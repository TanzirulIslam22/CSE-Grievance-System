# PROJECT REPORT

# CSE Grievance System — Departmental Complaint-Resolution Platform

**Department of Computer Science & Engineering, RUET**

**Prepared by:** Tanzirul Islam (ID: 2203054) · tanzirul.islam56@gmail.com
**Date:** 2026
**Live deployment:** https://cse-grievance-production.up.railway.app
**Source code:** https://github.com/TanzirulIslam22/CSE-Grievance-System

---

## 1. Abstract

The CSE Grievance System is a full-stack web application built to replace the manual,
paper-based complaint-handling process of the department. It provides students, teachers
and staff with a confidential channel to log grievances — academic, administrative or
facility-related — and lets the department receive, process, escalate and resolve them
with full accountability. The system enforces role-based access control, protects
complainant identities through three privacy tiers, records every sensitive action in an
audit trail, and generates measurable analytics and reports for departmental management.

> **Live demo:** https://cse-grievance-production.up.railway.app
> *Demo logins:* Student `2203054@student.ruet.ac.bd` / HoD `hod@cse.ruet.ac.bd` / Admin `admin@cse.ruet.ac.bd` — password `password123` (CAPTCHA on login).

---

## 2. Problem Statement

Raising a complaint in an academic department is often uncomfortable because of the fear
of identification and retaliation. In the existing manual process:

- A complainant must visit an office in person and fill a paper form, or send an informal
  e-mail.
- There is **no anonymity option**, so most grievances go unreported.
- There is **no tracking** — the complainant cannot know the status of their complaint.
- There is **no accountability** — actions are not logged, and nothing is measurable.
- Reports, if any, are hand-compiled and delayed.

The department cannot measure how quickly issues are addressed, which types recur, or
where escalations are needed.

---

## 3. Objectives

1. Provide a **confidential and safe channel** for logging departmental grievances.
2. Give complainants **transparent status tracking** (timeline + real-time notifications).
3. Give the HoD/Admin a **complete dashboard** to manage cases with valid status workflows.
4. Ensure **accountability** through a complete audit trail and role-based access control.
5. Deliver **analytics and reports** (SLA metrics, weekly CSV/e-mail reports to the HoD).
6. Replace paper with a **secure, extensible, real-time** web system.

---

## 4. Scope

**In scope:**

- Registration/login (institutional domain validation), password reset, JWT sessions.
- Complaint submission with category, priority, description and evidence attachments.
- Three privacy tiers: *identified*, *protected*, *confidential*.
- Case resolution workflow: opened → acknowledged → in-progress → resolved/closed, with valid-transition enforcement.
- Two-way messaging inside a case with identity protection.
- Manual and automatic **escalation** of stale cases.
- Smart submission assistant (category suggestion + duplicate detection).
- Analytics dashboard + SLA metrics + CSV exports + weekly report e-mails.
- Admin console (user management, system settings), audit-log viewer.
- Real-time updates via WebSocket (Socket.IO).

**Out of scope (future work):** machine-learning-based automatic categorization (the heuristic is deliberately swappable), live status from external systems, mobile apps.

---

## 5. Key Features (ki ki features ase)

### 5.1 Complainant features

| Feature | Description |
|---|---|
| **Secure registration & login** | Institutional e-mail only (`ruet.ac.bd`), hashed passwords, JWT access+refresh tokens, math CAPTCHA, rate limiting |
| **Complaint submission** | Choose category, priority, title, description; attach evidence (≤10 MB, e.g. images/PDFs) |
| **Privacy tiers** | *Identified* (all visible) · *Protected* (students shown as role-only to other students) · *Confidential* (submitter hidden even from HoD until reveal) |
| **Smart assistant** | Heuristic auto-suggests category & flags near-duplicate complaints before submitting |
| **Case tracking** | Personal dashboard, My Cases list, full **timeline** (created / status changes / escalations with dates + actor) |
| **Two-way messaging** | Communicate with the department inside the case; identity remains masked when chosen |
| **Email preferences** | Per-account toggles to opt out of status-update or message notifications |
| **Password reset** | E-mailed 1-hour token, no account enumeration |
| **Real-time push** | Instant notification when the case status changes or a reply arrives |

### 5.2 Department (HoD / Admin) features

