# AeroPulse

[繁體中文](README.zh-TW.md)

AeroPulse is a Nuxt 4 dashboard for Taiwan weather and air-quality data. It surfaces CWA (Central Weather Administration) forecasts and EPA (Environmental Protection Administration) air-pollution readings through an interactive map, per-township detail pages, and a saved-cities overview.

## Features

- **Nationwide overview** — 36-hour forecast blocks and average AQI per county, with quick access to a township's detail page.
- **Township detail page** — hourly readings, 3-day and 1-week forecasts, and nearby air-quality station data for a selected county/township.
- **Interactive map** — Leaflet map of Taiwan with toggleable weather and AQI station layers.
- **Saved cities** — bookmark townships for a quick-glance weather and pollution snapshot (stored client-side).

## Tech Stack

- [Nuxt 4](https://nuxt.com/) / Vue 3 / Vue Router
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/) for the interactive map
- PostgreSQL via [`pg`](https://node-postgres.com/) (this app is a read-only presentation layer — data ingestion/ETL from CWA/EPA open data happens outside this repo)

## Prerequisites

- Node.js
- A PostgreSQL database populated with the expected `weather.*`, `air.*`, `info.*`, and `ticker.*` schemas

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with your database connection settings (Nuxt maps these automatically to `runtimeConfig.postgres`):

```bash
NUXT_POSTGRES_URL=postgres://user:password@host:5432/dbname
NUXT_POSTGRES_SSL=false
NUXT_POSTGRES_POOL_MAX=10
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

Once running, `GET /api/health` can be used to verify the database connection.

## Production

Build the application for production:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

## API Overview

All endpoints live under `server/api/` and read from PostgreSQL:

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Database health check |
| `GET /api/cities` | List weather locations (optional `county` filter) |
| `GET /api/cities/[geocode]` | Look up a single city/township by geocode |
| `GET /api/weather/36hour` | 36-hour forecast blocks (optional `county` filter) |
| `GET /api/weather/forecast-three-days` | 3-day hourly forecast by `geocode` |
| `GET /api/weather/forecast-one-week` | 1-week forecast by `geocode` |
| `GET /api/air/stations` | List air-quality monitoring stations (optional `country` filter) |
| `GET /api/air/stations/[siteId]` | Look up a single monitoring station |
| `GET /api/air/pollution` | Latest pollution/AQI readings (optional `siteId` filter) |

## Learn More

See the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) and [deployment guide](https://nuxt.com/docs/getting-started/deployment) for framework-level details.
