#!/usr/bin/env node
/*
 * render-doc.mjs — 從 JSON 草稿產生 /tools/ 的單據 PDF。
 *
 * 給本機 agent 用的無介面入口：不開瀏覽器視窗、不上傳任何資料，
 * 直接驅動 headless Chrome 載入 /tools/<kind>/index.html，
 * 呼叫該頁的 window.DocGen.apply(draft) 後 Page.printToPDF。
 *
 * 單據的排版、條文、稅務計算全部沿用網頁那一份（tools/assets/tw-tax.js 等），
 * 這支 CLI 不重算任何金額，只負責灌資料、收金額、存檔。
 *
 * 零依賴：只用 Node 內建模組與 Node 22+ 的全域 WebSocket。
 *
 * 用法：
 *   node tools/cli/render-doc.mjs kinds
 *   node tools/cli/render-doc.mjs schema <kind>
 *   node tools/cli/render-doc.mjs render <draft.json> [--out out.pdf] [--no-pdf]
 *   node tools/cli/render-doc.mjs batch <jobs.json>
 *
 * 環境變數：
 *   OOTOBAI_SITE   站台 repo 根目錄（預設為本檔的 ../..）
 *   CHROME_BIN     Chrome 執行檔路徑
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname, extname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(process.env.OOTOBAI_SITE || join(HERE, "..", ".."));
const KINDS = ["quotation", "contract", "payment", "labor-form"];

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

const IMAGE_MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

function die(msg) {
  process.stderr.write("render-doc: " + msg + "\n");
  process.exit(1);
}

/* ---------- 本機靜態站（只讀 SITE_ROOT 底下的檔案） ---------- */
async function serveSite() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith("/")) rel += "index.html";
      const file = resolve(join(SITE_ROOT, rel));
      if (!file.startsWith(SITE_ROOT)) { res.writeHead(403).end("forbidden"); return; }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
    }
  });
  await new Promise((ok, no) => { server.once("error", no); server.listen(0, "127.0.0.1", ok); });
  const { port } = server.address();
  return { origin: `http://127.0.0.1:${port}`, close: () => new Promise((ok) => server.close(ok)) };
}

/* ---------- 極簡 CDP client ---------- */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(typeof ev.data === "string" ? ev.data : Buffer.from(ev.data).toString("utf8"));
      if (msg.id && this.pending.has(msg.id)) {
        const { ok, no } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? no(new Error(msg.method + ": " + msg.error.message)) : ok(msg.result);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((ok, no) => {
      ws.addEventListener("open", ok, { once: true });
      ws.addEventListener("error", () => no(new Error("CDP 連線失敗：" + url)), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((ok, no) => {
      this.pending.set(id, { ok, no });
      setTimeout(() => {
        if (this.pending.delete(id)) no(new Error(method + " 逾時（30 秒）"));
      }, 30000);
    });
  }

  close() { try { this.ws.close(); } catch { /* noop */ } }
}

/* ---------- Chrome ---------- */
async function launchChrome() {
  const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!bin) die("找不到 Chrome，請設 CHROME_BIN");
  const profile = mkdtempSync(join(tmpdir(), "render-doc-"));
  const child = spawn(bin, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });

  const wsUrl = await new Promise((ok, no) => {
    let buf = "";
    const timer = setTimeout(() => no(new Error("Chrome 沒有回報 DevTools endpoint")), 30000);
    child.stderr.on("data", (chunk) => {
      buf += chunk.toString();
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) { clearTimeout(timer); ok(m[0]); }
    });
    child.once("exit", (code) => { clearTimeout(timer); no(new Error("Chrome 結束，exit=" + code)); });
  });

  const cdp = await Cdp.connect(wsUrl);
  return {
    cdp,
    async close() {
      cdp.close();
      child.kill("SIGTERM");
      await new Promise((ok) => child.once("exit", ok)).catch(() => {});
      rmSync(profile, { recursive: true, force: true });
    }
  };
}

