import { test, expect } from '@playwright/test';

/**
 * Тесты авторизации
 */
test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу логина перед каждым тестом
    await page.goto('http://localhost:8099/login');
    await page.waitForLoadState('networkidle');
  });

  test('должна отображаться форма входа', async ({ page }) => {
    // Проверяем наличие формы входа
    await expect(page.locator('form')).toBeVisible();

    // Проверяем наличие полей ввода
    await expect(page.locator('input[name="login"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Проверяем наличие кнопки входа
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
  });

  test('должна показываться ошибка при пустых полях', async ({ page }) => {
    // Нажимаем кнопку входа без заполнения полей
    await page.getByRole('button', { name: /войти/i }).click();

    // Проверяем что поля подсвечены как обязательные (HTML5 validation)
    const loginInput = page.locator('input[name="login"]');
    await expect(loginInput).toHaveAttribute('required', '');
  });

  test('должна выполняться успешная авторизация с правильными данными', async ({ page }) => {
    // Используем демо-данные из AGENTS.md: admin/password
    await page.fill('input[name="login"]', 'admin');
    await page.fill('input[name="password"]', 'password');

    // Нажимаем кнопку входа
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждем перенаправления на дашборд
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Проверяем что мы на дашборде
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
