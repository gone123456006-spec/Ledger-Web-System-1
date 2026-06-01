/**
 * Ledger Sync Manager: offline-first sync with MongoDB backend
 * 
 * - Saves data locally first (localStorage / IndexedDB)
 * - Queues changes for sync when online
 * - Pulls latest from server on load/login
 */

(function () {
  function defaultApiBase() {
    try {
      const h = location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' ||
          /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) {
        if (location.origin && /^https?:$/i.test(location.protocol || '')) {
          return location.origin.replace(/\/$/, '') + '/api/v1';
        }
        return 'http://127.0.0.1:5001/api/v1';
      }
      return location.origin.replace(/\/$/, '') + '/api/v1';
    } catch (e) {
      return 'https://ledger-api-qmtc.onrender.com/api/v1';
    }
  }
  const API_BASE =
    (window.LEDGER_API_BASE && String(window.LEDGER_API_BASE).trim()) || defaultApiBase();
  const OUTBOX_KEY = 'ledger_sync_outbox_v1';
  const DEVICE_ID_KEY = 'ledger_device_id';
  const LAST_SYNC_KEY = 'ledger_last_sync_v1';

  let currentShopId = null;
  let currentToken = null;
  let currentDeviceId = null;
  let syncInProgress = false;

  /**
   * Generate or retrieve persistent device ID
   */
  function getOrCreateDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  /**
   * Set shop context (call after login)
   */
  function setContext(shopId, token) {
    currentShopId = shopId;
    currentToken = token;
    currentDeviceId = getOrCreateDeviceId();
  }

  /**
   * Get current outbox (pending writes)
   */
  function getOutbox() {
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Add operation to outbox
   */
  function addToOutbox(key, payload, version) {
    const outbox = getOutbox();
    outbox.push({
      key,
      payload,
      version: version || 1,
      clientUpdatedAt: new Date().toISOString(),
      operationId: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    });
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    } catch (e) {
      console.warn('Failed to save outbox:', e);
    }
  }

  /**
   * Remove operation from outbox
   */
  function removeFromOutbox(operationId) {
    const outbox = getOutbox();
    const filtered = outbox.filter(op => op.operationId !== operationId);
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to update outbox:', e);
    }
  }

  /**
   * Save data locally AND queue for sync
   */
  async function saveData(key, payload, version) {
    if (!currentShopId) {
      console.warn('saveData called without shopId context');
      return false;
    }

    // Save locally first (always works)
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save locally:', e);
    }

    // Queue for sync
    addToOutbox(key, payload, version);

    // Try to sync immediately if online
    if (navigator.onLine) {
      await syncNow();
    }

    return true;
  }

  /**
   * Push all pending changes to server
   */
  async function syncNow() {
    if (!currentShopId || !currentToken) {
      console.warn('syncNow called without auth context');
      return false;
    }

    if (syncInProgress) {
      return false;
    }

    syncInProgress = true;
    try {
      const outbox = getOutbox();
      if (outbox.length === 0) {
        return true; // Nothing to sync
      }

      let successCount = 0;
      for (const op of outbox) {
        try {
          const response = await fetch(`${API_BASE}/sync/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`,
            },
            body: JSON.stringify({
              shopId: currentShopId,
              key: op.key,
              payload: op.payload,
              version: op.version,
              deviceId: currentDeviceId,
              operationId: op.operationId,
              clientUpdatedAt: op.clientUpdatedAt,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              removeFromOutbox(op.operationId);
              successCount++;
            }
          } else if (response.status === 409) {
            // Stale write; remove from outbox and log
            console.warn('Stale write for key:', op.key);
            removeFromOutbox(op.operationId);
          }
        } catch (e) {
          console.warn('Sync error for operation:', op.operationId, e);
          // Leave in outbox for retry
        }
      }

      // Update last sync time
      try {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch (e) {}

      return successCount === outbox.length;
    } finally {
      syncInProgress = false;
    }
  }

  /**
   * Pull latest data from server and refresh local
   */
  async function pullLatest() {
    if (!currentShopId || !currentToken) {
      console.warn('pullLatest called without auth context');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/sync/pull?shopId=${currentShopId}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        console.warn('Pull failed:', response.status);
        return false;
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) {
        return false;
      }

      // Merge server data into local (server is source of truth here)
      for (const item of data.data) {
        try {
          localStorage.setItem(item.key, JSON.stringify(item.payload));
        } catch (e) {
          console.warn('Failed to store', item.key, ':', e);
        }
      }

      // Update last sync
      try {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      } catch (e) {}

      return true;
    } catch (e) {
      console.warn('pullLatest error:', e);
      return false;
    }
  }

  /**
   * Get sync status
   */
  async function getSyncStatus() {
    if (!currentShopId || !currentToken) {
      return { ready: false };
    }

    try {
      const response = await fetch(`${API_BASE}/sync/status?shopId=${currentShopId}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('getSyncStatus error:', e);
    }

    return { ready: false };
  }

  /**
   * Clear outbox (after clearing statement or manual reset)
   */
  function clearOutbox() {
    try {
      localStorage.removeItem(OUTBOX_KEY);
    } catch (e) {}
  }

  // Setup: listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('[Sync] Network online');
    // Auto-sync when coming back online
    if (currentToken) {
      await syncNow();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[Sync] Network offline - changes saved locally');
  });

  // Expose public API
  window.ledgerSync = {
    setContext,
    saveData,
    syncNow,
    pullLatest,
    getSyncStatus,
    clearOutbox,
    getOutbox,
  };
})();