/* ---------- 頁面操作 ---------- */
async function openPage(cdp, url) {
  const { targetId } = await cdp.send("Target.createTarget", { url });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);

  const deadline = Date.now() + 30000;
  for (;;) {
    const ready = await evaluate(cdp, sessionId, 'document.readyState === "complete" && !!(window.DocGen && window.DocGen.kind)');
    if (ready === true) break;
    if (Date.now() > deadline) throw new Error(url + " 沒有出現 window.DocGen（頁面載入失敗或缺少 CLI 介面）");
    await new Promise((ok) => setTimeout(ok, 150));
  }
  // 字型到位再列印，避免 PDF 用 fallback 字型排版
  await evaluate(cdp, sessionId, "document.fonts && document.fonts.ready ? document.fonts.ready.then(function(){return true;}) : true", true).catch(() => {});
  return { targetId, sessionId };
}

async function evaluate(cdp, sessionId, expression, awaitPromise = false) {
  const res = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, sessionId);
  if (res.exceptionDetails) {
    const e = res.exceptionDetails;
    throw new Error("頁面 JS 例外：" + (e.exception?.description || e.text));
  }
  return res.result.value;
}

async function pdfOf(cdp, sessionId) {
  const { data } = await cdp.send("Page.printToPDF", {
    printBackground: true,
    preferCSSPageSize: true,
    transferMode: "ReturnAsBase64"
  }, sessionId);
  return Buffer.from(data, "base64");
}

function pdfPageCount(buf) {
  return (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
}

/* ---------- 草稿處理 ---------- */
async function loadDraft(file) {
  const path = resolve(file);
  let draft;
  try { draft = JSON.parse(await readFile(path, "utf8")); }
  catch (e) { die("讀不到或解析失敗的草稿：" + path + "（" + e.message + "）"); }
  return { draft, base: dirname(path) };
}

// images 的值可以是 data URL，也可以是圖檔路徑（相對於草稿檔所在目錄）
async function inlineImages(draft, base) {
  if (!draft.images) return draft;
  const out = {};
  for (const [id, val] of Object.entries(draft.images)) {
    if (!val) continue;
    if (String(val).startsWith("data:")) { out[id] = val; continue; }
    const file = isAbsolute(val) ? val : resolve(base, val);
    const ext = extname(file).toLowerCase();
    if (!IMAGE_MIME[ext]) die("不支援的圖檔格式：" + file);
    out[id] = "data:" + IMAGE_MIME[ext] + ";base64," + (await readFile(file)).toString("base64");
  }
  return { ...draft, images: out };
}

function checkKind(kind) {
  if (!KINDS.includes(kind)) die("未知的單據種類：" + kind + "（可用：" + KINDS.join(", ") + "）");
  return kind;
}

/* ---------- 指令 ---------- */
const FIELD_WALK = `(function () {
  var form = document.getElementById("form");
  var out = [];
  var seen = {};
  Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (el) {
    if (el.type === "file") return;
    if (el.closest("#itemRows, #s-item-rows, [data-row]")) return;   // 明細列走 items，不列為固定欄位
    if (!el.id && !el.name) return;
    var field = el.closest(".field");
    var label = field && field.querySelector("label") ? field.querySelector("label").textContent.trim() : "";
    var hintEl = field ? field.querySelector(".hint") : null;
    var hint = hintEl ? hintEl.textContent.trim() : "";
    if (el.type === "radio") {
      var key = "r:" + el.name;
      if (!seen[key]) {
        seen[key] = { key: key, type: "radio", label: label, hint: hint, options: [] };
        out.push(seen[key]);
      }
      var own = el.closest("label");
      seen[key].options.push({ value: el.value, label: own ? own.textContent.trim() : el.value });
      return;
    }
    var entry = {
      key: el.type === "checkbox" ? "c:" + el.id : el.id,
      type: el.tagName.toLowerCase() === "select" ? "select" : (el.type || "text"),
      label: label,
      hint: hint,
      value: el.type === "checkbox" ? el.checked : el.value
    };
    if (entry.type === "select") {
      entry.options = Array.prototype.map.call(el.options, function (o) { return { value: o.value, label: o.textContent.trim() }; });
    }
    if (el.placeholder) entry.placeholder = el.placeholder;
    out.push(entry);
  });
  return { kind: window.DocGen.kind, describe: window.DocGen.describe(), fields: out };
})()`;

async function cmdSchema(kind) {
  checkKind(kind);
  const site = await serveSite();
  const chrome = await launchChrome();
  try {
    const { sessionId } = await openPage(chrome.cdp, `${site.origin}/tools/${kind}/`);
    const schema = await evaluate(chrome.cdp, sessionId, FIELD_WALK);
    process.stdout.write(JSON.stringify(schema, null, 2) + "\n");
  } finally {
    await chrome.close();
    await site.close();
  }
}

async function renderOne(cdp, origin, job) {
  const kind = checkKind(job.kind);
  const { sessionId } = await openPage(cdp, `${origin}/tools/${kind}/`);
  const draft = await inlineImages(job.draft, job.base || process.cwd());
  const summary = await evaluate(
    cdp, sessionId,
    "JSON.stringify(window.DocGen.apply(" + JSON.stringify(draft) + "))"
  );
  const result = { kind, summary: summary ? JSON.parse(summary) : null };
  if (job.out) {
    const buf = await pdfOf(cdp, sessionId);
    await mkdir(dirname(resolve(job.out)), { recursive: true });
    await writeFile(resolve(job.out), buf);
    result.out = resolve(job.out);
    result.pages = pdfPageCount(buf);
    result.bytes = buf.length;
  }
  return result;
}

async function cmdRender(file, opts) {
  const { draft, base } = await loadDraft(file);
  const kind = checkKind(opts.kind || draft.kind);
  const out = opts.noPdf ? null : resolve(opts.out || draft.out || `${kind}.pdf`);
  const site = await serveSite();
  const chrome = await launchChrome();
  try {
    const res = await renderOne(chrome.cdp, site.origin, { kind, draft, base, out });
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  } finally {
    await chrome.close();
    await site.close();
  }
}

async function cmdBatch(file) {
  const { draft, base } = await loadDraft(file);
  const jobs = Array.isArray(draft) ? draft : draft.jobs;
  if (!Array.isArray(jobs) || !jobs.length) die("批次檔要是 job 陣列，或 { jobs: [...] }");
  const site = await serveSite();
  const chrome = await launchChrome();
  const results = [];
  try {
    for (const [i, job] of jobs.entries()) {
      const kind = checkKind(job.kind || draft.kind);
      const body = job.draft || job;
      const out = job.out ? resolve(base, job.out) : resolve(base, `${kind}-${String(i + 1).padStart(2, "0")}.pdf`);
      try {
        results.push(await renderOne(chrome.cdp, site.origin, { kind, draft: body, base, out }));
      } catch (e) {
        results.push({ kind, out, error: e.message });
      }
    }
  } finally {
    await chrome.close();
    await site.close();
  }
  process.stdout.write(JSON.stringify({ total: results.length, failed: results.filter((r) => r.error).length, results }, null, 2) + "\n");
  if (results.some((r) => r.error)) process.exitCode = 1;
}

/* ---------- 進入點 ---------- */
function parseArgs(argv) {
  const positional = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-pdf") opts.noPdf = true;
    else if (a === "--out") opts.out = argv[++i];
    else if (a === "--kind") opts.kind = argv[++i];
    else if (a.startsWith("--")) die("未知參數：" + a);
    else positional.push(a);
  }
  return { positional, opts };
}

