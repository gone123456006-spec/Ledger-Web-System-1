/**
 * Ledger API base URL. Load BEFORE auth.js / sync-manager.js.
 * Local: direct to Node on port 5000.
 * Production: same-origin /api/v1 (Vercel proxies to Render — no CORS issues).
 */
(function (global) {
  if (global.LEDGER_API_BASE && String(global.LEDGER_API_BASE).trim()) return;

  var RENDER_API = 'https://ledger-api-qmtc.onrender.com/api/v1';
  var h = (typeof location !== 'undefined' && location.hostname) || '';

  if (h === 'localhost' || h === '127.0.0.1') {
    global.LEDGER_API_BASE = 'http://127.0.0.1:5000/api/v1';
    return;
  }

  if (typeof location !== 'undefined' && location.origin) {
    global.LEDGER_API_BASE = location.origin.replace(/\/$/, '') + '/api/v1';
    return;
  }

  global.LEDGER_API_BASE = RENDER_API;
})(typeof window !== 'undefined' ? window : globalThis);
