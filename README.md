# SaaS File Management System - Backend

A production-ready, highly scalable backend for a SaaS File Management System built with Node.js, Express, TypeScript, and Prisma ORM.

## 🚀 Architecture Overview

This project follows a **Layered Modular Architecture** designed for maintainability and horizontal scalability.

- **Modular Design**: Features are encapsulated within their own modules under `src/modules/`.
- **Layered Structure**:
  - **Controller**: Handles HTTP requests, input validation, and invokes services.
  - **Service**: Orchestrates business logic and enforces subscription limits.
  - **Repository**: Encapsulates Prisma queries for database interaction.
- **Infrastructure**: Centralized logging, global error handling, and security middlewares.

## 📁 Folder Structure

```
src/
├── config/           # Centralized configurations (DB, Swagger, Env)
├── constants/        # Enums and system constants (Roles, Tier limits)
├── middlewares/      # Security, Auth, RBAC, and Error Handlers
├── modules/          # Feature-based modular architecture
│   ├── auth/         # Authentication logic (JWT, Refresh tokens)
│   ├── user/         # User profile and management
│   ├── subscription/ # Plans and limit enforcement logic
│   ├── folder/       # Folder management CRUD and nesting logic
│   └── file/         # File metadata and storage orchestration
├── utils/            # Utilities (Logger, AppError, Response helpers)
├── app.ts            # Express application setup & middleware wiring
└── server.ts         # Server entry point & DB connection
prisma/
├── schema.prisma     # Prisma data models and indexes
└── schema.sql        # (Optional) SQL migrations
```

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript (Strict Mode)
- **ORM**: Prisma 7 (PostgreSQL)
- **API Documentation**: Swagger (OpenAPI 3.0)
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Security**: JWT, Helmet, CORS, Express-Rate-Limit

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 3. Installation
```bash
npm install
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 📖 API Documentation

The API is documented using Swagger. Once the server is running, you can access the interactive documentation at:

`http://localhost:5000/api-docs`

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts development server with hot reload |
| `npm run build` | Compiles TypeScript to JavaScript (Dist) |
| `npm run lint` | Runs ESLint to check for code quality |
| `npm run lint:fix` | Automatically fixes common linting errors |
| `npm run format`| Formats code using Prettier |

## 🛡 Code Quality Standards

- **Strict Type Enforcement**: No `any` types allowed. Configuration includes `noImplicitAny`, `strictNullChecks`, etc.
- **ESLint & Prettier**: Enforced via pre-commit hooks. No `eslint-disable` allowed.
- **Import Sorting**: Automated import sorting for consistency.
- **Centralized Logging**: All logs managed by Winston; no `console.log` in production-ready code.
- **CI/CD**: Automated GitHub Actions pipeline for every Push and PR (Type Check, Lint, Build).

## 🚀 Development Workflow

1. **Local Dev**: `npm run dev`
2. **Linting**: Checked automatically on commit. Manual check: `npm run lint`
3. **Type Checking**: Manual check: `npx tsc --noEmit`
4. **Pre-commit Hooks**: Enforced using Husky and lint-staged.

## 📦 Deployment Notes

- Build the project: `npm run build`
- Start production server: `npm start`
- Ensure all environment variables are set in the production environment.


