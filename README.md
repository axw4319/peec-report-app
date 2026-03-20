# Peec.ai — AI Visibility Report Generator

Generate competitive intelligence reports from your Peec.ai data and download them as PDFs.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in your browser
open http://localhost:3000
```

## How It Works

The app runs a small Express server that proxies requests to the Peec.ai API (solving CORS issues). The frontend fetches your brand, prompt, model, and report data, then renders a professional competitive intelligence report matching Peec's visual style — complete with downloadable PDF export.

## Configuration

All configuration is done in the browser UI:

- **API Key** — Your Peec.ai API key (from app.peec.ai → API Keys)
- **Project ID** — The project to pull data from (format: `or_xxxxx`)
- **Brand ID** — Optional; auto-detects from brand name if blank
- **Brand Name** — The brand to focus the report on
- **Date Range** — Last 7/14/30 days or custom

## Troubleshooting

Click **"Discover API Endpoints"** to see which Peec API paths return data vs 404s. This helps identify the exact endpoint names your account has access to.

## Files

```
server.js           — Express proxy server
public/index.html   — Frontend app (single file, no build step)
```
