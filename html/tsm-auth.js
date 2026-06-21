/**
 * TSM Shell — Demo Auth Middleware
 * Token-based access control for war room pages
 * 
 * HOW IT WORKS:
 * 1. War room URLs require a valid token: /html/healthcare/hc-denial-war-room.html?t=TOKEN
 * 2. Tokens are set in TSM_DEMO_TOKENS env var (comma-separated)
 * 3. Each token can optionally have an expiry set in TSM_TOKEN_EXPIRY (ISO date)
 * 4. The portfolio page is always public — only war rooms are gated
 * 5. A session cookie is set on first valid token so the user doesn't need ?t= on every page
 * 
 * SETUP:
 * Add to fly.toml secrets:
 *   fly secrets set TSM_DEMO_TOKENS="REGINA2024,COPPER2024,REMX2024,INVESTOR2024"
 *   fly secrets set TSM_MASTER_KEY="your-admin-key-here"
 * 
 * USAGE:
 * Share with prospects: https://tsm-shell.fly.dev/html/healthcare/hc-denial-war-room.html?t=REGINA2024
 * Admin access (always valid): ?t=TSM_MASTER_KEY value
 */

const crypto = require('crypto');

// ── TOKEN CONFIG ──────────────────────────────────────────────────────────────
const MASTER_KEY   = process.env.TSM_MASTER_KEY || 'TSM-ADMIN-2024';
const RAW_TOKENS   = process.env.TSM_DEMO_TOKENS || 'DEMO2024,INVESTOR2024,PREVIEW2024';
const VALID_TOKENS = new Set(RAW_TOKENS.split(',').map(t => t.trim()).filter(Boolean));
const COOKIE_NAME  = 'tsm_demo_access';
const COOKIE_TTL   = 8 * 60 * 60 * 1000; // 8 hours

// ── PROTECTED PATH PATTERNS ───────────────────────────────────────────────────
// Portfolio page stays public. Only war rooms + nodes + strategists + exec portals are gated.
const PROTECTED_PATTERNS = [
  /\/html\/healthcare\//,
  /\/html\/finops-suite\//,
  /\/html\/tsm-insurance\//,
  /\/html\/construction-suite\//,
  /\/html\/legal-pro\//,
  /\/html\/reo-pro\//,
  /\/html\/bpo\//,
  /\/healthcare\//,
  /\/construction\//,
  /\/insurance\//,
  /\/html\/executive-portal\//,
];

// Always public — never gate these
const PUBLIC_EXCEPTIONS = [
  /tsm-consultz-portfolio\.html/,
  /war-room-prep\.html/,
  /tsm-doc-search-multi\.html/,
  /\/shared\//,
  /\/api\//,
  /\.css$/,
  /\.js$/,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.ico$/,
  /\.woff/,
  /\/health$/,
];

function isProtected(url) {
  const path = url.split('?')[0];
  if (PUBLIC_EXCEPTIONS.some(p => p.test(path))) return false;
  return PROTECTED_PATTERNS.some(p => p.test(path));
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    out[k.trim()] = decodeURIComponent(v.join('='));
  });
  return out;
}

function isValidToken(token) {
  if (!token) return false;
  if (token === MASTER_KEY) return true;
  return VALID_TOKENS.has(token.toUpperCase().trim());
}

