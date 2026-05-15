// Auth against backend only — credentials live in MongoDB (hashed). No secrets in this file.
(function () {
  const SESSION_KEY = 'ledger_auth_session_v1';
  const API_BASE = window.LEDGER_API_BASE || 'http://localhost:5000/api/v1';
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
          message: data.message || 'Invalid credentials',
        };
      }

      if (!data.success || !data.token) {
        return { ok: false, message: 'Invalid response from server' };
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
      return {
        ok: false,
        message: 'Cannot reach server. Is the API running on ' + API_BASE + '?',
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
