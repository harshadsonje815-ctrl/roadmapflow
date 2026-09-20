# Render Deployment Guide for RoadmapFlow

This guide explains how to deploy **RoadmapFlow** to [Render](https://render.com) as a production-grade full-stack **Node.js Web Service**.

---

## Architecture Overview

RoadmapFlow is architected as a unified full-stack application:
1. **Frontend**: Built into optimized static assets inside `/dist` via `vite build`.
2. **Backend**: Bundled into a standalone CommonJS file at `dist/server.cjs` via `esbuild`.
3. **Runtime**: The Express server serves both the REST API endpoints under `/api/*` and the static single-page application (SPA) with fallback routing for all other paths on a single port.

---

## Prerequisites

- A GitHub or GitLab account with the RoadmapFlow code repository pushed.
- A free or paid [Render](https://render.com) account.
- A live MongoDB connection string (see [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)).

---

## Step-by-Step Deployment

### 1. Create a New Web Service on Render

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button in the top navigation and select **Web Service**.
3. Connect your GitHub or GitLab repository containing RoadmapFlow.

---

### 2. Configure Service Settings

Fill in the service details:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `roadmapflow` | Custom service name |
| **Region** | *Choose closest to MongoDB Atlas* | E.g. Oregon (US West), Frankfurt (EU), or Ohio (US East) |
| **Branch** | `main` | Production Git branch |
| **Root Directory** | *(Leave blank)* | Uses the root repository directory |
| **Runtime** | `Node` | Standard Node.js runtime environment |
| **Build Command** | `npm install && npm run build` | Installs dependencies and runs Vite + esbuild compilation |
| **Start Command** | `npm start` | Executes `node dist/server.cjs` |
| **Instance Type** | Free or Starter ($7/mo) | Free tier spins down after inactivity; Starter remains always-on |

---

### 3. Configure Environment Variables

Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each required key:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/feature_portal?retryWrites=true&w=majority
JWT_ACCESS_SECRET=paste_generated_64_char_secret_here
JWT_REFRESH_SECRET=paste_generated_64_char_secret_here
COOKIE_SECRET=paste_generated_64_char_secret_here
CORS_ORIGIN=https://your-service-name.onrender.com
```

*(To generate cryptographically secure secrets, run `openssl rand -hex 32` in your local terminal).*

> **Note on PORT**: Render automatically injects the `PORT` environment variable (usually `10000`) and routes incoming HTTPS traffic to it. The server code dynamically uses `process.env.PORT || 3000`, so no manual port configuration is required.

---

### 4. Configure Health Check

1. Under **Advanced Settings**, find **Health Check Path**.
2. Set the path to:
   ```
   /api/health
   ```
3. Render will poll this endpoint during rolling deployments to verify the application has booted and is ready to accept user requests before swapping traffic.

---

### 5. Deploy & Verify

1. Click **Create Web Service**.
2. Render will trigger the initial build pipeline:
   - Cloning repository
   - Running `npm install`
   - Executing `npm run build` (compiles client to `dist/` and server to `dist/server.cjs`)
   - Launching `npm start`
3. Once the logs show `Server running on port ...` and the health check responds `200 OK`, Render will display a green **Live** badge.
4. Open the generated `https://<service-name>.onrender.com` URL in your browser.

---

### 6. Custom Domain & SSL Configuration (Optional)

1. In your Render service page, navigate to **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and input your domain name (e.g. `roadmap.yourcompany.com`).
3. Add the displayed `CNAME` or `A` DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.).
4. Render will automatically issue and renew a free TLS/SSL certificate via Let's Encrypt.
5. Update your `CORS_ORIGIN` environment variable to match your custom domain:
   ```env
   CORS_ORIGIN=https://roadmap.yourcompany.com
   ```

---

## Troubleshooting Render Deployments

### Issue 1: "Build failed: vite not found"
- **Cause**: Development dependencies were pruned before build.
- **Fix**: Ensure `NODE_ENV` is not set to `production` during the build step, or ensure dependencies are in `dependencies` (as already configured in `package.json`).

### Issue 2: Service spins down after 15 minutes of inactivity (Free Tier)
- **Cause**: Render's free tier spins down idle services. The first request after spin-down may experience a ~40s cold start.
- **Fix**: Upgrade to Render's **Starter** plan ($7/mo) for 24/7 always-on uptime.

### Issue 3: In-Memory Fallback Active in Production
- **Cause**: The application could not connect to MongoDB Atlas within the 2.5-second timeout window.
- **Fix**: Check `MONGODB_URI` spelling, verify database user password, and verify that Atlas **Network Access** allows `0.0.0.0/0`.
