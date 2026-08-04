---
name: verify-privacy
description: Audit privacy invariant enforcement, ownership scoping, and required auth/adversarial tests.
argument-hint: Optional scope, for example backend/src/bookmarks or backend/test/bookmarks
agent: security-reviewer
tools:
	- read_file
	- file_search
	- grep_search
	- semantic_search
	- get_errors
	- run_in_terminal
	- vscode_listCodeUsages
model: GPT-5 (copilot)
---

Run a privacy and ownership audit for this bookmark manager.

Use these sources as project authority before concluding anything:
- [Project rules](../copilot-instructions.md)
- [Technical spec](../../SPEC.md)
- [API design notes](../../API_DESIGN.md)
- [Decision log](../../DECISIONS.md)
- [README](../../README.md)

Requested focus: ${input:scope:backend}

Tasks:
1. Identify the concrete code paths that control access to Collection and Bookmark records in the requested scope.
2. Verify every read, update, patch, delete, relation traversal, and list query is scoped to the authenticated user's ownerId.
3. Flag any direct lookup by record id alone for user-owned resources.
4. Verify foreign-resource access returns 404, not 403, and does not leak existence in the body.
5. Verify auth handling returns 401 for missing token, expired token, or wrong audience.
6. Verify JWT validation checks signature, issuer, and audience against the live Auth0 configuration assumptions used by the app.
7. Verify first-login user provisioning upserts by token sub.
8. Verify list filtering is implemented in Prisma where clauses.
9. Verify frontend token handling stays in memory and does not use localStorage.
10. Verify endpoint tests include happy-path, adversarial second-user, and unauthenticated coverage.

If tests exist for the reviewed scope, run the narrowest relevant command to validate the claims you make.

Return results in this structure:

## Findings
- Only include real problems or meaningful gaps.
- Order by severity.
- For each item include file reference, risk, and exact remediation direction.

## Confirmed Protections
- List protections you verified with code or tests.

## Test Coverage Gaps
- List missing adversarial, ownership, or auth validation tests.

## Residual Risk
- State what remains unverified and why.

If no findings are found, say: "No concrete privacy invariant violations found in the reviewed scope," then continue with coverage gaps and residual risk.
