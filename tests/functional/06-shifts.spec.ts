import { test, expect } from '@playwright/test';
import { readState } from './setup/state';
import { FUNC_EMPLOYEE1_STATE } from './setup/helpers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');

/**
 * Функциональные тесты страницы смен /shifts
 * Тесты выполняются строго последовательно (serial).
 * Открытие/закрытие смены — от сотрудника (employee1).
 * Просмотр истории — от admin.
 */
test.describe.serial('06 — Shifts: управление сменами', () => {
  // ─── 1. Страница загружается ─────────────────────────────────────────────

  test('страница загружается — заголовок и карточки статистики видны', async ({
    page,
  }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: 'Смены' }),
    ).toBeVisible({ timeout: 15000 });

    // Карточки статистики
    await expect(page.getByText('Всего смен')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Открыто сейчас')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 2. Пустое состояние / история смен ──────────────────────────────────

  test('секция «История смен» видна', async ({ page }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Смены' }),
    ).toBeVisible({ timeout: 15000 });

    // Секция истории смен должна быть видна
    await expect(page.getByText('История смен')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 3. employee1 открывает смену ────────────────────────────────────────

  test('employee1 открывает смену с фото — статус «Смена открыта»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const empPage = await ctx.newPage();

    try {
      await empPage.goto('/shifts');
      await empPage.waitForLoadState('domcontentloaded');
      await expect(
        empPage.getByRole('heading', { name: 'Смены' }),
      ).toBeVisible({ timeout: 15000 });

      // Секция управления сменой
      await expect(empPage.getByText('Управление сменой')).toBeVisible({
        timeout: 10000,
      });

      // Выбираем автосалон
      const dealershipSelect = empPage
        .locator('label')
        .filter({ hasText: 'Автосалон' })
        .locator('..')
        .locator('select')
        .first();
      const dealershipSelectExists = await dealershipSelect
        .isVisible()
        .catch(() => false);

      if (dealershipSelectExists) {
        await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });
        await empPage.waitForTimeout(500);
      }

      // Загружаем фото открытия смены
      const fileInput = empPage
        .locator('#opening-photo')
        .or(empPage.locator('input[type="file"]').first());
      await fileInput.setInputFiles(TEST_IMAGE);

      await empPage.waitForTimeout(500);

      // Нажимаем «Открыть смену»
      const openShiftButton = empPage.getByRole('button', {
        name: 'Открыть смену',
      });
      await expect(openShiftButton).toBeVisible({ timeout: 5000 });

      const responsePromise = empPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/shifts') &&
          resp.request().method() === 'POST' &&
          (resp.status() === 200 || resp.status() === 201),
      );

      await openShiftButton.click();
      await responsePromise;

      // Статус должен измениться на «Смена открыта»
      await expect(empPage.getByText('Смена открыта')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await ctx.close();
    }
  });

  // ─── 4. employee1 закрывает смену ────────────────────────────────────────

  test('employee1 закрывает смену — статус «Смена закрыта»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const empPage = await ctx.newPage();

    try {
      await empPage.goto('/shifts');
      await empPage.waitForLoadState('domcontentloaded');
      await expect(
        empPage.getByRole('heading', { name: 'Смены' }),
      ).toBeVisible({ timeout: 15000 });

      // Смена должна быть открыта
      await expect(empPage.getByText('Смена открыта')).toBeVisible({
        timeout: 10000,
      });

      // Загружаем фото закрытия (необязательно, но загружаем)
      const closingFileInput = empPage
        .locator('input[type="file"]')
        .last();
      const closingFileExists = await closingFileInput
        .isVisible()
        .catch(() => false);
      if (closingFileExists) {
        await closingFileInput.setInputFiles(TEST_IMAGE);
        await empPage.waitForTimeout(500);
      }

      // Нажимаем «Закрыть смену»
      const closeShiftButton = empPage.getByRole('button', {
        name: 'Закрыть смену',
      });
      await expect(closeShiftButton).toBeVisible({ timeout: 5000 });
      await closeShiftButton.click();

      // Диалог подтверждения «Закрыть смену?»
      await expect(empPage.getByText('Закрыть смену?')).toBeVisible({
        timeout: 5000,
      });

      const responsePromise = empPage.waitForResponse(
        (resp) =>
          resp.url().includes('/api/shifts') &&
          (resp.request().method() === 'PUT' ||
            resp.request().method() === 'PATCH' ||
            resp.request().method() === 'POST') &&
          resp.status() === 200,
      );

      // Подтверждаем в диалоге
      await empPage
        .getByRole('button', { name: 'Закрыть смену' })
        .last()
        .click();
      await responsePromise;

      // Статус должен измениться на «Смена закрыта»
      await expect(empPage.getByText('Смена закрыта')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await ctx.close();
    }
  });

  // ─── 5. admin видит смену в истории ──────────────────────────────────────

  test('admin видит закрытую смену в истории', async ({ page }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Смены' }),
    ).toBeVisible({ timeout: 15000 });

    // История смен должна показывать хотя бы одну запись
    await expect(page.getByText('История смен')).toBeVisible({
      timeout: 10000,
    });

    // Ищем запись смены в списке
    const shiftEntry = page
      .getByText('Автосалон Тест-1')
      .or(page.getByText('Сотрудник Первый'))
      .first();

    await expect(shiftEntry).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. admin видит детали смены ─────────────────────────────────────────

  test('admin видит детали записи смены в истории', async ({ page }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Смены' }),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('История смен')).toBeVisible({
      timeout: 10000,
    });

    // Запись смены должна содержать имя сотрудника или автосалон
    const shiftDetails = page
      .getByText('Сотрудник Первый')
      .or(page.getByText('Автосалон Тест-1'))
      .first();

    await expect(shiftDetails).toBeVisible({ timeout: 10000 });

    // Статус смены виден
    const closedBadge = page.getByText('Закрыта').or(
      page.getByText('Смена закрыта'),
    ).first();
    await expect(closedBadge).toBeVisible({ timeout: 5000 });
  });
});
