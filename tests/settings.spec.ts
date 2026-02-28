import { test, expect } from '@playwright/test';

/**
 * Тесты страницы настроек
 */
test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Выполняем вход
    await page.goto('http://localhost:8099/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждем перехода на дашборд
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Переходим на страницу настроек
    await page.goto('http://localhost:8099/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('страница настроек должна загружаться', async ({ page }) => {
    // Проверяем что страница загрузилась
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  });

  test('должен отображаться контент страницы настроек', async ({ page }) => {
    // Проверяем что основной контент виден
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });
});
