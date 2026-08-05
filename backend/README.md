# BBL Bookmark Manager — Backend API

NestJS + Prisma backend service for the Private Bookmark Manager application.

---

## 🔒 Security Architecture

- **Auth0 OIDC Validation:** Verifies JWT signatures dynamically against Auth0's JWKS using `jose`. Checks `iss`, `aud`, and `exp` claims atomically.
- **Row-Level Owner Isolation:** Every query on `Collection` and `Bookmark` models filters by `{ id, ownerId }`.
- **Privacy Leak Prevention:** Cross-user resource access attempts return `HTTP 404 Not Found` (never 403) to prevent ID probing.
- **Cross-Resource IDOR Protection:** Verifies caller ownership of `collectionId` before creating or updating linked bookmarks.

---

## 🛠️ API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Retrieve or provision authenticated user |
| GET | `/collections` | List collections for caller |
| POST | `/collections` | Create a collection (`{ "name": "..." }`) |
| GET | `/collections/:id` | Get collection by ID |
| PATCH | `/collections/:id` | Update collection name |
| DELETE | `/collections/:id` | Delete collection (`204 No Content`) |
| GET | `/collections/:id/bookmarks` | List bookmarks within a specific collection |
| GET | `/bookmarks` | List all bookmarks for caller |
| POST | `/bookmarks` | Create a bookmark |
| GET | `/bookmarks/:id` | Get bookmark by ID |
| PATCH | `/bookmarks/:id` | Update bookmark fields |
| DELETE | `/bookmarks/:id` | Delete bookmark (`204 No Content`) |

---

## ⚙️ Development Commands

Run from `backend/`:

```bash
npm run start:dev   # Start dev server with hot reload (Port 3001)
npm run build       # Build production NestJS bundle
npm test            # Run all 82 Jest unit/integration tests
npm run test:cov    # Generate test coverage report
npm run lint        # Run ESLint check & fix
```
