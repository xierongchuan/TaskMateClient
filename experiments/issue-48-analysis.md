# Issue #48 Root Cause Analysis

## Problem Description
После ввода логина и пароля пользователь переходит на главную страницу, но мгновенно перебрасывается обратно на страницу логина. В cookies ничего нет.

## Root Cause

### 1. Missing Hydration State Tracking
Zustand persist middleware загружает данные из localStorage **асинхронно**. Однако, код не ожидает завершения гидратации перед проверкой `isAuthenticated`.

**Последовательность событий:**
1. App.tsx рендерится при загрузке страницы
2. ProtectedRoute проверяет `isAuthenticated` **до** завершения hydration
3. `isAuthenticated` = `false` (начальное значение)
4. Происходит редирект на `/login`
5. Только потом persist middleware восстанавливает `isAuthenticated = true` из localStorage
6. Но уже слишком поздно - пользователь на странице логина

### 2. useEffect Dependency Issue in App.tsx
```typescript
useEffect(() => {
  if (token && isAuthenticated) {
    refreshUser();
  }
}, [token, isAuthenticated, refreshUser]); // refreshUser меняется при каждом обновлении store
```

Проблема: `refreshUser` - это функция из Zustand store, которая пересоздается при каждом изменении state. Это может вызывать лишние вызовы `useEffect`.

### 3. Cookie vs localStorage Confusion
Пользователь ожидает данные в cookies, но Zustand persist использует localStorage с ключом `auth-storage`.

## Solution Requirements

1. **Добавить отслеживание состояния hydration** в authStore
2. **Ожидать завершения hydration** перед рендерингом защищенных маршрутов
3. **Исправить зависимости useEffect** в App.tsx
4. **Добавить загрузочный индикатор** пока идет hydration
5. **Добавить debug логирование** (опционально, выключено по умолчанию)

## Implementation Plan

### Step 1: Add Hydration State to authStore
```typescript
interface AuthState {
  // ... existing fields
  hasHydrated: boolean; // NEW
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ... existing fields
      hasHydrated: false, // NEW
      // ... existing methods
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => { // NEW
        state?.hasHydrated = true;
      },
    }
  )
);
```

### Step 2: Wait for Hydration in App.tsx
```typescript
function App() {
  const { isAuthenticated, token, hasHydrated, refreshUser } = useAuthStore();

  useEffect(() => {
    // Only refresh after hydration is complete
    if (hasHydrated && token && isAuthenticated) {
      refreshUser();
    }
  }, [hasHydrated, token, isAuthenticated]); // Remove refreshUser from deps

  // Show loading screen while hydrating
  if (!hasHydrated) {
    return <div>Загрузка...</div>;
  }

  return (
    // ... rest of the app
  );
}
```

### Step 3: Update ProtectedRoute
No changes needed - it will work correctly once hydration is handled in App.tsx

## Expected Result
- Пользователь успешно логинится
- После перезагрузки страницы остается залогиненным
- Нет мгновенного редиректа на `/login`
- State корректно восстанавливается из localStorage
