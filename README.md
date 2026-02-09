# TaskMate Client

Frontend приложение для системы управления задачами TaskMate, построенное на React 19 + TypeScript + Vite 7.

## Технологический стек

- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Vite 7** - Сборщик и dev сервер
- **React Router** - Маршрутизация
- **Zustand** - State management
- **TanStack Query v5** - Управление серверным состоянием
- **Axios** - HTTP клиент
- **Tailwind CSS** - CSS фреймворк
- **date-fns** - Работа с датами
- **react-hook-form** - Работа с формами
- **heroicons** - Иконки

## Требования

- Node.js 20+
- npm или yarn

## Установка

```bash
# Установка зависимостей
npm install

# Создать .env файл на основе .env.example
cp .env.example .env

# Отредактировать .env и указать правильный API URL
# VITE_API_BASE_URL=http://localhost:8007/api/v1
```

## Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`

## Предпросмотр продакшен сборки

```bash
npm run preview
```

## Docker

### Важно: Переменные окружения при сборке

Vite встраивает переменные окружения (начинающиеся с `VITE_`) в JavaScript **во время сборки**, а не во время запуска. Это означает, что переменные должны быть переданы как build arguments при сборке образа.

### Сборка образа

```bash
# Сборка с дефолтным API URL (http://localhost:8007/api/v1)
docker build -t taskmate-frontend .

# Сборка с кастомным API URL
docker build \
  --build-arg VITE_API_BASE_URL=http://your-api-url:8007/api/v1 \
  -t taskmate-frontend .
```

### Запуск контейнера

```bash
docker run -p 80:80 taskmate-frontend
```

Приложение будет доступно по адресу `http://localhost`

### podman compose

Добавьте в `docker-compose.yml`:

```yaml
services:
  frontend:
    build:
      context: ./TaskMateFrontend
      dockerfile: Dockerfile
      args:
        # Передаем build argument для Vite
        VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:8007/api/v1}
    ports:
      - "80:80"
    depends_on:
      - api
```

**Примечание:** Runtime переменные окружения (через `environment:`) НЕ работают для Vite приложений, так как код уже собран. Используйте только `build.args`.

## Структура проекта

```
src/
├── api/                 # API клиент и endpoints
│   ├── client.ts        # Axios instance
│   ├── auth.ts          # Аутентификация
│   ├── users.ts         # Пользователи
│   ├── tasks.ts         # Задачи
│   ├── taskGenerators.ts # Генераторы задач
│   ├── archivedTasks.ts # Архивные задачи
│   └── dashboard.ts     # Dashboard
│
├── components/          # React компоненты
│   ├── common/         # Общие компоненты (PageContainer, PageHeader, DealershipSelector)
│   ├── auth/           # Компоненты аутентификации
│   ├── layout/         # Layout (Sidebar, Layout)
│   ├── users/          # Компоненты пользователей
│   ├── tasks/          # Компоненты задач (TaskModal, TaskDetailsModal)
│   ├── generators/     # Компоненты генераторов
│   ├── shifts/         # Управление сменами (ShiftControl)
│   └── notifications/  # Настройки уведомлений (NotificationSettingsContent)
│
├── pages/              # Страницы приложения
│   ├── DashboardPage.tsx
│   ├── TasksPage.tsx
│   ├── TaskGeneratorsPage.tsx
│   ├── ArchivedTasksPage.tsx
│   ├── UsersPage.tsx
│   ├── ShiftsPage.tsx
│   ├── LinksPage.tsx
│   ├── SettingsPage.tsx
│   ├── ReportsPage.tsx
│   └── NotificationSettingsPage.tsx
│
├── context/            # Context API
│   └── ThemeContext.tsx # Управление темами и Dark Mode
│
├── stores/             # Zustand stores
│   └── authStore.ts
│
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useTheme.ts
│
├── types/              # TypeScript типы
│   ├── user.ts
│   ├── task.ts
│   ├── setting.ts
│   └── ...
│
├── utils/              # Утилиты
│   ├── debug.ts        # Отладочные функции
│   ├── phoneFormatter.ts  # Форматирование телефонов
│   └── roleTranslations.ts # Перевод ролей на русский
└── constants/          # Константы
```

## Функциональность

### Задачи и Генераторы

- **Task Generators**: Система для создания повторяющихся регулярных задач (ежедневно, еженедельно, ежемесячно).
  - Поддержка гибких настроек уведомлений.
  - Назначение исполнителей сразу для всей серии задач.
- **Tasks**: Разовые задачи или инстансы, созданные генераторами.
  - Обычные задачи (без повторений).
  - Улучшенная фильтрация и поиск.
- **Archive**: Просмотр завершенных и просроченных задач.

### Аутентификация

Приложение использует Bearer Token аутентификацию (Laravel Sanctum):

1. Пользователь вводит логин и пароль (Логин: латинские буквы, цифры, макс. одна точка, макс. одно подчеркивание, до 64 символов)
2. После успешного входа токен сохраняется в localStorage
3. Токен автоматически добавляется ко всем API запросам
4. При получении 401 ошибки пользователь перенаправляется на страницу входа