| Feature | Description |
|---|---|
| **All-cases dashboard** | Filter & search by status, category, priority, privacy mode |
| **Status workflow** | Acknowledge / mark in-progress / resolve / close / reopen with valid-transition validation and audit |
| **Escalation** | Manual escalation button + background **auto-escalation job** for cases older than a configurable number of days; reason recorded, audit + e-mail + realtime notifications |
| **Identity reveal** | HoD/Admin can (audited & gated) reveal a confidential submitter |
| **Analytics** | Totals by status/category/priority, average resolution time, **avg first-response time (hours)**, **escalated counts** |
| **Weekly report** | CSV of recent cases + plain-text summary e-mailed to all HoD/Admin accounts; manual "Send" button and an automatic Monday-09:00 schedule |
| **CSV exports** | Cases and audit log export to CSV |
| **Audit log** | Every sensitive action logged (who/when/what) with viewer + export |
| **Admin console** | User management (list/search/change role), system settings (registration on-off, CAPTCHA on-off, escalation enable + days) |

### 5.3 Cross-cutting / platform features

- **RBAC everywhere:** permissions are data-driven (roles → permissions tables), enforced by middleware on every protected route.
- **Security:** Helmet headers, CORS, Zod input validation, bcrypt hashing, rate limiting on auth & submission, secret-token refresh rotation.
- **Reliability:** background jobs self-reschedule; graceful DB handling; test suite covering the whole workflow.
- **Responsive UI:** Tailwind CSS, works on desktop & mobile.

---

## 6. How It Works (ki kaj kore)

### 6.1 Actors & roles

Only roles seeded in the database have access:

- **Student / Teacher / (Staff)** — create cases, message on own cases, track, escalate *nothing*.
- **Head of Department (HoD)** — sees all cases, status changes, escalates, reveals identity, analytics, CSVs, weekly reports, audit log.
- **Admin** — everything the HoD can do, plus user management and system settings.

### 6.2 Core workflows

**1. Registration & authentication.**
A user registers with an institutional e-mail; the server validates the domain against
`INSTITUTIONAL_DOMAINS`, hashes the password with bcrypt, and issues JWT access (`15m`) and
refresh (`7d`) tokens. Login and registration are protected by a stateless math CAPTCHA and
rate limiting. The refresh token is exchanged silently by the SPA when the access token expires.

**2. Submitting a grievance.**
The complainant fills the submission form. The *smart assistant* (`POST /api/cases/analyze`)
scores keywords/patterns to suggest a **category** and compares against recent cases to warn
about **probable duplicates**. The case is stored with a unique ID (`CSE-2026-00001`), and the
chosen privacy tier controls who can later see the submitter's identity:
- `identified` → name visible to staff;
- `protected` → students see only a masked label;
- `confidential` → submitter is `null` to everyone until an audited reveal.

Evidence files are uploaded with Multer, validated for size/type, and downloadable only by
authorized roles.

**3. Resolution workflow & messaging.**
The HoD/Admin sees the case, can change status along a validated graph
(open → acknowledged → in-progress → resolved → closed, with reopen), and can post replies.
Every status change is **audited**, triggers an **e-mail** (respecting the complainant's
email preferences) and a **real-time Socket.IO event** to that user's room, so the open tab
updates instantly. The complainant replies with messages that travel through the same identity-
protection layer.

**4. Escalation.**
If a case is not resolved within `escalationDays` (default 7), the background
`escalationJob` marks it `escalated` with an auto-recorded reason, or an authorized user can
escalate manually — idempotently, with reason, audit entry, and notifications to both sides.

**5. Analytics & reports.**
`GET /api/analytics/summary` aggregates counts and computes SLA metrics:
- *average resolution days* (resolved/closed cases),
- *average first-response hours* (time from creation to the first status change, via a lookup
  over the status-history collection),
- *escalated count*.

`POST /api/analytics/report` (or the scheduled job) generates a **CSV of the 500 most recent
cases** plus a summary text and e-mails it to every HoD/Admin account. SMTP is configurable;
without SMTP the mail is printed to the server console (dev mode).

### 6.3 Real-time (Socket.IO)

When the client logs in it connects with its JWT. The server authenticates the socket, joins
the socket to a personal room (`user:<id>`) and a role room (`role:<name>`). Any event —
status change, message, escalation — is emitted to the relevant rooms, and the client
invalidates its React Query cache to refetch fresh data.

### 6.4 Security model

