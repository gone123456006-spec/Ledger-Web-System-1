// Simple frontend-only auth (localStorage session)
(function () {
  const SESSION_KEY = "ledger_auth_session_v1";
  const STORAGE_FALLBACK_KEY = "ledger_auth_storage_fallback_v1";

  // Simple hardcoded users (change as needed)
  const USERS = [
    { username: "admin", password: "admin" },
    { username: "user", password: "1234" }
  ];

  function normalizeUsername(u) {
    return String(u || "").trim();
  }

  function normalizePassword(p) {
    return String(p || "").trim();
  }

  function getStorage(){
    // Prefer localStorage, fallback to sessionStorage (some browsers block localStorage)
    try {
      const t = "__t";
      localStorage.setItem(t, "1");
      localStorage.removeItem(t);
      return localStorage;
    } catch(e) {}
    try {
      const t = "__t";
      sessionStorage.setItem(t, "1");
      sessionStorage.removeItem(t);
      return sessionStorage;
    } catch(e) {}
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
    return !!(s && s.username);
  }

  function getUsername() {
    const s = getSession();
    return (s && s.username) ? String(s.username) : "";
  }

  function login(username, password) {
    const u = normalizeUsername(username);
    const p = normalizePassword(password);

    const ok = USERS.some(x => x.username === u && x.password === p);
    if (!ok) return { ok: false, message: "Invalid username or password" };

    try {
      const storage = getStorage();
      if(!storage) return { ok: false, message: "Browser storage is blocked. Please allow site data." };

      storage.setItem(
        SESSION_KEY,
        JSON.stringify({ username: u, loginAt: new Date().toISOString() })
      );
      // store which storage we used (debug/support)
      try {
        storage.setItem(STORAGE_FALLBACK_KEY, storage === localStorage ? "local" : "session");
      } catch(e) {}
    } catch (e) {}

    return { ok: true, message: "Login successful" };
  }

  function logout() {
    try {
      const storage = getStorage();
      if(storage){
        storage.removeItem(SESSION_KEY);
        storage.removeItem(STORAGE_FALLBACK_KEY);
      } else {
        // best effort
        try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
        try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {}
      }
    } catch (e) {}
  }

  function requireAuth(redirectUrl) {
    if (isLoggedIn()) return true;
    // keep it relative when possible (works on localhost + Vercel + Render)
    const target = redirectUrl || "login.html";
    try {
      window.location.replace(target);
    } catch (e) {
      window.location.href = target;
    }
    return false;
  }

  // Expose minimal API
  window.ledgerAuth = {
    login,
    logout,
    isLoggedIn,
    getUsername,
    requireAuth
  };
})();

