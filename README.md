# ootob.ai

歐兜拜 ootobai，AI 軟體應用整合工作室的官網。個人內容在 https://me.ootob.ai（repo `jtsaich/me-ootob-ai`）。

## Deploy

Cloudflare Worker `ootob-ai`（static assets，Workers Builds 連 GitHub，push `main` 即部署）。自訂網域 `ootob.ai`、`www.ootob.ai` 在 `wrangler.jsonc` 的 routes。

## 結構

```
index.html        首頁：三條線、怎麼合作、做事原則、已交付、聯絡
work/             作品與 Demo（導覽影片在 work/video/）
services/         服務項目與報價；services/line-oa/ LINE 方案頁
demo/             可操作的概念展示（travel ×3、slow-travel-line、yiqi-line、cert、doc-check、doc-archive）
tools/            接案行政文件工具（四張單共用 tools/assets/：doc-kit.css 樣式與 A4 列印、doc-kit.js 表單與 handoff、tw-tax.js 115 年度扣繳參數）
                  tools/quotation/ 報價單 · tools/contract/ 合約 · tools/payment/ 請款單 · tools/labor-form/ 勞報單
                  全部純前端，資料只在瀏覽器；稅務數字一律取 tw-tax.js 的 PARAMS，年度更新只改那一個檔
_redirects        舊個人路徑 301 到 me.ootob.ai
_headers          Cloudflare 安全標頭
.private/         營業證明（gitignored）
```

## 本機預覽

```bash
npx serve .
```