- Passwords hashed (bcryptjs), tokens signed with HS256; no secrets in the client.
- Helmet, CORS origin allowlist, JSON body-size limits, Multer file-type/limit checks.
- Zod schemas validate every request payload; unknown routes return 404; centralized error handler.
- In-memory rate limiters guard auth (login/register) and case submission.
- Audit logging covers access to confidential cases, identity reveals, status changes, escalations,
  report sends and other sensitive actions; the log is viewable/exportable by HoD/Admin.

---

## 7. System Architecture

```
Browser (React SPA)                         Node.js / Express host
┌───────────────────────┐                    ┌───────────────────────────────────────┐
│  React 18 · Vite ·    │   /api/* (JSON)    │  middleware: helmet, cors, rate-limit │
│  Tailwind · Query ·   │ ─────────────────► │  routes → validators(Zod) → RBAC      │
│  Socket.IO client     │ ◄───────────────── │  → services (business logic)          │
│  Auth context + JWT   │   socket.io events │        │                             │
└───────────────────────┘                    │   models (Mongoose) ────► MongoDB    │
                                            │   emailService (nodemailer)          │
                                            │   jobs: escalationJob · reportJob    │
                                            └───────────────────────────────────────┘
```

- **Frontend:** React SPA built with Vite; state & caching via TanStack Query; routing via
  React Router; realtime via Socket.IO.
- **Backend:** layered Express — routes → validators → controllers → services → models.
  Context-managed services isolate DB, e-mail and socket logic.
- **Data:** MongoDB (Mongoose). Collections include users, roles, cases, casestatushistories,
  auditlogs, messages, configs, tokens, evidence.
- **Deployment:** a single Node service serving both the REST/socket API and the built static
  frontend (one domain, no CORS headaches).

### 7.1 Technology choices

| Layer | Technology | Why |
|---|---|---|
| UI | React 18 + Vite + Tailwind | Fast, componentized, responsive |
| State | TanStack Query | Server-state cache, invalidation on realtime events |
| Realtime | Socket.IO | Rooms-per-role natural fit for RBAC |
| API | Express | Mature, minimal, well-known |
| DB | MongoDB Atlas | Free-tier, flexible documents, fast aggregation |
| Auth | JWT + bcryptjs | Stateless access tokens + rotating refresh |
| Validation | Zod | First-class schema validation on both ends |
| Email | Nodemailer | SMTP-ready with console fallback |
| Uploads | Multer | Simple local evidence storage |
| Security | Helmet, express-rate-limit, CORS | Standard hardening |

---

## 8. Development & Testing

The project was built in **7 incremental phases**, each tested end-to-end before moving on:

1. **Phase 1–2 — MVP:** authentication, RBAC, case submission, privacy modes, messaging,
   evidence upload, audit logging.
2. **Phase 3 — Security & management:** CAPTCHA, confidential mode + identity reveal,
   system configuration, user management, analytics, WebSocket realtime.
3. **Phase 4 — Self-service:** password reset, smart submission assistant, CSV exports.
4. **Phase 5 — Escalation:** manual + auto-escalation job, case timeline, site footer.
5. **Phase 6 — Reporting:** per-user e-mail preferences, SLA metrics, weekly report job.

The automated suite (Jest + end-to-end API scripts) exercises every major flow — login/CAPTCHA,
RBAC, privacy enforcement, audits, password reset, smart analyse, exports, escalation, prefs,
SLA and reports. **Final regression: 62 automated assertions passing**, and the client builds to
~416 KB JS / ~22 KB CSS.

---

## 9. Limitations & Future Work

**Current limitations**

- Evidence files live on server disk (ephemeral on free hosting; fine for a demo).
- SMTP is not configured in dev so e-mails print to the console (SMTP drops-in via `.env`).
- Category suggestion uses heuristics, not learned ML.

**Future work**

- ML/NLP category detection + embeddings (the `/cases/analyze` contract already supports swap-in).
- Object storage (S3) for evidence; push/WhatsApp-style notifications.
- Case reassignment to specific staff members and per-case SLA deadlines.
- Multi-department / university-wide deployment with separate HoDs.
- Audit-log retention & export to PDF; PII anonymization tools.

---

## 10. Conclusion

The CSE Grievance System turns an uncomfortable, opaque and untrackable paper process into a
secure, confidential and measurable digital one. Complainants are protected by design, staff
are held accountable through a complete audit trail, and the department gains real insight —
response times, resolution times, escalation trends — to improve continuously. All six phases
are implemented, tested and covered by a live deployment, making the system ready for
demonstration and adaptable for real departmental use.

---

*Report generated as part of the final-year project deliverables.*