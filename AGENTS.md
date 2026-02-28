# AGENTS.md

This file provides guidance to agents when working with TaskMateClient.

## Stack

React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3.4 + TanStack Query 5 + Zustand 5 + react-hook-form 7 + date-fns 4 + Capacitor 8.

## Commands (run via Docker)

```bash
# Build
podman run --rm -v ./TaskMateClient:/app:z -w /app docker.io/library/node:22-alpine npm run build

# Lint
podman run --rm -v ./TaskMateClient:/app:z -w /app docker.io/library/node:22-alpine npm run lint

# Dev
podman run --rm -v ./TaskMateClient:/app:z -w /app docker.io/library/node:22-alpine npm run dev

# Capacitor sync
podman run --rm -v ./TaskMateClient:/app:z -w /app docker.io/library/node:22-alpine npm run cap:sync
```

## Non-Obvious Rules

### State Management — Two Layers
- **Zustand** — client state (auth, workspace, sidebar), persisted in localStorage
- **TanStack Query** — server data, ALWAYS use `dealershipId` in queryKey

```typescript
// CORRECT: placeholderData prevents UI flickering
useQuery({
  queryKey: ['tasks', dealershipId, filters],
  queryFn: () => tasksApi.getAll({ ...filters, dealership_id: dealershipId }),
  placeholderData: (prev) => prev,
});
```

### Permissions
- ALWAYS use `usePermissions()` — NEVER check `user.role` directly
```typescript
const { canManageTasks, canCreateUsers, isOwner } = usePermissions();
{canManageTasks && <Button>Создать</Button>}
```

### Dates
- Server sends UTC ISO with Z: `"2024-01-15T10:30:00Z"`
- Use `src/utils/dateTime.ts` utilities:
```typescript
import { formatDateTime, toUtcIso, parseUtc } from '@/utils/dateTime';
```

### API Modules
- Use modules from `src/api/` — NEVER use axios directly

### Security

- **XSS**: Never use `dangerouslySetInnerHTML` with user data
- **Memory Leaks**: Clean up subscriptions and timers in useEffect
- **Secure API**: Validate response data with Zod schemas, use parameterized queries
- **Defense in Depth**: Validate on both client AND server

## Structure

```
src/
├── api/           # 15 API modules
├── components/   # ui, common, layout, tasks, [domain]
├── pages/        # 17 route pages
├── hooks/        # 13 custom hooks
├── stores/       # Zustand stores
├── types/        # TypeScript types
├── utils/        # dateTime, debug, rateLimitManager
└── context/      # ThemeContext
```

## Forbidden

- Direct role checks — use `usePermissions()`
- Server data in Zustand — use TanStack Query
- `keepPreviousData` — use `placeholderData: (prev) => prev`
- Direct axios — use API modules
- Dates without UTC conversion — use dateTime.ts
