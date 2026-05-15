# Complete Backend Setup - Summary

## What Was Built

You now have a **complete offline-first system** with:

### 1. **Backend (Node + Express + MongoDB)**
- ✅ **User authentication** (JWT-based, email/password)
- ✅ **Sync API** (`/api/v1/sync/*`) for offline-first data
- ✅ **Multi-tenant** (shopId scoping on every sync record)
- ✅ **Version tracking** (conflict detection)
- ✅ **Idempotent writes** (operationId for safe retries)

### 2. **Frontend Integration** 
- ✅ **auth.js** - Now connects to backend API (not hardcoded users)
- ✅ **sync-manager.js** - New file for offline/online sync
- ✅ **Auto-sync** on network reconnect
- ✅ **Outbox queue** for offline changes

## Files Created

### Backend
- `BackEnd/models/SyncData.js` - MongoDB collection for sync blobs
- `BackEnd/controllers/syncController.js` - Sync API logic
- `BackEnd/routes/syncRoutes.js` - Sync API routes
- `BackEnd/.env.example` - Environment config template
- `BACKEND_SETUP.md` - Complete setup & usage guide

### Frontend
- `frontend/sync-manager.js` - Offline-first sync library
- `frontend/auth.js` - Updated to use backend API

## Quick Start (5 steps)

### Step 1: Backend Setup
```bash
cd BackEnd
cp .env.example .env
# Edit .env: set MONGO_URI, JWT_SECRET
npm install
npm run dev
```

### Step 2: Verify Backend Running
```bash
curl http://localhost:5000/api/v1/health
# Should return: { "success": true, "message": "API is running" }
```

### Step 3: Create First User
```bash
# Option A: Via API (frontend register button)
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@shop.com", "password": "password123", "name": "Admin", "role": "admin"}'

# Option B: Use MongoDB directly if you have a seeder
```

### Step 4: Update Frontend HTML
Add these to your `<head>` (in login.html, dashboard, etc.):
```html
<script>
  // Set API URL (optional, defaults to localhost:5000)
  window.LEDGER_API_BASE = 'http://localhost:5000/api/v1';
</script>
<script src="../sync-manager.js"></script>
<script src="../auth.js"></script>
```

### Step 5: Update Login Form
Replace your login button's onclick with:
```javascript
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const result = await window.ledgerAuth.login(email, password);
  if (result.ok) {
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  } else {
    alert('Login failed: ' + result.message);
  }
}
```

## How It Works: Offline + Online Flow

### Saving Data (e.g., customers)
**Today (localStorage only):**
```javascript
localStorage.setItem('customers', JSON.stringify(data));
```

**New (offline-first with sync):**
```javascript
// This saves locally AND queues for sync
await window.ledgerSync.saveData('customers', data, 1);
```

### What Happens
1. **Offline**: Data saves to localStorage immediately; queues in outbox; shows "Syncing..." status
2. **Reconnect**: Auto-detects `online` event; drains outbox to `/api/v1/sync/push`
3. **Multi-device**: Other PCs pull latest via `/api/v1/sync/pull` (all data synced by shopId)

### Loading Data on Page Open
```javascript
if (window.ledgerAuth.isLoggedIn()) {
  // Pull latest from server
  await window.ledgerSync.pullLatest();
  
  // Load from localStorage (now contains server's latest copy)
  const customers = JSON.parse(localStorage.getItem('customers') || '[]');
  renderUI(customers);
}
```

## API Reference (Most Important)

### Login (Frontend)
```javascript
const result = await window.ledgerAuth.login(email, password);
// Returns: { ok: true/false, message: string, user: {...} }
```

### Save Data (Frontend)
```javascript
await window.ledgerSync.saveData(key, payload, version);
// key: 'customers', 'bills', 'stmt_LF123', etc. (mirrors localStorage keys)
// payload: any JSON object or array
// version: number (for conflict detection)
```

### Sync Now (Frontend)
```javascript
await window.ledgerSync.syncNow();
// Immediately push all pending outbox items
```

### Pull Latest (Frontend)
```javascript
await window.ledgerSync.pullLatest();
// Download all data for this shop from server
```

### Check Sync Status (Frontend)
```javascript
const status = await window.ledgerSync.getSyncStatus();
// Returns: { success, totalKeys, lastSync, keys }
```

## Deployment Notes

### For Production
1. Change `JWT_SECRET` to a long random string
2. Set `NODE_ENV=production` in .env
3. Use MongoDB Atlas or managed DB (not localhost)
4. Set `CORS_ORIGIN` to your actual frontend domain
5. Use HTTPS everywhere (`secure: true` in cookies)
6. Consider adding rate limiting and monitoring

### Docker (Optional)
```dockerfile
FROM node:16
WORKDIR /app
COPY BackEnd /app
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
```

## Testing Checklist

- [ ] Backend runs: `curl http://localhost:5000/api/v1/health` ✅
- [ ] User registration works (POST /auth/register)
- [ ] Login works (POST /auth/login, returns token)
- [ ] Sync push works (POST /api/v1/sync/push, offline and online)
- [ ] Sync pull works (GET /api/v1/sync/pull, returns customer data)
- [ ] Multi-device: login on 2 PCs, edit on PC-1, see changes on PC-2 after refresh
- [ ] Offline mode: disable network, save data, verify it queues, reconnect and syncs
- [ ] Conflict: edit same data on 2 PCs simultaneously, verify one gets 409 or last-write-wins

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" | API URL wrong or server down | Check `CORS_ORIGIN`, restart backend |
| 401 Unauthorized | Token missing or expired | Re-login, check Bearer header |
| CORS error | Frontend domain not allowed | Update `CORS_ORIGIN` in .env |
| Sync not working | Network offline | Check `navigator.onLine`, verify online |
| MongoDB connection fails | URL wrong or MongoDB not running | Check `MONGO_URI`, start MongoDB |

## Next Phase (After Testing)

1. **Replace all `localStorage.setItem()` calls** in your pages with `window.ledgerSync.saveData()`
2. **Add a "Sync Status" indicator** in UI (showing offline/syncing/synced)
3. **Implement shop selection** (if supporting multiple shops per user)
4. **Add device/shop membership** to User model (currently basic)
5. **Consider Service Worker** for true offline-first PWA (load app even with 0 internet)

---

**You're now ready to:**
- ✅ Work offline and sync later
- ✅ Support multiple PCs/shops
- ✅ Store everything in MongoDB
- ✅ Keep passwords secure on backend only
- ✅ Use JWT tokens for API auth

Go ahead and test the flow. If you hit any errors, the backend logs will show them clearly. Good luck! 🚀
