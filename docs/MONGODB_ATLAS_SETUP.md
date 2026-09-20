# MongoDB Atlas Setup Guide for RoadmapFlow

This guide provides step-by-step instructions for provisioning and connecting a managed cloud **MongoDB Atlas** database to your **RoadmapFlow** deployment.

---

## 1. Create a MongoDB Atlas Account & Project

1. Navigate to the [MongoDB Atlas Registration Portal](https://www.mongodb.com/cloud/atlas/register).
2. Sign up with your email or log in with your Google/GitHub account.
3. Once in the Atlas console, click **Create an Organization** (or use the default) and then click **New Project**.
4. Name your project (e.g. `RoadmapFlow-Production`) and click **Create Project**.

---

## 2. Deploy a Free Cloud Cluster (M0 Sandbox)

1. On your project dashboard, click **Create a Deployment** or **Build a Database**.
2. Under the cluster options, select the **M0 Free Tier** (Shared):
   - **Cloud Provider & Region**: Choose a region closest to your hosting service (e.g., AWS `us-east-1` or `eu-central-1`).
   - **Cluster Name**: Name your cluster (e.g., `Cluster0` or `roadmap-cluster`).
3. Click **Create Deployment**.

---

## 3. Configure Database User Credentials

MongoDB Atlas requires dedicated credentials separate from your Atlas login:

1. In the left navigation menu, go to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Configure the user:
   - **Authentication Method**: Password
   - **Username**: e.g., `roadmap_admin`
   - **Password**: Generate a secure 24+ character password (click *Autogenerate Secure Password* and copy it safely).
   - **Database User Privileges**: Select **Read and write to any database** (or restrict to `feature_portal`).
4. Click **Add User**.

> **Important**: Avoid using special characters like `@`, `/`, or `:` inside your password, or ensure they are URL-encoded (`encodeURIComponent`) to prevent URI parsing errors in the connection string.

---

## 4. Configure Network Access (IP Whitelist)

Cloud hosting platforms (Render, Vercel, Railway, Fly.io, Cloud Run) utilize dynamic IP pools. To allow your application to connect:

1. In the left navigation menu, go to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. Choose one of the following:
   - **Allow Access from Anywhere**: Click **Allow Access from Anywhere** (adds `0.0.0.0/0`). Recommended for serverless and PaaS deployments.
   - **Specific IP Address**: If hosting on a VPS or service with a static outbound IP, enter that specific IP.
4. Click **Confirm**. The status will change to *Active* within 1–2 minutes.

---

## 5. Retrieve Your Connection String

1. In the left navigation menu, click **Databases**.
2. Next to your cluster, click **Connect**.
3. Select **Drivers** under the connection options.
4. Set the driver to **Node.js** and version **6.7 or later**.
5. Copy the provided connection string, which will resemble:
   ```
   mongodb+srv://roadmap_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database user password.
7. Add your database name right before the query string (`?`):
   ```
   mongodb+srv://roadmap_admin:MySecurePass123@cluster0.abcde.mongodb.net/feature_portal?retryWrites=true&w=majority
   ```

---

## 6. Apply to Environment Configuration

### Local Testing
In your local `.env` file:
```env
MONGODB_URI="mongodb+srv://roadmap_admin:MySecurePass123@cluster0.abcde.mongodb.net/feature_portal?retryWrites=true&w=majority"
```

### Production Hosting (Render / Vercel / Cloud Run)
Add `MONGODB_URI` as a secret environment variable in your platform dashboard.

---

## 7. Recommended Database Indexes

RoadmapFlow defines schema indexes in Mongoose models, which are created automatically during startup when `autoIndex` is enabled in development. For production databases, verify the following indexes are active in the Atlas **Collections** tab:

### `feature_requests` Collection
| Field(s) | Type | Purpose |
| :--- | :--- | :--- |
| `{ slug: 1 }` | Unique | Fast SEO-friendly slug lookups |
| `{ createdAt: -1 }` | Single | Chronological feed sorting |
| `{ status: 1, roadmapOrder: 1 }` | Compound | Public Kanban board column ordering |
| `{ status: 1, createdAt: -1 }` | Compound | Status-filtered chronological feed queries |
| `{ status: 1, voteCount: -1, createdAt: -1 }` | Compound | Status-filtered popular ranking feed |
| `{ category: 1, status: 1, createdAt: -1 }` | Compound | Category & status multi-attribute filtering |
| `{ voters: 1 }` | Multi-key | Checks if a user has voted via atomic array indexing |
| `{ title: "text", description: "text" }` | Text | High-performance full-text search index |

### `comments` Collection
| Field(s) | Type | Purpose |
| :--- | :--- | :--- |
| `{ featureRequest: 1, createdAt: 1 }` | Compound | Fast threaded discussion loading |
| `{ featureRequest: 1, path: 1 }` | Compound | Materialized hierarchy tree traversal |
| `{ author: 1 }` | Single | Author activity lookups |
| `{ parentComment: 1 }` | Single | Direct reply filtering |

### `users` Collection
| Field(s) | Type | Purpose |
| :--- | :--- | :--- |
| `{ email: 1 }` | Unique | Uniqueness enforcement and fast login lookups |
| `{ role: 1 }` | Single | Administrator and role authorization queries |
| `{ isVerified: 1 }` | Single | Account verification checks |

### `refresh_tokens` Collection
| Field(s) | Type | Purpose |
| :--- | :--- | :--- |
| `{ token: 1 }` | Unique | Refresh token lookup during session renewal |
| `{ expiresAt: 1 }` | TTL (`expireAfterSeconds: 0`) | Automatic purging of expired session tokens by MongoDB |
| `{ user: 1, isRevoked: 1 }` | Compound | Active session inspection and user sign-out |

---

## 8. Troubleshooting Common Atlas Errors

| Error Message | Root Cause | Solution |
| :--- | :--- | :--- |
| `MongoServerError: bad auth : authentication failed` | Incorrect password or database user username | Verify the user exists in **Database Access**. If the password has special characters, URL-encode them. |
| `MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster` | IP address is not whitelisted | Ensure `0.0.0.0/0` is active in **Network Access** tab. |
| `querySrv ENOTFOUND _mongodb._tcp...` | DNS SRV resolution blocked by local network/firewall | Switch to Google DNS (`8.8.8.8`) or Cloudflare DNS (`1.1.1.1`), or use standard seed list connection string format provided in Atlas. |
| `MongoTimeoutError: Server selection timed out after 30000 ms` | Network connectivity dropped | Verify cluster is running and not paused in Atlas console. |
