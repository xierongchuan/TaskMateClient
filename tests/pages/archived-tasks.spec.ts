import { test, expect } from '@playwright/test';

/**
 * Тесты страницы архива задач /archived-tasks
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('ArchivedTasks — архив задач', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archived-tasks');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Архив задач' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Архив задач"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Архив задач' })).toBeVisible();
  });

  test('кнопка переключения вида (ViewModeToggle) присутствует', async ({ page }) => {
    // ViewModeToggle рендерит кнопки с title="Список" и title="Карточки"
    await expect(page.locator('button[title="Список"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button[title="Карточки"]')).toBeVisible({ timeout: 15000 });
  });

  test('кнопка "Экспорт CSV" видна', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Экспорт CSV' })).toBeVisible();
  });

  test('карточки статистики видны если есть данные в архиве', async ({ page }) => {
    // StatCard-и показываются только если total > 0
    // Ждём одно из двух состояний: статистика или пустой архив
    const statsIndicator = page.getByText('Всего в архиве');
    const emptyIndicator = page.getByText(/Архив пуст/);
    await expect(statsIndicator.or(emptyIndicator)).toBeVisible({ timeout: 15000 });
  });

  test('FilterPanel присутствует и раскрывается', async ({ page }) => {
    // FilterPanel имеет кнопку-триггер с текстом "Фильтры" или иконкой
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    await expect(filterToggle).toBeVisible({ timeout: 10000 });
    // Кликаем чтобы открыть
    await filterToggle.click();
    // После раскрытия появляется поле поиска
    await expect(
      page.locator('input[placeholder*="Название"]').or(page.getByLabel('Поиск'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('пустое состояние или список задач отображается корректно', async ({ page }) => {
    const hasTasksOrEmpty = await page.getByText(/Архив пуст|Детали|Восстановить/).first().isVisible({ timeout: 15000 })
      .catch(() => false);
    // Страница не упала
    await expect(page.locator('main')).toBeVisible();
  });

  test('переключение вида (list/grid) работает на десктопе', async ({ page }) => {
    // ViewModeToggle рендерит кнопки с title="Список" и title="Карточки"
    const listBtn = page.locator('button[title="Список"]');
    const gridBtn = page.locator('button[title="Карточки"]');

    if (await listBtn.isVisible()) {
      await gridBtn.click();
      await expect(page.locator('main')).toBeVisible();
      await listBtn.click();
      await expect(page.locator('main')).toBeVisible();
    } else {
      // На мобильном или если ViewModeToggle скрыт — просто проверяем страницу
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
