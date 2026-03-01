# SaaS File Management System — Backend

A production-ready, **highly scalable REST API** for a SaaS File Management System built with **Node.js**, **Express 5**, **TypeScript**, and **Prisma 7** on **PostgreSQL**. The backend enforces subscription-based storage and file limits, handles Cloudinary-backed file uploads, processes Stripe payments and webhooks, and exposes a full OpenAPI 3.0 (Swagger) reference.

**Live API:** [https://filesys-server.onrender.com](https://filesys-server.onrender.com)  
**API Docs (Swagger UI):** [https://filesys-server.onrender.com/api-docs](https://filesys-server.onrender.com/api-docs)

---

## 🏗 Architecture Overview

The project follows a **Layered Modular Architecture** designed for maintainability and horizontal scalability.

```
Request → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Modular Design** — Every feature is self-contained in its own module under `src/modules/`.
- **Controller Layer** — Handles HTTP parsing, input validation (Zod), and delegates to the service layer.
- **Service Layer** — Orchestrates business logic, enforces subscription limits, and coordinates external services (Cloudinary, Stripe, Brevo).
- **Repository Layer** — Encapsulates all Prisma database queries; services never access the database directly.
- **Infrastructure** — Centralized Winston/Morgan logging, global error handling, and security middlewares.

---

## 📁 Folder Structure

```
server/
├── prisma/
│   ├── schema.prisma         # Prisma data models (User, Folder, File, SubscriptionPackage, etc.)
│   ├── seed.ts               # Database seeder (admin user + default packages)
│   └── migrations/           # Prisma migration history
├── scripts/
│   └── deploy.sh             # Production database migration script (run on container start)
├── src/
│   ├── app.ts                # Express app setup: middlewares, routes, Swagger, error handler
│   ├── server.ts             # Server entry point & database connection
│   ├── routes.ts             # Central API router
│   ├── config/               # Centralized config loader (env, Swagger spec, Prisma client)
│   ├── constants/            # Enums and system constants (Roles, tier defaults)
│   ├── middlewares/          # Auth (JWT), RBAC, upload (Multer), error handler
│   ├── modules/
│   │   ├── auth/             # Registration, login, logout, email verification, password reset
│   │   ├── user/             # User profile read & update
│   │   ├── admin/            # Admin-only user listing & management
│   │   ├── package/          # Subscription package CRUD (Admin)
│   │   ├── payment/          # Stripe checkout, webhook handler, billing portal
│   │   ├── folder/           # Folder CRUD with nesting depth enforcement
│   │   ├── file/             # File upload (Cloudinary), metadata CRUD, signed URL generation
│   │   └── email/            # Brevo transactional email service
│   ├── types/                # Shared TypeScript types & Express augmentations
│   └── utils/                # AppError, response helpers, Winston logger
├── Dockerfile                # Multi-stage Docker image (Node 20 Alpine + pnpm)
├── docker-compose.yml        # Local dev stack (API + PostgreSQL 15)
└── .env.example              # Environment variable reference
```

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js 20 |
| **Framework** | [Express.js 5](https://expressjs.com/) with TypeScript (Strict Mode) |
| **ORM** | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| **Database** | PostgreSQL 15 |
| **API Docs** | [Swagger UI](https://swagger.io/) (OpenAPI 3.0 via `swagger-jsdoc`) |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Auth** | JWT (`jsonwebtoken`) — access + refresh token rotation |
| **File Storage** | [Cloudinary](https://cloudinary.com/) (signed upload URLs via Multer) |
| **Payments** | [Stripe](https://stripe.com/) — subscriptions, webhooks, billing portal |
| **Email** | [Brevo](https://brevo.com/) (SMTP) — email verification & password reset |
| **Logging** | [Winston](https://github.com/winstonjs/winston) + [Morgan](https://github.com/expressjs/morgan) |
| **Security** | Helmet, CORS, express-rate-limit, bcrypt, cookie-parser |

---

## 🗄 Database Schema

The Prisma schema defines the following core models:

| Model | Description |
| :--- | :--- |
| `User` | Platform user with role (`USER` / `ADMIN`), Stripe customer ID, and verification status |
| `SubscriptionPackage` | Admin-defined plans with storage limits, max folders, nesting depth, file types, and Stripe price ID |
| `UserSubscriptionHistory` | Subscription lifecycle tracking (active plan, Stripe subscription ID, payment status) |
| `Folder` | Nested folder tree with configurable depth enforcement per subscription |
| `File` | File metadata including MIME type, size (BigInt), Cloudinary `s3Key`, and parent folder reference |

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js** v20+
- **PostgreSQL** database (local or cloud)
- **pnpm** (`npm install -g pnpm`) — recommended, or use `npm`

### 2. Clone the Repository
```bash
git clone https://github.com/jsdevrazuislam/filesys-server
cd filesys-server
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in all values:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/file_system_db

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Brevo SMTP)
SMTP_TOKEN=brevo_smtp_token

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISH_KEY=your_stripe_publish_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook

# CORS — comma-separated list of allowed origins
CLIENT_URL=http://localhost:3000,https://filesys-client.vercel.app
```

### 4. Install Dependencies
```bash
pnpm install
# or
npm install --legacy-peer-deps
```

### 5. Database Setup
```bash
# Generate Prisma Client
pnpm run prisma:generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database with default packages and admin user
pnpm run seed
```

### 6. Run Development Server
```bash
pnpm run dev
```

The API will be available at `http://localhost:5000`.  
Swagger docs: `http://localhost:5000/api-docs`

---

## 📖 API Reference

Interactive API documentation is available via Swagger UI:

- **Local:** `http://localhost:5000/api-docs`
- **Production:** [https://filesys-server.onrender.com/api-docs](https://filesys-server.onrender.com/api-docs)

### API Endpoint Summary

| Module | Base Path | Description |
| :--- | :--- | :--- |
| Auth | `/api/auth` | Register, login, logout, email verification, password reset |
| User | `/api/user` | Get and update authenticated user profile |
| Admin | `/api/admin` | Admin-only user listing and management |
| Packages | `/api/packages` | Subscription package CRUD (Admin) |
| Payments | `/api/payments` | Stripe checkout session, webhook, billing portal |
| Folders | `/api/folders` | Folder create, read, update, delete (subscription-enforced) |
| Files | `/api/files` | File upload, list, retrieve, delete, signed URL generation |

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Starts development server with hot reload (`ts-node-dev`) |
| `pnpm run build` | Compiles TypeScript to JavaScript in `dist/` |
| `npm run start` | Starts the compiled production server |
| `pnpm run seed` | Seeds the database with default packages and admin account |
| `pnpm run db:clear` | Clears the database (development only) |
| `pnpm run lint` | Runs ESLint across all `src/**/*.ts` files |
| `pnpm run lint:fix` | Auto-fixes ESLint violations |
| `pnpm run format` | Formats all source files with Prettier |
| `pnpm run prisma:generate` | Regenerates the Prisma Client from schema |
| `pnpm run prisma:studio` | Opens Prisma Studio for database inspection |

---

## 🛡 Code Quality Standards

- **Strict TypeScript** — No `any` types. `noImplicitAny`, `strictNullChecks`, and all strict-mode flags are enforced.
- **ESLint** — `@typescript-eslint` parser with `eslint-plugin-prettier`, `eslint-plugin-simple-import-sort`, and `@eslint-community/eslint-plugin-eslint-comments`. No `eslint-disable` directives permitted.
- **Prettier** — Code formatting enforced via the ESLint Prettier integration.
- **Centralized Logging** — All HTTP traffic and application events are handled by **Winston** (file + console transports). No `console.log` in production code.
- **Pre-commit Hooks** — Husky + lint-staged run ESLint (with auto-fix) and Prettier on staged `.ts` files before every commit.
- **Conventional Commits** — `commitlint` enforces conventional commit spec on every commit message.

---

## 🔄 CI/CD Pipeline

Automated via **GitHub Actions** on every push and pull request to `main`, `master`, and `develop` branches.

**Pipeline steps (Node.js 20.x & 22.x matrix):**
1. Checkout code
2. Install dependencies (`npm install --legacy-peer-deps`)
3. Generate Prisma Client (`npm run prisma:generate`)
4. Type check (`npx tsc --noEmit`)
5. Lint (`npm run lint`)
6. Build (`npm run build`)

---

## 🐳 Docker

The project includes a production-ready multi-stage Docker setup.

### Run with Docker Compose (API + PostgreSQL 15)
```bash
# Copy and configure your env file first
cp .env.example .env

docker-compose up --build
```

The API will be available at `http://localhost:5000`.

### Build Image Manually
```bash
docker build --build-arg DATABASE_URL=<your_db_url> -t filesys-backend .
```

---

## 🚀 Deployment

The backend is deployed on **[Render](https://render.com/)** using the Docker image.

- **Live API:** [https://filesys-server.onrender.com](https://filesys-server.onrender.com)
- Set all environment variables listed in `.env.example` in your Render service settings.
- The `scripts/deploy.sh` script runs `prisma migrate deploy` automatically on container startup.
