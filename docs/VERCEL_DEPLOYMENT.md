# Vercel Deployment Guide for RoadmapFlow

This guide explains how to deploy **RoadmapFlow** on [Vercel](https://vercel.com).

---

## Deployment Architecture Options

There are two primary ways to deploy RoadmapFlow on Vercel:

1. **Option A: Unified Serverless Full-Stack on Vercel** *(Recommended if hosting both frontend and backend on Vercel)*:
   - The Vite frontend is served via Vercel's global CDN Edge Network.
   - The Express API is mounted as a Vercel Serverless Function via a lightweight entry point (`api/index.ts` or `vercel.json` rewrites).
2. **Option B: Split Frontend on Vercel + Backend on Render/Cloud Run**:
   - The React 19 SPA is hosted on Vercel for zero-latency CDN edge delivery.
   - The Express Node server runs as a persistent container on Render, Railway, or Google Cloud Run.

This guide details **Option A** (Unified Vercel Serverless deployment).

---

## Prerequisites

- A GitHub repository containing the RoadmapFlow codebase.
- A free or Pro [Vercel](https://vercel.com) account.
- A cloud MongoDB database URI (see [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)).

---

## 1. Project Configuration for Vercel

To allow Vercel to route both the compiled static frontend and dynamic Express API endpoints, create a `vercel.json` file in the project root (if not already present):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> **How this works**:
> - Any request matching `/api/*` is routed directly to the Express server handler.
> - All other requests fallback to `/index.html` allowing React Router / client-side SPA navigation.

---

## 2. Serverless Database Optimization

Serverless functions spin up and down dynamically. In `server/config/db.ts`, RoadmapFlow already implements serverless-friendly connection caching:

- Connection pooling (`minPoolSize: 2`, `maxPoolSize: 15`).
- Disabled command buffering (`bufferCommands: false`) to avoid serverless function request timeouts.
- Global connection state reuse to prevent opening duplicate connections across warm invocations.

---

## 3. Deploying via Vercel Dashboard

1. Navigate to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select your Git provider (GitHub, GitLab) and import the `roadmapflow` repository.
3. Configure the Project:
   - **Framework Preset**: Select **Vite** (or leave as *Other*).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## 4. Environment Variables on Vercel

In the **Environment Variables** section during project import, add the following keys for **Production**, **Preview**, and **Development**:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.abcde.mongodb.net/feature_portal?retryWrites=true&w=majority` | Atlas connection string |
| `JWT_ACCESS_SECRET` | *(64-character random hex string)* | Signs authentication tokens |
| `JWT_REFRESH_SECRET` | *(64-character random hex string)* | Signs token refresh grants |
| `COOKIE_SECRET` | *(64-character random hex string)* | Signs session cookies |
| `CORS_ORIGIN` | `https://your-project.vercel.app` | Allowed CORS domain |

---

## 5. Deploy & Verify

1. Click **Deploy**.
2. Vercel will execute the build pipeline:
   - Compiling React assets with Vite into `dist/`.
   - Bundling the server into `dist/server.cjs` with `esbuild`.
3. When the build finishes, Vercel will assign a live URL (e.g. `https://roadmapflow-xyz.vercel.app`).
4. Test the health endpoint:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Output:
   ```json
   {"status":"ok","timestamp":"2026-09-20T..."}
   ```

---

## 6. Custom Domains & DNS

1. Go to **Settings** → **Domains** in your Vercel project.
2. Enter your custom domain (e.g. `roadmap.yourcompany.com`).
3. Add the recommended `CNAME` record to your DNS manager (`cname.vercel-dns.com`).
4. Vercel automatically provisions SSL/TLS certificates with zero renewal maintenance.
5. Update `CORS_ORIGIN` in the Vercel Environment Variables to match your new domain.

---

## Troubleshooting Vercel Deployments

### Issue 1: "FUNCTION_INVOCATION_TIMEOUT"
- **Cause**: Serverless function exceeded execution time limit (10s on free tier). Usually caused by waiting for a cold database connection.
- **Fix**: Verify your MongoDB Atlas IP Access list contains `0.0.0.0/0` and ensure your database cluster region matches your Vercel deployment region.

### Issue 2: Cookies Not Persisting Across Domains
- **Cause**: If hosting the frontend on Vercel and the backend on another platform (Render/Cloud Run), cookies must have `SameSite: "none"` and `Secure: true`.
- **Fix**: When using the unified single-domain deployment described above, cookies are same-site and persist reliably without cross-origin cookie restrictions.
