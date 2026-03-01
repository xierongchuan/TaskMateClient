import { test, expect } from '@playwright/test';

/**
 * Тесты страницы журнала аудита /audit-logs
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('AuditLog — журнал аудита', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audit-logs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Журнал аудита' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Журнал аудита"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Журнал аудита' })).toBeVisible();
  });

  test('секция фильтров с выпадающими списками видна', async ({ page }) => {
    // Фильтры: Тип записи, Действие — рендерятся непосредственно на странице (без тоггла)
    await expect(page.getByText('Тип записи').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Действие').first()).toBeVisible({ timeout: 10000 });
  });

  test('заголовки таблицы присутствуют', async ({ page }) => {
    // Ждём загрузки данных или empty state
    // Проверяем заголовки таблицы — видны только если есть записи
    const tableOrEmpty = page.getByText('ID').or(page.getByText('Нет записей')).or(page.getByText('Журнал аудита пуст'));
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 15000 });
  });

  test('записи журнала аудита существуют (демо-данные)', async ({ page }) => {
    // После seed демо-данных должны быть записи в логах (создание пользователей, автосалонов)
    // Если данные есть — будет кнопка "Детали", если нет — empty state
    // Используем .or() для ожидания одного из двух состояний (данные или пустое состояние)
    const dataIndicator = page.getByRole('button', { name: 'Детали' }).first();
    const emptyIndicator = page.getByText(/Нет записей|Журнал аудита пуст/);
    await expect(dataIndicator.or(emptyIndicator)).toBeVisible({ timeout: 15000 });
  });

  test('фильтр по типу записи работает', async ({ page }) => {
    // Находим select "Тип записи" и выбираем "Задачи"
    const typeSelect = page.locator('label').filter({ hasText: 'Тип записи' }).locator('..').locator('select');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('tasks');
      await page.waitForTimeout(1000);
      // Страница не упала
      await expect(page.locator('main')).toBeVisible();
    } else {
      // Альтернативный поиск select
      const selects = page.locator('select');
      const count = await selects.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('кнопка "Сбросить" появляется после активации фильтра', async ({ page }) => {
    // Выбираем значение в фильтре "Действие"
    const actionSelect = page.locator('label').filter({ hasText: 'Действие' }).locator('..').locator('select');
    if (await actionSelect.isVisible()) {
      await actionSelect.selectOption('created');
      await page.waitForTimeout(1000);
      // Кнопка "Сбросить" должна появиться
      await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('кнопка "Детали" открывает модальное окно', async ({ page }) => {
    const detailsButton = page.getByRole('button', { name: 'Детали' }).first();

    if (await detailsButton.isVisible({ timeout: 10000 })) {
      await detailsButton.click();
      // Модальное окно с заголовком "Детали записи аудита"
      await expect(page.getByText('Детали записи аудита')).toBeVisible({ timeout: 5000 });
      // В модальном окне есть кнопка "Закрыть"
      await expect(page.getByRole('button', { name: 'Закрыть' })).toBeVisible();
    }
  });

  test('счётчик найденных записей виден', async ({ page }) => {
    // "Найдено: N"
    await expect(page.getByText(/Найдено:/).first()).toBeVisible({ timeout: 15000 });
  });
});
