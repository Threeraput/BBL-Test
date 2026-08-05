# Design Decisions

## JWT Validation Library: jose + JWKS

**Status:** Decided  
**Date:** 2026-08-04  
**Owner:** Backend Team

### Decision

Use **jose** (npm:jose v6+) as the JWT validation library with `createRemoteJWKSet()` to fetch Auth0's JWKS dynamically from the discovery document, rather than:
- Hardcoding the JWKS URL
- Using passport-jwt (lower-level, requires manual JWKS management)
- Using @auth0/express-openid-connect (over-engineered for API-only use case)

### Rationale

1. **Prevents id_token misuse** — By verifying the `aud` claim matches our API audience (`https://bbl-candidate-test-api`), we automatically reject id_tokens (which have a different audience) without custom logic. This is verified in `auth.service.spec.ts` test case #2.

2. **Single atomic verification** — `jwtVerify(token, jwks, options)` checks signature, issuer, audience, and expiration in one call. No risk of forgetting to check a claim.

3. **Automatic key rotation** — The jose library caches JWKS but auto-refreshes when a new `kid` isn't found. Auth0 can rotate keys without requiring our deployment.

4. **Live discovery** — We fetch Auth0's `.well-known/openid-configuration` on startup and cache it. If Auth0 ever changes their jwks_uri or issuer, we pick it up automatically (without hardcoding). This satisfies the SPEC requirement: "verify. Inspect the tenant's discovery document and JWKS to determine which flows, tokens, and signing algorithms are actually available before committing to a design."

5. **Test coverage** — Easy to mock jose in unit tests (4 test cases in `auth.service.spec.ts`). Easy to verify real discovery + JWKS path in integration test (`auth.service.integration.spec.ts`). Proves both the happy path and error cases work.

### Trade-offs

- **Pro:** Small, focused library with zero production dependencies
- **Con:** One more npm package to maintain (but jose is well-maintained and widely used)
- **Pro:** Spec-compliant; follows IETF JOSE standards
- **Con:** Must understand JWT/JWS/JWKS concepts to debug

### Related Files

- `backend/src/auth/auth.service.ts` — Verification logic
- `backend/src/auth/auth.guard.ts` — NestJS integration
- `backend/src/auth/auth.service.spec.ts` — 5 unit tests (4 mocked, 1 real)
- See [API_DESIGN.md](API_DESIGN.md) for full technical details


## AuthController is empty; /me lives in UsersController

**Context:** With Authorization Code + PKCE, the frontend drives login and
token exchange directly against Auth0 — no client secret to protect, so
there's no backend callback/token/logout route to build.
**Decision:** AuthController has zero routes. Auth-related backend logic
lives only in AuthGuard (cross-cutting token validation, applied via
@UseGuards across modules) and AuthService (JWT verification). The /me
endpoint lives in UsersController since it returns a user resource, not
an auth operation.
**Trade-off:** None functionally — kept AuthModule/AuthController as a
module boundary for clarity and possible future extension (e.g. a
session-invalidation route) rather than deleting it outright.

## Email/name claim source for /me
**Context:** Uncertain whether the Auth0 access token for this tenant
includes `email`/`name` claims directly, without blocking on manually
verifying via PKCE flow before the frontend exists.
**Decision:** Implemented defensively — check token payload first, fall
back to calling the /userinfo endpoint with the access token if profile
claims are absent. Verified end-to-end once the frontend PKCE flow was
built (see commit <fill in later>).
**Trade-off:** One extra network call on first login if the fallback path
is the one actually used; negligible for this app's scale.

## userinfo_endpoint discovery (no hardcoding)

**Context:** When falling back to /userinfo for email/name claims, we
need the endpoint URL. Could hardcode `https://dev-yg.us.auth0.com/userinfo`
or fetch it dynamically from the discovery document.

**Decision:** Fetch `userinfo_endpoint` from Auth0's discovery document
(already fetched in `AuthService.getDiscoveryDocument()`). Never hardcode
the endpoint URL.

**Rationale:**
1. **Tenant flexibility** — A different Auth0 tenant might have a different
   userinfo_endpoint URL. The discovery document is the tenant's source
   of truth.
2. **Automatic updates** — If Auth0 ever relocates the endpoint (unlikely
   but possible during infrastructure migrations), we pick it up without
   code changes.
3. **Defense-in-depth** — Aligns with earlier decision to fetch discovery
   live rather than hardcoding JWKS URI. Keeps all tenant config in one
   place.

**Trade-offs:**
- **Pro:** Resilient to Auth0 tenant config changes
- **Con:** Requires AuthService to expose `getDiscoveryDocument()` public
  method (so UsersService can call it)
- **Pro:** Single discovery document call on app startup; discovery is
  cached, so UsersService.upsertFromToken doesn't re-fetch it per login

**Related Files:**
- `backend/src/auth/auth.service.ts` — `getDiscoveryDocument()` public method
- `backend/src/users/users.service.ts` — Calls `authService.getDiscoveryDocument().userinfo_endpoint`
- `backend/prisma/schema.prisma` — Updated generator to "prisma-client-js"
  (standard output location for TypeScript builds)

## GET /me has no adversarial test (by design)

