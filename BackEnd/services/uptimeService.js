/**
 * Keep Render (and local) API warm: real HTTP GET /api/v1/health every 1 minute.
 * When the service is asleep, only external pings wake it (GitHub Actions, frontend).
 */
const cron = require('node-cron');
const http = require('http');
const https = require('https');

const DEFAULT_RENDER_HEALTH = 'https://ledger-api-qmtc.onrender.com/api/v1/health';

let uptimeTask = null;

function pingUrl(url) {
  return new Promise(function (resolve, reject) {
    const lib = String(url).indexOf('https:') === 0 ? https : http;
    const req = lib.get(url, { timeout: 20000 }, function (res) {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.setTimeout(20000, function () {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function collectHealthTargets() {
  const port = process.env.PORT || 5001;
  const targets = ['http://127.0.0.1:' + port + '/api/v1/health'];

  const external =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.LEDGER_UPTIME_URL ||
    process.env.LEDGER_API_HEALTH_URL;

  if (external) {
    const base = String(external).replace(/\/$/, '');
    if (base.indexOf('/api/v1/health') >= 0) {
      targets.push(base);
    } else if (base.indexOf('/api/v1') >= 0) {
      targets.push(base.replace(/\/api\/v1\/?$/, '') + '/api/v1/health');
    } else {
      targets.push(base + '/api/v1/health');
    }
  }

  return targets.filter(function (url, i, arr) {
    return arr.indexOf(url) === i;
  });
}

async function runUptimePing() {
  const targets = collectHealthTargets();
  const stamp = new Date().toISOString();

  for (let i = 0; i < targets.length; i++) {
    const url = targets[i];
    try {
      const code = await pingUrl(url);
      console.log('[UPTIME] ' + stamp + ' - ' + url + ' -> HTTP ' + code);
    } catch (err) {
      console.warn('[UPTIME] ' + stamp + ' - ' + url + ' failed: ' + (err.message || err));
    }
  }
}

function startUptimeMonitor() {
  if (uptimeTask) return;

  runUptimePing().catch(function () {});

  uptimeTask = cron.schedule(
    '* * * * *',
    function () {
      runUptimePing().catch(function () {});
    },
    { scheduled: true }
  );

  console.log(
    '[UPTIME] Keep-alive active — health ping every 1 minute (' +
      collectHealthTargets().join(', ') +
      ')'
  );
}

function stopUptimeMonitor() {
  if (uptimeTask) {
    uptimeTask.stop();
    uptimeTask = null;
    console.log('[UPTIME] Health monitor stopped');
  }
}

module.exports = {
  startUptimeMonitor,
  stopUptimeMonitor,
  runUptimePing,
  DEFAULT_RENDER_HEALTH,
};
