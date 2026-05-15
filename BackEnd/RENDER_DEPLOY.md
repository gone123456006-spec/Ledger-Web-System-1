# Deploy Ledger backend on Render

## 1. Repo layout

This repo uses **`BackEnd/`** as the Node app. The root **`render.yaml`** sets `rootDir: BackEnd` so Render runs `npm install` and `npm start` there.

## 2. Create the Web Service on Render

1. Push your code to **GitHub** (or GitLab / Bitbucket Render supports).
2. In [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect the repo, or **New** → **Web Service** → connect the repo.
3. If **Web Service** (manual):
   - **Root Directory:** `BackEnd`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/v1/health`

## 3. Environment variables (Render → Environment)

Set at least:

| Key | Example / notes |
|-----|-------------------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (do not reuse dev defaults in production) |
| `JWT_EXPIRE` | `7d` |
| `JWT_COOKIE_EXPIRE` | `7` |
| `CORS_ORIGIN` | Your **live** frontend URL, e.g. `https://your-app.pages.dev` (no trailing slash) |
| `NODE_ENV` | `production` |

Optional: `DEFAULT_LOGIN_EMAIL`, `DEFAULT_LOGIN_PASSWORD` if you use the default-user seeder.

**Atlas:** Network Access → allow **`0.0.0.0/0`** (or Render’s egress if you lock it down later).

## 4. Port

Render sets **`PORT`**. `server.js` already uses `process.env.PORT` — no change needed.

## 5. Frontend → API URL

Production frontend on Vercel uses a **same-origin proxy** (`vercel.json` rewrites `/api/v1/*` → your Render URL). No manual `LEDGER_API_BASE` needed for `ledger-navi.vercel.app`.

If you use a **different** Render service URL, update **both**:
- `vercel.json` → `/api/v1/:path*` destination
- `frontend/api-config.js` → `RENDER_API` fallback constant

## 6. “Never sleep” on Render

- **Free Web Service:** Render **spins the service down** after about **15 minutes** without HTTP traffic. You **cannot** disable that on Free.
- **Always on:** Use a **paid** instance. In **`render.yaml`** this repo sets **`plan: starter`** so the service stays up (no idle sleep). If you want **Free**, delete the `plan: starter` line in `render.yaml` or pick **Free** in the dashboard — then expect cold starts after idle.
- **Not a substitute for paid:** Pinging `/api/v1/health` every few minutes from an external cron **may** reduce sleep on Free, but it is **fragile**, can violate fair-use expectations, and is **not** guaranteed 24/7. For production, use **Starter or higher**.

## 7. After first deploy

1. Open `https://YOUR-SERVICE.onrender.com/api/v1/health` — should return JSON `success: true`.
2. Run **seed default user** once (Render **Shell** or one-off job), from `BackEnd`:
   - `node seeders/defaultUser.js`
3. Set **`CORS_ORIGIN`** to your real frontend origin so login works.

## 8. Blueprint vs manual

- **Blueprint:** connect repo; Render reads root **`render.yaml`**.
- Edit **`plan: starter`** vs remove it to match **Free vs paid** choice.