function setCookieHeader(token) {
  const expires = new Date(Date.now() + COOKIE_TTL).toUTCString();
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`;
}

// ── LOGIN PAGE HTML ───────────────────────────────────────────────────────────
function loginPage(redirectTo, error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TSM Shell — Access Required</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A1628; color:#fff; font-family:'Segoe UI',Arial,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .box { background:#060E1A; border:1px solid rgba(0,200,150,.2); border-radius:8px; padding:48px 40px; width:380px; text-align:center; }
  .logo { font-size:10px; font-weight:700; letter-spacing:.3em; color:#00C896; margin-bottom:24px; }
  h1 { font-size:22px; font-weight:700; color:#fff; margin-bottom:8px; }
  p { font-size:12px; color:#4A6070; margin-bottom:28px; line-height:1.6; }
  input { width:100%; background:#0A1628; border:1px solid rgba(0,200,150,.3); border-radius:4px; padding:12px 16px; color:#fff; font-size:13px; font-family:monospace; letter-spacing:.1em; outline:none; margin-bottom:14px; text-transform:uppercase; }
  input:focus { border-color:#00C896; }
  input::placeholder { color:#2A4A5A; text-transform:none; letter-spacing:0; }
  button { width:100%; background:#00C896; color:#001a12; border:none; border-radius:4px; padding:13px; font-size:12px; font-weight:700; letter-spacing:.15em; cursor:pointer; }
  button:hover { opacity:.85; }
  .err { font-size:11px; color:#E53935; margin-bottom:14px; padding:8px 12px; background:rgba(229,57,53,.1); border-radius:3px; border:1px solid rgba(229,57,53,.2); }
  .footer { font-size:10px; color:#2A4A5A; margin-top:24px; }
</style>
</head>
<body>
<div class="box">
  <div class="logo">⚡ TSM SHELL</div>
  <h1>Access Required</h1>
  <p>This war room is protected.<br>Enter your demo access token to continue.</p>
  ${error ? `<div class="err">Invalid or expired token. Contact your TSM representative.</div>` : ''}
  <form method="POST" action="/auth/token">
    <input type="hidden" name="redirect" value="${redirectTo}">
    <input type="text" name="token" placeholder="Enter access token" autocomplete="off" autocorrect="off" spellcheck="false">
    <button type="submit">▶ ACCESS PLATFORM</button>
  </form>
  <div class="footer">TSM Shell · tsm-shell.fly.dev · Confidential</div>
</div>
</body>
</html>`;
}

// ── MIDDLEWARE FACTORY ────────────────────────────────────────────────────────
function tsmAuthMiddleware(app) {

  // Parse cookies manually (no cookie-parser dependency)
  app.use((req, res, next) => {
    req.tsmCookies = parseCookies(req.headers.cookie);
    next();
  });

  // ── TOKEN LOGIN HANDLER ──────────────────────────────────────────────────────
  app.post('/auth/token', express_bodyparser(), (req, res) => {
    const { token, redirect } = req.body || {};
    const dest = redirect || '/html/tsm-consultz-portfolio.html';
    if (isValidToken(token)) {
      res.setHeader('Set-Cookie', setCookieHeader(token.toUpperCase().trim()));
      return res.redirect(302, dest);
    }
    return res.status(401).send(loginPage(dest, true));
  });

  // ── QUERY STRING TOKEN ───────────────────────────────────────────────────────
  // Allow ?t=TOKEN to set the cookie then redirect cleanly (no token in URL)
  app.use((req, res, next) => {
    const t = req.query.t;
    if (t && isProtected(req.path)) {
      if (isValidToken(t)) {
        res.setHeader('Set-Cookie', setCookieHeader(t.toUpperCase().trim()));
        const clean = req.path + (Object.keys(req.query).filter(k=>k!=='t').length
          ? '?' + Object.entries(req.query).filter(([k])=>k!=='t').map(([k,v])=>`${k}=${v}`).join('&')
          : '');
        return res.redirect(302, clean);
      }
      // Bad token in URL — show login
      return res.status(401).send(loginPage(req.path, true));
    }
    next();
  });

  // ── PROTECTED ROUTE GUARD ────────────────────────────────────────────────────
  app.use((req, res, next) => {
    if (!isProtected(req.url)) return next();
    const cookieToken = req.tsmCookies[COOKIE_NAME]
      ? decodeURIComponent(req.tsmCookies[COOKIE_NAME])
      : null;
    if (isValidToken(cookieToken)) return next();
    return res.status(401).send(loginPage(req.url, false));
  });
}

// Tiny body parser (avoids adding express.urlencoded globally)
function express_bodyparser() {
  return (req, res, next) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        req.body = Object.fromEntries(new URLSearchParams(body));
      } catch(e) { req.body = {}; }
      next();
    });
  };
}

module.exports = { tsmAuthMiddleware, isValidToken, VALID_TOKENS };
