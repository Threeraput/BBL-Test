# BBL Test — Private Bookmark Manager

A fullstack private read-later application (Backend API + Frontend SPA). Authenticated users can manage their own bookmarks and collections; data belonging to other users must never be accessible or disclosed.

> **Current status:** Both the NestJS Backend API (`backend/`) and the React + Vite + MUI Frontend (`frontend/`) are fully implemented, tested, and integrated.

## Features

- Auth0/OIDC authentication that accepts only an API-scoped **access token**.
- JWT signature, issuer, audience, and expiry validation through the Auth0 discovery document and JWKS.
- Strict memory-only token storage on the frontend (`cacheLocation: "memory"`, no `localStorage`).
- Automatic database provisioning of a user on `GET /users/me`.
- CRUD operations for collections and bookmarks with MUI v9 UI cards & modals.
- Bookmark filtering by collection through `?collectionId=` and nested `/collections/:id/bookmarks` endpoint.
- Every query is scoped by `ownerId`; attempts to access another user's data return `404`.
- Prevents assigning a bookmark to a collection owned by another user.
- Automated GitHub Actions CI/CD pipeline building and testing on every push.

## Technology

- Node.js / TypeScript / NestJS
- React / Vite / MUI v9 / React Router v8
- PostgreSQL + Prisma ORM
- Auth0 OIDC and JWT validation with `jose`
- Jest + Supertest

## Getting started

You need Node.js, npm, and a running PostgreSQL instance.

### 1. Backend Setup

```bash
cd backend
npm ci
```

Create `backend/.env` with the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=3001
```

Generate the Prisma client and apply the migrations included in the repository:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the API in development mode:

```bash
npm run start:dev
```

By default, the API listens on `http://localhost:3001`.

### 2. Frontend Setup

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

Start the frontend development server:

```bash
npm run dev
```

By default, the web application runs on `http://localhost:3000`.

## Authentication

All endpoints that access user data require this header:

```http
Authorization: Bearer <access_token>
```

Any connected frontend should use the Authorization Code flow with PKCE (S256) through Auth0 and request an access token for the `https://bbl-candidate-test-api` audience. An ID token cannot be used in its place.

The API reads the issuer, JWKS URI, and userinfo endpoint from the Auth0 discovery document at runtime, supporting key rotation and tenant configuration changes.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/users/me` | Retrieve or provision the current user |
| GET | `/collections` | List the user's collections |
| POST | `/collections` | Create a collection (`{ "name": "..." }`) |
| GET | `/collections/:id` | Retrieve a collection |
| PUT/PATCH | `/collections/:id` | Update a collection |
| DELETE | `/collections/:id` | Delete a collection (`204`) |
| GET | `/collections/:id/bookmarks` | List bookmarks in a collection |
| GET | `/bookmarks?collectionId=:id` | List bookmarks, optionally filtered by collection |
| POST | `/bookmarks` | Create a bookmark |
| GET | `/bookmarks/:id` | Retrieve a bookmark |
| PUT/PATCH | `/bookmarks/:id` | Update a bookmark |
| DELETE | `/bookmarks/:id` | Delete a bookmark (`204`) |

Example request body for creating a bookmark:

```json
{
  "url": "https://example.com/article",
  "title": "An article to read",
  "notes": "optional note",
  "collectionId": "optional-collection-uuid"
}
```

`collectionId` is optional. When supplied, it must belong to the authenticated user. Deleting a collection leaves its bookmarks uncategorised (`collectionId = null`).

## Common commands

Run these commands from `backend/`:

```bash
npm run build        # Build the production bundle
npm test             # Run unit tests
npm run test:cov     # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
npm run lint         # Lint and apply automatic fixes
```

Run these commands from `frontend/`:

```bash
npm run dev          # Start Vite dev server
npm run build        # Typecheck and build production bundle
npm run preview      # Preview production build locally
```

## Repository structure

```text
.github/
  workflows/ci.yml    # GitHub Actions CI/CD pipeline
backend/
  prisma/             # PostgreSQL schema and migrations
  src/auth/           # Auth0 discovery, JWKS, and Nest guard
  src/users/          # /users/me endpoint and user provisioning
  src/collections/    # Collection CRUD and nested bookmarks endpoint
  src/bookmarks/      # Bookmark CRUD and collection filter
  test/               # End-to-end test configuration
frontend/
  src/api/            # API client wrapper and resource services
  src/auth/           # Auth0 React Provider (memory storage)
  src/hooks/          # Custom hooks (useCollections, useBookmarks)
  src/layout/         # MUI Sidebar and main Layout components
  src/pages/          # Login, Collections, and Bookmarks pages
transcripts/          # Test reports and conversation logs
API_DESIGN.md         # API and token-validation design notes
DECISIONS.md          # Architectural decision log
SPEC.md               # Original project requirements
AI_WORKFLOW.md        # AI-assisted development workflow log
```

## Further documentation

- [API design](API_DESIGN.md)
- [Design decisions](DECISIONS.md)
- [Project specification](SPEC.md)
- [AI Workflow Log](AI_WORKFLOW.md)
- [Adversarial Security Test Report](transcripts/privacy-adversarial-test-report.md)
- [Collection Navigation & API Report](transcripts/collection-navigation-and-nested-api-report.md)
- [Full Conversation Transcript](transcripts/full-conversation-transcript.md)
