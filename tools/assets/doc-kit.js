/*
 * doc-kit.js — /tools/ 單據產生器共用邏輯
 * 全部在瀏覽器內執行，沒有任何網路請求。
 * 唯一會寫入本機的情況：使用者自己按「記住我的資料」或「帶到下一張單」。
 */
(function (root) {
  "use strict";

  var PROFILE_KEY = "ootobai.docs.profile.v1";  // 乙方固定資料（我自己）
  var HANDOFF_KEY = "ootobai.docs.handoff.v1";  // 跨單據帶入的專案資料

  function $(id) { return document.getElementById(id); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  /* ---------- 日期 ---------- */
  function today() { return new Date().toLocaleDateString("sv-SE"); }
  function addDays(dateStr, days) {
    var d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
    d.setDate(d.getDate() + (days || 0));
    return d.toLocaleDateString("sv-SE");
  }
  function roc(dateStr, blank) {
    if (!dateStr) return blank === undefined ? "＿＿＿ 年 ＿＿ 月 ＿＿ 日" : blank;
    var p = dateStr.split("-");
    return (Number(p[0]) - 1911) + " 年 " + Number(p[1]) + " 月 " + Number(p[2]) + " 日";
  }
  function ad(dateStr, blank) {
    if (!dateStr) return blank === undefined ? "＿＿＿＿ 年 ＿＿ 月 ＿＿ 日" : blank;
    var p = dateStr.split("-");
    return Number(p[0]) + " 年 " + Number(p[1]) + " 月 " + Number(p[2]) + " 日";
  }
  function docNo(prefix, dateStr) {
    var d = (dateStr || today()).replace(/-/g, "");
    return prefix + "-" + d + "-01";
  }

  /* ---------- 身分證／統一編號 ---------- */
  var ID_LETTERS = "ABCDEFGHJKLMNPQRSTUVXYWZIO";
  var ID_WEIGHTS = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  function letterCode(ch) { var i = ID_LETTERS.indexOf(ch); return i < 0 ? -1 : i + 10; }
  function validTwId(raw) {
    var id = (raw || "").trim().toUpperCase(), digits;
    if (/^[A-Z][0-9]{9}$/.test(id)) {
      var c = letterCode(id[0]);
      if (c < 0 || "1289".indexOf(id[1]) < 0) return false;
      digits = [Math.floor(c / 10), c % 10].concat(id.slice(1).split("").map(Number));
    } else if (/^[A-Z]{2}[0-9]{8}$/.test(id)) {
      var c1 = letterCode(id[0]), c2 = letterCode(id[1]);
      if (c1 < 0 || c2 < 0) return false;
      digits = [Math.floor(c1 / 10), c1 % 10, c2 % 10].concat(id.slice(2).split("").map(Number));
    } else {
      return false;
    }
    var sum = digits.reduce(function (a, d, i) { return a + d * ID_WEIGHTS[i]; }, 0);
    return sum % 10 === 0;
  }
  function plausiblePassport(raw) { return /^[A-Z0-9]{6,12}$/.test((raw || "").trim().toUpperCase()); }
  // 營利事業統一編號：8 位數，乘積和可被 5 整除（第 7 位為 7 時有例外規則）
  function validTaxId(raw) {
    var s = (raw || "").trim();
    if (!/^[0-9]{8}$/.test(s)) return false;
    var w = [1, 2, 1, 2, 1, 2, 4, 1], sum = 0, sevenAlt = false;
    for (var i = 0; i < 8; i++) {
      var p = Number(s[i]) * w[i];
      p = Math.floor(p / 10) + (p % 10);
      sum += p;
      if (i === 6 && s[6] === "7") { sevenAlt = true; }
    }
    if (sum % 5 === 0) return true;
    return sevenAlt && (sum + 1) % 5 === 0;
  }

  /* ---------- 表單狀態（handoff／JSON 匯出的骨幹） ---------- */
  function formState(form) {
    var state = {};
    $$("input, select, textarea", form).forEach(function (el) {
      if (!el.id && !el.name) return;
      if (el.type === "file") return;
      if (el.type === "radio") { if (el.checked) { state["r:" + el.name] = el.value; } return; }
      if (el.type === "checkbox") { state["c:" + el.id] = el.checked; return; }
      if (el.id) { state[el.id] = el.value; }
    });
    return state;
  }
  function setFormState(form, state) {
    if (!state) return;
    Object.keys(state).forEach(function (k) {
      if (k.indexOf("r:") === 0) {
        var radio = form.querySelector('input[name="' + k.slice(2) + '"][value="' + state[k] + '"]');
        if (radio) radio.checked = true;
        return;
      }
      if (k.indexOf("c:") === 0) {
        var cb = $(k.slice(2));
        if (cb) cb.checked = !!state[k];
        return;
      }
      var el = $(k);
      if (el && el.type !== "file") el.value = state[k];
    });
  }

  /* ---------- 本機儲存（一律使用者主動觸發） ---------- */
  function read(key) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function drop(key) { try { localStorage.removeItem(key); } catch (e) { /* noop */ } }

  var profile = {
    keys: [],   // 由各頁指定哪些欄位算「我的固定資料」
    load: function () { return read(PROFILE_KEY); },
    save: function (form, keys) {
      var all = formState(form), picked = {};
      (keys || profile.keys).forEach(function (k) { if (all[k] !== undefined) picked[k] = all[k]; });
      return write(PROFILE_KEY, picked);
    },
    apply: function (form) { setFormState(form, read(PROFILE_KEY)); },
    clear: function () { drop(PROFILE_KEY); }
  };

  var handoff = {
    load: function () { return read(HANDOFF_KEY); },
    save: function (doc) {
      var rec = read(HANDOFF_KEY) || { v: 1, updated: "", docs: {} };
      rec.v = 1;
      rec.updated = new Date().toISOString();
      rec.docs[doc.kind] = doc;
      rec.shared = Object.assign({}, rec.shared || {}, doc.shared || {});
      return write(HANDOFF_KEY, rec);
    },
    shared: function () { var r = read(HANDOFF_KEY); return r ? r.shared || {} : {}; },
    doc: function (kind) { var r = read(HANDOFF_KEY); return r && r.docs ? r.docs[kind] || null : null; },
    clear: function () { drop(HANDOFF_KEY); }
  };

  /* ---------- case-radar 匯入 ---------- */
  /**
   * 吃三種輸入：`case-radar show <TK-id>` 的 JSON、Tasker 案件網址、純 TK-id。
   * @returns {{caseId:string,title:string,budget:number,budgetRaw:string,url:string,location:string,description:string}|null}
   */
  function parseCase(text) {
    var s = (text || "").trim();
    if (!s) return null;
    if (s[0] === "{" || s[0] === "[") {
      var data;
      try { data = JSON.parse(s); } catch (e) { return null; }
      if (Array.isArray(data)) data = data[0];
      if (!data) return null;
      return {
        caseId: data.external_id || data.id || "",
        title: data.title || "",
        budget: Number(data.budget_ntd) || 0,
        budgetRaw: data.budget_raw || "",
        url: data.url || "",
        location: data.location || "",
        description: data.description || ""
      };
    }
    var m = s.match(/TK[0-9A-Z]{10,}/i);
    if (m) {
      var id = m[0].toUpperCase();
      return {
        caseId: id, title: "", budget: 0, budgetRaw: "",
        url: /^https?:/i.test(s) ? s : "https://www.tasker.com.tw/case/" + id,
        location: "", description: ""
      };
    }
    return null;
  }

  /* ---------- 圖片：縮圖後嵌入，不上傳 ---------- */
  function bindImage(inputId, imgIds, maxEdge, after) {
    var input = $(inputId);
    if (!input) return;
    input.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) { setImages(imgIds, "", after); return; }
      var reader = new FileReader();
      reader.onload = function (ev) {
        var tmp = new Image();
        tmp.onload = function () {
          var edge = maxEdge || 1000;
          var w = tmp.naturalWidth, h = tmp.naturalHeight;
          var s = Math.min(1, edge / Math.max(w, h));
          var cv = document.createElement("canvas");
          cv.width = Math.max(1, Math.round(w * s));
          cv.height = Math.max(1, Math.round(h * s));
          var ctx = cv.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, cv.width, cv.height);
          ctx.drawImage(tmp, 0, 0, cv.width, cv.height);
          setImages(imgIds, cv.toDataURL("image/jpeg", 0.85), after);
        };
        tmp.onerror = function () { setImages(imgIds, "", after); };
        tmp.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function setImages(ids, src, after) {
    ids.forEach(function (id) {
      var img = $(id);
      if (!img) return;
      img.src = src;
      img.hidden = !src;
    });
    if (after) after(!!src);
  }

  /* ---------- 檔案匯出／匯入 ---------- */
  function downloadJson(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function readJsonFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        try { resolve(JSON.parse(r.result)); } catch (e) { reject(e); }
      };
      r.onerror = reject;
      r.readAsText(file);
    });
  }

  /* ---------- 螢幕預覽縮放 ---------- */
  /*
   * 以前是 @media (max-width: 860px) 直接 zoom: .46，手機上小到看不清，
   * 而且那條選擇器的 specificity 蓋掉 @media print 的還原規則，
   * 導致窄視窗（含 headless Chrome 的 800px）列印出來整張縮成 46%。
   * 現在螢幕縮放一律走 .sheet-wrap 的 --sheet-zoom，列印由 @media print 以 !important 還原成 1。
   */
  var MIN_ZOOM = 0.3;

  function naturalSheetWidth(wrap, sheet) {
    var prev = wrap.style.getPropertyValue("--sheet-zoom");
    wrap.style.setProperty("--sheet-zoom", "1");
    var w = sheet.getBoundingClientRect().width;
    if (prev) { wrap.style.setProperty("--sheet-zoom", prev); }
    else { wrap.style.removeProperty("--sheet-zoom"); }
    return w;
  }

  function innerWidth(wrap) {
    var cs = getComputedStyle(wrap);
    return wrap.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
  }

  function fitZoom(wrap, sheet) {
    var natural = naturalSheetWidth(wrap, sheet);
    if (!natural) return 1;
    return Math.max(MIN_ZOOM, Math.min(1, innerWidth(wrap) / natural));
  }

  /**
   * 在 #preview-section 的預覽上方插入縮放列（列印時因為不在 #print-area 裡而自動隱藏）。
   * 預設「適應寬度」；視窗夠寬時 fit 本身就是 100%。
   */
  function sheetZoom() {
    var wrap = document.querySelector("#print-area .sheet-wrap");
    var sheet = wrap ? wrap.querySelector("#sheet") : null;
    var host = document.getElementById("print-area");
    if (!wrap || !sheet || !host || document.querySelector(".zoom-bar")) return null;

    var bar = document.createElement("div");
    bar.className = "zoom-bar";
    bar.innerHTML = '<span>預覽縮放</span>'
      + '<button type="button" data-zoom="fit">適應寬度</button>'
      + '<button type="button" data-zoom="full">原尺寸</button>'
      + "<output></output>";
    host.parentNode.insertBefore(bar, host);

    var out = bar.querySelector("output");
    var buttons = $$("button", bar);
    var mode = "fit";

    function paint() {
      var z = mode === "fit" ? fitZoom(wrap, sheet) : 1;
      wrap.style.setProperty("--sheet-zoom", String(z));
      out.textContent = Math.round(z * 100) + "%";
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-zoom") === mode));
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-zoom") === "fit" ? "fit" : "full";
        paint();
      });
    });

    var queued = false;
    root.addEventListener("resize", function () {
      if (mode !== "fit" || queued) return;
      queued = true;
      root.requestAnimationFrame(function () { queued = false; paint(); });
    });

    paint();
    return { paint: paint, mode: function () { return mode; } };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sheetZoom);
  } else {
    sheetZoom();
  }

  /* ---------- 其他 ---------- */
  function print(eventName) {
    if (root.gtag && eventName) { root.gtag("event", eventName, { page_path: location.pathname }); }
    root.print();
  }
  function bind(form, handler) {
    form.addEventListener("input", handler);
    form.addEventListener("change", handler);
  }
  function box(on) { return on ? "■" : "□"; }
  function boxes(items, active) {
    return items.map(function (it) { return box(it[0] === active) + it[1]; }).join("　");
  }
  // 國字大寫金額（單據防改用）
  var NUM = "零壹貳參肆伍陸柒捌玖", UNIT = ["", "拾", "佰", "仟"], BIG = ["", "萬", "億", "兆"];
  function chineseAmount(n) {
    var v = Math.round(Math.abs(n || 0));
    if (!v) return "零";
    var groups = [], out = "";
    while (v > 0) { groups.push(v % 10000); v = Math.floor(v / 10000); }
    for (var g = groups.length - 1; g >= 0; g--) {
      var part = groups[g], seg = "", zero = false;
      var digits = String(part).split("").map(Number);
      for (var i = 0; i < digits.length; i++) {
        var d = digits[i], u = digits.length - 1 - i;
        if (d === 0) { zero = true; continue; }
        if (zero && seg) { seg += NUM[0]; }
        zero = false;
        seg += NUM[d] + UNIT[u];
      }
      if (seg) { out += seg + BIG[g]; }
    }
    return out;
  }

  root.DocKit = {
    $: $, $$: $$,
    today: today, addDays: addDays, roc: roc, ad: ad, docNo: docNo,
    validTwId: validTwId, plausiblePassport: plausiblePassport, validTaxId: validTaxId,
    formState: formState, setFormState: setFormState,
    profile: profile, handoff: handoff, parseCase: parseCase,
    bindImage: bindImage, setImages: setImages,
    downloadJson: downloadJson, readJsonFile: readJsonFile,
    print: print, bind: bind, box: box, boxes: boxes, chineseAmount: chineseAmount,
    sheetZoom: sheetZoom
  };
})(window);
