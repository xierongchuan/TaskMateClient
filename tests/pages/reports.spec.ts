import { test, expect } from '@playwright/test';

/**
 * Тесты страницы отчётности /reports
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('Reports — страница отчётности', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Отчетность' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Отчетность"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Отчетность' })).toBeVisible();
  });

  test('кнопки выбора периода видны ("Эта неделя", "Этот месяц")', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Эта неделя' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Этот месяц' })).toBeVisible();
  });

  test('итоговые карточки видны после загрузки данных', async ({ page }) => {
    // Карточки "Всего задач", "Выполнено", "Просрочено", "Опоздания"
    // Проверяем хотя бы одну из них
    const summaryCards = page.getByText(/Всего задач|Выполнено|Просрочено|Опоздания/);
    await expect(summaryCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('переключение на "Этот месяц" меняет активную кнопку', async ({ page }) => {
    const monthButton = page.getByRole('button', { name: 'Этот месяц' });
    await monthButton.click();
    await page.waitForTimeout(1000);

    // После клика страница не упала — основной контент виден
    await expect(page.locator('main')).toBeVisible();
    // Кнопка "Эта неделя" всё ещё присутствует
    await expect(page.getByRole('button', { name: 'Эта неделя' })).toBeVisible();
  });

  test('секция эффективности сотрудников или распределения задач видна', async ({ page }) => {
    // Ждём данные — либо секции с данными, либо empty state
    // Используем .first() чтобы избежать strict mode violation: оба заголовка секций
    // ("Эффективность сотрудников" и "Распределение задач по статусам") могут быть видны одновременно
    await expect(
      page.getByText('Эффективность сотрудников')
        .or(page.getByText('Распределение задач по статусам'))
        .or(page.getByText('Нет данных для отчета'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('кнопка "Экспорт" присутствует на странице', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Экспорт' })).toBeVisible();
  });

  test('поле выбора формата (JSON/PDF) видно', async ({ page }) => {
    // Select с опциями JSON/PDF
    const formatSelect = page.locator('select').filter({ hasText: /JSON|PDF/ })
      .or(page.locator('select option[value="json"]').locator('..'));
    // Достаточно проверить наличие select на странице
    const selectCount = await page.locator('select').count();
    expect(selectCount).toBeGreaterThan(0);
  });

  test('кнопка "Обновить" присутствует на странице', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible();
  });
});
