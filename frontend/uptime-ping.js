/**
 * When the dashboard is open on a deployed host, periodically GET /health so the
 * API stays warm alongside GitHub Actions (see .github/workflows).
 * No-op on localhost. Load after api-config.js.
 */
(function () {
  try {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return;
    var base = (window.LEDGER_API_BASE && String(window.LEDGER_API_BASE).trim()) || '';
    if (!base) return;
    var url = base.replace(/\/?$/, '') + '/health';
    function ping() {
      fetch(url, { method: 'GET', cache: 'no-store', credentials: 'omit' }).catch(
        function () {}
      );
    }
    ping();
    setInterval(ping, 5 * 60 * 1000);
  } catch (e) {
    /* ignore */
  }
})();
