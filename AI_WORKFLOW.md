# AI Workflow Log

This file documents how GitHub Copilot (Claude Sonnet 4.6) was used throughout this project.
It is honest about what the AI did, what I directed, and where I caught and corrected mistakes.

---

## Tool & Model

- **Tool:** GitHub Copilot Chat (VS Code, Agent mode)
- **Model:** Claude Sonnet 4.6
- **Dates:** 2026-08-04 – 2026-08-05

---

## How I used the AI

I used Copilot as a pair programmer, not an autonomous agent. I read every piece of code before accepting it, ran the test suite after each change, and directed the architecture decisions myself. The AI generated code; I reviewed, approved, corrected, and sometimes rejected it.

---

## Phase 1 — Architecture & Auth (2026-08-04)

**What I asked for:**
- Read SPEC.md and summarise which token the API should accept as Bearer credential
- Create JWT auth guard using jose + JWKS, fetching discovery document live from Auth0

**What the AI produced:**
- `auth.service.ts` — verifies signature, iss, aud, exp atomically via `jwtVerify`
- `auth.guard.ts` — extracts Bearer token from header, attaches verified payload to `request.auth`
- `auth.constants.ts`, `auth.types.ts`, `auth.module.ts`
- Unit tests: 4 mocked service tests + 2 guard tests + 1 real integration test

**What I verified manually:**
- Confirmed that rejecting `id_token` works because `aud` mismatch is tested explicitly
- Confirmed discovery document is fetched live (not hardcoded)

**Bugs caught & fixed:**
- Jest config didn't handle jose (ESM module) → I directed the AI to fix `transformIgnorePatterns`
- `fetchDiscoveryDocument()` returned only `{ issuer, jwks_uri }` and dropped `userinfo_endpoint` → I spotted this from the 401 error at runtime and directed the fix

---

## Phase 2 — User Provisioning / GET /me (2026-08-04)

**What I asked for:**
- Implement `UsersService.upsertFromToken()` with defensive email/name extraction
- Fallback to `/userinfo` if claims missing from token payload
- Fetch `userinfo_endpoint` from cached discovery document (no hardcoding)

**What the AI produced:**
- `prisma.service.ts`, `users.service.ts`, `users.controller.ts`, `users.module.ts`
- Tests: happy-path, /userinfo fallback, unauthenticated (HTTP-level supertest)

**Bugs caught & fixed during this phase:**
- Prisma v7 requires `@prisma/adapter-pg` — AI identified this from the startup error I pasted
- `prisma-client` generator with custom output path broke TypeScript imports → reverted to `prisma-client-js`
- `dotenv/config` not loaded at NestJS startup → AI added `import 'dotenv/config'` as first line of `main.ts`
- `@types/jest` not in `tsconfig.json` → AI added `"types": ["jest", "node"]` after I flagged VS Code errors

**Decision I made (AI documented):**
- `GET /me` has no adversarial test by design — endpoint is self-scoped (no resource id in path), documented in DECISIONS.md

---

## Phase 3 — Collections CRUD (2026-08-04)

