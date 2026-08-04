# BBL Test — Private Bookmark Manager

A backend API for a private read-later application. Authenticated users can manage their own bookmarks and collections; data belonging to other users must never be accessible or disclosed.

> Current status: this repository contains the backend API in `backend/`. The frontend specified for the project has not yet been implemented.

## Features

- Auth0/OIDC authentication that accepts only an API-scoped **access token**.
- JWT signature, issuer, audience, and expiry validation through the Auth0 discovery document and JWKS.
- Automatic database provisioning of a user on `GET /users/me`.
- CRUD operations for collections and bookmarks.
- Bookmark filtering by collection through `?collectionId=`.
- Every query is scoped by `ownerId`; attempts to access another user's data return `404`.
- Prevents assigning a bookmark to a collection owned by another user.

## Technology

- Node.js / TypeScript / NestJS
- PostgreSQL + Prisma ORM
- Auth0 OIDC and JWT validation with `jose`
- Jest + Supertest

## Getting started

You need Node.js, npm, and a running PostgreSQL instance.

```bash
cd backend
npm ci
```

Create `backend/.env` with the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=3000
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

By default, the API listens on `http://localhost:3000`.

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

## Repository structure

```text
backend/
  prisma/             # PostgreSQL schema and migrations
  src/auth/           # Auth0 discovery, JWKS, and Nest guard
  src/users/          # /users/me endpoint and user provisioning
  src/collections/    # Collection CRUD and nested bookmarks endpoint
  src/bookmarks/      # Bookmark CRUD and collection filter
  test/               # End-to-end test configuration
API_DESIGN.md         # API and token-validation design notes
DECISIONS.md          # Architectural decision log
SPEC.md               # Original project requirements
AI_WORKFLOW.md        # AI-assisted development workflow log
```

## Further documentation

- [API design](API_DESIGN.md)
- [Design decisions](DECISIONS.md)
- [Project specification](SPEC.md)
