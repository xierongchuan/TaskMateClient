import { test, expect } from '@playwright/test';
import { readState } from './setup/state';
import {
  FUNC_EMPLOYEE1_STATE,
  loginAndSaveState,
} from './setup/helpers';

/**
 * Функциональные тесты страницы профиля /profile
 * Тесты выполняются строго последовательно (serial).
 * Авторизация через storageState func-employee1.json (employee1).
 */
test.describe.serial('08 — Profile: личный профиль', () => {
  // ─── 1. Профиль загружается с данными ────────────────────────────────────

  test('профиль загружается — заголовок и имя «Сотрудник Первый» предзаполнены', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      // Поле «Полное имя» предзаполнено
      const fullNameInput = page.getByLabel('Полное имя');
      await expect(fullNameInput).toBeVisible({ timeout: 10000 });
      const value = await fullNameInput.inputValue();
      expect(value).toBe('Сотрудник Первый');
    } finally {
      await ctx.close();
    }
  });

  // ─── 2. Редактирование имени ──────────────────────────────────────────────

  test('редактирование имени — имя обновляется', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      const fullNameInput = page.getByLabel('Полное имя');
      await fullNameInput.clear();
      await fullNameInput.fill('Сотрудник Первый Изменён');

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH') &&
          resp.status() === 200,
      );

      await page
        .getByRole('button', { name: 'Сохранить изменения' })
        .click();
      await responsePromise;

      // Проверяем что поле содержит новое имя
      await expect(fullNameInput).toHaveValue(
        'Сотрудник Первый Изменён',
        { timeout: 5000 },
      );
    } finally {
      await ctx.close();
    }
  });

  // ─── 3. Возврат исходного имени ───────────────────────────────────────────

  test('возврат исходного имени «Сотрудник Первый»', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      const fullNameInput = page.getByLabel('Полное имя');
      await fullNameInput.clear();
      await fullNameInput.fill('Сотрудник Первый');

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH') &&
          resp.status() === 200,
      );

      await page
        .getByRole('button', { name: 'Сохранить изменения' })
        .click();
      await responsePromise;

      await expect(fullNameInput).toHaveValue('Сотрудник Первый', {
        timeout: 5000,
      });
    } finally {
      await ctx.close();
    }
  });

  // ─── 4. Изменение телефона ────────────────────────────────────────────────

  test('изменение телефона — сохраняется', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      const phoneInput = page.getByLabel('Телефон');
      await expect(phoneInput).toBeVisible({ timeout: 5000 });
      await phoneInput.clear();
      await phoneInput.fill('+79001234567');

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH') &&
          resp.status() === 200,
      );

      await page
        .getByRole('button', { name: 'Сохранить изменения' })
        .click();
      await responsePromise;
    } finally {
      await ctx.close();
    }
  });

  // ─── 5. Смена пароля ─────────────────────────────────────────────────────

  test('смена пароля с «password» на «newpassword123»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      // Переходим на вкладку «Безопасность»
      await page.getByRole('button', { name: 'Безопасность' }).click();
      await page.waitForTimeout(500);

      const currentPasswordInput = page.getByLabel('Текущий пароль');
      await expect(currentPasswordInput).toBeVisible({ timeout: 5000 });

      await currentPasswordInput.fill('password');
      await page.getByLabel('Новый пароль').fill('newpassword123');
      await page.getByLabel('Подтверждение пароля').fill('newpassword123');

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH' ||
            resp.request().method() === 'POST') &&
          resp.status() === 200,
      );

      await page
        .getByRole('button', { name: 'Обновить пароль' })
        .click();
      await responsePromise;

      // Сохраняем новый storageState после смены пароля
      await page.context().storageState({ path: FUNC_EMPLOYEE1_STATE });
    } finally {
      await ctx.close();
    }

    // Повторно логинимся с новым паролем и сохраняем storageState
    const newCtx = await browser.newContext();
    const newPage = await newCtx.newPage();
    try {
      await loginAndSaveState(
        newPage,
        'func_emp1',
        'newpassword123',
        FUNC_EMPLOYEE1_STATE,
      );
    } finally {
      await newCtx.close();
    }
  });

  // ─── 6. Вход с новым паролем ─────────────────────────────────────────────

  test('вход с новым паролем «newpassword123» — переход на dashboard', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="login"]', 'func_emp1');
    await page.fill('input[name="password"]', 'newpassword123');
    await page.getByRole('button', { name: /войти/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(
      page.getByRole('heading', { name: /дашборд|главная|задачи/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 7. Возврат исходного пароля ─────────────────────────────────────────

  test('возврат исходного пароля «password»', async ({ browser }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: 'Безопасность' }).click();
      await page.waitForTimeout(500);

      const currentPasswordInput = page.getByLabel('Текущий пароль');
      await expect(currentPasswordInput).toBeVisible({ timeout: 5000 });

      await currentPasswordInput.fill('newpassword123');
      await page.getByLabel('Новый пароль').fill('password');
      await page.getByLabel('Подтверждение пароля').fill('password');

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH' ||
            resp.request().method() === 'POST') &&
          resp.status() === 200,
      );

      await page
        .getByRole('button', { name: 'Обновить пароль' })
        .click();
      await responsePromise;

      // Пересохраняем storageState
      await page.context().storageState({ path: FUNC_EMPLOYEE1_STATE });
    } finally {
      await ctx.close();
    }

    // Повторно логинимся с исходным паролем
    const newCtx = await browser.newContext();
    const newPage = await newCtx.newPage();
    try {
      await loginAndSaveState(
        newPage,
        'func_emp1',
        'password',
        FUNC_EMPLOYEE1_STATE,
      );
    } finally {
      await newCtx.close();
    }
  });

  // ─── 8. Валидация: несовпадающие пароли ──────────────────────────────────

  test('валидация: несовпадающие пароли — ошибка «Пароли не совпадают»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: 'Безопасность' }).click();
      await page.waitForTimeout(500);

      const currentPasswordInput = page.getByLabel('Текущий пароль');
      await expect(currentPasswordInput).toBeVisible({ timeout: 5000 });

      await currentPasswordInput.fill('password');
      await page.getByLabel('Новый пароль').fill('newpass123');
      await page
        .getByLabel('Подтверждение пароля')
        .fill('differentpass456');

      await page
        .getByRole('button', { name: 'Обновить пароль' })
        .click();

      // Ошибка «Пароли не совпадают»
      await expect(
        page.getByText('Пароли не совпадают'),
      ).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  // ─── 9. Валидация: слишком короткий пароль ───────────────────────────────

  test('валидация: пароль менее 6 символов — ошибка валидации', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Мой профиль' }),
      ).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: 'Безопасность' }).click();
      await page.waitForTimeout(500);

      const currentPasswordInput = page.getByLabel('Текущий пароль');
      await expect(currentPasswordInput).toBeVisible({ timeout: 5000 });

      await currentPasswordInput.fill('password');
      await page.getByLabel('Новый пароль').fill('abc');
      await page.getByLabel('Подтверждение пароля').fill('abc');

      await page
        .getByRole('button', { name: 'Обновить пароль' })
        .click();

      // Ошибка о минимальной длине пароля
      await expect(
        page.getByText(/не менее 6 символ|минимум 6|слишком короткий/i),
      ).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });
});
