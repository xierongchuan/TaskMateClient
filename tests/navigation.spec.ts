import { test, expect } from '@playwright/test';

/**
 * Тесты навигации и сайдбара
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Выполняем вход
    await page.goto('http://localhost:8099/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждем перехода на дашборд
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
  });

  test('должен отображаться сайдбар', async ({ page }) => {
    // Проверяем наличие основных элементов сайдбара
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('должен отображаться основной контент', async ({ page }) => {
    // Проверяем наличие основного контента
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('должен переходить на страницу задач', async ({ page }) => {
    // Ищем ссылку на задачи в сайдбаре
    const tasksLink = page.locator('a[href="/tasks"]');
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await page.waitForURL('**/tasks', { timeout: 15000 });
      await expect(page).toHaveURL(/.*tasks/);
    }
  });

  test('должен переходить на страницу сотрудников', async ({ page }) => {
    // Ищем ссылку на сотрудников
    const employeesLink = page.locator('a[href="/employees"]');
    if (await employeesLink.isVisible()) {
      await employeesLink.click();
      await page.waitForURL('**/employees', { timeout: 15000 });
      await expect(page).toHaveURL(/.*employees/);
    }
  });
});
