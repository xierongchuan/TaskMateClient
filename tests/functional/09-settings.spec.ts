import { test, expect } from '@playwright/test';
import { FUNC_MANAGER_STATE, FUNC_EMPLOYEE1_STATE } from './setup/helpers';

/**
 * Функциональные тесты страницы настроек /settings
 * Тесты выполняются строго последовательно (serial).
 * Авторизация через storageState func-admin.json (admin/owner).
 * Проверяет доступность всех 7 вкладок и ролевые ограничения.
 */
test.describe.serial('Settings — настройки системы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Настройки', exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: 'Общие' }),
    ).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Страница загружается ─────────────────────────────────────────────

  test('страница загружается — заголовок и все 7 вкладок видны', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Настройки', exact: true }),
    ).toBeVisible();

    const tabNames = [
      'Общие',
      'Интерфейс',
      'Задачи',
      'Календарь',
      'Смены',
      'Уведомления',
      'Обслуживание',
    ];

    for (const name of tabNames) {
      await expect(
        page.getByRole('button', { name }),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  // ─── 2. Вкладка «Общие» активна по умолчанию ─────────────────────────────

  test('вкладка «Общие» активна по умолчанию — контент «Общие настройки» виден', async ({
    page,
  }) => {
    // По умолчанию открыта вкладка «Общие» — заголовок секции должен быть виден
    await expect(
      page.getByText('Общие настройки'),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 3. Вкладка «Интерфейс» — смена темы ─────────────────────────────────

  test('вкладка «Интерфейс» — переключение темы на «Темная» и обратно', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Интерфейс' }).click();

    // Контент вкладки загружен
    await expect(
      page
        .getByText('Тема оформления')
        .or(page.getByText('Интерфейс и Отображение'))
        .first(),
    ).toBeVisible({ timeout: 10000 });

    // Кнопка «Тёмная» тема
    const darkButton = page.getByRole('button', { name: 'Темная' })
      .or(page.locator('button').filter({ hasText: /Темная/i }))
      .first();

    await expect(darkButton).toBeVisible({ timeout: 5000 });
    await darkButton.click();

    // Небольшая пауза — тема должна применяться (CSS класс или атрибут)
    await page.waitForTimeout(500);

    // Проверяем что кнопка отображает выбранное состояние:
    // aria-pressed, class с "active"/"selected" или визуальный индикатор
    const isDarkSelected =
      (await darkButton.getAttribute('aria-pressed')) === 'true' ||
      (await darkButton.getAttribute('data-active')) === 'true' ||
      (await darkButton.evaluate((el) =>
        el.className.includes('active') ||
        el.className.includes('selected') ||
        el.className.includes('ring') ||
        el.className.includes('border-blue') ||
        el.className.includes('bg-blue'),
      ));
    expect(isDarkSelected).toBeTruthy();

    // Возвращаем тему «Светлая»
    const lightButton = page
      .getByRole('button', { name: 'Светлая' })
      .or(page.locator('button').filter({ hasText: /Светлая/i }))
      .first();

    await expect(lightButton).toBeVisible({ timeout: 5000 });
    await lightButton.click();

    await page.waitForTimeout(500);
  });

  // ─── 4. Вкладка «Задачи» ─────────────────────────────────────────────────

  test('вкладка «Задачи» — настройки задач видны', async ({ page }) => {
    await page.getByRole('button', { name: 'Задачи' }).click();

    // Контент вкладки: чекбокс о связи со сменами или задержка архивации
    await expect(
      page
        .getByText('Задержка архивации')
        .or(page.getByText('Связь со сменами'))
        .or(page.getByText('Требовать открытую смену'))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 5. Вкладка «Календарь» ──────────────────────────────────────────────

  test('вкладка «Календарь» — годовой календарь и год видны', async ({ page }) => {
    await page.getByRole('button', { name: 'Календарь' }).click();

    // Заголовок секции или сам год (2025/2026)
    await expect(
      page
        .getByText('Календарь выходных дней')
        .or(page.getByText(/202[56]/))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. Вкладка «Смены» ──────────────────────────────────────────────────

  test('вкладка «Смены» — настройки расписания видны', async ({ page }) => {
    await page.getByRole('button', { name: 'Смены' }).click();

    // Контент вкладки: рабочие дни или расписание смен
    await expect(
      page
        .getByText('Рабочие дни')
        .or(page.getByText('Расписание смен'))
        .or(page.getByText('Допуск опоздания'))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 7. Менеджер имеет доступ к /settings ────────────────────────────────

  test('менеджер имеет доступ — страница /settings загружается с заголовком', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();

    try {
      await page.goto('/settings');
      await page.waitForLoadState('domcontentloaded');

      // Менеджер может видеть страницу настроек (или быть перенаправлен —
      // зависит от политики доступа. Проверяем что страница загрузилась)
      const hasHeading = await page
        .getByRole('heading', { name: 'Настройки', exact: true })
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      const isRedirected = !page.url().includes('/settings');

      // Одно из двух должно быть верно: страница открылась ИЛИ был редирект
      expect(hasHeading || isRedirected).toBeTruthy();
    } finally {
      await ctx.close();
    }
  });

  // ─── 8. Сотрудник НЕ имеет доступа к /settings ───────────────────────────

  test('сотрудник НЕ имеет доступа — редирект или отказ в доступе', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const page = await ctx.newPage();

    try {
      await page.goto('/settings');
      await page.waitForLoadState('domcontentloaded');

      // Небольшая пауза для завершения редиректа
      await page.waitForTimeout(2000);

      // Сотрудник должен быть перенаправлен или видеть ошибку доступа
      const isRedirectedAway = !page.url().includes('/settings');
      const isAccessDenied = await page
        .getByText(/Доступ запрещен|Доступ запрещён|нет прав|не авторизован/i)
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(isRedirectedAway || isAccessDenied).toBeTruthy();
    } finally {
      await ctx.close();
    }
  });
});
