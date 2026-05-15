# Internal Announcement & Communication Portal

A full-stack portal where **authors** publish organization-wide announcements and **readers** browse, filter, and acknowledge them. The system tracks per-user read state and explicit acknowledgments, with author-only analytics on engagement.

## Quick setup steps

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
npm run install:all
```



### 2. Database setup

**Always run these from the `server` folder** (or use `npm run db:setup` from the project root):

```bash
cd server
npx prisma migrate dev
npm run db:seed
```

This creates `server/prisma/dev.db` and seeds demo accounts.

**If login fails or you see “database” errors**, reset everything:

```bash
cd server
npm run db:reset
```

Verify the connection:

```bash
cd server
npm run db:check
```

You should see: `OK — connected. Users in database: 2` (or more).

### Prisma Studio (database UI)

Prisma Studio defaults to port **5555**. This project uses **5556** so it does not clash with anything else on 5555.

```bash
cd server
npm run db:studio
```

Then open [http://localhost:5556](http://localhost:5556) in your browser.

To use another port: `npx prisma studio --port 4000`

### 3. Run the app

**Terminal 1 — API (port 5000):**

```bash
cd server
npm run dev
```

**Terminal 2 — UI (port 5173):**

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `author@company.com` | `password123` | AUTHOR |
| `reader@company.com` | `password123` | READER |

New registrations default to **READER**. To promote a user to author, update `role` to `AUTHOR` in the database (e.g. `npx prisma studio`).

---

## Tech stack & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| **API** | Node.js + Express 5 | Fast to build REST endpoints; familiar middleware model |
| **ORM / DB** | Prisma + **SQLite** | Zero external services for reviewers; file persists across restarts; easy local setup |
| **Auth** | JWT (7-day) + **bcrypt** (10 rounds) | Stateless sessions for SPA; passwords never stored in plain text |
| **UI** | React 19 + Vite + Tailwind CSS 4 | Fast HMR, simple component model, utility styling |
| **Routing** | react-router-dom | Protected routes, author-only sections |

SQLite is ideal for a take-home demo. For production, switch the Prisma datasource to PostgreSQL with the same schema.

---

## Architectural overview

```
my_project/
├── server/
│   ├── index.js                 # Express app, CORS, route mounting
│   ├── prisma/
│   │   ├── schema.prisma        # User, Announcement, Read, Acknowledgment
│   │   └── seed.js              # Demo author + reader
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── authorMiddleware.js  # AUTHOR role gate
│   ├── routes/
│   │   ├── authRoutes.js        # register, login, me
│   │   └── announcementRoutes.js
│   └── utils/                   # validation, constants, response shaping
└── client/
    └── src/
        ├── api/client.js        # fetch wrapper + Bearer token
        ├── context/AuthContext.jsx
        ├── components/          # Layout, ProtectedRoute
        └── pages/               # List, Detail, Form, Drafts, Analytics, Auth
```

**Key flows**

- **Publish**: Draft → `PATCH /:id/publish` sets `publishedAt` once.
- **Read**: Opening a published announcement upserts a `Read` row.
- **Acknowledge**: Explicit `POST /:id/acknowledge` (idempotent); required when `requiresAck` is true.
- **List**: Combinable filters, case-insensitive title search (SQLite `LOWER`), pinned-first sort, pagination.

---

## How AI tools were used

ChatGPT and Claude was used to assist in designing the full-stack architecture, generating backend API structures, Prisma schemas, authentication flows, and React frontend components based on the assignment requirements.

AI-assisted code generation was carefully reviewed and customized for:

role-based access control (AUTHOR / READER),
secure JWT authentication,
announcement lifecycle management (draft, publish, archive),
read tracking,
idempotent acknowledgment handling,
analytics generation,
filtering, sorting, and pagination logic.

Hand-edited and customized areas included:

frontend UI styling using Tailwind CSS glassmorphism design,
dashboard interactions,
API integration with Axios,
protected routes,
Prisma migrations,
debugging runtime issues,
role handling workflows,
project structure organization,
README/documentation updates.

A notable implementation challenge involved handling advanced filtering and frontend-backend synchronization during search and pagination workflows, which required refining Prisma query conditions and React state management for stable real-time updates.

---

## Assumptions

- Single organization (no multi-tenancy).
- All registered users are employees; “pending acknowledgment” = all users minus those who acknowledged.
- Authors are created via **seed** or manual DB update; registration does not auto-grant author.
- JWT in `localStorage` is acceptable for this demo (not production-hardened).
- Plain-text announcement bodies (no rich text or attachments).

---

## Trade-offs (6-hour budget)

- **SQLite** instead of Postgres — simpler ops, sufficient for hundreds of announcements.
- **JWT** instead of server sessions — less infrastructure; logout is client-side token removal.
- **Minimal UI polish** — focus on correct flows over design system.
- No real-time updates, email notifications, or CSV export.
- No automated test suite.

---

## Future work

- Postgres + connection pooling for production
- httpOnly cookie sessions
- Email notifications for ack-required posts
- CSV export of acknowledgment lists
- Markdown rendering for bodies
- Admin UI to promote readers to authors
- Docker Compose for one-command startup

---

## API summary (authenticated unless noted)

| Method | Path | Description |
|--------|------|-------------|
| POST | `http://localhost:5000/api/auth/register` | Register (public) |
| POST | `http://localhost:5000/api/auth/register` | Login (public) |
| GET | `/api/announcements` | Paginated list + filters |
| GET | `/api/announcements/mine/drafts` | Author drafts |
| POST | `/api/announcements` | Create draft (author) |
| GET | `/api/announcements/:id` | Detail + record read |
| PUT | `/api/announcements/:id` | Edit draft (author) |
| PATCH | `/api/announcements/:id/publish` | Publish draft |
| PATCH | `/api/announcements/:id/archive` | Archive published |
| POST | `/api/announcements/:id/acknowledge` | Acknowledge |
| GET | `/api/announcements/:id/analytics` | Author analytics |

List query params: `page`, `pageSize`, `status`, `category`, `requiresAck`, `unread`, `unacknowledged`, `search`, `sortBy`, `sortOrder`.
