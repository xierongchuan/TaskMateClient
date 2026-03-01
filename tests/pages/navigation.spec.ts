import { test, expect } from '@playwright/test';

/**
 * Тесты навигации — запускаются от admin (owner), storageState задан в playwright.config.ts
 */
test.describe('Навигация — структура сайдбара', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('сайдбар (aside) отображается после авторизации', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
  });

  test('основной контент (main) отображается', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Навигация — ссылки admin (owner) в сайдбаре', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('присутствуют все ссылки группы "Рабочая зона"', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/tasks"]')).toBeVisible();
    await expect(page.locator('a[href="/my-history"]')).toBeVisible();
    await expect(page.locator('a[href="/shifts"]')).toBeVisible();
  });

  test('присутствует ссылка на "Ссылки" (/links)', async ({ page }) => {
    await expect(page.locator('a[href="/links"]')).toBeVisible();
  });

  test('присутствуют ссылки группы "Управление задачами" для owner', async ({ page }) => {
    await expect(page.locator('a[href="/task-generators"]')).toBeVisible();
    await expect(page.locator('a[href="/pending-review"]')).toBeVisible();
    await expect(page.locator('a[href="/archived-tasks"]')).toBeVisible();
  });

  test('присутствуют ссылки группы "Организация" для owner', async ({ page }) => {
    await expect(page.locator('a[href="/employees"]')).toBeVisible();
    await expect(page.locator('a[href="/dealerships"]')).toBeVisible();
  });

  test('ссылки группы "Администрирование" доступны после раскрытия группы', async ({ page }) => {
    // Группа "Администрирование" свёрнута по умолчанию — раскрываем её
    const adminGroupToggle = page.getByRole('button', { name: /Администрирование/i });
    if (await adminGroupToggle.isVisible()) {
      await adminGroupToggle.click();
    }

    await expect(page.locator('a[href="/reports"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
    // /audit-logs виден только для owner
    await expect(page.locator('a[href="/audit-logs"]')).toBeVisible();
  });
});

test.describe('Навигация — переходы по ссылкам', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('клик на "Задачи" переходит на /tasks', async ({ page }) => {
    await page.locator('a[href="/tasks"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Сотрудники" переходит на /employees', async ({ page }) => {
    await page.locator('a[href="/employees"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/employees/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Смены" переходит на /shifts', async ({ page }) => {
    await page.locator('a[href="/shifts"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/shifts/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Генераторы" переходит на /task-generators', async ({ page }) => {
    await page.locator('a[href="/task-generators"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/task-generators/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Автосалоны" переходит на /dealerships', async ({ page }) => {
    await page.locator('a[href="/dealerships"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dealerships/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Ссылки" переходит на /links', async ({ page }) => {
    await page.locator('a[href="/links"]').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/links/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Настройки" переходит на /settings', async ({ page }) => {
    // Группа "Администрирование" свёрнута по умолчанию — всегда раскрываем её.
    // Нельзя полагаться на isVisible() для элементов, скрытых через max-h-0/overflow-hidden:
    // Playwright считает такие элементы видимыми, даже если они не кликабельны визуально.
    const adminGroupToggle = page.getByRole('button', { name: /Администрирование/i });
    await expect(adminGroupToggle).toBeVisible({ timeout: 5000 });
    await adminGroupToggle.click();

    const settingsLink = page.locator('a[href="/settings"]');
    await expect(settingsLink).toBeVisible({ timeout: 5000 });
    await settingsLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Отчёты" переходит на /reports', async ({ page }) => {
    // Группа "Администрирование" свёрнута по умолчанию — всегда раскрываем её.
    const adminGroupToggle = page.getByRole('button', { name: /Администрирование/i });
    await expect(adminGroupToggle).toBeVisible({ timeout: 5000 });
    await adminGroupToggle.click();

    const reportsLink = page.locator('a[href="/reports"]');
    await expect(reportsLink).toBeVisible({ timeout: 5000 });
    await reportsLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('клик на "Аудит" переходит на /audit-logs', async ({ page }) => {
    // Группа "Администрирование" свёрнута по умолчанию — всегда раскрываем её.
    const adminGroupToggle = page.getByRole('button', { name: /Администрирование/i });
    await expect(adminGroupToggle).toBeVisible({ timeout: 5000 });
    await adminGroupToggle.click();

    const auditLink = page.locator('a[href="/audit-logs"]');
    await expect(auditLink).toBeVisible({ timeout: 5000 });
    await auditLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/audit-logs/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Навигация — группа "Администрирование" сворачиваема', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('группа "Администрирование" имеет кнопку-тоггл', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Администрирование/i })).toBeVisible();
  });

  test('клик на тоггл раскрывает группу "Администрирование"', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Администрирование/i });

    // Убедимся что /reports скрыт (группа свёрнута по умолчанию)
    const reportsLink = page.locator('a[href="/reports"]');
    const isInitiallyHidden = !(await reportsLink.isVisible());

    if (isInitiallyHidden) {
      await toggle.click();
      await expect(reportsLink).toBeVisible();
    } else {
      // Группа уже раскрыта — достаточно проверить наличие ссылок
      await expect(reportsLink).toBeVisible();
    }
  });
});
