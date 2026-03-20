const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BASE = 'https://api.peec.ai/customer/v1';

// ── Generic proxy: /api/METHOD/path ──
// Frontend sends:  POST /proxy  { method, path, query, body }
// Server forwards to Peec API
app.post('/proxy', async (req, res) => {
  const { method = 'GET', apiPath, query = {}, body: reqBody, apiKey } = req.body;
  const qs = new URLSearchParams(query).toString();
  const url = `${BASE}/${apiPath}${qs ? '?' + qs : ''}`;
  console.log(`[PROXY] ${method} ${url}`);

  try {
    const headers = { 'Content-Type': 'application/json', 'X-API-Key': apiKey };
    const opts = { method, headers };
    if (method === 'POST' && reqBody) opts.body = JSON.stringify(reqBody);

    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('json')) {
      const data = await r.json();
      console.log(`  => ${r.status} (${JSON.stringify(data).slice(0, 200)})`);
      return res.status(r.status).json(data);
    }
    const text = await r.text();
    console.log(`  => ${r.status} "${text.slice(0, 150)}"`);
    res.status(r.status).json({ raw: text });
  } catch (e) {
    console.error(`  ERR: ${e.message}`);
    res.status(502).json({ error: e.message });
  }
});

// ── Deep discovery — tries 50+ path combos to find working report endpoints ──
app.post('/deep-discover', async (req, res) => {
  const { apiKey, projectId, startDate, endDate } = req.body;
  const h = { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
  const qs = `project_id=${projectId}&start_date=${startDate}&end_date=${endDate}`;
  const body = JSON.stringify({ start_date: startDate, end_date: endDate, project_id: projectId });

  const paths = [
    // Report paths
    'reports/brands','reports/brand','reports/domains','reports/urls',
    'reports/visibility','reports/brand-visibility','reports/brand_visibility',
    'reports/sentiment','reports/brand-sentiment',
    'reports/position','reports/brand-position',
    'reports/share-of-voice','reports/sov',
    'reports/citations','reports/overview',
    'reports','report/brands','report/domains','report/urls',
    'report/visibility','report/sentiment','report/position',
    'report','analytics','analytics/brands','analytics/visibility',
    // Dashboard / stats
    'dashboard','overview','stats','stats/brands',
    'metrics','metrics/brands','metrics/visibility',
    // Brand-centric
    'brands/report','brands/analytics','brands/visibility','brands/stats',
    'brands/metrics','brands/overview',
    // Other
    'visibility','sentiment','position','share-of-voice',
    'chats/stats','prompts/stats','summary','data',
  ];

  const results = [];

  for (const p of paths) {
    // Try GET
    try {
      const r = await fetch(`${BASE}/${p}?${qs}`, { method: 'GET', headers: h });
      let b; try { b = await r.json(); } catch { b = await r.text(); }
      if (r.status !== 404) results.push({ method: 'GET', path: p, status: r.status, body: typeof b === 'string' ? b.slice(0, 300) : JSON.stringify(b).slice(0, 300) });
      console.log(`[DISC] GET ${p} => ${r.status}`);
    } catch (e) { /* skip */ }

    // Try POST
    try {
      const r = await fetch(`${BASE}/${p}?project_id=${projectId}`, { method: 'POST', headers: h, body });
      let b; try { b = await r.json(); } catch { b = await r.text(); }
      if (r.status !== 404) results.push({ method: 'POST', path: p, status: r.status, body: typeof b === 'string' ? b.slice(0, 300) : JSON.stringify(b).slice(0, 300) });
      console.log(`[DISC] POST ${p} => ${r.status}`);
    } catch (e) { /* skip */ }
  }

  // Also try the known working endpoints to confirm auth
  for (const p of ['brands', 'prompts', 'models', 'chats', 'tags', 'topics', 'projects']) {
    try {
      const r = await fetch(`${BASE}/${p}?project_id=${projectId}`, { method: 'GET', headers: h });
      let b; try { b = await r.json(); } catch { b = await r.text(); }
      results.push({ method: 'GET', path: p, status: r.status, body: typeof b === 'string' ? b.slice(0, 300) : JSON.stringify(b).slice(0, 300) });
      console.log(`[DISC] GET ${p} => ${r.status}`);
    } catch (e) { /* skip */ }
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n  ✅  http://localhost:${PORT}\n`));
