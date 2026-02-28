# TaskMateClient — CLAUDE.md

React SPA для TaskMate. Общие правила — в [../CLAUDE.md](../CLAUDE.md).

## Стек

React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3.4 + TanStack Query 5 + Zustand 5 + react-hook-form 7 + date-fns 4.

## Структура

```
src/
├── api/            # 15 модулей (client.ts — Axios instance)
├── components/
│   ├── ui/         # UI Kit: Button, Card, Modal, Badge, Input...
│   ├── common/     # DealershipSelector, StatusBadge, UserSelector...
│   ├── layout/     # Layout, Sidebar, WorkspaceSwitcher
│   ├── tasks/      # TaskModal, TaskDetailsModal, VerificationPanel
│   └── [domain]/   # generators, shifts, users, dealerships, settings
├── pages/          # 17 страниц-роутов
├── hooks/          # usePermissions, useWorkspace, useSettings...
├── stores/         # Zustand: authStore, workspaceStore, sidebarStore
├── types/          # TypeScript-типы
├── utils/          # dateTime, errorHandling, rateLimitManager
└── context/        # ThemeContext (light/dark/system + accent color)
```

## Конвенции

### State management — два слоя

**Zustand** — клиентское состояние (auth, workspace, sidebar). Persist в localStorage.
```typescript
// Пример: authStore
export const useAuthStore = create<AuthState>(
  persist((set) => ({
    user: null,
    login: (user) => set({ user }),
  }), { name: 'auth-store' })
);
```

**TanStack Query** — серверные данные. Всегда используй `dealershipId` в queryKey.
```typescript
// ПРАВИЛЬНО: placeholderData предотвращает мигание при смене фильтров
useQuery({
  queryKey: ['tasks', dealershipId, filters],
  queryFn: () => tasksApi.getAll({ ...filters, dealership_id: dealershipId }),
  placeholderData: (prev) => prev,
});

// НЕПРАВИЛЬНО: без placeholderData — UI мигает
useQuery({ queryKey: ['tasks'], queryFn: tasksApi.getAll });
```

### Права доступа (usePermissions)

```typescript
// ПРАВИЛЬНО: всегда используй usePermissions()
const { canManageTasks, canCreateUsers, isOwner } = usePermissions();
{canManageTasks && <Button onClick={handleCreate}>Создать</Button>}

// НЕПРАВИЛЬНО: проверка role напрямую
if (user.role === 'owner') { ... }
```

### API модули

```typescript
// Паттерн: объект с методами, типизированный ответ
export const tasksApi = {
  getAll: async (params?: TaskFilters): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },
  create: async (data: CreateTaskPayload): Promise<ApiResponse<Task>> => {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },
};

// Использование ТОЛЬКО через эти модули, не через axios напрямую
```

### Даты (dateTime.ts)

```typescript
import { formatDateTime, toUtcIso, parseUtcDate } from '@/utils/dateTime';

// Backend → UTC ISO: "2024-01-15T10:30:00Z"
const date = parseUtcDate("2024-01-15T10:30:00Z");

// Отображение: локальный timezone
formatDateTime(date);  // "15 янв 2024, 15:30"

// Отправка на backend
toUtcIso(localDate);  // "2024-01-15T10:30:00Z"
```

### Multi-tenant (useWorkspace)

```typescript
// useWorkspace() — единственный источник dealershipId
const { dealershipId } = useWorkspace();

// Employee: только свой. Manager: назначенные. Owner: все или конкретный.
// Это проверяется на backend через TaskPolicy::view()
```

## Команды (специфичные для frontend)

```bash
npm run dev       # Dev server (http://localhost:5173)
npm run build     # Production (tsc -b + vite build)
npm run lint      # ESLint
```

## Запрещено

- Прямая проверка `user.role === 'owner'` — используй `usePermissions()`
- Хранить серверные данные в Zustand — используй TanStack Query
- `keepPreviousData` (устарело) — используй `placeholderData: (prev) => prev`
- Обращаться к API напрямую через axios — используй модули из `src/api/`
- Отображать даты без конвертации из UTC — используй `dateTime.ts` утилиты
- Обращаться к dealershipId напрямую из `useAuthStore` — используй `useWorkspace()`

## Темы и стили

- Tailwind CSS + dark mode (`class` strategy)
- Primary: blue-600, accent через CSS variables
- `useTheme()` → `{ theme, accentColor, toggleTheme }`
