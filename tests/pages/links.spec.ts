import { test, expect } from '@playwright/test';

/**
 * Тесты страницы ссылок (/links)
 * Запускаются от admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('LinksPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/links');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Ссылки' })).toBeVisible({ timeout: 15000 });
  });

  test('страница ссылок загружается с заголовком "Ссылки"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ссылки' })).toBeVisible({ timeout: 10000 });
  });

  test('кнопка "Добавить ссылку" видна для admin (owner)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /добавить ссылку/i })).toBeVisible({ timeout: 10000 });
  });

  test('ViewModeToggle отображается и позволяет переключать вид', async ({ page }) => {
    const listBtn = page.getByRole('button', { name: /список/i });
    const gridBtn = page.getByRole('button', { name: /карточки/i });
    await expect(listBtn).toBeVisible({ timeout: 10000 });
    await expect(gridBtn).toBeVisible();

    await listBtn.click();
    await gridBtn.click();
    await expect(gridBtn).toBeVisible();
  });

  test('поле поиска ссылок присутствует на странице', async ({ page }) => {
    // SearchInput имеет placeholder "Поиск ссылок..."
    await expect(page.getByPlaceholder(/поиск ссылок/i)).toBeVisible({ timeout: 10000 });
  });

  test('клик по "Добавить ссылку" открывает модальное окно с формой', async ({ page }) => {
    await page.getByRole('button', { name: /добавить ссылку/i }).click();

    // Модальное окно с заголовком
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /добавить ссылку/i })).toBeVisible();
  });

  test('форма создания ссылки содержит поля Название, URL, Категория, Описание', async ({ page }) => {
    await page.getByRole('button', { name: /добавить ссылку/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('label', { hasText: 'Название' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'URL' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Категория' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Описание' })).toBeVisible();
  });

  test('контент страницы отображает ссылки или пустое состояние', async ({ page }) => {
    // Ждём завершения загрузки — либо карточки, либо EmptyState, либо skeleton исчезнет
    // Используем .first() чтобы избежать strict mode violation при множестве кнопок "Открыть"
    const hasLinks = page.locator('text=Открыть').first();
    const emptyState = page.getByText('Нет ссылок').or(page.getByText('Ссылки не найдены')).first();
    // Ждём появления одного из состояний
    await expect(hasLinks.or(emptyState)).toBeVisible({ timeout: 15000 });
  });
});
