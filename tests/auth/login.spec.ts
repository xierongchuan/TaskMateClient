import { test, expect } from '@playwright/test';

test.describe('Страница входа — отображение', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('форма входа отображается корректно', async ({ page }) => {
    await expect(page.locator('input[name="login"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Войти');
  });

  test('поля содержат правильные атрибуты', async ({ page }) => {
    const loginInput = page.locator('input[name="login"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(loginInput).toHaveAttribute('placeholder', 'Логин');
    await expect(loginInput).toHaveAttribute('required', '');
    await expect(loginInput).toHaveAttribute('maxlength', '64');

    await expect(passwordInput).toHaveAttribute('placeholder', 'Пароль');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('отображается заголовок и подзаголовок системы', async ({ page }) => {
    await expect(page.getByText('Система управления задачами')).toBeVisible();
  });
});

test.describe('Страница входа — валидация формы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('кнопка "Войти" неактивна или показывает ошибку при пустом логине', async ({ page }) => {
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();

    const loginInput = page.locator('input[name="login"]');
    // HTML5 required validation prevents submission
    await expect(loginInput).toHaveAttribute('required', '');
    await expect(page).toHaveURL(/\/login/);
  });

  test('кнопка "Войти" неактивна или показывает ошибку при пустом пароле', async ({ page }) => {
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('button[type="submit"]').click();

    const passwordInput = page.locator('input[name="password"]');
    // HTML5 required validation prevents submission
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(page).toHaveURL(/\/login/);
  });

  test('при полностью пустой форме остаёмся на странице входа', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Страница входа — неверные учётные данные', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('показывается сообщение об ошибке при неверных данных', async ({ page }) => {
    await page.locator('input[name="login"]').fill('wronguser');
    await page.locator('input[name="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();

    const errorBlock = page.locator('div[class*="bg-red-50"]');
    await expect(errorBlock).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('при ошибке форма остаётся доступной для повторного ввода', async ({ page }) => {
    await page.locator('input[name="login"]').fill('wronguser');
    await page.locator('input[name="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('div[class*="bg-red-50"]')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('input[name="login"]')).toBeEnabled();
    await expect(page.locator('input[name="password"]')).toBeEnabled();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});

test.describe('Страница входа — состояние загрузки', () => {
  test('кнопка показывает состояние загрузки во время запроса', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="password"]').fill('password');

    // Intercept the network request to delay it and observe loading state
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(submitButton).toHaveText('Выполняется вход...', { timeout: 2000 });
  });
});

test.describe('Страница входа — успешная авторизация', () => {
  test('успешный вход как admin (owner) → перенаправление на /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('успешный вход как manager1 → перенаправление на /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('manager1');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('успешный вход как emp1_1 (employee) → перенаправление на /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('emp1_1');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('успешный вход как obs1 (observer) → перенаправление на /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('obs1');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Страница входа — уже авторизованный пользователь', () => {
  test('авторизованный пользователь перенаправляется с /login на /dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Try to access /login again while authenticated
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Выход из системы', () => {
  test('после выхода пользователь перенаправляется на /login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[name="login"]').fill('admin');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });

    // Кнопка "Выйти из аккаунта" находится только на странице профиля
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Мой профиль' })).toBeVisible({ timeout: 15000 });

    // Нажимаем кнопку выхода из аккаунта
    const logoutButton = page.getByRole('button', { name: /выйти из аккаунта/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    await logoutButton.click();

    // Should redirect to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
