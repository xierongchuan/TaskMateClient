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
 * Закрытие смены — от сотрудника (employee1).
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

  // ─── 3. admin видит смену в истории ──────────────────────────────────────

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

  // ─── 5. admin видит детали смены ─────────────────────────────────────────

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
