# NeoChess — Deployment & Free Internet Multiplayer Guide ($0 Budget)

This guide documents how to run, host, and play **NeoChess** over the local network (LAN) and the public internet at **strictly $0 budget** using free, open-source, and cloud-native solutions.

---

## 1. Instant Free Internet Multiplayer (Quick Tunnel — 30 Seconds)

To play immediately with friends anywhere in the world without configuring port forwarding, router firewalls, dynamic DNS, or paying for servers:

### Step 1: Install Cloudflare Tunnel CLI (Free & Open Source)
On Windows PowerShell:
```powershell
winget install --id Cloudflare.cloudflared
```
*(Or download the binary directly from [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases/latest).)*

### Step 2: Start NeoChess Locally
Ensure both backend and frontend are running:
```bash
npm run dev --workspace=@chess/server
npm run dev --workspace=@chess/web
```

### Step 3: Run the Tunnel Script
Simply run the included helper script:
```powershell
.\scripts\start_internet_tunnel.ps1
```
*(Or double-click `scripts\start_internet_tunnel.bat`)*

Cloudflare will output a public HTTPS address like:
```text
https://random-words-here.trycloudflare.com
```
Share this URL with anyone! Both the web application, REST API, and WebSocket (Socket.IO) traffic will stream through this secure tunnel with zero latency degradation.

---

## 2. Local Area Network (LAN) Multiplayer

Play across multiple devices (phones, laptops, iPads) connected to the same Wi-Fi network:

1. Find your machine's local IP address:
   ```powershell
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.45)
   ```
2. Start the dev servers:
   ```bash
   npm run dev --workspace=@chess/server
   npm run dev --workspace=@chess/web
   ```
3. Open any browser on the same Wi-Fi network and navigate to:
   ```text
   http://192.168.1.45:5173
   ```
4. Click **Multiplayer Lobby** or send a challenge link. Both players connect instantaneously.

---

## 3. Permanent $0 Cloud Deployment Architecture

If you want NeoChess running 24/7 on the public web at zero cost:

```
┌──────────────────────────────────────┐
│  Client: Cloudflare Pages / Vercel   │
│  (Vite React SPA, Global CDN, $0)    │
└──────────────────┬───────────────────┘
                   │
                   ▼  HTTPS / WSS
┌──────────────────────────────────────┐
│  Server: Render / Railway / Fly.io   │
│  (Node.js Express + Socket.IO, $0)   │
└──────────┬───────────────────┬───────┘
           │                   │
           ▼                   ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Database: Supabase   │  │ Cache: Upstash Redis │
│ (PostgreSQL, $0 Free)│  │ (Serverless, $0 Free)│
└──────────────────────┘  └──────────────────────┘
```

### Option A: Frontend on Cloudflare Pages / Vercel ($0)
1. Fork or push the repo to GitHub.
2. In Cloudflare Pages or Vercel, create a new project:
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```env
     VITE_API_URL=https://your-backend.onrender.com/api
     VITE_SOCKET_URL=https://your-backend.onrender.com
     ```

### Option B: Backend on Render / Railway ($0 Free Tier)
1. Create a **Web Service** pointing to your repository.
2. Set settings:
   - **Root Directory**: (project root)
   - **Build Command**: `npm install && npm run build --workspace=@chess/shared && npm run build --workspace=@chess/chess && npm run build --workspace=@chess/server`
   - **Start Command**: `npm run start --workspace=@chess/server`
3. Environment variables:
   ```env
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-frontend.pages.dev
   DATABASE_URL=postgresql://user:password@supabase.co:5432/postgres
   JWT_SECRET=super_secret_production_key_xyz_9988
   ```

### Free Database Providers:
- **Neon / Supabase**: 100% free managed PostgreSQL instance.
- Run `npx prisma db push --schema=prisma/schema.postgresql.prisma` to synchronize the schema.

---

## 4. Docker Deployment (Local or VPS)

To deploy the entire stack with Docker Compose:

```bash
docker compose up -d
```
Services spun up:
- `chess-server`: Node.js backend on port 3001
- `chess-web`: Nginx serving static React bundle on port 80/5173
- `postgres`: PostgreSQL 16 on port 5432
- `redis`: Redis 7 alpine on port 6379

---

## 5. Google OAuth 2.0 Free Configuration

1. Visit [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth 2.0 Client ID** (Type: Web application).
3. Set **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:3001`
   - `https://your-domain.pages.dev` (if deployed)
4. Set **Authorized redirect URIs**:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.pages.dev/auth/callback`
5. Place the credentials in `.env`:
   ```env
   GOOGLE_CLIENT_ID="xxxx-xxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
   ```
6. Restart the backend. Google 1-Click Login will be active instantly.