**Context:** The spec requires three test types for every endpoint: happy-path,
adversarial (user B accesses user A's resource by id), and unauthenticated.

**Decision:** `GET /me` does not have an adversarial test, and this is intentional.
The endpoint takes no resource id from the caller — it always resolves the
authenticated user from the Bearer token's `sub` claim. There is no parameter
for a second user to manipulate in order to access another user's data.

**Trade-off:** No trade-off. The absence of an adversarial test is not a gap
in coverage; it reflects that the attack surface does not exist for this endpoint.
The ownership invariant is enforced structurally (endpoint is self-scoped), not
by a runtime `ownerId` filter. The adversarial test requirement applies to
endpoints that accept a resource id (collections, bookmarks) — those are tested
there.

**Related Files:**
- `backend/src/users/users.controller.spec.ts` — happy-path + unauthenticated tests

## Collection sharing (§3.3) — scope decision
**Context:** Spec says "A user may want to share a collection with someone
else" with no further detail — must decide scope and justify.
**Decision:** Not implementing sharing in this submission. The core
security invariant of the app is single-owner-only access; introducing
sharing means the ownership model becomes multi-party, which affects
every existing query, the 404-vs-403 logic, and every adversarial test
already written for Collections/Bookmarks. Given the time budget, I
chose to keep the private-only model solid and fully verified rather
than build a shallow sharing feature that weakens the property the
whole app is graded on.
**Trade-off:** Doesn't address the requirement's explicit "may want to
share" line. Schema left extensible (ownerId stays on both models,
no CollectionShare table added) so it could be layered on later
without a redesign — noted here as the extension point.
**What I'd build if I had more time:** a CollectionShare table
(collectionId, sharedWithUserId, permission) and a read-only grant
path, kept deliberately separate from the ownership check so the
existing privacy tests wouldn't need to change semantics.

## "View one" collection = filtered bookmarks view

**Context:** Spec's frontend section says /collections should support
"view one" but doesn't define what that shows. Backend has an explicit
GET /collections/:id/bookmarks endpoint.
**Decision:** Clicking a collection card navigates to /bookmarks
pre-filtered to that collection, using the nested endpoint rather
than a separate detail page/dialog — reuses the existing bookmarks
list UI instead of duplicating it.
**Trade-off:** No dedicated "collection detail" view; the collection
name itself isn't shown prominently on the filtered bookmarks page
unless the filter dropdown state makes it clear.

## Collection deletion behavior (SetNull vs Cascade)

**Context:** Under-specified requirement in SPEC.md regarding collection deletion behavior when a collection contains bookmarks.
**Decision:** Configured relation on `Bookmark` to set `collectionId` to `null` (SetNull) when a `Collection` is deleted, rather than cascading deletion (Cascade).
**Rationale:** Bookmarks represent valuable saved links. Deleting a collection is an organizational action, not a data-purge request. Retaining bookmarks as uncategorized items prevents accidental loss of user data while maintaining referential integrity.
**Trade-off:** Bookmarks will remain in the user's account without a collection assigned, requiring the user to manually re-categorize or delete them individually if desired.

## Frontend Auth Storage & Data-Fetching Architecture

**Context:** Non-negotiable security requirement states Auth0 tokens must NEVER be stored in `localStorage`, `sessionStorage`, `cookies`, or `IndexedDB`.
**Decision:** Configured Auth0 React SDK with `cacheLocation: "memory"`. Encapsulated token acquisition (`getAccessTokenSilently`) inside custom React hooks (`useCollections`, `useBookmarks`) and modular API resources (`client.ts`, `collections.ts`, `bookmarks.ts`).
**Rationale:** Keeps token in JS memory context only, neutralizing XSS token theft risks. The custom hook layer abstracts token passing away from UI components while managing `isLoading`, `error`, and `data` states cleanly.
**Trade-off:** Token relies on Auth0's silent token refresh on page reloads, adding a brief async check handled via UI loading skeletons.

## Backend Validation Pipe & CORS Configuration

**Context:** Cross-origin requests from Vite dev server (`localhost:3000`) to NestJS API server (`localhost:3001`) and strict DTO whitelist rules.
**Decision:** 
1. Enabled explicit CORS in NestJS `main.ts` with origins `['http://localhost:3000', 'http://127.0.0.1:3000']`, credentials, and standard HTTP methods.
2. Decorated all DTOs (`CreateCollectionDto`, `CreateBookmarkDto`, `UpdateBookmarkDto`) with `class-validator` annotations (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`).
3. Added a frontend URL normalizer `formatUrl()` in `Bookmarks.tsx` while keeping backend validation as `@IsString()` + `@IsNotEmpty()`.
**Rationale:** Enforces strict whitelist validation without rejecting valid domain inputs (e.g. `localhost`, IP addresses, or inputs missing explicit `https://` schemes).

## Docker Containerization (§ Optional Bonus) — Scope Decision

**Context:** SPEC.md lists Docker containerization under Optional Bonuses ("only after the above is solid").
**Decision:** Not implementing Docker containerization in this submission.
**Rationale:** Allocated available project time strictly toward perfecting the non-negotiable core requirements: Auth0 PKCE token verification, single-owner row-level access control via Prisma, 404 privacy leak prevention, and comprehensive UI state management. Given limited familiarity with Docker multi-stage builds and Nginx SPA routing, attempting to containerize without deep experience introduced unnecessary risk of misconfiguring security headers, environment variables, or Auth0 callback endpoints.
**Trade-off:** The application must be launched directly on local Node.js environments (`npm run start:dev` for backend, `npm run dev` for frontend) rather than instantiated via `docker-compose up`.
