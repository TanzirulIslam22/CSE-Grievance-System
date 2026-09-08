# CSE Grievance System — Complete Build Log

> A step-by-step record of every action taken to build this project.
> Any MERN developer can follow this file to recreate the entire system from scratch.

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + React Query + Axios
- **Backend**: Node.js + Express + MongoDB (Mongoose) + JWT Auth
- **No TypeScript** — plain JavaScript (ES Modules)

---

## Step 1: Create Project Folder Structure

```powershell
mkdir "CSE-Grievance-System"
mkdir "CSE-Grievance-System\cse-grievance-client"
mkdir "CSE-Grievance-System\cse-grievance-server"
```

**Result:**
```
CSE-Grievance-System/
├── cse-grievance-client/    (React frontend)
├── cse-grievance-server/    (Express backend)
└── BUILD-LOG.md             (this file)
```

---

## Step 2: Server — package.json

**File:** `cse-grievance-server/package.json`

Created with dependencies:
- `express` — web framework
- `mongoose` — MongoDB ODM
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT auth tokens
- `zod` — input validation
- `helmet` — security HTTP headers
- `cors` — cross-origin resource sharing
- `express-rate-limit` — rate limiting
- `multer` — file upload handling
- `dotenv` — environment variable loading
- `morgan` — HTTP request logging
- `uuid` — unique ID generation

Key setting: `"type": "module"` enables ES module imports (`import/export`).

**Command:**
```bash
cd cse-grievance-server
npm install
```

---

## Step 3: Server — Environment Config

**File:** `cse-grievance-server/.env.example`

