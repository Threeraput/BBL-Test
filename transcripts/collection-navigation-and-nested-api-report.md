# Collection Navigation & Nested API Endpoint Integration Report

**Date:** 2569-08-05 (2026-08-05)  
**Status:** Completed & Verified  

---

## 1. Overview

This report documents the architectural improvements, feature additions, and bug fixes applied to the **BBL Bookmark Manager** frontend and backend communication layer.

---

## 2. Feature Additions & Interactions

### 2.1 Collection Card Navigation ("View One")
- **Implementation:** Added an `onClick` event handler to each collection card on the `/collections` page.
- **Behavior:** Clicking a collection card navigates the user to `/bookmarks?collectionId=<COLLECTION_ID>`.
- **UI Enhancements:** Added hover animations (`transform: translateY(-2px)`, shadow effects) and `cursor: pointer`. Event bubbling is suppressed (`e.stopPropagation()`) on Edit and Delete action buttons to prevent accidental navigation.

### 2.2 URL Query Parameter Synchronization
- **Implementation:** Used React Router v8's `useSearchParams` hook inside `BookmarksPage`.
- **Behavior:**
  - Automatically reads `?collectionId=xxx` from the URL on load.
  - Syncs the filter dropdown state with the URL parameter.
  - Changing the dropdown filter updates the URL dynamically without page reloads.

### 2.3 Nested Endpoint Usage (`GET /collections/:id/bookmarks`)
- **Implementation:** Updated `src/api/bookmarks.ts` (`bookmarksApi.getBookmarks`).
- **Endpoint:** When a `collectionId` is provided, requests are dispatched to `GET /collections/:id/bookmarks` instead of standard query-string parameters.

---

## 3. Data-Fetching & Bug Fixes Refactoring

### 3.1 Data-Fetching Refactor (Custom Hooks)
- Created modular API wrappers in `src/api/collections.ts` and `src/api/bookmarks.ts`.
- Implemented custom React hooks `useCollections` and `useBookmarks` encapsulating Auth0's `getAccessTokenSilently` and managing state (`data`, `isLoading`, `error`).

### 3.2 Continuous Typing Focus Fix (FormFields)
- **Issue:** Typing inside the "New Bookmark" modal dialog caused the text input to lose focus after every keystroke.
- **Root Cause:** `<FormFields />` was declared as a functional component nested *inside* the render cycle of `BookmarksPage`, recreating a new component identity on every state change.
- **Resolution:** Refactored `<FormFields />` to a render function `{renderFormFields()}`, preserving DOM node identity across renders.

### 3.3 URL Validation Flexibility
- **Issue:** Strict `@IsUrl()` validation in NestJS DTOs rejected valid URLs lacking explicit `http://` or `https://` schemes (e.g., `google.com`).
- **Resolution:** Updated DTOs to use `@IsString()` and `@IsNotEmpty()` for backend validation, while the frontend automatically normalizes user inputs by prepending `https://` when missing.

---

## 4. Verification

- [x] Collection card click navigates to `/bookmarks?collectionId=...`
- [x] Filter dropdown reflects the selected collection ID
- [x] API calls use `GET /collections/:id/bookmarks`
- [x] Inputs allow continuous typing without focus loss
- [x] Backend accepts flexible URL inputs
