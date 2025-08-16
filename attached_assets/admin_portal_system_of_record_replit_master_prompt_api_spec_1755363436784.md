# Replit Master Prompt: “National Dialogue ZA – **Admin Portal** (System of Record)

> Copy–paste this whole prompt into Replit’s AI/Agent. It should scaffold a full‑stack TypeScript project (server + admin UI) that acts as the **system of record** for the National Dialogue. Include REST APIs for the mobile app, seed dummy data, and user management with multi‑role RBAC.

---

## 0) Project summary

Build a production‑ready **Admin Portal** and **Backend API** for the South Africa National Dialogue programme. The backend is the single source of truth (system of record) for users, submissions, cases, polls, departments, and taxonomy. Provide a secure Admin UI for super admins, moderators, analysts, and department officers to manage content and operations. Expose documented REST APIs for the mobile app.

---

## 1) Tech stack & architecture

- **Language:** TypeScript end‑to‑end.
- **Repo:** Single repo with two workspaces: `/server` (Node) and `/admin` (React).
- **Server:** Node.js + Fastify (or Express) + **Prisma** ORM + **PostgreSQL** (use SQLite in dev if Postgres unavailable). Runtime validation with **Zod**.
- **Auth:** JWT access/refresh tokens, password (bcrypt), email OTP (stub), optional TOTP MFA (stub). RBAC via roles+permissions.
- **Docs:** OpenAPI 3 at `/docs` (Swagger UI).
- **Security:** CORS (mobile + admin origins), rate limiting, helmet, input validation, audit logs.
- **Testing:** Vitest + Supertest; seed script for local data.
- **DX:** `.env` templates, Prisma migrations, `npm run dev` scripts for both apps.

Repo layout:

```
/ (root)
  package.json (workspaces)
  /server
    src/
    prisma/
    openapi.yaml (generated)
  /admin
    src/
```

---

## 2) Data model (Prisma schema)

Create these entities and relations:

- **User** { id, name, email, phone?, password\_hash, is\_active, language, province, roles[Role], createdAt, updatedAt }
- **Role** { id, name (SuperAdmin|Admin|Analyst|Moderator|DeptOfficer|Citizen), permissions[Permission] }
- **Permission** { id, key, description }
- **Department** { id, name, jurisdiction (national|provincial|municipal), province?, email, sla\_hours, topics[TopicTag] }
- **TopicTag** { id, name, parent\_id? }
- **Submission** { id, userId?, channel (mobile|web|whatsapp|social), text, media\_urls Json?, language\_detected, province, sentiment Float?, toxicity Boolean, status (new|moderated|routed|in\_progress|resolved|declined), createdAt }
- **SubmissionTag** { submissionId, tagId, confidence Float }
- **Case** { id, submissionId, departmentId, assigneeId?, priority (low|medium|high), state (open|investigating|awaiting\_info|resolved), dueAt, resolution\_note?, updatedAt }
- **Poll** { id, question, options Json, startAt, endAt, targetProvince? }
- **Vote** { id, pollId, userId, option, createdAt }
- **Notification** { id, userId, type, title, body, read Boolean, createdAt }
- **AuditLog** { id, actorId?, action, entity, entityId, before Json?, after Json?, createdAt }

Include sensible indexes (e.g., on `Submission.status`, `Case.state`, `User.email`).

---

## 3) Roles & personas (seed users)

Create **personas** with initial users and strong passwords (document in README; in dev only):

- **SuperAdmin** – “Thandi Dlamini” ([thandi@admin.local](mailto\:thandi@admin.local))
- **Admin** – “Johan Botha” ([johan@admin.local](mailto\:johan@admin.local))
- **Analyst** – “Naledi Mokoena” ([naledi@analytics.local](mailto\:naledi@analytics.local))
- **Moderator** – “Sipho Ncube” ([sipho@moderation.local](mailto\:sipho@moderation.local))
- **DeptOfficer (Health KZN)** – “Zanele Khumalo” ([zanele.health@kzn.local](mailto\:zanele.health@kzn.local))
- **DeptOfficer (Transport GP)** – “Pieter van Wyk” ([pieter.transport@gp.local](mailto\:pieter.transport@gp.local))
- **Citizen demo** – “Asha Naidoo” ([asha@citizen.local](mailto\:asha@citizen.local))

