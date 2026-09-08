# CSE Grievance System

A secure, digital **grievance-resolution system** for the Department of Computer Science & Engineering (RUET). Students, teachers and staff can submit complaints confidentially, track them through an official workflow, and get resolutions — while the identity of complainants stays protected. The department side gets role-based dashboards, audit trails, analytics (SLA metrics), CSV exports and automated weekly reports.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

> **Live app:** https://cse-grievance-production.up.railway.app
>
> **About page (inside the app):** use the "About / Project info" link in the footer.

---

## Table of contents

1. [Features](#features)
2. [Demo accounts](#demo-accounts)
3. [Tech stack](#tech-stack)
4. [Architecture](#architecture)
5. [Local development](#local-development)
6. [Environment variables](#environment-variables)
7. [API overview](#api-overview)
8. [Roles & permissions](#roles--permissions)
9. [Production deployment](#production-deployment)
10. [Testing](#testing)
11. [Project structure](#project-structure)
12. [License](#license)

---

## Features

**Complainant side (students / teachers / staff)**

- Submit a complaint with a **category, priority and description**, plus optional **evidence attachments** (up to 10 MB).
- Three **privacy tiers**: *identified*, *protected* (department sees your name, other see role-only) and *confidential* (even the department sees nothing until they ask).
- **Smart submission assistant** — a heuristic suggestor proposes a category and flags **duplicate/near-identical complaints** before you file.
- Track your case with a full **timeline** (created → acknowledged → in-progress → resolved → closed / escalated).
- Two-way **messaging** inside the case with identity protection maintained.
- Choose **email preferences**: toggle status-update and message emails per account.
- Self-service **password reset** (e-mail token, 1 h validity, no account enumeration).

**Department side (HoD / Admin)**

- Dashboard of all cases with **filtering and search** by status, category, priority and privacy mode.
- **Status workflow** with valid transition validation and full **audit log** of every sensitive action.
- **Escalate** a case (manual button) or let the **background job auto-escalate** stale cases after a configurable number of days — with real-time + email notifications and audit entries.
- **Reveal identity** on confidential cases (audited, permission-gated).
- **Analytics dashboard**: totals by status/category/priority, average resolution time, **average first-response time**, **escalated counts**.
- **Weekly report**: CSV of recent cases + plain-text summary emailed to all HoD/Admin accounts (manual button + scheduled job).
- **CSV exports** for cases and audit log.
- **Admin console**: user management (list, search, role changes), system settings (registration on/off, CAPTCHA on/off, escalation enable + days), and the **audit log viewer**.

**Cross-cutting**

- JWT (access + refresh) with role-based access control enforced on every route.
- **Math CAPTCHA** on login/register (zero external services; toggleable).
- **Rate limiting** on auth and submission endpoints.
- Real-time updates over **Socket.IO** (case status, messages, escalations) with per-user/per-role rooms.
- Helmet security headers, CORS, input-validation with Zod.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | `2203054@student.ruet.ac.bd` | `password123` |
| Student | `2203060@student.cse.ruet.ac.bd` | `password123` |
| Teacher | `xyz@cse.ruet.ac.bd` | `password123` |
| HoD | `hod@cse.ruet.ac.bd` | `password123` |
| Admin | `admin@cse.ruet.ac.bd` | `password123` |

> Login requires solving a math CAPTCHA. Registration must use an institutional domain (default `ruet.ac.bd`).

---

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, TanStack Query (React Query), Socket.IO client, Lucide icons, Zod
- **Backend:** Node.js, Express, Socket.IO (realtime), Mongoose (MongoDB), JWT, bcryptjs, Multer (uploads), Nodemailer (email), express-rate-limit, Helmet, Morgan, Zod
- **Database:** MongoDB (local or **MongoDB Atlas**)
- **Deployment:** Node service serving both the API and the built static frontend (works on Render / Railway / any Node host)

---

## Architecture

```
                        ┌────────────────────────────────────────────┐
   Browser (React SPA)  │                 Node.js / Express           │
   Vue of the API       │                                            │
   /api/* ────────────► │  middleware: helmet · cors · rate-limit    │
   socket.io ◄────────► │        RBAC      ┌────────────┐            │
                        │  routes ───────► │  services  │──────► MongoDB
                        │   (auth/cases/   │ (business  │      (Atlas)
                        │    evidence/admin│  logic)    │
                        │    audit/analytics)             │
                        │              │                  │
                        │        background jobs          │
                        │        escalationJob · reportJob│
                        │              │   Socket.IO emits│
                        │              └──► notify users  │
                        └────────────────────────────────┴────────────┘
```

- **Request flow:** middleware chain (helmet → cors → json → rate-limit) → route → validator (Zod) → RBAC check → service (DB + email + audit + realtime).
- **Real-time:** every status change, message and escalation emits a Socket.IO event to `user:<id>` and/or `role:<role>` rooms; the client invalidates its query cache.
- **Background jobs:** configurable-period scanners for stale-case escalation and a weekly report sender; both self-rescheduling.

---

## Local development

**Requirements:** Node.js ≥ 18, MongoDB (local **or** Atlas URI).

```bash
# 1. Backend
cd cse-grievance-server
cp .env.example .env          # edit MONGODB_URI, JWT_SECRET, CLIENT_URL, ...
npm install
npm run seed                  # creates roles + demo accounts
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd cse-grievance-client
npm install
npm run dev                   # http://localhost:5173  (proxies /api and /socket.io)
```

Open `http://localhost:5173` and sign in with a demo account.

---

## Environment variables

### Server (`cse-grievance-server/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/cse_grievance` | MongoDB connection string |
| `JWT_SECRET` | (dev only) | Secret for signing tokens — **set a strong value in production** |
| `JWT_ACCESS_EXPIRY` | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh-token lifetime |
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | `production` enables static client serving |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin (CORS) |
| `INSTITUTIONAL_DOMAINS` | `ruet.ac.bd` | Comma-separated allowed registration domains |
| `MAX_FILE_SIZE_MB` | `10` | Evidence upload limit |
| `UPLOAD_DIR` | `./uploads` | Evidence storage directory |
| `SMTP_HOST/PORT/USER/PASS/FROM` | empty | SMTP for real e-mail; empty = console fallback |
| `CAPTCHA_ENABLED` | `true` | Toggle math CAPTCHA on auth |
| `ESCALATION_SCAN_INTERVAL_MS` | — | Auto-escalation scan period (dev/testing) |
| `REPORT_DAY / REPORT_HOUR` | `1 / 9` | Weekly-report schedule (Mon 09:00) |
| `REPORT_INTERVAL_MS` | — | Weekly-report period override (dev/testing) |

### Client (`cse-grievance-client/.env`)

The client uses relative `/api` and `/socket.io` URLs, so **no client env vars are required** when the frontend is served from the same host as the backend. When deployed separately, set `VITE_API_URL` and adjust `src/api/client.js` + `src/context/RealtimeContext.jsx` accordingly (not needed for the default setup).

---

## API overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register (institutional domain + CAPTCHA) |
| POST | `/api/auth/login` | public | Login (CAPTCHA) |
| POST | `/api/auth/refresh` | public | Rotate tokens |
| GET/PATCH | `/api/auth/me`, `/api/auth/me/preferences` | any user | Profile / email preferences |
| POST | `/api/auth/forgot-password`, `/reset-password` | public | Password reset |
| GET/POST | `/api/cases`, `/api/cases/:id` | role-scoped | List/create/view cases |
| POST | `/api/cases/analyze` | any user | Smart category + duplicate suggestion |
| POST | `/api/cases/:id/status` | hod/admin | Status transition (audited) |
| POST | `/api/cases/:id/escalate` | hod/admin | Manual escalation |
| GET | `/api/cases/:id/timeline` | owner/hod/admin | Case timeline |
| GET | `/api/cases/export` | hod/admin | Cases CSV |
| GET/POST/DELETE | `/api/evidence/*` | role-scoped | Attachments |
| GET/PATCH | `/api/admin/users`, `/api/admin/config` | admin | User management / settings |
| GET/POST | `/api/audit/export`, `/api/audit/` | hod/admin | Audit trail + CSV |
| GET/POST | `/api/analytics/summary`, `/api/analytics/report` | hod/admin | Stats + weekly report |
| GET | `/api/health` | public | Health check |

---

## Roles & permissions

| Action | Student/Teacher/Staff | HoD | Admin |
|---|---|---|---|
| Submit & message own case | ✅ | — | — |
| View own case (timeline, messages) | ✅ | ✅ | ✅ |
| List all cases / analytics / audit | — | ✅ | ✅ |
| Change status / escalate / reveal identity | — | ✅ | ✅ |
| CSVs, weekly report | — | ✅ | ✅ |
| User management, system settings | — | — | ✅ |

---

## Production deployment

The app is designed to run as a **single Node service** (backend + built frontend). Logic is a repo-aware express static fallback in `src/app.js`; build the client and set `NODE_ENV=production`.

**On Render (or any Node host):**

- **Build command**
  ```bash
  npm --prefix cse-grievance-server install && npm --prefix cse-grievance-client install && npm --prefix cse-grievance-client run build
  ```
- **Start command**
  ```bash
  npm --prefix cse-grievance-server start
  ```
- **Environment:** `NODE_ENV=production`, `MONGODB_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your live URL), `INSTITUTIONAL_DOMAINS`, plus optional SMTP settings.

A `render.yaml` blueprint is included for one-click deployment, and the entire config drives the live instance at **https://cse-grievance-production.up.railway.app**.

> Note: uploaded evidence (`uploads/`) lives on the server's disk and is ephemeral on free hosts — fine for demos; pair with object storage for production.

---

## Testing

The project ships Jest-based unit tests plus end-to-end API scripts exercising the live flows:

```bash
cd cse-grievance-server
npm test
```

The suite verifies: auth + CAPTCHA + RBAC, confidential-mode identity protection, audits, password reset, smart analyse, CSV exports, escalation & timeline, email preferences, SLA analytics and weekly reports.

---

## Project structure

```
CSE-Grievance-System/
├─ cse-grievance-server/          # Express + Socket.IO + Mongo
│  ├─ src/
│  │  ├─ app.js, server.js        # express app + http/socket bootstrap
│  │  ├─ config/                  # env config, DB connection
│  │  ├─ models/                  # User, Role, Case, Message, AuditLog, ...
│  │  ├─ routes / controllers / validators   # API layer (Zod)
│  │  ├─ services/                # business logic, email, analytics, report
│  │  ├─ middleware/              # RBAC, rate limits, audit, errors
│  │  ├─ jobs/                    # escalation + weekly report schedulers
│  │  └─ realtime/                # Socket.IO wiring
│  └─ uploads/
├─ cse-grievance-client/          # React 18 + Vite + Tailwind SPA
│  └─ src/{api,components,context,pages,types}
├─ render.yaml                    # deployment blueprint
├─ BUILD-LOG.md                   # full build journal (7 phases)
└─ LICENSE                        # MIT
```

---

## License

[MIT](LICENSE) © 2026 **Tanzirul Islam** — Dept. of CSE, RUET (ID: 2203054) · tanzirul.islam56@gmail.com