— agent rules for this project

This file is read by any coding agent (Claude Code, Copilot, etc.) working in this repo. Read this fully before writing or editing any code.

What this project is

A private bookmark manager with two services:

/backend — NestJS + TypeScript API, Prisma ORM, PostgreSQL
/frontend — React + Vite + TypeScript, MUI v9, React Router v8

Auth: OIDC via Auth0, Authorization Code flow + PKCE (S256). No implicit flow, ever.

This is a take-home test for Bangkok Bank. The grading criteria weight security correctness, test coverage, and documented reasoning far above "the app runs." Treat every instruction below as a hard constraint, not a suggestion — deviations must be flagged to the user, not silently made.

Non-negotiable security invariant

Every record belongs to exactly one owner. A user must never see, modify, delete, or learn of the existence of another user's data.

This means:

Every Prisma query touching Collection or Bookmark MUST filter by the authenticated user's id (ownerId), not just by the record's own id.
Never write findUnique({ where: { id } }) for a user-owned resource. Always findFirst({ where: { id, ownerId: userId } }) or equivalent.
When a record isn't found or belongs to another user, return 404, not 403. A 403 confirms the record exists — that itself leaks information under this app's privacy model. Do not "helpfully" distinguish the two cases in the response.
ownerId is stored directly on both Collection and Bookmark (not derived only through the collection relation). This is deliberate defense-in-depth — do not "simplify" it away during refactors.
If you write an endpoint and can't point to the line that enforces ownership, stop and add it before moving on. Don't defer this to "add tests later."
Stack conventions

Backend

NestJS module-per-resource structure: collections/, bookmarks/, auth/, users/.
Prisma schema lives in backend/prisma/schema.prisma. Run migrations with npx prisma migrate dev, never hand-edit the generated client.
JWT validation: verify signature against the Auth0 JWKS endpoint, verify iss and aud claims. Audience is https://bbl-candidate-test-api. Do not accept the id_token as a Bearer credential — only the access token issued for this API audience.
User provisioning: on first successful auth, upsert a User row keyed by the token's sub claim. Don't require a separate registration step.
All list endpoints support filtering via query params (e.g. ?collectionId=) — implement filtering in the Prisma where clause, not by fetching everything and filtering in JS.

Frontend

No Next.js. Vite + React Router v8 (data router API, not the legacy <Switch> pattern).
MUI v9 components for all UI — don't hand-roll components MUI already provides.
Auth: PKCE flow, store tokens in memory (React state/context), not localStorage.
Testing requirements

Every endpoint needs, at minimum:

A happy-path test (authenticated owner can do the operation).
An adversarial test: a second seeded user attempts the same operation on the first user's resource by guessing/reusing a real id — must get 404, never 200 or 403 with a body that confirms existence.
An unauthenticated test (no token / expired token / wrong audience) → 401.

Do not consider an endpoint done until all three exist and pass. If you (the agent) write an endpoint without these, say so explicitly rather than presenting it as complete.

Documentation discipline

When you make a design decision the spec didn't dictate (e.g. how deep to implement collection sharing, which token to use as Bearer credential, on-delete behavior for collections), don't just implement it — also append a short entry to DECISIONS.md explaining the choice and the trade-off. Don't wait until the end to backfill this.

If your first implementation of something turns out to be wrong and gets corrected, leave that correction visible in the commit history (a fix commit), not squashed away. This project is graded partly on the visible back-and-forth, not just the final diff.

What NOT to do
Don't add features not in scope (no public sharing UI, no admin panel, no password-based login — Auth0/OIDC only).
Don't use any in TypeScript without a comment explaining why it's unavoidable.
Don't cache or hardcode the Auth0 discovery document — fetch it live so the app reflects the tenant's actual current configuration.
Don't mark a task complete without running the test suite.