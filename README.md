# BBL Bookmark Manager — Fullstack Web Application

A secure, private read-later bookmark manager built with Node.js/NestJS (Backend) and React/Vite/MUI (Frontend). Authenticated users can manage their private collections and bookmarks. Data belonging to other users is completely isolated and inaccessible (returns 404 Not Found to prevent information disclosure).

---

## 🚀 Features

- **Authentication & Security:** Auth0 OIDC with Authorization Code Flow + PKCE (S256). Tokens are stored strictly in JS memory (`cacheLocation: "memory"`, no `localStorage`).
- **Privacy Model:** Every record is scoped by `ownerId` at the database level. Cross-user access attempts return `404 Not Found` (never `403`) to prevent resource probing.
- **Cross-Resource Protection:** Creating/updating bookmarks with a `collectionId` verifies caller ownership of the target collection.
- **Frontend Pages:**
  - `/login`: Secure OIDC sign-in page.
  - `/collections`: Manage collections (List, Create, Edit, Delete). Clicking a card navigates to `/bookmarks?collectionId=...`.
  - `/bookmarks`: Manage bookmarks (List, Filter by collection, Create, Edit, Delete, Open links).
- **Automated CI/CD:** GitHub Actions workflow running build, linting, typechecking, and Jest tests on every push.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, TypeScript, NestJS, Prisma ORM, PostgreSQL, `jose` (JWKS JWT verification), Jest
- **Frontend:** React, Vite, TypeScript, MUI v9 (Custom Pastel Blue Theme), React Router v8, Auth0 React SDK

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js (v20+)
- PostgreSQL running locally or remotely

### 2. Backend Setup
```bash
cd backend
npm ci
```
Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bbl_bookmarks?schema=public"
PORT=3001
```
Apply migrations and generate Prisma client:
```bash
npx prisma generate
npx prisma migrate deploy
```
Start the backend dev server (Port 3001):
```bash
npm run start:dev
```

### 3. Frontend Setup
```bash
cd frontend
npm ci
```
Create `frontend/.env`:
```env
VITE_AUTH0_DOMAIN=dev-yg.us.auth0.com
VITE_AUTH0_CLIENT_ID=H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA
VITE_AUTH0_AUDIENCE=https://bbl-candidate-test-api
VITE_AUTH0_CALLBACK_URL=http://localhost:3000/callback
VITE_API_BASE_URL=http://localhost:3001
```
Start the frontend dev server (Port 3000):
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

Run backend automated unit & integration test suites (82 passing tests):
```bash
cd backend
npm test
```

Run frontend build check & typecheck:
```bash
cd frontend
npm run build
```

---

## 📚 Documentation & Logs

- [Architecture Decisions (DECISIONS.md)](DECISIONS.md)
- [API Design Specification (API_DESIGN.md)](API_DESIGN.md)
- [AI Workflow Log (AI_WORKFLOW.md)](AI_WORKFLOW.md)
- [Adversarial Security Test Report](transcripts/privacy-adversarial-test-report.md)
- [Collection Navigation & API Report](transcripts/collection-navigation-and-nested-api-report.md)
