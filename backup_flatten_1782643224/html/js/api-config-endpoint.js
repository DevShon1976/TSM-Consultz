/**
 * api/config endpoint — add this to your Railway Express/Node server
 *
 * Sets NEURAL_KEY as a Railway environment variable (never in code).
 * In Railway dashboard: Settings → Variables → Add NEURAL_KEY=gsk_...
 *
 * Usage: GET or POST /api/config  →  { "neural_key": "..." }
 */

// If using Express:
app.get('/api/config', (req, res) => {
  const key = process.env.NEURAL_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Neural Core not configured' });
  }
  // Only return what the client needs — nothing else from env
  res.json({ neural_key: key });
});

// ── If you don't have Express and use a plain Node http server: ────────────
//
// const http = require('http');
// http.createServer((req, res) => {
//   if (req.url === '/api/config') {
//     const key = process.env.NEURAL_KEY;
//     res.writeHead(key ? 200 : 503, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify(key ? { neural_key: key } : { error: 'not configured' }));
//     return;
//   }
//   // ... rest of your routing
// }).listen(process.env.PORT || 3000);

// ── If using Next.js (pages/api/config.js): ───────────────────────────────
//
// export default function handler(req, res) {
//   const key = process.env.NEURAL_KEY;
//   if (!key) return res.status(503).json({ error: 'not configured' });
//   res.status(200).json({ neural_key: key });
// }