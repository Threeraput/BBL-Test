# Issue Report: MUI ListItemText Typography Props Error

**Date:** 2026-08-05
**Component:** Frontend (`Sidebar.tsx`)
**Error Message:** `Type '{ primary: string; primaryTypographyProps: { fontWeight: number; }; }' is not assignable to type 'IntrinsicAttributes & ListItemTextProps<"span", "p">'. Property 'primaryTypographyProps' does not exist on type 'IntrinsicAttributes & ListItemTextProps<"span", "p">'.`

## Description
During the frontend compilation, a TypeScript error was thrown in `Sidebar.tsx`. The error indicated that `primaryTypographyProps` does not exist on the type definition for the `ListItemText` component in the currently installed version of `@mui/material` (version 9.2.0).

## Root Cause
The `ListItemText` component previously supported `primaryTypographyProps` to allow styling of the primary text node directly. However, in the current version of the MUI library (v9.2.0 as used in the project), this prop definition has either been removed or typing has become stricter, resulting in a type mismatch during compilation.

## Resolution
To resolve the TypeScript error while retaining the intended styling:
1. Replaced the `primaryTypographyProps` prop by wrapping the `item.text` string directly in a custom `<Typography>` component within the `primary` prop.
2. Added the `disableTypography` boolean prop to `ListItemText` to prevent the component from auto-wrapping the node in another default Typography layer.
3. Applied the dynamic `fontWeight` styling using the standard `sx` prop on the `<Typography>` component.

**Files Modified:**
- `frontend/src/layout/Sidebar.tsx`

## Status
**Resolved.** The `Sidebar.tsx` file now passes TypeScript type checking, and the desired styling is preserved without relying on the deprecated or missing prop.
