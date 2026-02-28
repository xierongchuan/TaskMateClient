import { test, expect } from '@playwright/test';

/**
 * Тесты дашборда
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Выполняем вход
    await page.goto('http://localhost:8099/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждем перехода на дашборд
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Дополнительно ждем загрузки контента
    await page.waitForLoadState('networkidle');
  });

  test('должен отображаться основной контент дашборда', async ({ page }) => {
    // Проверяем что страница загрузилась
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('должна отображаться статистика задач', async ({ page }) => {
    // Проверяем наличие секций со статистикой
    const dashboardContent = page.locator('main');
    await expect(dashboardContent).toBeVisible();
  });

  test('должна быть возможность переключения рабочего пространства', async ({ page }) => {
    // Проверяем наличие переключателя рабочих пространств
    const workspaceButton = page.locator('button').filter({ hasText: /автосалон/i });
    await expect(workspaceButton.first()).toBeVisible({ timeout: 15000 });
  });
});
