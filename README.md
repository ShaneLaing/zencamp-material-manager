<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ZenCamp Material Manager

第10屆 領禪營 物資管理系統 - A comprehensive material management system for the Leadership Zen Camp.

## Features

- 📦 Real-time inventory tracking
- 🛒 Procurement management
- 📋 Packing checklists
- 👥 Role-based access control (Admin, Procurement, General)
- 🔗 Google Sheets integration for data storage

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional)

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. Push your code to the `main` branch
2. Go to your repository **Settings** → **Pages**
3. Under "Build and deployment", select **GitHub Actions** as the source
4. The site will be automatically deployed when you push to `main`

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` folder

### Important Configuration

Before deploying, update the `base` path in [vite.config.ts](vite.config.ts) to match your repository name:

```ts
base: mode === 'production' ? '/your-repo-name/' : '/',
```

## Google Apps Script 設定

本系統透過 Google Apps Script 連接 Google Sheets，不需要設定 OAuth 或 API Key。

### 部署步驟

1. 開啟你的 Google Sheets 試算表
2. 點擊「擴充功能」→「Apps Script」
3. 將 `backend/Code.gs` 的內容貼入編輯器
4. 點擊「部署」→「新增部署」
5. 設定部署類型：
   - 類型：「網頁應用程式」
   - 執行身份：「我」(你的帳號)
   - 誰可以存取：「任何人」
6. 點擊「部署」
7. 複製產生的 Web App URL
8. 在本系統中點擊「連接 Apps Script」，貼上 URL

### 注意事項

- 每次修改 Code.gs 後需要重新部署
- Web App URL 格式：`https://script.google.com/macros/s/AKfyc.../exec`
- 試算表的第一列必須是標題列，欄位名稱需與 Code.gs 中的 COLUMN_MAP 對應
5. Create an API key
6. In the app, click "連接 Sheet" and enter your credentials