RBAC Matrix (examples):

- **SuperAdmin:** all permissions.
- **Admin:** manage users/roles, departments, taxonomy; read everything; update settings.
- **Analyst:** read submissions/cases, export data, view analytics; cannot edit users.
- **Moderator:** review queue (approve/reject/redact/merge), tag edits.
- **DeptOfficer:** view assigned cases, change state, add resolution note, notify citizen.
- **Citizen:** create submissions, view own submissions/polls only (via mobile API).

---

## 4) API surface (for mobile + admin)

Implement and document the following REST endpoints (JSON). Use plural nouns, JWT bearer auth where required. Provide examples in OpenAPI and sample `curl` in README.

### Auth

- `POST /auth/register` – citizen self‑register (email or phone).
- `POST /auth/login` – returns access & refresh tokens.
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/request-otp` and `POST /auth/verify-otp` (stubbed provider).
- `POST /auth/change-password`
- `POST /auth/enable-mfa` / `POST /auth/verify-mfa` (stub)

### Users & roles (admin‑only)

- `GET /users` (filters: role, active, q)
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id` (activate/deactivate, assign roles)
- `DELETE /users/:id` (soft delete)
- `GET /roles` / `POST /roles` / `PATCH /roles/:id`
- `GET /permissions`

### Departments & taxonomy

- `GET /departments` / `POST /departments` / `PATCH /departments/:id`
- `GET /topics` / `POST /topics` / `PATCH /topics/:id`

### Submissions (citizen + staff)

- `POST /submissions` – create (text + optional media URLs); public/citizen scope.
- `GET /submissions` – staff only, filters: status, province, tag, channel, date.
- `GET /submissions/:id`
- `PATCH /submissions/:id` – moderator actions: approve/reject/redact/merge.

### Cases (officers)

- `POST /cases` – create from a submission (usually server‑side after routing).
- `GET /cases` – filters: state, department, assignee, dueBefore.
- `GET /cases/:id`
- `PATCH /cases/:id` – change state, add resolution\_note, reassign.

### Polls & votes

- `GET /polls` (citizen visible)
- `POST /polls` / `PATCH /polls/:id` (admin)
- `POST /polls/:id/votes` (citizen)

### Notifications & profile

- `GET /me` – current user profile
- `PATCH /me` – language, province
- `GET /notifications` / `PATCH /notifications/:id` (mark read)

### Analytics (admin/analyst)

- `GET /analytics/summary?range=7d|30d` – totals, unique participants, top tags, sentiment.
- `GET /analytics/trends` – time series.

### Webhooks (stubs for future integrations)

- `POST /webhooks/whatsapp`
- `POST /webhooks/social`

### Admin utilities

- `POST /admin/seeds/reset` – reseed demo data (dev only).
- `GET /healthz`

**Note:** Return standard error shapes: `{ error: { code, message, details? } }`.

---

## 5) OpenAPI examples (include in generated `openapi.yaml`)

Schemas: `User`, `Role`, `Department`, `TopicTag`, `Submission`, `Case`, `Poll`, `Vote`, `Notification`, `AuthLoginRequest`, `AuthLoginResponse`, `ErrorResponse`.

Example: `POST /auth/login`

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/AuthLoginRequest'
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/AuthLoginResponse'
  '401':
    description: Unauthorized
