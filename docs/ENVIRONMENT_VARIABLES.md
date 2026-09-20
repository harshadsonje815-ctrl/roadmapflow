# Environment Variable Documentation

This document provides a comprehensive reference for all configuration options and environment variables supported by **RoadmapFlow**.

---

## Quick Reference Table

| Variable | Type | Default (Dev) | Required in Prod | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `number` | `3000` | Optional | Port on which the Express HTTP server listens. |
| `NODE_ENV` | `string` | `development` | **Yes** | Application environment (`development`, `production`, `test`). |
| `MONGODB_URI` | `string` | `mongodb://127.0.0.1:27017/feature_portal` | **Yes** | Full MongoDB connection string (local or Atlas URI). |
| `JWT_ACCESS_SECRET` | `string` | *Dev default string* | **Yes** | Cryptographic secret for signing short-lived Access Tokens (15 min). |
| `JWT_REFRESH_SECRET`| `string` | *Dev default string* | **Yes** | Cryptographic secret for signing Refresh Tokens (7 days). |
| `COOKIE_SECRET` | `string` | *Dev default string* | **Yes** | Cryptographic secret for signing HTTP-only session cookies. |
| `CORS_ORIGIN` | `string` | `""` (accepts same-origin) | Recommended | Allowed origins for cross-origin CORS requests. |
| `APP_URL` | `string` | `""` | Optional | Public canonical URL of the application instance. |
| `GEMINI_API_KEY` | `string` | `""` | Optional | API key for server-side Google Gemini AI integrations. |

---

## Detailed Variable Specifications

### 1. `PORT`
- **Description**: Port number where the Express HTTP server binds and listens.
- **Default Value**: `3000`
- **Cloud Note**: Cloud providers (such as Render, Google Cloud Run, Heroku, AWS ECS) automatically inject this variable (e.g., Render sets `PORT=10000`, Cloud Run sets `PORT=8080`). RoadmapFlow reads `process.env.PORT` dynamically.
- **Example**:
  ```env
  PORT=3000
  ```

---

### 2. `NODE_ENV`
- **Description**: Controls runtime optimizations, logging detail, and cookie security flags.
- **Allowed Values**: `development`, `production`, `test`
- **Default Value**: `development`
- **Behavior Differences**:
  - In `production`:
    - Express serves precompiled static assets from `/dist`.
    - Cookies are marked with `secure: true` (transmitted only via HTTPS).
    - Database auto-indexing (`autoIndex`) is disabled on startup to prevent latency.
  - In `development`:
    - Vite HMR middleware is dynamically mounted into Express.
    - Detailed database connection logging is emitted.
- **Example**:
  ```env
  NODE_ENV=production
  ```

---

### 3. `MONGODB_URI`
- **Description**: Connection string used by Mongoose 9 to connect to the MongoDB database.
- **Default Value**: `mongodb://127.0.0.1:27017/feature_portal`
- **Fallback Mechanism**: If no connection can be established within 2.5 seconds (or if the database server is offline), RoadmapFlow logs an informational warning and switches automatically to its built-in **In-Memory persistence engine** so development and preview environments never fail or crash.
- **Examples**:
  - *Local Docker/Daemon*:
    ```env
    MONGODB_URI="mongodb://127.0.0.1:27017/feature_portal"
    ```
  - *MongoDB Atlas*:
    ```env
    MONGODB_URI="mongodb+srv://roadmap_admin:SecurePassword123@cluster0.abcde.mongodb.net/feature_portal?retryWrites=true&w=majority"
    ```

---

### 4. `JWT_ACCESS_SECRET`
- **Description**: Secret key used with HMAC SHA-256 (`HS256`) to sign and verify short-lived JWT access tokens.
- **Token Expiration**: `15m` (15 minutes).
- **Default Value (Dev)**: `dev_jwt_access_secret_super_secure_key_123!`
- **Security Requirement**: In production, this **MUST** be set to a high-entropy random string (at least 32 bytes / 64 hex characters). Never reuse this secret across environments.
- **Example**:
  ```env
  JWT_ACCESS_SECRET="e4d909c290d0fb1ca068ffaddf22cbd0add8ab92e3a34a26e8574d75db1b3fa1"
  ```

---

### 5. `JWT_REFRESH_SECRET`
- **Description**: Secret key used with HMAC SHA-256 to sign and verify long-lived refresh tokens.
- **Token Expiration**: `7d` (7 days), stored alongside token families to detect and prevent token reuse replay attacks.
- **Default Value (Dev)**: `dev_jwt_refresh_secret_super_secure_key_456!`
- **Security Requirement**: Must be distinct from `JWT_ACCESS_SECRET`.
- **Example**:
  ```env
  JWT_REFRESH_SECRET="a87c12569e9e1451f2e8f192b027734898c8942b03b7a5ef694a53075215c2d1"
  ```

---

### 6. `COOKIE_SECRET`
- **Description**: Secret key passed to `cookie-parser` for cryptographically signing HTTP-only session cookies.
- **Default Value (Dev)**: `dev_cookie_signing_secret_super_secure_789!`
- **Security Requirement**: Must be a high-entropy string in production.
- **Example**:
  ```env
  COOKIE_SECRET="7b219eef6802e3b8a1c97a892b15d0e34c90d54a2e46b9a8f110756782194bca"
  ```

---

### 7. `CORS_ORIGIN`
- **Description**: Whitelist for Cross-Origin Resource Sharing (CORS). When left empty, the server allows same-origin requests.
- **Format**: Comma-separated list of allowed URLs or a single URL.
- **Default Value**: `""` (empty string)
- **Examples**:
  ```env
  CORS_ORIGIN="https://roadmap.mycompany.com"
  ```
  Or for multiple staging and production domains:
  ```env
  CORS_ORIGIN="https://roadmap.mycompany.com,https://staging.mycompany.com"
  ```

---

### 8. `APP_URL`
- **Description**: Canonical public URL of the application. Used for absolute link generation, email notifications, and self-referential webhooks.
- **Default Value**: `""` (in AI Studio, automatically set to the Cloud Run service URL).
- **Example**:
  ```env
  APP_URL="https://roadmap.mycompany.com"
  ```

---

### 9. `GEMINI_API_KEY`
- **Description**: Server-side API key for Google Gemini generative AI features.
- **Security Note**: This key is kept strictly on the backend server and is never exposed to browser clients or client bundles.
- **Example**:
  ```env
  GEMINI_API_KEY="AIzaSy..."
  ```

---

## How to Generate Strong Secrets

You can quickly generate cryptographically random 256-bit (64 hex characters) secrets using your terminal:

### Using OpenSSL
```bash
openssl rand -hex 32
```

### Using Node.js (One-Liner)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Best Practices

1. **Never Commit Secrets**: Ensure `.env` is listed in your `.gitignore` file (RoadmapFlow's `.gitignore` already excludes `.env*` except `.env.example`).
2. **Environment Separation**: Always use different secret keys for local development, staging, and production environments.
3. **Least Privilege for Database**: Give the MongoDB user only `readWrite` access to the `feature_portal` database.
4. **Secret Rotation**: Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` periodically or if compromise is suspected.
