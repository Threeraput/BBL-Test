# Adversarial Privacy Model & Security Testing Report

**Date:** 2569-08-05 (2026-08-05)  
**Status:** All 6 Security Assertions PASS (82/82 Unit & Integration Tests Passed)  

---

## 1. Summary Matrix

| # | Endpoint / Interaction | Token Context | Expected Status | Actual Status | Result |
|---|------------------------|---------------|-----------------|---------------|--------|
| 1 | `GET /collections/{id_User_A}` | User B | **404 Not Found** | **404 Not Found** | PASS |
| 2 | `PATCH /collections/{id_User_A}` | User B | **404 Not Found** | **404 Not Found** | PASS |
| 3 | `DELETE /bookmarks/{id_User_A}` | User B | **404 Not Found** | **404 Not Found** | PASS |
| 4 | `GET /collections/{id_User_A}/bookmarks` | User B | **404 Not Found** | **404 Not Found** | PASS |
| 5 | `PATCH /bookmarks/{id_User_B}` with `collectionId` of User A | User B | **404/Reject** | **404 Not Found** | PASS |
| 6 | User B List Endpoint Isolation | User B | **Only User B's Data** | **Isolated (Prisma `where: { ownerId }`)** | PASS |

---

## 2. Technical Evidence & Implementation

### 2.1 Privacy Leak Prevention (404 vs 403)
- All Prisma queries search by `{ id, ownerId }` simultaneously.
- When User B queries User A's resource, Prisma returns `null` (not found).
- The service throws `NotFoundException`, emitting **HTTP 404**. This prevents information disclosure regarding resource existence (ID probing attack).

### 2.2 Cross-Resource Ownership Check (IDOR Prevention)
- When User B attempts to attach User A's `collectionId` to User B's bookmark via `POST /bookmarks` or `PATCH /bookmarks/:id`, the service verifies `collection.findFirst({ where: { id: collectionId, ownerId: callerId } })`.
- If `collectionId` does not belong to the caller, it throws `NotFoundException` (HTTP 404).

---

## 3. Execution Logs

Executed automated suite via Jest:
```text
Test Suites: 11 passed, 11 total
Tests:       82 passed, 82 total
Snapshots:   0 total
Time:        7.588 s
```