```

Example: `Submission` schema

```yaml
Submission:
  type: object
  required: [id, text, status, createdAt]
  properties:
    id: { type: string, format: uuid }
    userId: { type: string, nullable: true }
    channel: { type: string, enum: [mobile, web, whatsapp, social] }
    text: { type: string }
    media_urls: { type: array, items: { type: string, format: uri } }
    language_detected: { type: string }
    province: { type: string }
    sentiment: { type: number, minimum: -1, maximum: 1 }
    toxicity: { type: boolean }
    tags: { type: array, items: { $ref: '#/components/schemas/TopicTag' } }
    status: { type: string, enum: [new, moderated, routed, in_progress, resolved, declined] }
    createdAt: { type: string, format: date-time }
```

---

## 6) Admin UI requirements (`/admin`)

- **Stack:** React + Vite + TypeScript + **Tailwind** + **shadcn/ui** (or Mantine) + React Router + React Query.
- **Auth:** JWT login, role‑aware routing/menus; session refresh.
- **Layout:** Sidebar with sections → Dashboard, Submissions, Cases, Analytics, Departments, Taxonomy, Users & Roles, Polls, Settings, Audit.
- **Components/pages:**
  - Dashboard: KPI tiles, charts (submissions over time, sentiment, SLA status), province filter.
  - Submissions: table with filters, bulk actions (approve/merge), detail drawer with AI tags + moderation actions.
  - Cases: inbox by department with SLA badges (on‑track/at‑risk/overdue); detail page with timeline and resolution.
  - Users & Roles: CRUD, assign roles, activate/deactivate, reset password, MFA toggle.
  - Departments: CRUD + SLA.
  - Taxonomy: tree editor with drag‑drop; link topics to departments.
  - Polls: create/edit, results.
  - Settings: languages, retention, email templates.
  - Audit Log: filterable table.
- **UX:** Empty states, loading/skeletons, error toasts, optimistic updates.

---

## 7) Seed/dummy data (use Prisma seed script)

Create realistic SA‑flavoured seed data:

- **Departments (12)** with SLAs: Health (72h), Transport (120h), Education (96h), Safety & Security (120h), Housing & Land (144h), Energy (168h), Environment (168h), Governance & Service Delivery (120h), Social Development (120h), Economy & Jobs (96h), Youth & Skills (96h), Digital & Innovation (96h).
- **TopicTag taxonomy** with top‑level + 3–5 sub‑tags each.
- **Users:** personas above plus \~20 staff across departments; 50 citizens.
- **Submissions:** 200 across provinces/languages with sentiments and tags (randomized but coherent). Some flagged `toxicity=true` for moderation demo.
- **Cases:** Create \~60 from submissions with varied states and due dates.
- **Polls:** 3 active with results; **Votes:** \~500 randomized.
- **Notifications:** 100 mixed read/unread.

Provide a JSON export under `/server/seed/` for transparency.

---

## 8) Environment & scripts

`.env.example` keys:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/ndialogue
JWT_SECRET=change_me
REFRESH_SECRET=change_me_too
CORS_ORIGINS=https://admin.local,https://mobile.local,http://localhost:5173
OTP_PROVIDER=mock
```

Scripts (root + workspace scripts):

- `npm run dev` – concurrently runs server and admin.
- `npm run db:migrate` – Prisma migrate.
- `npm run db:seed` – seed data.
- `npm run test` – run unit/API tests.

---

## 9) Acceptance criteria

- OpenAPI served at `/docs` and `openapi.yaml` generated in repo.
- All endpoints above implemented with auth, validation, and RBAC.
- Admin UI can login as any persona and perform permitted actions.
- Seed script completes with no errors; login creds documented in README (dev only).
- Basic tests for auth, submissions CRUD, case state transition, and RBAC guards.
- CI task (optional) that runs `db:migrate`, `db:seed`, and tests.

---

## 10) Nice‑to‑haves (if time allows)

- File storage abstraction (local → S3 compatible later).
- WebSocket/SSE for case status live updates.
- Background worker (BullMQ) for routing + notifications.
- Feature flags for experimental AI fields.

---

### End of prompt

