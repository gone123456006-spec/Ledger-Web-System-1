/**
 * External keep-alive: pings Render API /health every 1 minute while the app is open.
 * Works with login + dashboard (index.html). Complements GitHub Actions + backend cron.
 */
(function () {
  var INTERVAL_MS = 60 * 1000;
  var DEFAULT_HEALTH = 'https://ledger-api-qmtc.onrender.com/api/v1/health';

  function isLocalDevHost() {
    try {
      var h = location.hostname || '';
      if (!h || h === 'localhost' || h === '127.0.0.1') return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  function getHealthUrl() {
    var base = window.LEDGER_API_BASE && String(window.LEDGER_API_BASE).trim();
    if (base) {
      return base.replace(/\/$/, '') + '/health';
    }
    return DEFAULT_HEALTH;
  }

  function pingHealth() {
    var url = getHealthUrl();
    fetch(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      mode: 'cors',
    }).catch(function () {});
  }

  if (isLocalDevHost()) {
    return;
  }

  pingHealth();
  setInterval(pingHealth, INTERVAL_MS);
})();
