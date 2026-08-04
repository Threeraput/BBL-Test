# API Design Document

## Authentication & Authorization

### Why jose + JWKS?

#### Problem Statement

The API must validate JWT tokens from Auth0 in a way that:

1. **Prevents id_token misuse** — A client obtaining an id_token (intended for browser-based UI) must not be able to use it as a Bearer credential for the API
2. **Verifies token authenticity** — Signature must be validated against Auth0's public keys to ensure the token wasn't forged
3. **Enforces audience binding** — The API must only accept tokens that explicitly declare this API as their intended audience
4. **Stays current** — JWKS should be fetched live from Auth0's discovery document, not hardcoded, so the API reflects the tenant's current key rotation

#### Why jose?

**jose** (`npm:jose`) is a battle-tested, spec-compliant JOSE library that:

- ✅ Handles JWS (JWT signature) verification with industry-standard algorithms
- ✅ Provides `createRemoteJWKSet(url)` which:
  - Fetches JWKS from a URL on-demand
  - Caches keys to avoid repeated fetches
  - Auto-refreshes when a new key ID (`kid`) is not found locally
  - Properly handles JWKS Key Management (adding/rotating keys without downtime)
- ✅ Offers `jwtVerify(token, keySet, options)` which validates:
  - Signature (using the correct key from the JWKS)
  - Issuer claim (`iss`) — ensures the token came from Auth0
  - Audience claim (`aud`) — ensures the token was issued *for this API*
  - Expiration (`exp`) — rejects expired tokens
  - All in one atomic call
- ✅ Small, zero-dependency library (no extra npm bloat)

#### Why not passport-jwt or auth0/express-openid-connect?

- **passport-jwt** — Requires manual JWKS fetching and key management; less convenient
- **@auth0/express-openid-connect** — Over-engineered for this use case; designed for full OpenID Connect flows (login redirect, session management), not just API token validation

#### How does this prevent id_token misuse?

The token's `aud` (audience) claim is set by Auth0 when it issues the token:

- **Access token** issued for this API gets `aud: "https://bbl-candidate-test-api"`
- **id_token** issued to the client app gets `aud: "H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA"` (the client ID)

Our guard calls `jwtVerify(token, jwks, { audience: "https://bbl-candidate-test-api" })`.

- If someone tries to use an id_token as Bearer, the `aud` won't match → verification fails → `401 Unauthorized`
- This happens automatically during verification; no custom logic needed

#### Discovery Document Pattern

We fetch Auth0's `.well-known/openid-configuration` once per application startup and cache it:

```
GET https://dev-yg.us.auth0.com/.well-known/openid-configuration
→ issuer: "https://dev-yg.us.auth0.com/"
→ jwks_uri: "https://dev-yg.us.auth0.com/.well-known/jwks.json"
```

Then we use that `jwks_uri` to fetch keys. If Auth0 changes their key location in the future, we pick it up automatically (without code changes).

### Test Coverage

See `backend/src/auth/`:

- **auth.service.spec.ts** — 4 unit tests with mocked jose:
  - Invalid signature → 401
  - Mismatched `aud` (simulated id_token) → 401  ← *Proves id_token is rejected*
  - Expired token → 401
  - Valid token → payload returned
  
- **auth.guard.spec.ts** — 2 unit tests for HTTP layer:
  - Missing Authorization header → 401
  - Non-Bearer scheme → 401

- **auth.service.integration.spec.ts** — 1 integration test (real network):
  - Fetches Auth0's real discovery document
  - Verifies the jwks_uri endpoint is reachable
  - Validates JWKS structure (has `keys` array with > 0 entries)
  - Proves the live validation path works

### Implementation Files

- `backend/src/auth/auth.service.ts` — Manages discovery document caching and token verification
- `backend/src/auth/auth.guard.ts` — NestJS guard that extracts Bearer token and calls service
- `backend/src/auth/auth.types.ts` — Request type with auth metadata
- `backend/src/auth/auth.constants.ts` — Discovery URL and audience constants
- `backend/src/auth/auth.module.ts` — Module export for reuse across controllers

### Security Invariant

Every endpoint that touches user data (`Collections`, `Bookmarks`) **must**:

1. Apply `@UseGuards(AuthGuard)` to ensure a valid access token is present
2. Extract `request.auth.subject` (the Auth0 `sub` claim)
3. Filter all queries by `ownerId: request.auth.subject`

This ensures the privacy invariant: *a user can never see, modify, or learn of another user's data*.

---

## User Provisioning: GET /me

### Overview

When a user logs in via Auth0's Authorization Code + PKCE flow (frontend-driven), they get an access token. The first time they call any API endpoint, the `/me` endpoint auto-provisions them in our database.

### Endpoint

**GET /users/me**

- Required: `Authorization: Bearer {access_token}` header
- Decorators: `@UseGuards(AuthGuard)`, `@Get('me')`
- Response: `{ id: string, email: string, name: string | null, createdAt: Date, updatedAt: Date }`

### User Provisioning Flow

1. Client sends `GET /users/me` with valid access token
2. AuthGuard validates token → attaches `request.auth = { subject, payload, token }`
3. UsersController calls `UsersService.upsertFromToken(payload, rawAccessToken)`
4. Service extracts email/name:
   - **Path A (fast):** Check `payload.email` and `payload.name` — if present, use directly
   - **Path B (fallback):** If either claim missing, call Auth0's `/userinfo` endpoint with the access token
5. Upsert User record (keyed by `sub` claim) with email and name
6. Return user object
7. Console logs which path was used (payload direct vs /userinfo fallback)

### Why Defensive Email/Name Extraction?

We don't know in advance whether this Auth0 tenant's access token includes profile claims (`email`, `name`).

- **If included:** Fast path — use payload claims directly (no extra network call)
- **If missing:** Fallback path — call `/userinfo` endpoint to fetch them

The implementation handles both cases, and console logging shows which path actually occurs in production. This lets us verify the assumption without code changes.

### Why Fetch /userinfo Endpoint URL from Discovery Document?

The `/userinfo` endpoint URL could be hardcoded (`https://dev-yg.us.auth0.com/userinfo`), but we instead fetch it from the cached discovery document:

- **Tenant flexibility** — A different Auth0 tenant might have a different URL
- **Automatic updates** — If Auth0 relocates the endpoint, we pick it up via discovery
- **Defense-in-depth** — Aligns with the discovery-driven approach for JWKS; tenant config lives in one place

### Implementation Files

- `backend/src/users/users.service.ts` — `upsertFromToken(payload, rawAccessToken)` with dual-path email/name extraction
- `backend/src/users/users.controller.ts` — GET /me endpoint with AuthGuard
- `backend/src/users/users.module.ts` — Module registration, imports AuthModule
- `backend/src/prisma.service.ts` — PrismaClient singleton
- `backend/src/app.module.ts` — Imports UsersModule

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for the full invariant definition.

---

## Decisions

All design decisions are logged in [DECISIONS.md](DECISIONS.md).
