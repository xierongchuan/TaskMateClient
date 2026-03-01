import { test, expect } from '@playwright/test';

/**
 * Тесты страницы смен (/shifts)
 * Запускаются от admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('ShiftsPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Смены' })).toBeVisible({ timeout: 15000 });
  });

  test('страница смен загружается с заголовком "Смены"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Смены' })).toBeVisible({ timeout: 10000 });
  });

  test('карточки статистики видны на странице', async ({ page }) => {
    // Ждём пока пропадут скелетоны — потом проверяем карточку
    await expect(page.locator('text=Всего смен')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Открыто сейчас')).toBeVisible();
    await expect(page.locator('text=Опоздания')).toBeVisible();
    await expect(page.locator('text=Ср. опоздание')).toBeVisible();
  });

  test('ViewModeToggle отображается и позволяет переключать вид', async ({ page }) => {
    // ViewModeToggle рендерится только на не-мобильном экране (>768px, Desktop Chrome — 1280px)
    const listBtn = page.getByRole('button', { name: /список/i });
    const gridBtn = page.getByRole('button', { name: /карточки/i });
    await expect(listBtn).toBeVisible({ timeout: 10000 });
    await expect(gridBtn).toBeVisible();

    // Переключаемся на сетку
    await gridBtn.click();
    // Переключаемся обратно на список
    await listBtn.click();
    await expect(listBtn).toBeVisible();
  });

  test('FilterPanel можно открыть и закрыть', async ({ page }) => {
    // FilterPanel содержит кнопку-тоггл с иконкой или текстом "Фильтры"
    const filterToggle = page.getByRole('button', { name: /фильтры/i });
    await expect(filterToggle).toBeVisible({ timeout: 10000 });

    // Открываем
    await filterToggle.click();
    await expect(page.locator('label', { hasText: 'Статус' })).toBeVisible({ timeout: 5000 });

    // Закрываем
    await filterToggle.click();
  });

  test('фильтр по статусу доступен после открытия FilterPanel', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();
    await expect(page.locator('label', { hasText: 'Статус' })).toBeVisible({ timeout: 5000 });
    // Проверяем что select со статусами присутствует
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
  });

  test('фильтр по автосалону доступен после открытия FilterPanel (для admin)', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();
    // FilterPanel для admin (owner с "Все автосалоны") показывает фильтр автосалонов.
    // ShiftsPage рендерит его через plain <label> (не через Select с label prop).
    // Ищем <label> элемент с текстом "Автосалон" внутри FilterPanel.
    // Используем first() чтобы избежать strict mode violation при нескольких совпадениях.
    await expect(
      page.locator('label').filter({ hasText: 'Автосалон' }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('секция "История смен" видна на странице', async ({ page }) => {
    await expect(page.locator('text=История смен')).toBeVisible({ timeout: 15000 });
  });
});
