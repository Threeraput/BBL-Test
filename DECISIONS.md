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