Contains all environment variables:
| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/cse_grievance` | MongoDB connection |
| `JWT_SECRET` | `dev-secret-change-in-production` | Token signing key |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `PORT` | `5000` | Server port |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (CORS) |
| `INSTITUTIONAL_DOMAINS` | `ruet.ac.bd` | Allowed email domains |

**To create actual .env:**
```bash
cp .env.example .env
# Edit .env with your values
```

---

## Step 4: Server — .gitignore

**File:** `cse-grievance-server/.gitignore`

Ignores: `node_modules/`, `uploads/*`, `.env`, logs

---

## Step 5: Server — Config Module

**Files created:**
- `src/config/index.js` — exports `config` object from env vars
- `src/config/db.js` — `connectDB()` function using `mongoose.connect()`
- `src/config/constants.js` — all app constants (roles, permissions, statuses, privacy modes)

**Key constants defined:**
- `ROLES` — student, teacher, faculty, staff, hod, admin
- `PERMISSIONS` — case:create, case:read:own, case:read:all, etc.
- `PRIVACY_MODES` — identified, protected
- `CASE_STATUS` — submitted → acknowledged → under_review → ... → resolved/closed
- `STATUS_TRANSITIONS` — valid state machine transitions

---

## Step 6: Server — Mongoose Models

**Files created in `src/models/`:**

| File | Collection | Purpose |
|---|---|---|
| `Role.js` | `roles` | Role name + permissions array |
| `User.js` | `users` | Email, passwordHash, role ref, name, studentOrEmployeeId |
| `Case.js` | `cases` | The grievance/complaint itself |
| `CaseEvidence.js` | `caseevidences` | File attachments for cases |
| `CaseMessage.js` | `casemessages` | Two-way messages on a case |
| `AuditLog.js` | `auditlogs` | Append-only audit trail |
| `CaseStatusHistory.js` | `casestatushistories` | Status change history |
| `index.js` | — | Re-exports all models |

**Critical privacy design:** `Case.submitterUserId` is always stored but identity data (name, email) lives in the `User` collection. The API layer joins them ONLY when `privacyMode === "identified"` AND the requester is HoD/Admin.

---

## Step 7: Server — Middleware

**Files created in `src/middleware/`:**

| File | Purpose |
|---|---|
| `auth.js` | `authenticate` — verifies JWT, attaches `req.user`. `loadUser` — fetches full user + role from DB |
| `rbac.js` | `requirePermission(...perms)` — checks role permissions. `requireRole(...roles)` — checks role name |
| `validate.js` | `validate(schema)` — runs Zod schema validation on req.body/query/params |
| `errorHandler.js` | Global error handler — returns structured JSON errors |
| `rateLimiter.js` | `authLimiter` (10/15min), `submissionLimiter` (20/hr), `generalLimiter` (100/15min) |
| `audit.js` | `logAudit(req, action, targetType, targetId, metadata)` — writes to AuditLog |

---

## Step 8: Server — Validators (Zod Schemas)

**Files created in `src/validators/`:**

- `auth.js` — `registerSchema`, `loginSchema`, `refreshTokenSchema`
  - Email must match `@cse.ruet.ac.bd` or `@student.ruet.ac.bd`
  - Password min 8 chars
- `cases.js` — `createCaseSchema`, `updateCaseStatusSchema`, `caseMessageSchema`, `caseQuerySchema`
  - Title: 5-200 chars
  - Description: 20-5000 chars
  - Category: one of 6 predefined values
  - Privacy mode: "identified" or "protected"

---

## Step 9: Server — Auth Service

**File:** `src/services/authService.js`

Functions:
- `register(email, password, name, id, role)` — hashes password with bcrypt (12 rounds), creates user, returns JWT pair
- `login(email, password)` — validates credentials, returns JWT pair
- `refreshTokens(refreshToken)` — verifies refresh token, issues new pair

JWT payload: `{ userId, email, role }` — short-lived access (15m) + refresh (7d)

---

## Step 10: Server — Case Service (Core Business Logic)

**File:** `src/services/caseService.js`

**This is the most security-critical file.** It enforces privacy at the query/serialization layer.

Key functions:
- `createCase(userId, data)` — generates unique case ID (`CSE-2026-00001`), creates case
- `getCases(userId, role, query)` — HoD/Admin see ALL cases; submitters see only their own. For identified cases, submitter info is fetched and attached. For protected cases, submitter info is NEVER attached.
- `getCaseById(caseId, userId, role)` — same privacy enforcement for single case
- `addMessage(caseId, userId, body)` — for protected cases, sender name is replaced with "Anonymous Submitter"
- `getCaseMessages(caseId, userId, role)` — same anonymous replacement for protected cases

**Case ID generation:** `CSE-{year}-{zero-padded-sequence}` — queries the DB for the latest case to determine the next sequence number.

**Status transitions:** enforced against the `STATUS_TRANSITIONS` map — invalid transitions throw a 400 error.

---

## Step 11: Server — Controllers

**Files created in `src/controllers/`:**

- `authController.js` — handles register, login, refresh, me (current user)
- `caseController.js` — handles create, list, get, update status, add message, list messages

Controllers are thin — they extract request data, call the service layer, and write the response. All errors are forwarded to the global error handler via `next(error)`.

---

## Step 12: Server — Routes

**Files created in `src/routes/`:**

- `auth.js` — `POST /register`, `POST /login`, `POST /refresh`, `GET /me`
- `cases.js` — all protected by `authenticate` + `loadUser`:
  - `POST /` — create case (rate-limited)
  - `GET /` — list cases (all or own based on role)
  - `GET /my` — list my cases only
  - `GET /:id` — get single case
  - `PATCH /:id/status` — update status (HoD/Admin only)
  - `POST /:id/messages` — add message
  - `GET /:id/messages` — list messages

---

## Step 13: Server — App Entry

**Files:**
- `src/app.js` — Express app with helmet, CORS, JSON parsing, rate limiting, routes, error handler
- `src/server.js` — connects to MongoDB then starts listening

**Security measures in app.js:**
- `helmet()` — sets security HTTP headers
- `cors({ origin: CLIENT_URL })` — only allows frontend origin
- `express.json({ limit: "1mb" })` — limits body size
- Rate limiters on all routes

---

## Step 14: Server — Seed Script

**File:** `src/seeds/index.js`

**Run with:** `npm run seed`

Creates:
1. **6 roles** with data-driven permissions (student, teacher, faculty, staff, hod, admin)
2. **4 demo users** (all password: `password123`):
   - `xyz@cse.ruet.ac.bd` — Teacher
   - `2203054@student.ruet.ac.bd` — Student
   - `hod@cse.ruet.ac.bd` — HoD
   - `admin@cse.ruet.ac.bd` — Admin

---

## Step 15: Server — uploads Directory

```bash
mkdir cse-grievance-server\uploads
echo. > cse-grievance-server\uploads\.gitkeep
```

---

## Step 15b: FIX — RBAC Permission Bug

**Issue:** HoD/Admin could not list cases, getting `403 Forbidden`.

**Cause:** The `GET /cases` route required the `case:read:own` permission, but HoD/Admin roles only have `case:read:all`. The `requirePermission` middleware uses `.some()` (checks if the user has ANY of the listed permissions), so the fix was to pass BOTH permissions to the route.

**Fix applied to `src/routes/cases.js`:**
```js
router.get("/", requirePermission(PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_READ_ALL), ...);
```

**Also added** `requireAllPermissions()` to `src/middleware/rbac.js` for cases where a user must have ALL listed permissions (not just any).

---

## Step 15c: Verified Privacy Enforcement (Manual Tests)

After seeding the live MongoDB Atlas database, these end-to-end tests confirmed the core privacy rule works:

### Test 1 — Protected case (identity HIDDEN from HoD)
Student created a case with `privacyMode: "protected"`. HoD listed all cases:
```json
{"caseId":"CSE-2026-00002","privacyMode":"protected","submitter":null}
```
✅ `submitter` is `null` — identity NOT leaked.

### Test 2 — Identified case (identity VISIBLE to HoD)
Teacher created a case with `privacyMode: "identified"`. HoD viewed it:
```json
{"caseId":"CSE-2026-00003","privacyMode":"identified",
 "submitter":{"name":"Dr. XYZ","email":"xyz@cse.ruet.ac.bd","studentOrEmployeeId":"T001"}}
```
✅ `submitter` contains full identity — as intended for identified mode.

### Result
The privacy enforcement at the query/serialization layer (in `src/services/caseService.js`) correctly:
- Shows identity for **identified** cases to HoD/Admin
- Always returns `submitter: null` for **protected** cases, regardless of who requests it

---

## Step 16: Client — package.json

**File:** `cse-grievance-client/package.json`

Dependencies:
- `react`, `react-dom` — UI library
- `react-router-dom` — client-side routing
- `@tanstack/react-query` — server state management (caching, refetching)
- `axios` — HTTP client
- `lucide-react` — icons
- `zod` — shared validation schemas

Dev dependencies:
- `@vitejs/plugin-react` — Vite React plugin
- `tailwindcss`, `autoprefixer`, `postcss` — styling
- `vite` — build tool

**Command:**
```bash
cd cse-grievance-client
npm install
```

---

## Step 17: Client — Vite Config

**File:** `cse-grievance-client/vite.config.js`

- React plugin enabled
- Path alias: `@` → `./src`
- Dev server port: 5173
- API proxy: `/api` → `http://localhost:5000` (avoids CORS issues in dev)

---

## Step 18: Client — Tailwind Config

**File:** `cse-grievance-client/tailwind.config.js`

Custom color palette designed for an institutional/trust product:
- `primary` — calm blue (main UI color)
- `accent` — warm orange (warnings/priority)
- `danger` — red (errors, urgent)
- `success` — green (resolved, confirmed)
- `surface` — neutral grays (backgrounds, text)

Font: Inter (clean, professional)

---

## Step 19: Client — index.html + CSS

**Files:**
- `index.html` — loads Inter font from Google Fonts
- `src/index.css` — Tailwind directives + custom component classes:
  - `.btn-primary`, `.btn-secondary`, `.btn-danger` — styled buttons
  - `.input-field` — consistent form inputs
  - `.card` — white rounded container
  - `.badge-*` — status-colored badges

---

## Step 20: Client — API Layer

**Files in `src/api/`:**
- `client.js` — Axios instance with:
  - Auth interceptor: attaches JWT from localStorage to every request
  - Refresh interceptor: on 401, attempts token refresh, retries original request
- `auth.js` — `loginUser()`, `registerUser()`, `getMe()`
- `cases.js` — `getCases()`, `getMyCases()`, `getCaseById()`, `createCase()`, `updateCaseStatus()`, `getCaseMessages()`, `sendCaseMessage()`

---

## Step 21: Client — Auth Context

**File:** `src/context/AuthContext.jsx`

- Stores user + tokens in React state AND localStorage (persists across page reloads)
- On mount, checks for stored token and calls `GET /api/auth/me` to restore session
- Provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`

---

## Step 22: Client — Components

**Files in `src/components/`:**
- `ProtectedRoute.jsx` — redirects to `/login` if not authenticated, or `/dashboard` if wrong role
- `Layout.jsx` — sidebar navigation + mobile header + user info + sign out

Navigation adapts based on role:
- Students/Teachers/Faculty/Staff: Dashboard, Submit Case, My Cases
- HoD/Admin: Dashboard, All Cases

---

## Step 23: Client — Pages

**Files in `src/pages/`:**

| Page | Route | Purpose |
|---|---|---|
| `LoginPage.jsx` | `/login` | Email + password login form |
| `RegisterPage.jsx` | `/register` | Registration form (name, email, ID, role, password) |
| `DashboardPage.jsx` | `/dashboard` | Stats cards + recent cases list |
| `CreateCasePage.jsx` | `/cases/new` | Submit new case with privacy mode toggle |
| `CaseListPage.jsx` | `/cases` or `/my-cases` | Filterable, searchable case list with pagination |
| `CaseDetailPage.jsx` | `/cases/:id` | Full case view, status update (HoD), messaging |

---

## Step 24: Client — App Router + Main Entry

**Files:**
- `src/App.jsx` — sets up React Query, Auth, BrowserRouter, all routes
- `src/main.jsx` — renders `<App />` into the DOM

---

# PHASE 2 — Evidence, Admin & Audit

## Step 25: Server — Evidence Upload Backend

**File:** `src/middleware/upload.js`
- Uses `multer` → stores files in `server/uploads/` (outside the web root, never statically served)
- `fileFilter`: server-side MIME allowlist — `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, Word/Excel docs, `application/zip`, `video/mp4`
- Size limit: **10 MB** per file

**File:** `src/services/evidenceService.js`
- `uploadEvidence(caseId, userId, file)` — writer must be the case owner (or HoD/Admin); saves a `CaseEvidence` record
- `getEvidence(caseId, userId)` / `downloadEvidence(evidenceId, userId)` / `deleteEvidence(evidenceId, userId)`
- Access control: owner + HoD/Admin can download; delete is owner-only

**Files:** `src/controllers/evidenceController.js`, `src/routes/evidence.js`
Mounted at `/api/evidence`:
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/cases/:id/evidence` | Upload evidence to a case |
| GET | `/api/cases/:id/evidence` | List evidence for a case (owner or HoD/Admin) |
| GET | `/api/evidence/:evidenceId/download` | Stream file (auth + access check) |
| DELETE | `/api/evidence/:evidenceId` | Delete evidence (owner only) |

**Note:** the download route is `/:evidenceId/download` (not `/evidence/:evidenceId/download`) — the router is already mounted at `/api/evidence`.

---

## Step 26: Server — Admin Backend (Users + Roles)

**File:** `src/services/adminService.js`
- `listUsers(query)` — paginated, searchable (name/email/ID), populate role, shape away sensitive fields
- `listRoles()` — all roles with permissions
- `updateUserRole(userId, roleName)` — validates role exists, returns updated user

**Files:** `src/controllers/adminController.js`, `src/routes/admin.js`, `src/validators/admin.js`
Mounted at `/api/admin`:
| Method | Path | Permission Required | Purpose |
|---|---|---|---|
| GET | `/api/admin/users` | `ADMIN_USER_READ` | List/search/paginate users |
| GET | `/api/admin/roles` | `ADMIN_USER_READ` | List roles |
| PATCH | `/api/admin/users/:id/role` | `ADMIN_USER_UPDATE` | Change a user's role |

---

## Step 27: Server — Audit Log Backend

**File:** `src/services/auditService.js`
- `getAuditLogs(query)` — paginated, filterable by `action`, `targetType`, `actorUserId`; populates the actor (name + email)

**Files:** `src/controllers/auditController.js`, `src/routes/audit.js`
Mounted at `/api/audit`:
| Method | Path | Permission Required | Purpose |
|---|---|---|---|
| GET | `/api/audit` | `AUDIT_READ` (HoD/Admin) | Read the append-only audit trail |

**Audit actions recorded** (by `src/middleware/audit.js`): `case:create`, `case:read`, `case:status:update`, `case:message`, `evidence:upload`, `evidence:download`, `evidence:delete`, `user:role-update`.

---

## Step 28: Client — API Layer Additions

**Files:**
- `src/api/evidence.js` — `getEvidence()`, `uploadEvidence()` (multipart FormData), `downloadEvidence()`, `deleteEvidence()`
- `src/api/admin.js` — `getUsers()`, `getRoles()`, `changeUserRole()`, `getAuditLogs()`

---

## Step 29: Client — Pages (Admin + Evidence)

**Files:**
- `UserManagementPage.jsx` (route `/admin/users`, admin only) — search, paginate, change role via dropdown
- `AuditLogPage.jsx` (route `/admin/audit`, HoD/Admin) — filterable, paginated activity log
- `CaseDetailPage.jsx` — added an **Evidence** card: upload (with MIME/size hints), download, delete

`App.jsx` now includes:
```jsx
<Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
<Route path="/admin/audit" element={<ProtectedRoute roles={["hod","admin"]}><Layout><AuditLogPage /></Layout></ProtectedRoute>} />
```
`Layout.jsx` nav now shows Admin links (`Users`, `Audit Log`) only to the roles that need them.

---

## Step 30: FIX — Client Production Build

Running `npm run build` (Vite build) surfaced real issues the dev server had hidden:

1. **`index.html` still pointed at `/src/main.tsx`** → changed to `/src/main.jsx`.
2. **Extensionless relative imports failed** in the Rollup build → added `resolve.extensions` in `vite.config.js` (`[".js", ".jsx", ".mjs", ".json"]`) and added explicit extensions (`.js`/`.jsx`) to all relative imports.
3. **Wrong `..` depth in `src/pages/` imports** — pages live at `src/pages/`, so sibling folders are one level up, but every page used `../../` (which resolves to the *project root*). Fixed `../../context` / `../../api` / `../../types` → `../context` / `../api` / `../types`.

✅ Result: production bundle builds cleanly (`≈1700 modules`, ~327 kB JS, ~19 kB CSS).

---

## Verified in Phase 2 (live against Atlas DB)

- ✅ Evidence upload works (multipart, MIME allowlist enforced — a `.exe` is rejected)
- ✅ Evidence download: owner = 200, HoD = 200, non-owner teacher = 403
- ✅ Admin lists users; changing a role works (200); non-admin gets 403
- ✅ Audit log returns entries; role change is audited as `user:role-update`
- ✅ Backend + frontend both boot; login endpoint returns tokens

---

# Phase 3 — Hardening & Capabilities

## Step 31: Confidential Mode + Audited Identity Reveal (Backend)

**Files:** `models/Case.js`, `services/caseService.js`, `controllers/caseController.js`, `routes/cases.js`, `validators/cases.js`, `config/constants.js`

1. `constants.js`: added `PERMISSIONS.ANALYTICS_READ = "analytics:read"` and `PRIVACY_MODES.CONFIDENTIAL = "confidential"`.
2. `models/Case.js`: `privacyMode` enum now includes `"confidential"`; added `identityRevealed: { type: Boolean, default: false }`.
3. `validators/cases.js`: allowed `confidential` in the privacy mode field.
4. `services/caseService.js`:
   - Added `revealIdentity(caseId, userId)` — only HoD/Admin (route-gated), works only on `confidential` cases, sets `identityRevealed: true`, returns `{ caseId, _id, ownerUserId, alreadyRevealed }`.
   - `shapeCaseResponse` now includes `identityRevealed` (for confidential cases) and enforces the rule: submitter is returned to the staff **only** when `identified` or `confidential && identityRevealed`. Protected cases never expose the submitter.
5. `controllers/caseController.js` + `routes/cases.js`: `POST /api/cases/:id/reveal-identity` (requires `case:reveal-identity` permission), logs audit `case:identity-reveal`, emits realtime event, and notifies the owner by email.
6. **FIX (found in testing):** `GET /api/cases/:id` used to return the case object *directly*, but the client and `createCase` both use a `{ case: ... }` wrapper — the detail page would have shown "Case not found". Wrapped the response in `res.json({ case: result })`.

## Step 32: System Configuration Backend

**Files:** `models/SystemConfig.js` (new), `services/configService.js` (new), `config/index.js`, `controllers/configController.js` (new), `routes/admin.js`, `.env.example`

1. New `SystemConfig` model: `{ key, value, description }`.
2. `configService.js` with `DEFAULT_CONFIG`:
   | Key | Default |
   |---|---|
   | `allowRegistration` | `true` |
   | `captchaEnabled` | `true` |
   | `maxEvidenceSizeMb` | `10` |
   | `supportEmail` | `""` |
   | `departmentName` | `"Department of CSE, RUET"` |
3. `GET /api/admin/config` + `PATCH /api/admin/config` (requires new `system:config` permission, admin only).
4. `config/index.js`: added `email` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`), `captcha.enabled` (defaults **on** unless `CAPTCHA_ENABLED=false`), and `system.maxEvidenceSizeMb`.
5. `.env.example`: documented the new `SMTP_*` + `CAPTCHA_ENABLED` variables.

## Step 33: Email Notifications

**File:** `services/emailService.js` (new), dependency `nodemailer`

- `nodemailer` transport is created **only** when `SMTP_HOST` is set; otherwise a **console fallback** prints the would-be email (perfect for local dev / demo).
- Notifications implemented:
  - `notifyNewCase(case)` → HoD
  - `notifyStatusChange(caseId, urlSlug, ownerUserId, from, to)` → case owner
  - `notifyNewMessage(...)` → owner (staff wrote) or all staff (submitter wrote)
  - `notifyIdentityRevealed(...)` → case owner

## Step 34: Math CAPTCHA on Auth

**Files:** `services/captchaService.js` (new), `services/authService.js`, `controllers/authController.js`, `routes/auth.js`, `validators/auth.js`

1. **Stateless captcha** — `issueCaptcha()` produces a random math question (`What is 6 − 2?`), signs the operands into a short-lived JWT (expires 5 min), and returns `{ captchaToken, question }`. `verifyCaptcha(token, answer)` re-hashes and compares — no database or external services needed.
2. `routes/auth.js`: `GET /api/auth/captcha` (issue) + `GET /api/auth/captcha-status`.
3. `validators/auth.js`: register/login schemas accept optional `captchaToken` / `captchaAnswer`.
4. `services/authService.js`:
   - **Register** always requires a valid captcha (unless `CAPTCHA_ENABLED=false`).
   - **Login** requires it while the DB config flag `captchaEnabled` is `true` AND env allows it.
5. Registration is also gated by the config flag `allowRegistration` (403 when disabled).

## Step 35: Analytics Backend

**Files:** `services/analyticsService.js` (new), `controllers/analyticsController.js` (new), `routes/analytics.js` (new)

- `GET /api/analytics/summary` (requires `analytics:read`; seeded to HoD + Admin).
- Aggregations via MongoDB `$group`:
  - `byStatus` (all 8 statuses zero-filled), `byCategory`, `byPriority`, `byPrivacy`, `byMonth` (last 12)
  - `total`, `resolved`, `open`, `totalMessages`, `totalEvidence`
  - `averageResolutionDays` (avg of `updatedAt − createdAt` for resolved/closed cases)

## Step 36: WebSocket Real-Time Updates

**Files:** `realtime/io.js` (new), `server.js`, `app.js`, all case controllers

1. `server.js` now creates an `http.Server` and calls `attachIO(httpServer)` before listening.
2. `realtime/io.js`: Socket.IO with JWT auth (`socket.handshake.auth.token`), rooms `user:<userId>` and `role:<roleName>`; helpers `emitToUser()` and `emitToRole()`.
3. Events wired in `caseController.js`:
   | Event | When |
   |---|---|
   | `case:new` | case created (→ hoD/admin rooms) |
   | `case:status` | status changed (→ owner + hoD/admin) |
   | `case:message` | message added (→ owner + hoD/admin) |
   | `case:identity-revealed` | identity revealed (→ owner + hoD/admin) |
4. Frontend `vite.config.js` proxied `/socket.io` (with `ws: true`) to the backend.

## Step 37: Seeds Update + Reseed

**Files:** `seeds/index.js`

- HoD + Admin: granted `analytics:read`.
- Admin additionally granted `case:reveal-identity` + `system:config`.
- Seed now also clears and reseeds `SystemConfig` with defaults.
- Reseeded against the live DB (verified role permission arrays).

## Step 38: Phase 3 Integration Tests (live server)

Automated suite: **20/20 passed**:
- Captcha: status flag, login rejected without captcha, login with captcha, register with captcha, captcha correctly keyed as `captchaToken`/`captchaAnswer`
- Confidential: create → list hides submitter (null) → HoD reveal → submitter visible → subsequent GET keeps identity
- RBAC: HoD analytics 200 / student 403; admin config 200 + PATCH; HoD config 403; registration disabled via config → 403
- Audit trail contains `case:create` and `case:identity-reveal`

Realtime suite (socket.io-client): **7/7 passed** — connected with JWT, received `case:new` after a student created a case, received `case:identity-revealed` after HoD revealed, plus regression checks.

## Step 39: Client — Phase 3

New/changed files under `cse-grievance-client/src`:
- `api/`: `auth.js` (+`getCaptchaStatus`, `getCaptcha`, login accepts extra captcha payload), `cases.js` (+`revealCaseIdentity`), `admin.js` (+`getConfig`/`updateConfig`), `analytics.js` (new)
- `components/CaptchaField.jsx` (new) — renders the math question, answer input, "new question" refresh and feeds `{ captchaToken, captchaAnswer }` to the form
- `pages/LoginPage.jsx` — captcha shown when `captcha-status` says enabled; token auto-refreshes after a failed attempt
- `pages/RegisterPage.jsx` — captcha always required
- `pages/CreateCasePage.jsx` — third privacy option **Confidential** with explanatory banner
- `pages/CaseDetailPage.jsx` — confidential badge, "Reveal submitter identity" button for HoD/Admin (permission-checked on server), submitter hidden until revealed
- `pages/CaseListPage.jsx` — confidential/protected badges; submitter only shown when permitted
- `pages/AnalyticsPage.jsx` (new, route `/analytics`, HoD/Admin) — stat cards + Tailwind bar charts for status/category/priority/month
- `pages/SystemSettingsPage.jsx` (new, route `/admin/settings`, Admin) — toggles registration + captcha, evidence size, support email, department name
- `context/RealtimeContext.jsx` (new) + `App.jsx` — Socket.IO client with JWT auth; events invalidate `cases / case / messages / analytics / audit` React Query caches
- `types/index.js` — privacy labels/classes, category icons, `case:identity-reveal` action label

`Layout.jsx` nav updated: **Analytics** → HoD/Admin, **Settings** → Admin.

## Step 40: Client Build + E2E Smoke

- ✅ `npm run build` passes (~1740 modules, ~388 kB JS / ~20 kB CSS)
- ✅ Captcha check screen shows for login; registration blocked without valid captcha
- ✅ Confidential flow verified end-to-end over the API + websocket
- ✅ Analytics and Settings pages served for the correct roles

---

# Phase 4 — Self-Service & Intelligence

## Step 41: Self-Service Password Reset

**Files:** `models/User.js`, `services/authService.js`, `controllers/authController.js`, `routes/auth.js`, `validators/auth.js`, `services/emailService.js`, client `pages/ResetPasswordPage.jsx`, `api/auth.js`, `App.jsx`, `LoginPage.jsx`

1. **User model**: added `passwordResetTokenHash` + `passwordResetExpires` (the raw token is never stored — only its SHA-256 hash, so a DB leak can't be replayed).
2. **`authService.requestPasswordReset(email)`**: generates a 32-byte random token (1-hour expiry), stores its hash, emails a reset link (`{clientUrl}/reset-password?token=...&email=...`) via `sendEmail`. **Returns success even when the email doesn't exist** → no account enumeration.
3. **`authService.resetPassword(token, newPassword)`**: hashes the submitted token, matches the stored hash + unexpired window, re-hashes the password, clears the token fields.
4. **Routes** (rate-limited by `authLimiter`): `POST /auth/forgot-password`, `POST /auth/reset-password`.
5. **Client**: new public `/reset-password` page has two modes — request form (sends link) and reset form (reads `?token=&email=` from the link, min-8 validation, confirm-match check, auto-redirect to login after success). "Forgot your password?" link added to the login card.

## Step 42: Smart Submission Assistant (Categorization + Duplicate Detection)

**Files:** `services/caseAnalysisService.js` (new), `controllers/caseController.js`, `routes/cases.js`, `validators/cases.js`, client `api/cases.js`, `pages/CreateCasePage.jsx`

1. **Heuristic category suggestion** — keyword scoring over `title (2×) + description` for the six categories (`academic`, `faculty_conduct`, `facility`, `administration`, `harassment`, `other`, the fallback). No external AI service — fully offline.
2. **Duplicate detection** — tokenizes title + description (stop-word filtered), computes a title-weighted overlap similarity against the 200 most recent **active** cases. Students only see *their own* previous cases; HoD/Admin see all — privacy preserved. Returns top 3 matches ≥ 50%.
3. **Endpoint**: `POST /cases/analyze` (any authenticated user, rate-limited) returns `{ suggestedCategory, categoryScores, duplicates }` and logs an audit `case:analyze` entry.
4. **Client**: the Create Case form now runs a **debounced (600 ms)** analysis as you type. A "Smart assistant" panel shows a click-to-apply suggested category chip and links to similar existing cases with match percentage (flagged "Exact match!" when titles are identical).

## Step 43: CSV Exports (HoD/Admin)

**Files:** `services/csvService.js` (new), `controllers/caseController.js`, `controllers/auditController.js`, `routes/cases.js`, `routes/audit.js`, client `api/csv.js` (new), `pages/CaseListPage.jsx`, `pages/AuditLogPage.jsx`

1. `csvService.js` — RFC-4180-style escaping (quotes fields containing quotes/commas/newlines).
2. `GET /cases/export` (requires `case:read-all`) — up to 1,000 most recent cases: Case ID, Title, Category, Priority, Status, Privacy, Identity Revealed, Created, Description.
3. `GET /audit/export` (requires `audit:read`) — up to 5,000 entries: Time, Actor, Email, Action, Target, Details.
4. Client `downloadCsv()` helper fetches the blob through the authenticated Axios instance and triggers a download; **Export CSV** buttons added to the All Cases and Audit Log headers.

## Step 44: Phase 4 Tests + Verification (live)

- ✅ Reset without auth required; valid token works; invalid/expired token rejected; login with the new password works; forgotten-email request returns 200 (no enumeration); original password restored by test cleanup
- ✅ Analyzer: rejects anonymous calls (401), suggests `facility` for a lab/Wi-Fi complaint, returns score arrays, and flags a near-identical existing case at ≥ 90%
- ✅ CSV: cases export returns `text/csv` with header row; student gets 403; audit export returns valid CSV
- ✅ Socket.IO still connects after the changes
- ✅ Phase 3 regressions re-verified: **20/20 passed**
- ✅ `npm run build` clean (~1742 modules, ~398 kB JS / ~21 kB CSS)

---

## How to Run

### 1. Start MongoDB
Make sure MongoDB is running locally on port 27017, or set `MONGODB_URI` in `.env`.

### 2. Seed the database
```bash
cd cse-grievance-server
npm run seed
```

> **Note (Phase 3):** Login and registration now require solving a **math CAPTCHA** by
> default. To disable it for development, set `CAPTCHA_ENABLED=false` in `.env`.
> Registration can also be turned off at any time from the Admin → Settings page.

### 3. Start the backend
```bash
cd cse-grievance-server
npm run dev
```
Server runs on `http://localhost:5000`

### 4. Start the frontend
```bash
cd cse-grievance-client
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Login with demo accounts
| Role | Email | Password |
|---|---|---|
| Student | `2203054@student.ruet.ac.bd` | `password123` |
| Teacher | `xyz@cse.ruet.ac.bd` | `password123` |
| HoD | `hod@cse.ruet.ac.bd` | `password123` |
| Admin | `admin@cse.ruet.ac.bd` | `password123` |

---

## What's Built (Phase 1 MVP + Phase 2)

- [x] Institutional auth (email + password, JWT tokens)
- [x] Data-driven RBAC (roles → permissions, seeded)
- [x] Complaint submission with privacy mode (identified / protected)
- [x] Unique case ID generation (`CSE-2026-00001`)
- [x] HoD dashboard with filtering and search
- [x] Case status workflow with valid transitions
- [x] Two-way messaging with identity protection
- [x] Privacy enforcement at query/serialization layer
- [x] Rate limiting on auth and submission endpoints
- [x] Audit logging for case access, status changes, messages
- [x] RBAC middleware on every route
- [x] Security headers (Helmet), CORS, input validation (Zod)
- [x] **Evidence / file attachments** (upload, download, delete with access control)
- [x] **Admin user management** (list, search, change roles)
- [x] **Audit log access page** (HoD/Admin)
- [x] **Confidential mode** (third privacy tier) + audited identity reveal (HoD/Admin, gated)
- [x] **Email notifications** (nodemailer with console fallback for local dev)
- [x] **Analytics dashboard** (aggregations; HoD/Admin)
- [x] **WebSocket real-time updates** (Socket.IO, JWT auth, per-user/per-role rooms)
- [x] **CAPTCHA on auth endpoints** (stateless math captcha, no external services)
- [x] **System configuration page** (admin only)
- [x] **Self-service password reset** (1-hour token, hash-stored, no account enumeration)
- [x] **Smart submission assistant** (heuristic category suggestion + duplicate detection, privacy-aware)
- [x] **CSV exports** (cases + audit log) for HoD/Admin

## What's Deferred (Phase 5+)

- [ ] Real ML/NLP categorization & embeddings (swap-in behind the same `/cases/analyze` contract)
- [ ] Escalation workflow (auto-promote unresolved cases to admin after N days)
- [ ] Push notifications / email preferences per user
- [ ] Scheduled CSV/PDF email reports to the HoD
