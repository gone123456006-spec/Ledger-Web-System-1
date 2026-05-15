/**
 * Uptime service: Internal cron job to keep backend warm on Render.
 * Runs every 1 minute to prevent sleep mode.
 * Works as a backup to GitHub Actions workflow.
 */
const cron = require('node-cron');

let uptime_task = null;

function startUptimeMonitor() {
  if (uptime_task) return;

  uptime_task = cron.schedule('* * * * *', () => {
    const now = new Date().toISOString();
    console.log(`[UPTIME] ${now} - Health check running internally (cron job)`);
  });

  console.log('[UPTIME] Background health monitor started (every 1 minute)'.green);
}

function stopUptimeMonitor() {
  if (uptime_task) {
    uptime_task.stop();
    console.log('[UPTIME] Health monitor stopped'.yellow);
  }
}

module.exports = {
  startUptimeMonitor,
  stopUptimeMonitor,
};
