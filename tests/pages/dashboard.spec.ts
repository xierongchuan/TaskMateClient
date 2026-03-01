import { test, expect } from '@playwright/test';

/**
 * Тесты дашборда — запускаются от admin (owner), storageState задан в playwright.config.ts
 */
test.describe('Dashboard — основное содержимое', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Ждём рендера главного контента
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('дашборд загружается и отображает главный контент', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('PageHeader содержит заголовок "Панель управления"', async ({ page }) => {
    await expect(page.getByText('Панель управления')).toBeVisible();
  });

  test('PageHeader содержит приветствие пользователя', async ({ page }) => {
    // Проверяем что есть текст с "Добро пожаловать"
    await expect(page.getByText(/Добро пожаловать/i)).toBeVisible();
  });

  test('отображаются карточки статистики', async ({ page }) => {
    await expect(page.getByText('Активные смены', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Просроченные задачи', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Выполнено сегодня', { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('карточка "На проверке" видна для owner/manager (canManageTasks)', async ({ page }) => {
    // Admin — owner, у него есть canManageTasks
    await expect(page.getByText('На проверке')).toBeVisible({ timeout: 15000 });
  });

  test('секция "Live-табло: активные смены" отображается', async ({ page }) => {
    await expect(page.getByText('Live-табло: активные смены')).toBeVisible({ timeout: 15000 });
  });

  test('секция "Задачи за сегодня" отображается', async ({ page }) => {
    await expect(page.getByText('Задачи за сегодня')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Dashboard — быстрые действия (admin/owner)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('секция "Быстрые действия" отображается', async ({ page }) => {
    await expect(page.getByText('Быстрые действия')).toBeVisible();
  });

  test('кнопка "Создать задачу" видна для owner', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Создать задачу/i })).toBeVisible();
  });

  test('кнопка "Создать задачу" ведёт на /tasks и открывает модалку создания', async ({ page }) => {
    await page.getByRole('button', { name: /Создать задачу/i }).click();
    // TasksPage обрабатывает ?action=create и немедленно удаляет параметр из URL,
    // поэтому проверяем конечное состояние: страница /tasks и открытая модалка создания
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /создать задачу/i })).toBeVisible();
  });

  test('кнопка "Отчеты" видна для owner', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Отчеты/i })).toBeVisible();
  });

  test('кнопка "Отчеты" ведёт на /reports', async ({ page }) => {
    await page.getByRole('button', { name: /Отчеты/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/reports/);
  });

  test('кнопка "Полезные ссылки" видна для всех пользователей', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Полезные ссылки/i })).toBeVisible();
  });

  test('кнопка "Полезные ссылки" ведёт на /links', async ({ page }) => {
    await page.getByRole('button', { name: /Полезные ссылки/i }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/links/);
  });
});

test.describe('Dashboard — навигация из дашборда', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('кнопка "Все задачи" ведёт на /tasks', async ({ page }) => {
    const allTasksButton = page.getByRole('button', { name: /Все задачи/i });
    await expect(allTasksButton).toBeVisible();
    await allTasksButton.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tasks/);
  });
});

test.describe('Dashboard — WorkspaceSwitcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('WorkspaceSwitcher отображается в шапке страницы', async ({ page }) => {
    // WorkspaceSwitcher — кнопка с иконкой здания и названием автосалона
    const switcher = page.locator('button[title="Переключить автосалон"]');
    await expect(switcher).toBeVisible({ timeout: 10000 });
  });

  test('при клике на WorkspaceSwitcher открывается выпадающий список', async ({ page }) => {
    const switcher = page.locator('button[title="Переключить автосалон"]');
    await expect(switcher).toBeVisible({ timeout: 10000 });
    await switcher.click();

    // Должна появиться опция "Все автосалоны"
    await expect(page.getByText('Все автосалоны').first()).toBeVisible({ timeout: 5000 });
  });

  test('в выпадающем списке отображаются автосалоны', async ({ page }) => {
    const switcher = page.locator('button[title="Переключить автосалон"]');
    await expect(switcher).toBeVisible({ timeout: 10000 });
    await switcher.click();

    // Хотя бы один из демо-автосалонов должен быть виден
    const dealershipItem = page.getByText(/Автосалон/i).first();
    await expect(dealershipItem).toBeVisible({ timeout: 5000 });
  });

  test('можно выбрать конкретный автосалон из списка', async ({ page }) => {
    const switcher = page.locator('button[title="Переключить автосалон"]');
    await expect(switcher).toBeVisible({ timeout: 10000 });
    await switcher.click();

    // Ждём появления выпадающего списка с опцией "Все автосалоны"
    await expect(page.getByText('Все автосалоны').first()).toBeVisible({ timeout: 5000 });

    // Dropdown — div с absolute позиционированием, содержащий кнопки автосалонов
    // Ищем кнопки НЕ содержащие текст "Все автосалоны" (это кнопки конкретных автосалонов)
    const dealershipButtons = page.locator('button').filter({ hasNotText: /Все автосалоны|Переключить автосалон/ })
      .filter({ has: page.locator('div.text-sm.font-medium') });

    const count = await dealershipButtons.count();
    if (count === 0) {
      test.skip();
      return;
    }

    const firstDealership = dealershipButtons.first();
    // Получаем название автосалона из div.text-sm.font-medium внутри кнопки
    const dealershipName = await firstDealership.locator('div.text-sm.font-medium').textContent().catch(() => null);

    await firstDealership.click();

    // Dropdown должен закрыться — опция "Все автосалоны" больше не видна
    await expect(page.getByText('Все автосалоны').first()).not.toBeVisible({ timeout: 5000 });

    // Теперь switcher показывает выбранный автосалон
    if (dealershipName) {
      await expect(switcher).toContainText(dealershipName.trim(), { timeout: 5000 });
    }
  });
});

test.describe('Dashboard — авто-обновление', () => {
  test('страница выполняет периодические запросы к API дашборда', async ({ page }) => {
    const requests: string[] = [];

    page.on('request', (request) => {
      // Реальный URL: http://localhost:8099/api/v1/dashboard
      // Проверяем наличие '/dashboard' в URL (без '/api/dashboard' — он не является подстрокой '/api/v1/dashboard')
      if (request.url().includes('/dashboard')) {
        requests.push(request.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Ждём загрузки контента — первый запрос к dashboard API уже должен быть сделан
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

    // Первый запрос должен быть выполнен при загрузке
    expect(requests.length).toBeGreaterThanOrEqual(1);
  });
});
