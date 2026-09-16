// ootob.ai（工作室站）— GA4 only. 舊 GTM 容器 GTM-MCWCMS2L 是空的，已移除。
// 個人站 me.ootob.ai 用另一個 measurement ID，兩站報表分開。
(function () {
  var ID = "G-CPYE6XY574";  // ootob.ai 工作室站（GA4 資源「ootob.ai」，2026-09-16 建）
  if (!ID) return;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", ID);

  // Key events：聯絡動作與 demo 外連。GA 後台把 contact_click 標成 key event 就能看轉換。
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href") || "";
    var method = null;
    if (h.indexOf("mailto:") === 0) method = "email";
    else if (h.indexOf("line.me") !== -1 || h.indexOf("lin.ee") !== -1) method = "line";
    else if (h.indexOf("tasker.com.tw") !== -1) method = "tasker";
    else if (h.indexOf("calendly.com") !== -1) method = "call";
    if (method) { gtag("event", "contact_click", { method: method, link_url: h, page_path: location.pathname }); return; }
    if (/railway\.app|jewelry-demo\.ootob\.ai/.test(h) || h.indexOf("/demo/") === 0) {
      gtag("event", "demo_open", { link_url: h, link_text: (a.textContent || "").trim().slice(0, 60), page_path: location.pathname });
    }
  });
})();