const USAGE = `用法：
  node tools/cli/render-doc.mjs kinds
  node tools/cli/render-doc.mjs schema <${KINDS.join("|")}>
  node tools/cli/render-doc.mjs render <draft.json> [--kind <kind>] [--out <out.pdf>] [--no-pdf]
  node tools/cli/render-doc.mjs batch <jobs.json>
`;

const { positional, opts } = parseArgs(process.argv.slice(2));
const cmd = positional[0];

if (!existsSync(join(SITE_ROOT, "tools", "assets", "doc-kit.js"))) {
  die("OOTOBAI_SITE 看起來不是站台 repo：" + SITE_ROOT);
}

try {
  if (cmd === "kinds") {
    process.stdout.write(JSON.stringify({ siteRoot: SITE_ROOT, kinds: KINDS }, null, 2) + "\n");
  } else if (cmd === "schema") {
    if (!positional[1]) die("schema 要指定單據種類\n" + USAGE);
    await cmdSchema(positional[1]);
  } else if (cmd === "render") {
    if (!positional[1]) die("render 要指定草稿 JSON\n" + USAGE);
    await cmdRender(positional[1], opts);
  } else if (cmd === "batch") {
    if (!positional[1]) die("batch 要指定 jobs JSON\n" + USAGE);
    await cmdBatch(positional[1]);
  } else {
    process.stdout.write(USAGE);
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  die(e.message);
}
