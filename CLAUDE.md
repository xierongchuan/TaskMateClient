# TaskMateClient — CLAUDE.md

React SPA для TaskMate. Общие правила — в [../CLAUDE.md](../CLAUDE.md).

## Стек

React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3.4 + TanStack Query 5 + Zustand 5 + react-hook-form 7 + date-fns 4.

## Структура

```
src/
├── api/            # 15 модулей (client.ts — Axios instance)
├── components/
│   ├── ui/         # UI Kit: Button, Card, Modal, Badge, Input, Select...
│   ├── common/     # DealershipSelector, StatusBadge, UserSelector...
│   ├── layout/     # Layout, Sidebar, WorkspaceSwitcher
│   ├── tasks/      # TaskModal, TaskDetailsModal, VerificationPanel, ProofViewer
│   └── [domain]/   # generators, shifts, users, dealerships, settings, reports
├── pages/          # 17 страниц-роутов
├── hooks/          # 13 хуков (usePermissions, useWorkspace, useSettings...)
├── stores/         # Zustand: authStore, workspaceStore, sidebarStore
├── types/          # 12 файлов TypeScript-типов
├── utils/          # dateTime, errorHandling, rateLimitManager...
└── context/        # ThemeContext (light/dark/system + accent color)
```

## Conventions

### State management — два слоя

- **Zustand** — клиентское состояние (auth, workspace, sidebar). Persist в localStorage.
- **TanStack Query** — серверные данные. Каждый запрос использует `dealershipId` в queryKey.

```typescript
// ПРАВИЛЬНО: placeholderData предотвращает мигание при смене фильтров
useQuery({
  queryKey: ['tasks', dealershipId, filters],
  queryFn: () => tasksApi.getAll({ ...filters, dealership_id: dealershipId }),
  placeholderData: (prev) => prev,
});

// НЕПРАВИЛЬНО: без placeholderData — UI мигает при каждом запросе
useQuery({ queryKey: ['tasks'], queryFn: tasksApi.getAll });
```

### Права доступа

```typescript
// Всегда через usePermissions(), НЕ проверять role напрямую
const { canManageTasks, canCreateUsers, isOwner } = usePermissions();

// Скрывать UI-элементы, не отключать
{canManageTasks && <Button onClick={handleCreate}>Создать</Button>}
```

### Multi-tenant

```typescript
// useWorkspace() — единственный источник dealershipId
const { dealershipId } = useWorkspace();
// Employee: только свой. Manager: назначенные. Owner: все или конкретный.
```

### API модули

```typescript
// Паттерн: объект с методами, типизированный ответ
export const exampleApi = {
  getAll: async (params?: Filters): Promise<PaginatedResponse<Data>> => {
    const response = await apiClient.get('/endpoint', { params });
    return response.data;
  },
};
```

### Даты

```typescript
import { formatDateTime, toUtcIso, localInputToUtc } from '@/utils/dateTime';
// Backend → UTC ISO с Z: "2024-01-15T10:30:00Z"
// Отображение: formatDateTime(date) → "15 янв 2024, 15:30"
// Отправка: toUtcIso(localDate) → "2024-01-15T10:30:00Z"
```

### Modal CRUD

```typescript
// Паттерн: selectedItem=null → создание, object → редактирование
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
// Модалка получает item prop и определяет режим
```

## Запрещено

- Прямая проверка `user.role === 'owner'` — используй `usePermissions()`
- Хранить серверные данные в Zustand — используй TanStack Query
- `keepPreviousData` (устарело) — используй `placeholderData: (prev) => prev`
- Обращаться к API напрямую через axios — используй модули из `src/api/`
- Отображать даты без конвертации из UTC — используй `dateTime.ts` утилиты

## Темы и стили

- Tailwind CSS, dark mode через `class` strategy
- Primary: blue-600, accent через CSS variables
- ThemeContext: `useTheme()` → `{ theme, accentColor }`

## Команды

```bash
npm run dev       # Dev server
npm run build     # Production (tsc -b + vite build)
npm run lint      # ESLint
```
