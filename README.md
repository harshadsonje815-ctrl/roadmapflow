# RoadmapFlow — Feature Request & Public Roadmap Portal

A modern, full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for software teams and product organizations to collect user feedback, prioritize feature requests through community voting, and showcase transparent development roadmaps.

Built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **Redux Toolkit (RTK Query)**, **Express 4**, **TypeScript**, **Mongoose 9**, and **Zod**.

---

## Key Features

- **Live Product Roadmap (Kanban)**: Interactive 4-stage pipeline (*Under Review*, *Planned*, *In Progress*, *Completed*) with real-time status visibility and administrative drag/reorder controls.
- **Community Voting & Feedback**: One-click atomic voting mechanism preventing double-voting, with optimistic UI updates.
- **Categorization & Search**: Real-time debounced search, category filtering (*UI/UX*, *Performance*, *Security*, *Integrations*, *Mobile*, *API*, *General*), and sorting by *Top Voted*, *Most Recent*, *Comment Activity*, and *Trending*.
- **Nested Discussions**: Hierarchical threaded comments with moderation flags and role-based badges (*Staff*, *Admin*).
- **Administrative Governance**: Dedicated Admin Dashboard for changing feature lifecycle stages, moderating comments, reordering roadmap priorities, and managing user access.
- **Dual-Engine Persistence**: Production-ready MongoDB/Mongoose connection with automated connection pooling and schema sanitization, paired with an instant **In-Memory Store fallback** for zero-dependency local testing.
- **Security & Rate Limiting**: HTTP-only JWT cookies, CSRF-resistant cookie handling, Bcrypt password hashing, Helmet security headers, CORS origin controls, and Express rate limiting.
- **Modern UX Polish**: Responsive design, animated skeleton loaders, toast notification queue, and React error boundaries.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion |
| **State Management** | Redux Toolkit (RTK Query) with optimistic caching and tag invalidation |
| **Backend** | Node.js, Express 4, TypeScript (executed via `tsx` in dev, bundled with `esbuild` for production) |
| **Database** | MongoDB 6+ / MongoDB Atlas with Mongoose 9 ODM (plus built-in In-Memory fallback) |
| **Validation** | Zod (strict runtime request schema validation for body, params, and queries) |
| **Security** | JSON Web Tokens (Access + Refresh token rotation), bcryptjs, Helmet, Express Rate Limit |

---

## Project Structure

```
├── .env.example              # Template for environment variables
├── index.html                # Frontend HTML entry point
├── metadata.json             # Applet metadata configuration
├── package.json              # NPM dependencies and scripts
├── server.ts                 # Main server entry point (Express + Vite middleware)
├── tsconfig.json             # TypeScript project configuration
├── vite.config.ts            # Vite bundler & Tailwind configuration
├── docs/                     # Comprehensive documentation guides
│   ├── API_DOCUMENTATION.md     # Full REST API specification & curl examples
│   ├── MONGODB_ATLAS_SETUP.md   # Step-by-step Atlas cluster setup guide
│   ├── RENDER_DEPLOYMENT.md     # Production deployment on Render
│   ├── VERCEL_DEPLOYMENT.md     # Production deployment on Vercel
│   └── ENVIRONMENT_VARIABLES.md # Detailed environment variable reference
├── server/                   # Backend application source code
│   ├── config/               # Database and environment configurations
│   ├── constants/            # Enums (FeatureStatus, FeatureCategory, UserRole)
│   ├── controllers/          # Route handlers (auth, request, comment, roadmap, admin)
│   ├── middlewares/          # JWT authentication, RBAC authorization, validation, error handling
│   ├── models/               # Mongoose schema definitions (User, FeatureRequest, Comment, Vote)
│   ├── routes/               # Express API subrouters
│   ├── services/             # Business logic and In-Memory fallback store
│   └── validators/           # Zod validation schemas
└── src/                      # Frontend application source code
    ├── components/           # UI components (admin, auth, comments, common, layout, requests, roadmap)
    ├── hooks/                # Custom React hooks (useDebounce, useToast)
    ├── pages/                # Page views (Feed, Roadmap, Detail, Admin, Login, Register, NotFound)
    ├── store/                # Redux Toolkit store, RTK Query API slice, and UI state slices
    └── types/                # Shared TypeScript definitions
```

---

## Quickstart Guide

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **NPM** or **Bun**: Package manager
- *(Optional)* **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI. If omitted, the app automatically runs using the In-Memory store with pre-seeded demo data.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd roadmapflow
npm install
```

### 3. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` to configure your settings (see [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md) for details):

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/feature_portal
JWT_ACCESS_SECRET=dev_jwt_access_secret_super_secure_key_123!
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_super_secure_key_456!
COOKIE_SECRET=dev_cookie_signing_secret_super_secure_789!
CORS_ORIGIN=http://localhost:3000
```

> **Note:** If you don't have a local MongoDB daemon running, the application will detect the offline state and activate the built-in in-memory database engine automatically.

### 4. Running the Development Server

Start the full-stack development server:

```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:3000
```

### 5. Production Build

Compile both frontend static assets (via Vite) and server runtime (via esbuild):

```bash
npm run build
npm start
```

---

## Demo Accounts

Pre-seeded accounts are available immediately for testing:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@portal.dev` | `admin123` | Full access: change status, reorder roadmap, moderate comments, ban accounts |
| **Administrator** | `david@portal.dev` | `password123` | Full administrative capabilities |
| **Standard User** | `sarah@portal.dev` | `password123` | Post proposals, submit upvotes, join threaded discussions |

*(You can also register any new account using the in-app Register form.)*

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Runs the server in development mode with Vite HMR middleware |
| `npm run build` | `vite build && esbuild ...` | Builds frontend into `dist/` and bundles server into `dist/server.cjs` |
| `npm start` | `node dist/server.cjs` | Starts the production server |
| `npm run seed` | `tsx server/services/seed.service.ts` | Manually seeds or resets database with demo users and proposals (`--force` to reset) |
| `npm run lint` | `tsc --noEmit` | Runs the TypeScript compiler to check for syntax and type errors |
| `npm run preview` | `vite preview` | Previews the compiled client-side assets |
| `npm run clean` | `rm -rf dist server.js` | Cleans build artifacts |

---

## Documentation Directory

Detailed implementation and deployment guides are available in the `/docs` folder:

- 📘 [**REST API Documentation**](docs/API_DOCUMENTATION.md) — Comprehensive API endpoint reference with headers, query parameters, payloads, responses, and curl commands.
- 🍃 [**MongoDB Atlas Setup Guide**](docs/MONGODB_ATLAS_SETUP.md) — Walkthrough for provisioning a free cloud cluster, configuring network access, database users, and indexes.
- 🚀 [**Render Deployment Guide**](docs/RENDER_DEPLOYMENT.md) — How to deploy RoadmapFlow on Render as a single unified Node.js Web Service.
- ⚡ [**Vercel Deployment Guide**](docs/VERCEL_DEPLOYMENT.md) — Instructions for deploying RoadmapFlow using Vercel serverless builds and configuration.
- 🔑 [**Environment Variable Documentation**](docs/ENVIRONMENT_VARIABLES.md) — Reference for every configuration flag, security requirements, and key generation instructions.

---

## License

MIT License. Designed and maintained for modern product engineering teams.
