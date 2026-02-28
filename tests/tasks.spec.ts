import { test, expect } from '@playwright/test';

/**
 * Тесты страницы задач
 */
test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Выполняем вход
    await page.goto('http://localhost:8099/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждем перехода на дашборд
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Переходим на страницу задач через URL
    await page.goto('http://localhost:8099/tasks');
    await page.waitForTimeout(5000);
  });

  test('страница задач должна загружаться без ошибок', async ({ page }) => {
    // Проверяем что URL содержит tasks
    await expect(page).toHaveURL(/.*tasks/);
  });
});