**What I asked for:**
- Full CRUD with ownership filter on every query
- Tests: happy-path, adversarial (user B uses user A's id → 404), unauthenticated (HTTP 401)

**What the AI produced:**
- `collections.service.ts` — all queries use `findFirst({ where: { id, ownerId } })`
- `collections.controller.ts` — `@UseGuards(AuthGuard)` at class level
- `collections.service.spec.ts`, `collections.controller.spec.ts`

**What I verified:**
- Checked that `findUnique` was never used (would bypass ownership check)
- Confirmed 404 (not 403) response for cross-user access

---

## Phase 4 — Bookmarks CRUD (2026-08-04 – 2026-08-05)

**What I asked for:**
- Full CRUD with ownership filter + `?collectionId` filter support
- `GET /collections/:id/bookmarks` nested route

**What the AI produced:**
- `bookmarks.service.ts`, `bookmarks.controller.ts`, `bookmarks.module.ts`
- Full test suite (happy-path, adversarial, unauthenticated)

---

## Phase 5 — Security Review (2026-08-05)

**What I asked for:**
- Cross-resource IDOR review across all controllers and services

**Finding the AI reported:**
- `BookmarksService.create/replace/patch` did not verify ownership of `collectionId` before saving
- User A could link their bookmark to User B's collection (data integrity violation + side-channel)

**Fix I directed:**
- Add `assertCollectionOwner(collectionId, ownerId)` called before any write that includes `collectionId`
- Add 5 adversarial tests covering the new check

**Other findings (all clean):**
- `GET /collections/:id/bookmarks` — double-scoped, no leak ✅
- `?collectionId` filter — always scoped by `ownerId`, no leak ✅
- Error responses — NestJS defaults, no stack traces in response ✅

**Additional hardening I directed:**
- Added `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `main.ts`

---

## Test Coverage Summary (post Phase 5)

```
Tests: 82 passing | Test Suites: 11
```

| Resource | Happy | Adversarial | Unauth (HTTP) |
|----------|-------|-------------|---------------|
| Auth guard | ✅ | ✅ | ✅ |
| GET /me | ✅ | N/A (documented) | ✅ |
| Collections | ✅ | ✅ | ✅ |
| Bookmarks | ✅ | ✅ (incl. cross-resource collectionId) | ✅ |

---

## Mistakes the AI made that I caught

| Mistake | How I caught it | Fix |
|---------|----------------|-----|
| `userinfo_endpoint` dropped from discovery response | Runtime 401 error when calling GET /me | Added field to return object |
| Prisma generator used non-standard output path | TypeScript build error | Reverted to `prisma-client-js` |
| Prisma v7 needs driver adapter | Runtime startup crash | Install `@prisma/adapter-pg` |
| `dotenv/config` not loaded → `DATABASE_URL` undefined | Runtime DB error | Added import as first line of `main.ts` |
| `@types/jest` missing from tsconfig | VS Code type errors visible in editor | Added to `"types"` array |
| `collections.controller.spec.ts` duplicate declarations | Jest parse error on test run | AI removed duplicate block |
| `bookmarks.service` did not check `collectionId` ownership | Security review I requested | Added `assertCollectionOwner()` |

---

## Decisions I made (AI did not decide these)

- Use jose (not passport-jwt) for JWT validation
- Reject id_token by verifying `aud` claim
- No backend callback/token routes — PKCE is frontend-driven
- Defensive email/name extraction with `/userinfo` fallback
- No collection sharing in v1 (documented trade-off in DECISIONS.md)
- OnDelete: SetNull for bookmark → collection relation (not cascade delete)
- 404 (not 403) for all cross-user access attempts

---

## Phase 6 — Frontend Development, API Integration & Refactoring (2026-08-05)

**What I asked for:**
- Build React + Vite + TypeScript + MUI v9 + React Router v8 frontend pages (`/login`, `/collections`, `/bookmarks`)
- Strict Auth0 PKCE memory-only token storage (`cacheLocation: "memory"`, no `localStorage`)
- Refactor data-fetching layer into dedicated API services (`client.ts`, `collections.ts`, `bookmarks.ts`) and Custom Hooks (`useCollections`, `useBookmarks`)
- Add interaction: Clicking a Collection card navigates to `/bookmarks?collectionId=xxx` using the nested `GET /collections/:id/bookmarks` endpoint
- Run full adversarial security matrix test (6 cross-user isolation checks returning HTTP 404) and log in `transcripts/privacy-adversarial-test-report.md`

**What the AI produced:**
- `src/auth/AuthProvider.tsx`, `src/api/client.ts`, `src/api/collections.ts`, `src/api/bookmarks.ts`
- `src/hooks/useCollections.ts`, `src/hooks/useBookmarks.ts`
- `src/pages/Login.tsx`, `src/pages/Collections.tsx`, `src/pages/Bookmarks.tsx`
- Reports in `transcripts/` (`mui-grid-issue-report.md`, `collection-navigation-and-nested-api-report.md`, `privacy-adversarial-test-report.md`)

**Bugs caught & fixed during this phase:**
- **MUI Grid2 Export Error:** MUI v9 Grid2 export caused bundling crash → Refactored to standard `Grid` layout
- **TS Module Import Error:** Missing `.tsx` extensions in `App.tsx` imports → Added explicit extensions
- **CORS Preflight Blocking:** Backend rejected frontend origin `http://localhost:3000` → Added `app.enableCors()` with allowed origins & methods in `main.ts`
- **ValidationPipe 400 Bad Request:** DTOs lacked `class-validator` decorators, causing `ValidationPipe({ forbidNonWhitelisted: true })` to strip all fields → Added `@IsString()`, `@IsNotEmpty()`, `@IsOptional()` to all DTOs
- **URL Validation Rejection:** `@IsUrl()` rejected valid domains without `http://` → Relaxed backend DTO to `@IsString()` + `@IsNotEmpty()` and added frontend `formatUrl()` helper
- **Form Input Focus Loss:** Nested `<FormFields />` component re-created on every keystroke → Refactored to render function `{renderFormFields()}` to preserve DOM node identity
- **Vite Type-Only Import Crash:** Vite bundling error importing TypeScript interfaces → Added `type` keyword (`import type { Collection }`)

---

## Test Coverage Summary (Final)

```text
Tests: 82 passing | Test Suites: 11
Adversarial Security Matrix: 6/6 PASS (All cross-user attempts return 404 Not Found)
```

| Resource | Happy | Adversarial | Unauth (HTTP) |
|----------|-------|-------------|---------------|
| Auth guard | ✅ | ✅ | ✅ |
| GET /me | ✅ | N/A (documented) | ✅ |
| Collections | ✅ | ✅ | ✅ |
| Bookmarks | ✅ | ✅ (incl. cross-resource collectionId) | ✅ |

---

## Mistakes the AI made that I caught

| Mistake | How I caught it | Fix |
|---------|----------------|-----|
| `userinfo_endpoint` dropped from discovery response | Runtime 401 error when calling GET /me | Added field to return object |
| Prisma generator used non-standard output path | TypeScript build error | Reverted to `prisma-client-js` |
| Prisma v7 needs driver adapter | Runtime startup crash | Install `@prisma/adapter-pg` |
| `dotenv/config` not loaded → `DATABASE_URL` undefined | Runtime DB error | Added import as first line of `main.ts` |
| `@types/jest` missing from tsconfig | VS Code type errors visible in editor | Added to `"types"` array |
| `collections.controller.spec.ts` duplicate declarations | Jest parse error on test run | AI removed duplicate block |
| `bookmarks.service` did not check `collectionId` ownership | Security review I requested | Added `assertCollectionOwner()` |
| MUI `Grid2` component export missing | Client runtime bundling crash | Refactored to standard `Grid` |
| NestJS DTOs lacked validation decorators | HTTP 400 error on POST/PATCH requests | Added `class-validator` decorators |
| Nested `<FormFields />` re-created on render | Text input lost focus on every character typed | Converted to render function `{renderFormFields()}` |

