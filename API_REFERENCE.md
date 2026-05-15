# Ledger Sync API - Complete Reference

## Authentication Endpoints

### POST `/api/v1/auth/register`
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "phone": "9876543210",
  "role": "admin"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### POST `/api/v1/auth/login`
Login user and get JWT token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Response (Failure - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### GET `/api/v1/auth/me`
Get current logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "phone": "9876543210",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Sync Endpoints

### GET `/api/v1/sync/pull`
Pull all synced data for a shop.

**Query Parameters:**
- `shopId` (required): e.g., `?shopId=shop@example.com`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "shopId": "shop@example.com",
      "key": "customers",
      "payload": [
        { "id": 1, "name": "Cust 1", "email": "cust1@ex.com" },
        { "id": 2, "name": "Cust 2", "email": "cust2@ex.com" }
      ],
      "version": 3,
      "updatedAt": "2024-01-15T11:22:33.000Z",
      "operationId": "op_1234567890_abc123"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "shopId": "shop@example.com",
      "key": "bills",
      "payload": [...],
      "version": 2,
      "updatedAt": "2024-01-15T10:45:00.000Z",
      "operationId": "op_1234567880_def456"
    }
  ]
}
```

### POST `/api/v1/sync/push`
Push a data blob (create or update).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "shopId": "shop@example.com",
  "key": "customers",
  "payload": [
    { "id": 1, "name": "Updated Customer", "email": "upd@ex.com" }
  ],
  "version": 1,
  "deviceId": "device_1234567890_abc123",
  "operationId": "op_1234567890_xyz789",
  "clientUpdatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "key": "customers",
    "version": 4,
    "updatedAt": "2024-01-15T12:00:15.000Z",
    "operationId": "op_1234567890_xyz789"
  }
}
```

**Response (Stale Write - 409):**
```json
{
  "success": false,
  "message": "Stale write: server version is newer",
  "serverVersion": 5,
  "serverUpdatedAt": "2024-01-15T12:01:00.000Z"
}
```

### GET `/api/v1/sync/status`
Get sync status for a shop.

**Query Parameters:**
- `shopId` (required): e.g., `?shopId=shop@example.com`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalKeys": 5,
    "lastSync": "2024-01-15T12:00:15.000Z",
    "keys": [
      {
        "key": "customers",
        "version": 4,
        "updatedAt": "2024-01-15T12:00:15.000Z"
      },
      {
        "key": "bills",
        "version": 2,
        "updatedAt": "2024-01-15T10:45:00.000Z"
      }
    ]
  }
}
```

### DELETE `/api/v1/sync/:key`
Delete a sync key.

**Query Parameters:**
- `shopId` (required): e.g., `?shopId=shop@example.com`

**URL Parameters:**
- `:key`: The key to delete (e.g., `customers`, `stmt_LF123`)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Sync record deleted"
}
```

## Data Entities (Existing, Already in Backend)

All these use the same pattern as existing routes. Include `Authorization: Bearer <token>` header.

- **Customers**: `GET/POST/PUT/DELETE /api/v1/customers`
- **Bills**: `GET/POST/PUT/DELETE /api/v1/bills`
- **Orders**: `GET/POST/PUT/DELETE /api/v1/orders`
- **Items**: `GET/POST/PUT/DELETE /api/v1/items`
- **Payments**: `GET/POST/PUT/DELETE /api/v1/payments`
- **Transactions**: `GET/POST/PUT/DELETE /api/v1/transactions`
- **Loans**: `GET/POST/PUT/DELETE /api/v1/loans`
- **Stations**: `GET/POST/PUT/DELETE /api/v1/stations`
- **Agents**: `GET/POST/PUT/DELETE /api/v1/agents`
- **Job Workers**: `GET/POST/PUT/DELETE /api/v1/jobworkers`

## Frontend API Usage Examples

### Example 1: Complete Login + Sync Flow
```javascript
// Step 1: Login
const loginResult = await window.ledgerAuth.login('user@shop.com', 'password123');
if (!loginResult.ok) {
  console.error('Login failed:', loginResult.message);
  return;
}

// Step 2: Pull latest data from server (downloads all synced keys)
await window.ledgerSync.pullLatest();

// Step 3: Load local data (now contains server's latest)
const customers = JSON.parse(localStorage.getItem('customers') || '[]');
renderCustomerUI(customers);
```

### Example 2: Edit and Save with Auto-Sync
```javascript
// User edits customers
const updatedCustomers = [...customers, { id: 3, name: 'New Cust', email: 'new@ex.com' }];

// Save locally AND queue for sync
await window.ledgerSync.saveData('customers', updatedCustomers, 1);

// If offline: data queues in outbox
// If online: automatically syncs to server
```

### Example 3: Manual Sync Control
```javascript
// Check current outbox
const pending = window.ledgerSync.getOutbox();
console.log('Pending syncs:', pending.length);

// Force sync now (useful for "Sync Now" button)
const syncOk = await window.ledgerSync.syncNow();
if (syncOk) {
  console.log('All changes synced');
}
```

### Example 4: Multi-Device Sync
```javascript
// On PC-1: Save changes
await window.ledgerSync.saveData('bills', billsData, 1);

// On PC-2: After login, pull to get PC-1's changes
await window.ledgerSync.pullLatest();

// Local data on PC-2 now matches PC-1
const bills = JSON.parse(localStorage.getItem('bills'));
```

## Error Codes & Meanings

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Data saved/pulled successfully |
| 201 | Created | New resource created (register) |
| 400 | Bad Request | Missing required fields | Add shopId, key, email, password |
| 401 | Unauthorized | Invalid token or login | Login again |
| 403 | Forbidden | No permission to shop | Check shopId membership |
| 404 | Not Found | Resource doesn't exist | Verify ID/key exists |
| 409 | Conflict | Stale write (version mismatch) | Refresh and retry |
| 429 | Too Many Requests | Rate limit hit | Wait before retrying |
| 500 | Server Error | Backend error | Check server logs |

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@shop.com",
    "password": "password123",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@shop.com", "password": "password123"}'

# Save the returned token as TOKEN
```

### Push Data
```bash
curl -X POST http://localhost:5000/api/v1/sync/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "shopId": "test@shop.com",
    "key": "customers",
    "payload": [{"id": 1, "name": "Test"}],
    "version": 1,
    "deviceId": "device123",
    "operationId": "op_12345"
  }'
```

### Pull Data
```bash
curl -X GET "http://localhost:5000/api/v1/sync/pull?shopId=test@shop.com" \
  -H "Authorization: Bearer TOKEN"
```

### Check Status
```bash
curl -X GET "http://localhost:5000/api/v1/sync/status?shopId=test@shop.com" \
  -H "Authorization: Bearer TOKEN"
```
