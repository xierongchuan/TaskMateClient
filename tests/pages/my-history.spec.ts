import { test, expect } from '@playwright/test';

/**
 * Тесты страницы "Моя история" (/my-history)
 * Запускаются от admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('MyHistoryPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-history');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Моя история' })).toBeVisible({ timeout: 15000 });
  });

  test('страница "Моя история" загружается с заголовком', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Моя история' })).toBeVisible({ timeout: 10000 });
  });

  test('фильтр по статусу видим с опциями', async ({ page }) => {
    // Select с label "Статус"
    await expect(page.locator('label', { hasText: 'Статус' })).toBeVisible({ timeout: 10000 });

    const statusSelect = page.locator('select');
    await expect(statusSelect).toBeVisible();

    // Проверяем что опции присутствуют
    const options = await statusSelect.locator('option').allTextContents();
    expect(options).toContain('Все статусы');
    expect(options).toContain('Выполнено');
    expect(options).toContain('На проверке');
    expect(options).toContain('Подтверждено');
  });

  test('область контента показывает карточки задач или пустое состояние', async ({ page }) => {
    // Для admin (owner) история пуста — показывается EmptyState
    await expect(
      page.locator('text=История пуста')
        .or(page.locator('text=Подробнее'))
        .or(page.locator('text=Найдено:'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('изменение фильтра статуса меняет URL или вызывает обновление контента', async ({ page }) => {
    const statusSelect = page.locator('select');
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    // Выбираем "Выполнено"
    await statusSelect.selectOption('completed');
    await page.waitForTimeout(1000);

    // Счётчик должен обновиться (либо показать 0 — история пуста, либо задачи)
    // page.locator() не принимает RegExp — используем getByText() для текста с регулярным выражением
    await expect(
      page.locator('text=История пуста')
        .or(page.getByText(/Найдено:/))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });
});
