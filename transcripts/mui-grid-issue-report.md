# Issue Report: MUI Grid2 Export Error

**Date:** 2026-08-05
**Component:** Frontend (`Collections.tsx`, `Bookmarks.tsx`)
**Error Message:** `Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/@mui_material.js' does not provide an export named 'Grid2'`

## Description
During the frontend implementation, the application crashed with a `SyntaxError` when attempting to load the `Collections` and `Bookmarks` pages. The error indicated that `@mui/material` (version 9.2.0 installed in the project) did not provide an export named `Grid2`.

## Root Cause
The initial implementation used `Grid2` and its associated props (e.g., `size={{ xs: 12 }}`). However, the currently installed version of `@mui/material` either does not export `Grid2` natively or requires a different import path (e.g., `Unstable_Grid2`). As a result, Vite failed to bundle the module, causing the application to crash on the client side.

## Resolution
To resolve the issue quickly and maintain compatibility with the existing `@mui/material` version:
1. Replaced all `Grid2` imports and component usages with the standard `Grid` component.
2. Updated the grid sizing props from the new API (`size={{ xs: 12, sm: 6, md: 4 }}`) back to the standard API (`item xs={12} sm={6} md={4}`).

**Files Modified:**
- `frontend/src/pages/Collections.tsx`
- `frontend/src/pages/Bookmarks.tsx`

## Status
**Resolved.** The UI now renders correctly using the standard `Grid` layout without any module export errors.
