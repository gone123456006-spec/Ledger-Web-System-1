// Auth against backend only — credentials live in MongoDB (hashed). No secrets in this file.
(function () {
  const SESSION_KEY = 'ledger_auth_session_v1';
  function defaultApiBase() {
    try {
      const h = location.hostname;
      if (h === 'localhost' || h === '127.0.0.1') {
        return 'http://localhost:5000/api/v1';
      }
    } catch (e) { /* ignore */ }
    return 'https://ledger-api-qmtc.onrender.com/api/v1';
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
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          ok: false,
          message: loginFailedMessage(response.status, data.message),
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

      if (window.ledgerSync) {
        window.ledgerSync.setContext(data.user.email, data.token);
      }

      return { ok: true, message: 'Login successful', user: data.user };
    } catch (err) {
      const msg = err && err.message ? String(err.message) : '';
      const looksNetwork =
        (err && err.name === 'TypeError') ||
        /failed to fetch|network|load failed|aborted/i.test(msg);
      return {
        ok: false,
        message: looksNetwork ? networkFailedMessage() : 'Failed to log in. Something went wrong. Please try again.',
      };
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
  };
})();
