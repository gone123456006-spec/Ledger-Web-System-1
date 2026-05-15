# Ledger Backend Setup Guide

## Environment Variables (.env)

Create a `.env` file in the `BackEnd` directory with:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/ledger-db
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/ledger-db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# CORS
CORS_ORIGIN=http://localhost:8000

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

```bash
cd BackEnd
npm install
```

## Running the Server

```bash
# Development (with nodemon for hot reload)
npm run dev

# Production
npm start
```

The API will be available at: `http://localhost:5000/api/v1`

## Frontend Integration

1. **Add sync-manager.js to your HTML pages** (before other scripts):
   ```html
   <script src="../sync-manager.js"></script>
   <script src="../auth.js"></script>
   ```

2. **Set API base** (optional, defaults to `http://localhost:5000/api/v1`):
   ```html
   <script>
     window.LEDGER_API_BASE = 'http://your-api-domain:5000/api/v1';
   </script>
   ```

3. **Update your login form** to call:
   ```javascript
   const result = await window.ledgerAuth.login(email, password);
   if (result.ok) {
     // Navigate to dashboard
   } else {
     console.error(result.message);
   }
   ```

4. **When saving data**, replace `localStorage.setItem()` with:
   ```javascript
   await window.ledgerSync.saveData('customers', customersArray, 1);
   ```

5. **On page load** (after login check):
   ```javascript
   if (window.ledgerAuth.isLoggedIn()) {
     // Pull latest from server
     await window.ledgerSync.pullLatest();
     // Load local data (already updated from pullLatest)
   }
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email + password
- `POST /api/v1/auth/register` - Register new user (email + password)
- `GET /api/v1/auth/me` - Get current user (requires Bearer token)
- `PUT /api/v1/auth/updatepassword` - Change password

### Sync (Offline-First)
- `GET /api/v1/sync/pull?shopId=X` - Get all synced data for a shop
- `POST /api/v1/sync/push` - Push a data blob (create or update)
- `GET /api/v1/sync/status?shopId=X` - Get sync status
- `DELETE /api/v1/sync/:key?shopId=X` - Delete a synced key

### Data Entities (existing)
- Customers: `GET/POST /api/v1/customers`
- Bills: `GET/POST /api/v1/bills`
- Orders: `GET/POST /api/v1/orders`
- And all other existing routes

## Multi-Device / Multi-Shop Sync Flow

1. **User logs in** on PC-1 with email "user@shop.com"
   - Backend creates JWT with user ID
   - Frontend stores token + shopId in localStorage
   - `window.ledgerSync.setContext(shopId, token)` called

2. **User saves customers** on PC-1
   - Frontend writes to localStorage (instant)
   - Calls `window.ledgerSync.saveData('customers', [...], 1)`
   - If online: pushes to `/api/v1/sync/push` immediately
   - If offline: queues in outbox

3. **Same user logs in** on PC-2
   - Different localStorage (local to PC-2)
   - After login, calls `window.ledgerSync.pullLatest()`
   - Server returns all synced data for that shopId
   - PC-2 now has the same customers, bills, etc.

4. **Conflict handling** (two PCs edit same document)
   - Version number on each document
   - PC with older version gets 409 (Conflict)
   - Frontend can show "Server updated, reload?" or use last-write-wins

## Troubleshooting

- **CORS error**: Check `CORS_ORIGIN` in .env matches your frontend URL
- **401 Unauthorized**: Token expired or not sent with `Authorization: Bearer <token>` header
- **MongoDB connection failed**: Ensure MongoDB is running or check `MONGO_URI`
- **Port already in use**: Change `PORT` in .env or kill process on port 5000

## Next Steps

1. Create initial user: either via POST /api/v1/auth/register or seed script
2. Update your login.html to use the new `window.ledgerAuth.login()` async function
3. Wrap all data saves with `window.ledgerSync.saveData()` calls
4. Test offline: disable network and verify changes queue; reconnect and sync
