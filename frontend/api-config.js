/**
 * Ledger API base URL. Load this script BEFORE auth.js / sync-manager.js.
 * Override anytime: window.LEDGER_API_BASE = 'https://your-api.com/api/v1';
 */
(function () {
  if (window.LEDGER_API_BASE && String(window.LEDGER_API_BASE).trim()) return;
  var h = (typeof location !== 'undefined' && location.hostname) || '';
  if (h === 'localhost' || h === '127.0.0.1') {
    window.LEDGER_API_BASE = 'http://localhost:5000/api/v1';
  } else {
    window.LEDGER_API_BASE = 'https://ledger-api-qmtc.onrender.com/api/v1';
  }
})();