## Роли и права доступа

Система поддерживает следующие роли пользователей (отображаются на русском языке):

| Роль (код)  | Название (RU)  | Описание                                |
|-------------|----------------|-----------------------------------------|
| `employee`  | Сотрудник      | Только доступ к боту                    |
| `observer`  | Наблюдатель    | Только просмотр                         |
| `manager`   | Управляющий    | Создание/редактирование задач и пользователей |
| `owner`     | Владелец       | Полный доступ                           |

### Утилита перевода ролей

Для отображения ролей на русском языке используйте утилиту `src/utils/roleTranslations.ts`:

```typescript
import { getRoleLabel, translateRoles, roleLabels, roleDescriptions } from './utils/roleTranslations';

// Получить русское название роли
getRoleLabel('employee'); // → "Сотрудник"

// Перевести массив ролей
translateRoles(['employee', 'manager']); // → "Сотрудник, Управляющий"

// Использовать маппинг напрямую
roleLabels.owner; // → "Владелец"
roleDescriptions.manager; // → "Управление салонами"
```

## Переменные окружения

- `VITE_API_BASE_URL` - URL API сервера (по умолчанию: `http://localhost:8007/api/v1`)

### Для локальной разработки

Создайте `.env` файл:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8007/api/v1
```

### Для Docker

При использовании Docker переменные должны передаваться как **build arguments**, а не runtime environment variables. Смотрите раздел "Docker" выше для подробностей.

## Android (Capacitor)

Приложение можно собрать как нативное Android-приложение через Capacitor 8. Сборка происходит внутри Docker-контейнера — Android Studio не нужна.

### Как это работает

Capacitor оборачивает собранный Vite-билд (`dist/`) в нативный Android WebView. Приложение работает как обычное Android-приложение, но внутри — веб-интерфейс TaskMate.

### Файлы Capacitor

```
TaskMateClient/
├── capacitor.config.ts      # Конфигурация Capacitor (appId, webDir)
├── android/                 # Нативный Android-проект (коммитится в git)
│   ├── app/
│   │   ├── build.gradle     # Gradle конфигурация приложения
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/ru/andcrm/vfp/  # MainActivity
│   │       └── assets/public/        # Сюда копируется dist/ при cap sync
│   ├── variables.gradle     # Версии SDK (compileSdk 36, minSdk 24)
│   └── gradle/              # Gradle wrapper (8.14.3)
```

### Команды

```bash
# Сборка web-ассетов + синхронизация с Android
npm run cap:build

# Только синхронизация (если dist/ уже собран)
npm run cap:sync
```

### Сборка APK (из корня монорепо)

```bash
# Первая сборка Docker-образа (~3 ГБ: JDK 21 + Node 22 + Android SDK 36)
podman compose --profile android build android-builder

# Сборка APK
./scripts/build-android.sh
# Результат: android/app/build/outputs/apk/debug/app-debug.apk (4.2 МБ)
```

### Установка на устройство по Wi-Fi

На телефоне: Настройки > Для разработчиков > Отладка по Wi-Fi. Нужны значения с **двух разных мест**:

- **Модальное окно** (кнопка "Сопряжение через код") — IP:port (`ADB_PAIR_TARGET`) + 6-значный код (`ADB_PAIR_CODE`). Одноразовое сопряжение.
- **Основной экран** "Отладка по Wi-Fi", строка "IP-адрес и порт" (видна без нажатия кнопок) — IP:port (`ADB_CONNECT`). Постоянный порт для подключения, **отличается** от порта сопряжения.

```bash
# Первый раз: сопряжение + подключение + сборка + установка
ADB_PAIR_TARGET=192.168.1.X:XXXXX \
ADB_PAIR_CODE=XXXXXX \
ADB_CONNECT=192.168.1.X:YYYYY \
./scripts/build-android.sh --pair --deploy

# Последующие разы: подключение + сборка + установка
ADB_CONNECT=192.168.1.X:YYYYY \
./scripts/build-android.sh --deploy
```

### API URL

Переменная `VITE_API_BASE_URL` вшивается в APK при сборке. Для Android она берётся из `ANDROID_API_URL` в `.env`:

| Режим | Значение |
|-------|----------|
| Через туннель | `http://173.212.212.236/api/v1` |
| Через LAN | `http://192.168.x.x:8099/api/v1` |
| Production | `https://site.com/api/v1` |

### Смена appId

Для смены нужно обновить:
1. `capacitor.config.ts` — поле `appId`
2. `android/app/build.gradle` — `namespace` и `applicationId`
3. `android/app/src/main/java/` — переименовать пакет

## Документация API

Смотрите файл `creating_intructions/FRONTEND_GUIDE.md` для подробной документации по интеграции с API.

## Лицензия

Proprietary License
Copyright © 2023-2026 [https://github.com/xierongchuan](https://github.com/xierongchuan). All rights reserved.
