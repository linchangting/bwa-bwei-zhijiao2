# 問筊 — 擲筊問事

擲杯筊求神問事，敲木魚積功德。純前端靜態頁面，無需後端。

## 本機部署（供其他人使用）

在同一臺電腦上啟動服務後，**同一 WiFi 或局域網內的其他人**可用瀏覽器訪問你的本機地址使用。

### 方式一：一鍵啟動（推薦）

```bash
./start.sh
```

腳本會：
- 在埠號 **8765** 啟動 HTTP 服務（可通過環境變量改：`PORT=3000 ./start.sh`）
- 綁定到 `0.0.0.0`，允許局域網訪問
- 在終端顯示 **本機** 和 **局域網** 訪問地址

其他人用手機或電腦瀏覽器打開終端裡顯示的「局域網訪問」地址即可。

### 方式二：手動用 Python 啟動

```bash
cd /path/to/bwa-bwei
python3 -m http.server 8765 --bind 0.0.0.0
```

然後用本機 IP 訪問，例如：`http://192.168.1.100:8765`。

### 方式三：使用 npx serve（若已安裝 Node.js）

```bash
npx serve . -l 8765 --listen 0.0.0.0
```

### 注意事項

- **防火牆**：若他人無法訪問，請在系統防火牆中允許該埠的入站連接。
- **同一網絡**：訪問者需與你在同一局域網（同一 WiFi 或同一內網）。
- **埠號**：默認 8765，可自定義，例如 `PORT=8080 ./start.sh`。

## 公網部署（供任何人訪問）

項目是純靜態頁面，可免費部署到公網，無需自己的服務器。

### 方式一：Vercel（推薦，最簡單）

1. 打開 [vercel.com](https://vercel.com)，用 GitHub 登錄。
2. 點「Add New」→「Project」，導入你的 **bwa-bwei** 倉庫（若尚未推送，先在本機執行 `git init` 並推送到 GitHub）。
3. 根目錄保持為項目根目錄，**Build Command** 留空，**Output Directory** 留空（或填 `.`）。
4. **若倉庫根目錄不是 bwa-bwei**（例如 bwa-bwei 只是倉庫裡的一個子目錄）：在專案 **Settings → General → Root Directory** 中填寫 `bwa-bwei` 並保存，然後重新部署。否則訪問部署網址會出現 NOT_FOUND (404)。
5. 點「Deploy」，幾十秒後會得到一個 `xxx.vercel.app` 的網址，即為公網訪問地址。

**若出現 NOT_FOUND (404)**：專案內已透過 `vercel.json` 設定 `framework: null`、`outputDirectory: "."` 與 SPA 回退；若仍 404，請在 Vercel **Settings → General → Root Directory** 設為包含 `index.html` 的目錄（例如 `bwa-bwei`）。完整原因與排查見 [docs/VERCEL_NOT_FOUND.md](docs/VERCEL_NOT_FOUND.md)，官方說明見 [Vercel NOT_FOUND](https://vercel.com/docs/errors/NOT_FOUND)。

**不用 GitHub 時**：安裝 Vercel CLI 後在項目目錄執行：

```bash
npm i -g vercel
cd /path/to/bwa-bwei
vercel
```

按提示登錄並選擇「當前目錄」即可，會得到一個公網 URL。

---

### 方式二：Netlify

1. 打開 [netlify.com](https://www.netlify.com)，用 GitHub 登錄。
2. 「Add new site」→「Import an existing project」→ 選擇 GitHub 倉庫 **bwa-bwei**。
3. Build command 留空，Publish directory 填 `.` 或留空。
4. 部署完成後會得到 `xxx.netlify.app` 的網址。

**拖拽上傳**：若不想連 GitHub，可到 [app.netlify.com/drop](https://app.netlify.com/drop)，把整個 **bwa-bwei** 文件夾拖進去，會生成一個隨機子域。

---

### 方式三：GitHub Pages

1. 將項目推送到 GitHub（例如倉庫名 `bwa-bwei`）。
2. 倉庫頁面：**Settings** → **Pages**。
3. **Source** 選「Deploy from a branch」；**Branch** 選 `main`，目錄選 `/ (root)`，保存。
4. 幾分鐘後訪問：`https://<你的用戶名>.github.io/bwa-bwei/`（若倉庫名為 `bwa-bwei`）。

若希望根路徑就是 `https://<用戶名>.github.io/`，可把倉庫名改為 `<用戶名>.github.io` 再按上述設置。

---

### 方式四：Cloudflare Pages

1. 打開 [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
2. 選擇 GitHub 倉庫 **bwa-bwei**，構建設置：Build command 留空，Build output directory 填 `.`。
3. 部署完成後會得到 `xxx.pages.dev` 的網址。

**直接上傳**：也可選「Direct Upload」，在項目目錄執行 `npx wrangler pages deploy . --project-name=bwa-bwei`（需先安裝並登錄 Wrangler）。

---

### 小結

| 方式           | 難度 | 免費額度 | 得到網址示例              |
|----------------|------|----------|---------------------------|
| Vercel         | 低   | 有       | `bwa-bwei.vercel.app`     |
| Netlify        | 低   | 有       | `xxx.netlify.app`         |
| GitHub Pages   | 低   | 有       | `用戶名.github.io/bwa-bwei` |
| Cloudflare Pages | 低 | 有       | `xxx.pages.dev`           |

部署後可綁定自己的域名（各平台在後台都有「Custom domain」設置）。

## 僅本機使用

若只在自己電腦上打開，可直接用瀏覽器打開 `index.html`，或：

```bash
python3 -m http.server 8765
```

然後訪問 http://127.0.0.1:8765 。

## 功能簡介

- **擲筊**：問事模式 / 選擇模式，三聖筊邏輯
- **木魚**：敲擊積功德，功德可兌換「再擲」機會
- **簽文**：求籤
- **記錄**：擲筊歷史
- **功德商店**：兌換與成就

數據存於瀏覽器本地，無服務器存儲。
