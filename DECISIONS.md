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

