/**
 * Ledger API base URL. Load BEFORE auth.js / sync-manager.js.
 * Local: Node API on port 5001 (5000 is often used by other apps).
 * Production: same-origin /api/v1 (Vercel proxies to Render).
 */
(function (global) {
  if (global.LEDGER_API_BASE && String(global.LEDGER_API_BASE).trim()) return;

  var LOCAL_API_PORT = 5001;
  var LOCAL_API = 'http://127.0.0.1:' + LOCAL_API_PORT + '/api/v1';
  var RENDER_API = 'https://ledger-api-qmtc.onrender.com/api/v1';

  function isLocalDevHost(hostname) {
    if (!hostname) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
  }

  function isVercelProduction() {
    var h = (typeof location !== 'undefined' && location.hostname) || '';
    return /\.vercel\.app$/i.test(h);
  }

  var h = (typeof location !== 'undefined' && location.hostname) || '';

  if (isVercelProduction()) {
    global.LEDGER_API_BASE = location.origin.replace(/\/$/, '') + '/api/v1';
    return;
  }

  if (isLocalDevHost(h)) {
    if (typeof location !== 'undefined' && location.origin && /^https?:$/i.test(location.protocol || '')) {
      global.LEDGER_API_BASE = location.origin.replace(/\/$/, '') + '/api/v1';
      return;
    }
    global.LEDGER_API_BASE = LOCAL_API;
    return;
  }

  if (typeof location !== 'undefined' && location.origin) {
    global.LEDGER_API_BASE = location.origin.replace(/\/$/, '') + '/api/v1';
    return;
  }

  global.LEDGER_API_BASE = RENDER_API;
})(typeof window !== 'undefined' ? window : globalThis);
