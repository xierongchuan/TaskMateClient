import { test, expect } from '@playwright/test';
import { MANAGER_STATE, EMPLOYEE_STATE, OBSERVER_STATE } from '../setup/helpers';

/**
 * Тесты видимости навигации в зависимости от роли.
 * Каждый describe-блок использует свой storageState.
 */

// ---------------------------------------------------------------------------
// EMPLOYEE
// ---------------------------------------------------------------------------
test.describe('Навигация — Employee: видимые разделы', () => {
  test.use({ storageState: EMPLOYEE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('employee видит Dashboard, Задачи, Моя история, Смены', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/tasks"]')).toBeVisible();
    await expect(page.locator('a[href="/my-history"]')).toBeVisible();
    await expect(page.locator('a[href="/shifts"]')).toBeVisible();
  });

  test('employee видит раздел "Ссылки"', async ({ page }) => {
    await expect(page.locator('a[href="/links"]')).toBeVisible();
  });
});

test.describe('Навигация — Employee: скрытые разделы', () => {
  test.use({ storageState: EMPLOYEE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('employee не видит "Генераторы"', async ({ page }) => {
    await expect(page.locator('a[href="/task-generators"]')).not.toBeVisible();
  });

  test('employee не видит "На проверке"', async ({ page }) => {
    await expect(page.locator('a[href="/pending-review"]')).not.toBeVisible();
  });

  test('employee не видит "Архив"', async ({ page }) => {
    await expect(page.locator('a[href="/archived-tasks"]')).not.toBeVisible();
  });

  test('employee не видит "Настройки"', async ({ page }) => {
    await expect(page.locator('a[href="/settings"]')).not.toBeVisible();
  });

  test('employee не видит "Аудит"', async ({ page }) => {
    await expect(page.locator('a[href="/audit-logs"]')).not.toBeVisible();
  });

  test('employee не видит "Отчёты"', async ({ page }) => {
    await expect(page.locator('a[href="/reports"]')).not.toBeVisible();
  });

  test('employee не видит "Автосалоны"', async ({ page }) => {
    await expect(page.locator('a[href="/dealerships"]')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// MANAGER
// ---------------------------------------------------------------------------
test.describe('Навигация — Manager: видимые разделы', () => {
  test.use({ storageState: MANAGER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('manager видит "Рабочую зону": Dashboard, Задачи, Моя история, Смены', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/tasks"]')).toBeVisible();
    await expect(page.locator('a[href="/my-history"]')).toBeVisible();
    await expect(page.locator('a[href="/shifts"]')).toBeVisible();
  });

  test('manager видит "Управление задачами": Генераторы, На проверке, Архив', async ({ page }) => {
    await expect(page.locator('a[href="/task-generators"]')).toBeVisible();
    await expect(page.locator('a[href="/pending-review"]')).toBeVisible();
    await expect(page.locator('a[href="/archived-tasks"]')).toBeVisible();
  });

  test('manager видит "Организация": Сотрудники, Автосалоны', async ({ page }) => {
    await expect(page.locator('a[href="/employees"]')).toBeVisible();
    await expect(page.locator('a[href="/dealerships"]')).toBeVisible();
  });

  test('manager видит "Ссылки"', async ({ page }) => {
    await expect(page.locator('a[href="/links"]')).toBeVisible();
  });

  test('manager видит "Отчёты" и "Настройки" в группе "Администрирование"', async ({ page }) => {
    // Раскрываем группу если свёрнута
    const adminToggle = page.getByRole('button', { name: /Администрирование/i });
    if (await adminToggle.isVisible()) {
      const reportsLink = page.locator('a[href="/reports"]');
      if (!(await reportsLink.isVisible())) {
        await adminToggle.click();
      }
    }
    await expect(page.locator('a[href="/reports"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });
});

test.describe('Навигация — Manager: скрытые разделы', () => {
  test.use({ storageState: MANAGER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Раскрываем группу "Администрирование" чтобы проверить отсутствие Аудита
    const adminToggle = page.getByRole('button', { name: /Администрирование/i });
    if (await adminToggle.isVisible()) {
      const reportsLink = page.locator('a[href="/reports"]');
      if (!(await reportsLink.isVisible())) {
        await adminToggle.click();
      }
    }
  });

  test('manager не видит "Аудит" (только для owner)', async ({ page }) => {
    await expect(page.locator('a[href="/audit-logs"]')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// OBSERVER
// ---------------------------------------------------------------------------
test.describe('Навигация — Observer: видимые разделы', () => {
  test.use({ storageState: OBSERVER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('observer видит "Рабочую зону": Dashboard, Задачи, Моя история, Смены', async ({ page }) => {
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/tasks"]')).toBeVisible();
    await expect(page.locator('a[href="/my-history"]')).toBeVisible();
    await expect(page.locator('a[href="/shifts"]')).toBeVisible();
  });

  test('observer видит "Сотрудники"', async ({ page }) => {
    await expect(page.locator('a[href="/employees"]')).toBeVisible();
  });

  test('observer видит "Ссылки"', async ({ page }) => {
    await expect(page.locator('a[href="/links"]')).toBeVisible();
  });
});

test.describe('Навигация — Observer: скрытые разделы', () => {
  test.use({ storageState: OBSERVER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('observer не видит "Генераторы"', async ({ page }) => {
    await expect(page.locator('a[href="/task-generators"]')).not.toBeVisible();
  });

  test('observer не видит "На проверке"', async ({ page }) => {
    await expect(page.locator('a[href="/pending-review"]')).not.toBeVisible();
  });

  test('observer не видит "Архив"', async ({ page }) => {
    await expect(page.locator('a[href="/archived-tasks"]')).not.toBeVisible();
  });

  test('observer не видит "Настройки"', async ({ page }) => {
    await expect(page.locator('a[href="/settings"]')).not.toBeVisible();
  });

  test('observer не видит "Аудит"', async ({ page }) => {
    await expect(page.locator('a[href="/audit-logs"]')).not.toBeVisible();
  });

  test('observer не видит "Отчёты"', async ({ page }) => {
    await expect(page.locator('a[href="/reports"]')).not.toBeVisible();
  });

  test('observer не видит "Автосалоны"', async ({ page }) => {
    await expect(page.locator('a[href="/dealerships"]')).not.toBeVisible();
  });
});
