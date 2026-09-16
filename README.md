# ootob.ai

歐兜拜 ootobai，AI 軟體應用整合工作室的官網。個人內容在 https://me.ootob.ai（repo `jtsaich/me-ootob-ai`）。

## Deploy

Cloudflare Pages 專案（git 連動），push `main` 即部署。自訂網域 `ootob.ai`、`www.ootob.ai`。

## 結構

```
index.html        首頁：三條線、怎麼合作、做事原則、已交付、聯絡
work/             作品與 Demo（導覽影片在 work/video/）
services/         服務項目與報價；services/line-oa/ LINE 方案頁
demo/             可操作的概念展示（travel ×3、slow-travel-line、yiqi-line、cert、doc-check、doc-archive）
_redirects        舊個人路徑 301 到 me.ootob.ai
_headers          Cloudflare 安全標頭
.private/         營業證明（gitignored）
```

## 本機預覽

```bash
npx serve .
```
