# BBL Bookmark Manager — Frontend Web Application

React + Vite + TypeScript frontend for the Private Bookmark Manager application, built with MUI v9 and React Router v8.

---

## 🎨 Features & UI Architecture

- **Auth0 PKCE Integration:** Single sign-on with in-memory token storage (`cacheLocation: "memory"`). No tokens are saved in `localStorage`.
- **Custom Design System:** MUI v9 custom theme with Pastel Blue palette (`#8EC5FC`), Inter typography, card shadows, and responsive grid layouts.
- **Custom Hooks Data Layer:** Encapsulated API communication layer using `useCollections` and `useBookmarks` hooks.
- **Page Views:**
  - `/login`: Auth0 login landing page.
  - `/collections`: Collection cards with inline Edit/Delete modals and click-to-filter navigation.
  - `/bookmarks`: Bookmark cards with external link opening, Collection filter dropdown (synced with URL `?collectionId=`), and Create/Edit/Delete modals.

---

## ⚙️ Development Commands

Run from `frontend/`:

```bash
npm run dev     # Start Vite development server (Port 3000)
npm run build   # Typecheck (tsc -b) and bundle for production via Vite
npm run preview # Preview production build locally
```
