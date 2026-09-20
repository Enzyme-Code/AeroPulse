# AeroPulse

[English](README.md)

AeroPulse 是一個以 Nuxt 4 打造的台灣天氣與空氣品質儀表板，整合中央氣象署（CWA）的天氣預報與環保署（EPA）的空氣污染資料，透過互動地圖、鄉鎮詳情頁與收藏城市總覽呈現給使用者。

## 功能

- **全國總覽** — 顯示各縣市的 36 小時預報區塊與平均 AQI，並可快速前往鄉鎮詳情頁。
- **鄉鎮詳情頁** — 針對選定的縣市/鄉鎮，顯示逐時觀測、3 日與 1 週預報，以及鄰近測站的空氣品質資料。
- **互動地圖** — 以 Leaflet 呈現的台灣地圖，可切換天氣與 AQI 測站圖層。
- **收藏城市** — 收藏常用鄉鎮，快速檢視天氣與污染狀況（資料儲存於瀏覽器端）。

## 技術棧

- [Nuxt 4](https://nuxt.com/) / Vue 3 / Vue Router
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/)（互動地圖）
- PostgreSQL（透過 [`pg`](https://node-postgres.com/)）— 本專案僅為資料呈現層，CWA/EPA 開放資料的擷取與寫入（ETL）流程並不在此 repo 中

## 前置需求

- Node.js
- 已建置好 `weather.*`、`air.*`、`info.*`、`ticker.*` schema 的 PostgreSQL 資料庫

## 安裝

安裝套件：

```bash
npm install
```

在專案根目錄建立 `.env`，設定資料庫連線（Nuxt 會自動對應到 `runtimeConfig.postgres`）：

```bash
NUXT_POSTGRES_URL=postgres://user:password@host:5432/dbname
NUXT_POSTGRES_SSL=false
NUXT_POSTGRES_POOL_MAX=10
```

## 啟動開發伺服器

在 `http://localhost:3000` 啟動開發伺服器：

```bash
npm run dev
```

啟動後可透過 `GET /api/health` 確認資料庫連線是否正常。

## 建置與部署

建置正式版本：

```bash
npm run build
```

在本機預覽建置結果：

```bash
npm run preview
```

## API 一覽

所有 API 皆位於 `server/api/`，資料來源為 PostgreSQL：

| Endpoint | 說明 |
| --- | --- |
| `GET /api/health` | 資料庫健康檢查 |
| `GET /api/cities` | 取得天氣地點列表（可用 `county` 篩選） |
| `GET /api/cities/[geocode]` | 依 geocode 查詢單一城市/鄉鎮 |
| `GET /api/weather/36hour` | 36 小時預報區塊（可用 `county` 篩選） |
| `GET /api/weather/forecast-three-days` | 依 `geocode` 取得 3 日逐時預報 |
| `GET /api/weather/forecast-one-week` | 依 `geocode` 取得 1 週預報 |
| `GET /api/air/stations` | 取得空氣品質測站列表（可用 `country` 篩選） |
| `GET /api/air/stations/[siteId]` | 查詢單一測站 |
| `GET /api/air/pollution` | 取得最新污染/AQI 觀測值（可用 `siteId` 篩選） |

## 延伸閱讀

框架相關細節請參考 [Nuxt 官方文件](https://nuxt.com/docs/getting-started/introduction) 及 [部署指南](https://nuxt.com/docs/getting-started/deployment)。
