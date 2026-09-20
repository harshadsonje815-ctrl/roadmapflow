# RoadmapFlow — REST API Documentation

This document outlines the complete RESTful HTTP API specifications for the **RoadmapFlow** feature portal.

---

## 1. Overview & Protocol Conventions

- **Base URL**: `/api` (or `http://localhost:3000/api` in local development)
- **Data Format**: All request payloads and response bodies are formatted as `application/json; charset=utf-8`.
- **Security & Headers**:
  - Secure endpoints require authentication via Bearer token:
    ```http
    Authorization: Bearer <access_token>
    ```
  - Alternatively, the server supports reading the `accessToken` and `refreshToken` from HTTP-only secure cookies sent by browser clients.

### Standard Success Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```
*(Note: The `meta` key is included on paginated listing endpoints).*

### Standard Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must be at least 5 characters"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded and data is returned. |
| `201 Created` | Resource Created | A new request, comment, or user account was successfully created. |
| `400 Bad Request` | Client Error | Payload failed Zod schema validation or malformed data was passed. |
| `401 Unauthorized` | Authentication Required | Token is missing, expired, or signature is invalid. |
| `403 Forbidden` | Insufficient Permissions | User does not hold the required role (e.g. non-admin accessing `/api/admin/*`). |
| `404 Not Found` | Resource Not Found | Target request, comment, or user could not be located. |
| `409 Conflict` | State Conflict | Email already registered or resource conflict. |
| `429 Too Many Requests` | Rate Limited | Exceeded rate limit thresholds (Express Rate Limit). |
| `500 Server Error` | Internal Failure | Unexpected exception handled by global error middleware. |

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Description**: Registers a new user account, hashes the password with bcrypt, and sets secure session cookies.

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "user": {
    "_id": "65f1a0000000000000000004",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "role": "USER",
    "isVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials, generates access and refresh tokens, and attaches HTTP-only cookies.

#### Request Body
```json
{
  "email": "admin@portal.dev",
  "password": "admin123"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "_id": "65f1a0000000000000000001",
    "name": "Alex Chen",
    "email": "admin@portal.dev",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "role": "ADMIN",
    "isVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2.3 Refresh Access Token
- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Access**: Public (requires refresh token in cookie or request body)
- **Description**: Rotates refresh tokens and issues a new 15-minute access token.

#### Request Body *(Optional if cookie is present)*
```json
{
  "refreshToken": "optional_if_cookie_stored"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2.4 Logout
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Access**: Public
- **Description**: Revokes the active refresh token session and clears authentication cookies.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.5 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Access**: Protected (`Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65f1a0000000000000000001",
      "name": "Alex Chen",
      "email": "admin@portal.dev",
      "role": "ADMIN",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      "isVerified": true
    }
  }
}
```

---

## 3. Feature Request Endpoints (`/api/requests`)

### 3.1 List Feature Requests
- **Method**: `GET`
- **Path**: `/api/requests`
- **Access**: Public / Optional Authentication (authenticated users receive computed `hasVoted: true/false` flag)

#### Query Parameters
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | `1` | Page number (1-indexed) |
| `limit` | `number` | `20` | Items per page (max `100`) |
| `category` | `string` | `ALL` | Filter by category: `UI_UX`, `PERFORMANCE`, `SECURITY`, `INTEGRATIONS`, `MOBILE`, `API`, `GENERAL` |
| `status` | `string` | `ALL` | Filter by status: `UNDER_REVIEW`, `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `DECLINED` |
| `search` | `string` | `""` | Search query matching title or description |
| `sort` | `string` | `upvotes` | Sort options: `upvotes`, `recent`, `comments`, `trending` |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f2b0000000000000000001",
      "title": "Dark Mode Support with OLED Black Theme",
      "slug": "dark-mode-support-with-oled-black-theme",
      "description": "Provide an eye-friendly dark color scheme with automatic OS synchronization.",
      "category": "UI_UX",
      "status": "IN_PROGRESS",
      "voteCount": 84,
      "commentCount": 12,
      "roadmapOrder": 1,
      "author": {
        "_id": "65f1a0000000000000000002",
        "name": "Sarah Miller",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "role": "USER"
      },
      "hasVoted": false,
      "createdAt": "2026-08-20T14:32:00.000Z",
      "updatedAt": "2026-09-18T10:15:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3.2 Get Single Feature Request
- **Method**: `GET`
- **Path**: `/api/requests/:slugOrId`
- **Access**: Public / Optional Authentication

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "_id": "65f2b0000000000000000001",
    "title": "Dark Mode Support with OLED Black Theme",
    "slug": "dark-mode-support-with-oled-black-theme",
    "description": "Provide an eye-friendly dark color scheme with automatic OS synchronization.",
    "category": "UI_UX",
    "status": "IN_PROGRESS",
    "voteCount": 84,
    "commentCount": 12,
    "roadmapOrder": 1,
    "author": {
      "_id": "65f1a0000000000000000002",
      "name": "Sarah Miller",
      "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      "role": "USER"
    },
    "hasVoted": true,
    "createdAt": "2026-08-20T14:32:00.000Z"
  }
}
```

---

### 3.3 Create Feature Request
- **Method**: `POST`
- **Path**: `/api/requests`
- **Access**: Protected (`Bearer <token>`)

#### Request Body
```json
{
  "title": "Export Analytics Data to CSV and Excel",
  "description": "Allow workspace administrators to export all proposal interaction metrics and vote counts into downloadable CSV or XLSX files.",
  "category": "GENERAL"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "_id": "65f2b0000000000000000099",
    "title": "Export Analytics Data to CSV and Excel",
    "slug": "export-analytics-data-to-csv-and-excel",
    "description": "Allow workspace administrators to export all proposal interaction metrics...",
    "category": "GENERAL",
    "status": "UNDER_REVIEW",
    "voteCount": 1,
    "commentCount": 0,
    "roadmapOrder": 0,
    "author": "65f1a0000000000000000001",
    "hasVoted": true,
    "createdAt": "2026-09-20T08:00:00.000Z"
  }
}
```

---

### 3.4 Update Feature Request
- **Method**: `PATCH`
- **Path**: `/api/requests/:id`
- **Access**: Protected (Author or Admin)

#### Request Body
```json
{
  "title": "Export Analytics Data to CSV, Excel, and JSON",
  "description": "Allow workspace administrators to export all proposal interaction metrics into CSV, XLSX, or JSON formats."
}
```

---

### 3.5 Delete Feature Request
- **Method**: `DELETE`
- **Path**: `/api/requests/:id`
- **Access**: Protected (Author or Admin)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "message": "Feature request deleted successfully"
  }
}
```

---

### 3.6 Toggle Vote
- **Method**: `POST`
- **Path**: `/api/requests/:id/vote`
- **Access**: Protected (`Bearer <token>`)
- **Description**: Atomically adds or removes the user's vote. Increments/decrements `voteCount`.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "voted": true,
    "voteCount": 85
  }
}
```

---

## 4. Comment Endpoints (`/api/requests/:id/comments` & `/api/comments/:commentId`)

### 4.1 Get Threaded Comments
- **Method**: `GET`
- **Path**: `/api/requests/:id/comments`
- **Access**: Public

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "_id": "65f3c0000000000000000001",
      "featureRequest": "65f2b0000000000000000001",
      "content": "Will this include support for custom accent colors alongside dark mode?",
      "parentComment": null,
      "depth": 0,
      "isDeleted": false,
      "author": {
        "_id": "65f1a0000000000000000003",
        "name": "David Kim",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "role": "ADMIN"
      },
      "createdAt": "2026-08-21T09:15:00.000Z",
      "replies": [
        {
          "_id": "65f3c0000000000000000002",
          "content": "Yes! We plan to support high-contrast accents.",
          "parentComment": "65f3c0000000000000000001",
          "depth": 1,
          "author": {
            "_id": "65f1a0000000000000000001",
            "name": "Alex Chen",
            "role": "ADMIN"
          }
        }
      ]
    }
  ]
}
```

---

### 4.2 Post Comment or Reply
- **Method**: `POST`
- **Path**: `/api/requests/:id/comments`
- **Access**: Protected (`Bearer <token>`)

#### Request Body
```json
{
  "content": "Great suggestion, we are actively considering this for our next sprint.",
  "parentComment": null
}
```

*(To reply to a thread, provide the parent comment's `_id` in `parentComment`).*

#### Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "_id": "65f3c0000000000000000010",
    "featureRequest": "65f2b0000000000000000001",
    "content": "Great suggestion, we are actively considering this for our next sprint.",
    "parentComment": null,
    "depth": 0,
    "isDeleted": false,
    "author": {
      "_id": "65f1a0000000000000000001",
      "name": "Alex Chen",
      "role": "ADMIN"
    },
    "createdAt": "2026-09-20T08:30:00.000Z"
  }
}
```

