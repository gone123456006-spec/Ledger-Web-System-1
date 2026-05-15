# Implementation Checklist

## Phase 1: Backend Setup ✅

- [x] Created `SyncData` MongoDB model for storing synced data
- [x] Created sync controller with pull/push/status/delete endpoints
- [x] Created sync routes (`/api/v1/sync/*`)
- [x] Integrated sync routes into main server.js
- [x] Created `.env.example` configuration template
- [x] Auth system already in place (User model, JWT, login/register)

**Action Required:**
- [ ] Copy `.env.example` to `.env` and fill in values
- [ ] Start MongoDB locally or use MongoDB Atlas
- [ ] Run `npm install` in BackEnd folder
- [ ] Test: `npm run dev` and check `http://localhost:5000/api/v1/health`

## Phase 2: Frontend Integration ✅

- [x] Created `sync-manager.js` - complete offline-first sync library
- [x] Updated `auth.js` - now connects to backend API (not hardcoded users)
- [x] Created `sync-demo.html` - interactive testing page

**Action Required:**
- [ ] Add `<script src="../sync-manager.js"></script>` to your HTML pages
- [ ] Add `<script src="../auth.js"></script>` to your HTML pages
- [ ] Update login form to use `window.ledgerAuth.login(email, password)`
- [ ] Replace `localStorage.setItem('customers', ...)` with `await window.ledgerSync.saveData('customers', ...)`

## Phase 3: Testing Setup ⏳

**Before Going Live:**

### Backend Tests
- [ ] Can start backend without errors
- [ ] MongoDB connects successfully
- [ ] Health check responds: `curl http://localhost:5000/api/v1/health`
- [ ] Can register user via API
- [ ] Can login with valid credentials
- [ ] Invalid login returns 401
- [ ] Sync endpoints require Bearer token (401 without it)

### Frontend Tests
- [ ] Open `sync-demo.html` to test interactively
- [ ] Login works (calls backend)
- [ ] Can save data offline (queues in outbox)
- [ ] Can see outbox contents
- [ ] Sync pushes queued data when online
- [ ] Pull downloads server data
- [ ] Network status indicator works
- [ ] Auto-sync on reconnect works

### Multi-Device Test
- [ ] Login on PC-1 with email `user1@shop.com`
- [ ] Save customer data on PC-1
- [ ] Login on PC-2 with same email
- [ ] Pull on PC-2 - should get PC-1's data
- [ ] Edit on PC-2, save and sync
- [ ] PC-1 pulls again - should see PC-2's changes

### Offline Test
- [ ] Disable network in DevTools (Ctrl+Shift+J > Network > Offline)
- [ ] Try saving data - should queue in outbox (no error)
- [ ] See "🔴 Offline" indicator
- [ ] Re-enable network
- [ ] Auto-sync should fire and push queued data
- [ ] See "🟢 Online" indicator

## Phase 4: Update Your Pages 📝

For each HTML page that saves data, update the save logic:

### Example: Updating gold-invoice.html

**Before (localStorage only):**
```javascript
function saveInvoice() {
  const invoiceData = {...};
  localStorage.setItem('invoices', JSON.stringify(invoiceData));
  showMessage('Saved');
}
```

**After (offline-first with sync):**
```javascript
async function saveInvoice() {
  const invoiceData = {...};
  
  // Save locally + queue for sync
  await window.ledgerSync.saveData('invoices', invoiceData, 1);
  
  // Show appropriate message
  if (navigator.onLine) {
    showMessage('✅ Saved and synced');
  } else {
    showMessage('✅ Saved locally (will sync when online)');
  }
}
```

### Pages to Update:
- [ ] gold-invoice.html - saveInvoice() calls
- [ ] customer-balance-QR.html - all localStorage.setItem() calls
- [ ] ready-extra-order.html - all save operations
- [ ] Any other page that uses localStorage for data

## Phase 5: Add UI Indicators 🎨

Add network/sync status to your dashboard:

