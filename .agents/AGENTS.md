# Workspace Rules for BBL Bookmark Manager

This file defines project-scoped behavioral rules and security constraints for AI coding agents working in this repository.

---

## 1. Non-Negotiable Security Invariant (Privacy Model)

> **Core Rule:** Every record belongs to exactly one owner (`ownerId`). A user must **never** see, modify, delete, or learn of the existence of another user's data.

- **Prisma Ownership Filter:** Every query touching `Collection` or `Bookmark` MUST filter by the authenticated user's ID (`ownerId`), not just by the record's ID.
  - **Do NOT use:** `findUnique({ where: { id } })` for user-owned resources.
  - **ALWAYS use:** `findFirst({ where: { id, ownerId: userId } })` or equivalent scoped queries.
- **Privacy Leak Prevention (404 vs 403):** When a record is not found OR belongs to another user, return **`404 Not Found`**, never `403 Forbidden`. A 403 response leaks information by confirming record existence.
- **Defense in Depth:** `ownerId` is stored directly on both `Collection` and `Bookmark` models. Do not simplify or remove `ownerId` from either model.
- **Cross-Resource Ownership:** When creating or updating a Bookmark linked to a `collectionId`, verify that the caller also owns that `collectionId` before saving.

---

## 2. Technical Stack Conventions

### Backend (NestJS + TypeScript + Prisma)
- **Module Structure:** Follow module-per-resource (`collections/`, `bookmarks/`, `auth/`, `users/`).
- **Prisma:** Schema at `backend/prisma/schema.prisma`. Run migrations via `npx prisma migrate dev`. Never hand-edit the generated client.
- **JWT Validation:** Verify JWT signature dynamically against Auth0 JWKS. Verify `iss` and `aud` claims. Audience must match `https://bbl-candidate-test-api`. Reject `id_token` as Bearer credentials (accept access tokens only).
- **User Provisioning:** Automatically upsert a `User` row keyed by the token's `sub` claim on the first authenticated request.
- **DB Filtering:** All list endpoints must filter at the Prisma `where` clause level, not in-memory in JavaScript.

### Frontend (React + Vite + MUI v9 + React Router v8)
- **No Next.js:** Use Vite + React Router v8 (data router API).
- **UI Components:** Use MUI v9 for all components.
- **Auth Storage:** Use PKCE flow for Auth0. Store tokens in **memory (React state/context)** only. Never store tokens in `localStorage`, `sessionStorage`, `cookies`, or `IndexedDB`.

---

## 3. Testing Requirements

Every API endpoint must have at minimum:
1. **Happy-path test:** Authenticated owner successfully performs the operation.
2. **Adversarial test:** A second user attempts the same operation on the first user's resource ID $\rightarrow$ expects **HTTP 404**.
3. **Unauthenticated test:** Invalid / missing / wrong audience token $\rightarrow$ expects **HTTP 401**.

---

## 4. Documentation Discipline

- **Architecture Decision Records:** Log any non-trivial design decisions or trade-offs in `DECISIONS.md`.
- **AI Log Updates:** Keep track of major AI-assisted changes or bug fixes in `AI_WORKFLOW.md`.