---

### 4.3 Update Comment
- **Method**: `PATCH`
- **Path**: `/api/comments/:commentId`
- **Access**: Protected (Author or Admin)

#### Request Body
```json
{
  "content": "Updated content of my comment."
}
```

---

### 4.4 Delete Comment
- **Method**: `DELETE`
- **Path**: `/api/comments/:commentId`
- **Access**: Protected (Author or Admin)

---

## 5. Public Roadmap Endpoint (`/api/roadmap`)

### 5.1 Get Roadmap Columns
- **Method**: `GET`
- **Path**: `/api/roadmap`
- **Access**: Public / Optional Authentication
- **Description**: Returns all feature requests categorized into the four public lifecycle columns sorted by `roadmapOrder` and `voteCount`.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "status": "UNDER_REVIEW",
      "title": "Under Review",
      "items": [ ... ]
    },
    {
      "status": "PLANNED",
      "title": "Planned",
      "items": [ ... ]
    },
    {
      "status": "IN_PROGRESS",
      "title": "In Progress",
      "items": [ ... ]
    },
    {
      "status": "COMPLETED",
      "title": "Completed",
      "items": [ ... ]
    }
  ]
}
```

---

## 6. Admin Governance Endpoints (`/api/admin`)

> **Note**: All endpoints under `/api/admin` strictly require authentication with `role: "ADMIN"`.

### 6.1 Update Feature Status & Roadmap Order
- **Method**: `PATCH`
- **Path**: `/api/admin/requests/:id/status`
- **Access**: Protected (`ADMIN` only)

#### Request Body
```json
{
  "status": "IN_PROGRESS",
  "roadmapOrder": 2
}
```

---

### 6.2 Bulk Reorder Roadmap
- **Method**: `PATCH`
- **Path**: `/api/admin/roadmap/reorder`
- **Access**: Protected (`ADMIN` only)

#### Request Body
```json
{
  "items": [
    { "id": "65f2b0000000000000000001", "status": "IN_PROGRESS", "roadmapOrder": 0 },
    { "id": "65f2b0000000000000000002", "status": "IN_PROGRESS", "roadmapOrder": 1 }
  ]
}
```

---

### 6.3 Moderate Comment (Soft-delete / Restore)
- **Method**: `PATCH`
- **Path**: `/api/admin/comments/:id/moderate`
- **Access**: Protected (`ADMIN` only)

#### Request Body
```json
{
  "isDeleted": true
}
```

---

### 6.4 Toggle User Ban / Verification
- **Method**: `PATCH`
- **Path**: `/api/admin/users/:id/ban`
- **Access**: Protected (`ADMIN` only)

---

## 7. System Health Endpoint (`/api/health`)

- **Method**: `GET`
- **Path**: `/api/health`
- **Access**: Public
- **Description**: Used by Docker, Render, Cloud Run, or Kubernetes for liveness/readiness probes.

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "timestamp": "2026-09-20T08:42:00.000Z"
}
```

---

## 8. Example Curl Commands

### Login & Obtain Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portal.dev","password":"admin123"}'
```

### Fetch Proposals with Filters
```bash
curl -X GET "http://localhost:3000/api/requests?category=UI_UX&sort=upvotes&page=1&limit=10" \
  -H "Accept: application/json"
```

### Upvote a Feature Request
```bash
curl -X POST http://localhost:3000/api/requests/65f2b0000000000000000001/vote \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

### Update Lifecycle Stage (Admin)
```bash
curl -X PATCH http://localhost:3000/api/admin/requests/65f2b0000000000000000001/status \
  -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"PLANNED","roadmapOrder":1}'
```