**Simple Status Bar:**
```html
<div id="syncStatus" style="position: fixed; top: 0; right: 0; padding: 10px; 
  border-radius: 5px; background: #e8f5e9; color: #2e7d32;">
  🟢 Online - Last sync: <span id="lastSyncTime">never</span>
</div>

<script>
  // Update status every second
  setInterval(async () => {
    const status = await window.ledgerSync.getSyncStatus();
    if (status.data && status.data.lastSync) {
      document.getElementById('lastSyncTime').textContent = 
        new Date(status.data.lastSync).toLocaleTimeString();
    }
    
    // Update online/offline indicator
    const el = document.getElementById('syncStatus');
    if (navigator.onLine) {
      el.textContent = '🟢 Online - Last sync: ' + 
        new Date(status.data?.lastSync).toLocaleTimeString();
    } else {
      el.textContent = '🔴 Offline - Changes will sync when online';
    }
  }, 1000);
</script>
```

## Phase 6: Production Checklist 🚀

Before deploying to production:

- [ ] Change `JWT_SECRET` in `.env` to a strong random value
- [ ] Change `NODE_ENV` from `development` to `production`
- [ ] Use MongoDB Atlas (or managed DB) instead of localhost
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Enable HTTPS everywhere (set `secure: true` in cookies)
- [ ] Set up error logging/monitoring
- [ ] Test with real HTTPS URLs
- [ ] Set rate limiting appropriately
- [ ] Create backup strategy for MongoDB
- [ ] Set up automated tests (CI/CD)
- [ ] Document API for team

## Phase 7: Future Enhancements 🎯

After initial launch, consider:

- [ ] Service Worker for true offline app (load shell without internet)
- [ ] WebSocket for real-time sync notifications
- [ ] Multi-shop support (currently using email as shopId)
- [ ] User invitation system for team collaboration
- [ ] Role-based access control (RBAC)
- [ ] Audit logging of all changes
- [ ] Conflict resolution UI (show conflicts when two PCs edit same data)
- [ ] Advanced sync (incremental, bandwidth-optimized)
- [ ] Mobile app integration
- [ ] API rate limiting per user
- [ ] Search/full-text indexing

## Quick Command Reference

```bash
# Backend setup
cd BackEnd
cp .env.example .env
# Edit .env with your values
npm install

# Run backend
npm run dev      # Development (with nodemon)
npm start        # Production

# Frontend testing
# Open http://localhost:8000/frontend/pages/sync-demo.html

# Backend testing
curl http://localhost:5000/api/v1/health

# MongoDB (if local)
mongod            # Start MongoDB
mongo             # Connect to MongoDB shell
use ledger-db     # Select database
db.syncdata.find() # View sync records
```

## Support & Debugging

### Issue: CORS error when calling API
**Solution:** 
1. Check `CORS_ORIGIN` in `.env`
2. Ensure it matches your frontend URL exactly
3. Restart backend

### Issue: 401 Unauthorized errors
**Solution:**
1. Verify token is being sent: `Authorization: Bearer <token>`
2. Check token is not expired
3. Re-login to get fresh token

### Issue: Sync not working
**Solution:**
1. Check `navigator.onLine` in browser console
2. Verify backend is running
3. Check browser Network tab for API calls
4. Check backend logs for errors

### Issue: MongoDB connection failed
**Solution:**
1. Verify MongoDB is running locally or connection string is correct
2. Check `MONGO_URI` in `.env`
3. Verify network access for MongoDB Atlas if using cloud

### Debug Mode
Enable detailed logging:
```javascript
// In browser console
window.ledgerSync.getOutbox()  // See what's queued
window.ledgerAuth.getToken()   // See current JWT token
navigator.onLine               // Check connection status
```

---

**You're all set!** Follow the checklist above and your system will be fully offline-first with cloud sync. Start with Phase 1-2, test with sync-demo.html, then gradually update your actual pages. Good luck! 🚀
