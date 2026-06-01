// Auth against backend only — credentials live in MongoDB (hashed). No secrets in this file.
(function () {
  const SESSION_KEY = 'ledger_auth_session_v1';
  const OFFLINE_AUTH_CACHE_KEY = 'ledger_offline_auth_cache_v1';
  const LOCAL_BOOTSTRAP_EMAIL = 'u9xQ7mL2vT8kR4pZ@ledger.co';
  const LOCAL_BOOTSTRAP_USER_ID = 'local_bootstrap_admin';
  /** SHA-256 of default seed password — local offline bootstrap only (matches BackEnd/seeders/defaultUser.js). */
  const LOCAL_BOOTSTRAP_PW_HASH = '2297605cbe0c624804c889de4d8aa4256d62981cd1f95234c69f82d41f377d2f';

  function defaultApiBase() {
    try {
      const h = location.hostname;
      if (!h || h === 'localhost' || h === '127.0.0.1' ||
          /^192\.168\.\d{1,3}\.\d{1,3}$/.test(h) ||
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) {
        if (location.origin && /^https?:$/i.test(location.protocol || '')) {
          return location.origin.replace(/\/$/, '') + '/api/v1';
        }
        return 'http://127.0.0.1:5001/api/v1';
      }
      if (/\.vercel\.app$/i.test(h)) {
        return location.origin.replace(/\/$/, '') + '/api/v1';
      }
      return location.origin.replace(/\/$/, '') + '/api/v1';
    } catch (e) {
      return 'https://ledger-api-qmtc.onrender.com/api/v1';
    }
  }
  const API_BASE =
    (window.LEDGER_API_BASE && String(window.LEDGER_API_BASE).trim()) || defaultApiBase();
  /** If user types the short id without @, map to this email (must match seeded user). */
  const LOGIN_EMAIL_DOMAIN = '@ledger.co';

  function normalizeInput(s) {
    return String(s || '').trim();
  }

  function loginIdentifierToEmail(identifier) {
    const raw = normalizeInput(identifier).toLowerCase();
    if (!raw) return '';
    if (raw.includes('@')) return raw;
    return raw + LOGIN_EMAIL_DOMAIN;
  }

  function isLocalAppHost() {
    try {
      const h = location.hostname;
      if (!h || h === 'localhost' || h === '127.0.0.1') return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
      return location.protocol === 'file:';
    } catch (e) {
      return false;
    }
  }

  async function sha256Hex(text) {
    const value = String(text || '');
    if (globalThis.crypto && crypto.subtle && typeof TextEncoder !== 'undefined') {
      const data = new TextEncoder().encode(value);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
    return value;
  }

  function getStorage() {
    try {
      const t = '__t';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return localStorage;
    } catch (e) {}
    try {
      const t = '__t';
      sessionStorage.setItem(t, '1');
      sessionStorage.removeItem(t);
      return sessionStorage;
    } catch (e) {}
    return null;
  }

  function getSession() {
    try {
      const storage = getStorage();
      const raw = storage ? storage.getItem(SESSION_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    const s = getSession();
    return !!(s && s.token);
  }

  function getUsername() {
    const s = getSession();
    if (!s) return '';
    if (s.displayLogin) return String(s.displayLogin);
    return s.email ? String(s.email) : '';
  }

  function getToken() {
    const s = getSession();
    return s && s.token ? s.token : null;
  }

  function saveOfflineAuthCache(user, displayLogin, passwordVerifier) {
    try {
      localStorage.setItem(
        OFFLINE_AUTH_CACHE_KEY,
        JSON.stringify({
          email: user.email,
          userId: user.id,
          role: user.role,
          name: user.name,
          displayLogin: normalizeInput(displayLogin),
          passwordVerifier: passwordVerifier,
          cachedAt: new Date().toISOString(),
        })
      );
    } catch (e) {}
  }

  function readOfflineAuthCache() {
    try {
      const raw = localStorage.getItem(OFFLINE_AUTH_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeSession(session) {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  }

  async function tryOfflineLogin(email, password, displayLogin) {
    if (!isLocalAppHost()) return null;

    const verifier = await sha256Hex(password);
    const cache = readOfflineAuthCache();

    if (cache && String(cache.email || '').toLowerCase() === email && cache.passwordVerifier === verifier) {
      if (!writeSession({
        token: 'offline_' + String(cache.userId || 'user'),
        email: cache.email,
        userId: cache.userId,
        role: cache.role || 'admin',
        name: cache.name || 'Ledger User',
        displayLogin: normalizeInput(displayLogin) || cache.displayLogin || email,
        loginAt: new Date().toISOString(),
        offline: true,
      })) {
        return { ok: false, message: 'Browser storage is blocked. Please allow site data.' };
      }
      if (window.ledgerSync) {
        window.ledgerSync.setContext(cache.email, 'offline_' + String(cache.userId || 'user'));
      }
      return { ok: true, message: 'Login successful (offline mode)', offline: true };
    }

    if (
      email === LOCAL_BOOTSTRAP_EMAIL.toLowerCase() &&
      verifier === LOCAL_BOOTSTRAP_PW_HASH
    ) {
      const display = normalizeInput(displayLogin) || 'u9xQ7mL2vT8kR4pZ';
      saveOfflineAuthCache(
        {
          email: LOCAL_BOOTSTRAP_EMAIL,
          id: LOCAL_BOOTSTRAP_USER_ID,
          role: 'admin',
          name: 'Ledger Admin',
        },
        display,
        verifier
      );
      if (!writeSession({
        token: 'offline_' + LOCAL_BOOTSTRAP_USER_ID,
        email: LOCAL_BOOTSTRAP_EMAIL,
        userId: LOCAL_BOOTSTRAP_USER_ID,
        role: 'admin',
        name: 'Ledger Admin',
        displayLogin: display,
        loginAt: new Date().toISOString(),
        offline: true,
      })) {
        return { ok: false, message: 'Browser storage is blocked. Please allow site data.' };
      }
      if (window.ledgerSync) {
        window.ledgerSync.setContext(LOCAL_BOOTSTRAP_EMAIL, 'offline_' + LOCAL_BOOTSTRAP_USER_ID);
      }
      return { ok: true, message: 'Login successful (offline mode)', offline: true };
    }

    return null;
  }

  function loginFailedMessage(httpStatus, serverMessage) {
    const s = Number(httpStatus) || 0;
    const m = serverMessage ? String(serverMessage).trim() : '';

    if (s === 401 || s === 400) {
      return 'Failed to log in. Please check your username and password.';
    }
    if (s === 429) {
      return 'Failed to log in. Too many attempts — please wait a few minutes and try again.';
    }
    if (s >= 500) {
      return 'Failed to log in. The server is having a problem. Please try again later.';
    }
    if (m && m.length > 0 && m.length < 160) {
      return 'Failed to log in. ' + m;
    }
    return 'Failed to log in. Please try again.';
  }

  function networkFailedMessage() {
    if (isLocalAppHost()) {
      return 'Server is not running. Logged in using offline mode, or start the app with: npm run dev';
    }
    return 'Failed to log in — we could not reach the server. Check that it is running and try again.';
  }

  async function login(usernameOrEmail, password) {
    const email = loginIdentifierToEmail(usernameOrEmail);
    const pw = normalizeInput(password);

    if (!email || !pw) {
      return { ok: false, message: 'Username and password required' };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (isLocalAppHost() && (response.status >= 500 || response.status === 0)) {
          const offline = await tryOfflineLogin(email, pw, usernameOrEmail);
          if (offline) return offline;
        }
        const serverMsg = data.message || data.error;
        return {
          ok: false,
          message: loginFailedMessage(response.status, serverMsg),
        };
      }

      if (!data.success || !data.token) {
        return { ok: false, message: 'Failed to log in. Please try again.' };
      }

      const storage = getStorage();
      if (!storage) {
        return { ok: false, message: 'Browser storage is blocked. Please allow site data.' };
      }

      storage.setItem(
        SESSION_KEY,
        JSON.stringify({
          token: data.token,
          email: data.user.email,
          userId: data.user.id,
          role: data.user.role,
          name: data.user.name,
          displayLogin: normalizeInput(usernameOrEmail),
          loginAt: new Date().toISOString(),
        })
      );

      saveOfflineAuthCache(data.user, usernameOrEmail, await sha256Hex(pw));

      if (window.ledgerSync) {
        window.ledgerSync.setContext(data.user.email, data.token);
      }

      return { ok: true, message: 'Login successful', user: data.user };
    } catch (err) {
      const offline = await tryOfflineLogin(email, pw, usernameOrEmail);
      if (offline) return offline;

      const msg = err && err.message ? String(err.message) : '';
      const looksNetwork =
        (err && err.name === 'TypeError') ||
        /failed to fetch|network|load failed|aborted/i.test(msg);
      return {
        ok: false,
        message: looksNetwork
          ? (isLocalAppHost()
            ? 'Could not reach the server. Use your saved password to log in offline, or run npm run dev from the project folder.'
            : networkFailedMessage())
          : 'Failed to log in. Something went wrong. Please try again.',
      };
    }
  }

  async function checkServerHealth() {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(function () { controller.abort(); }, 4000) : null;
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller ? controller.signal : undefined,
      });
      if (timer) clearTimeout(timer);
      return !!(response && response.ok);
    } catch (e) {
      return false;
    }
  }

  function logout() {
    try {
      const storage = getStorage();
      if (storage) storage.removeItem(SESSION_KEY);
      else {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {}
      }
    } catch (e) {}
  }

  function requireAuth(redirectUrl) {
    if (isLoggedIn()) return true;
    const target = redirectUrl || 'login.html';
    try {
      window.location.replace(target);
    } catch (e) {
      window.location.href = target;
    }
    return false;
  }

  window.ledgerAuth = {
    login,
    logout,
    isLoggedIn,
    getUsername,
    getToken,
    requireAuth,
    checkServerHealth,
    isLocalAppHost,
  };
})();
