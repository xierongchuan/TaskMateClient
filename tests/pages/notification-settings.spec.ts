import { test, expect } from '@playwright/test';

/**
 * Тесты страницы настроек уведомлений /notification-settings
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('NotificationSettings — настройки уведомлений', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notification-settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Настройки уведомлений' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Настройки уведомлений"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Настройки уведомлений' })).toBeVisible();
  });

  test('кнопка "Сбросить" видна', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible();
  });

  test('контент настроек уведомлений (NotificationSettingsContent) отрендерен', async ({ page }) => {
    // NotificationSettingsContent рендерит настройки каналов уведомлений
    // Ожидаем любой контент внутри основной области
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    // Должны быть какие-то элементы управления (чекбоксы, переключатели, карточки)
    const hasControls = await page.locator('input[type="checkbox"], input[type="radio"], [role="switch"]').count();
    // Или карточки с настройками
    const hasCards = await page.locator('[class*="Card"], .rounded-xl').count();
    expect(hasControls + hasCards).toBeGreaterThan(0);
  });

  test('информационный блок (Info card) виден', async ({ page }) => {
    // Info card рендерит заголовок "Информация" (h3) внизу страницы настроек уведомлений.
    // Используем getByRole('heading') чтобы избежать strict mode violation при множественных совпадениях.
    await expect(
      page.getByRole('heading', { name: 'Информация' })
        .or(page.getByText(/Отключенные каналы не будут отправлять/))
        .or(page.getByText(/Изменения вступают в силу немедленно/))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('нажатие "Сбросить" открывает диалог подтверждения', async ({ page }) => {
    await page.getByRole('button', { name: 'Сбросить' }).click();

    // ConfirmDialog должен появиться с заголовком "Сбросить настройки?"
    await expect(page.getByText('Сбросить настройки?')).toBeVisible({ timeout: 5000 });
    // Кнопки подтверждения и отмены
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Сбросить' }).nth(1)
        .or(page.locator('[role="dialog"] button', { hasText: 'Сбросить' }))
    ).toBeVisible();
  });

  test('кнопка "Отмена" в диалоге закрывает его без сброса', async ({ page }) => {
    await page.getByRole('button', { name: 'Сбросить' }).click();
    await expect(page.getByText('Сбросить настройки?')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Отмена' }).click();

    // Диалог закрылся
    await expect(page.getByText('Сбросить настройки?')).not.toBeVisible({ timeout: 3000 });
    // Страница осталась на месте
    await expect(page.getByRole('heading', { name: 'Настройки уведомлений' })).toBeVisible();
  });
});
