# AGENTS.md — TaskMateClient

React SPA for TaskMate. General rules in [../AGENTS.md](../AGENTS.md).

## Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind 3.4 · TanStack Query 5 · Zustand 5 · react-hook-form 7 · date-fns 4.

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production (tsc -b + vite build)
npm run lint      # ESLint
```

## Key Conventions

- **Zustand** — Client state (auth, workspace, sidebar). Persisted in localStorage
- **TanStack Query** — Server data. ALWAYS use `dealershipId` in queryKey + `placeholderData: (prev) => prev`
- **usePermissions()** — ALWAYS use for access checks. NEVER check `user.role` directly
- **useWorkspace()** — Single source for `dealershipId`
- **API modules** — Use `src/api/` modules. NEVER use axios directly
- **Dates** — Use `src/utils/dateTime.ts`: `formatDateTime()`, `toUtcIso()`, `parseUtcDate()`

## Structure

```
src/
├── api/         # API modules (Axios instance)
├── components/  # ui, common, layout, tasks, [domain]
├── pages/       # Route pages
├── hooks/       # usePermissions, useWorkspace, useSettings...
├── stores/      # Zustand stores
├── types/       # TypeScript types
├── utils/       # dateTime, errorHandling
└── context/     # ThemeContext
```

## Forbidden

- Direct role checks (`user.role === 'owner'`) — use `usePermissions()`
- Server data in Zustand — use TanStack Query
- `keepPreviousData` (deprecated) — use `placeholderData: (prev) => prev`
- Direct axios — use API modules from `src/api/`
- Dates without UTC conversion — use `dateTime.ts`
- Direct `dealershipId` from `useAuthStore` — use `useWorkspace()`
