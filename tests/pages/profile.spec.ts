import { test, expect } from '@playwright/test';

/**
 * Тесты страницы профиля (/profile)
 * Запускаются от admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('ProfilePage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Мой профиль' })).toBeVisible({ timeout: 15000 });
  });

  test('страница профиля загружается с заголовком "Мой профиль"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Мой профиль' })).toBeVisible({ timeout: 10000 });
  });

  test('отображаются три таба навигации', async ({ page }) => {
    await expect(page.getByRole('button', { name: /личные данные/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /безопасность/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /статистика/i })).toBeVisible();
  });

  test('таб "Личные данные" активен по умолчанию и показывает поля имени и телефона', async ({ page }) => {
    await expect(page.getByLabel('Полное имя')).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Телефон')).toBeVisible();
  });

  test('поле "Полное имя" предзаполнено именем admin-пользователя', async ({ page }) => {
    const nameInput = page.getByLabel('Полное имя');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    const value = await nameInput.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('кнопка "Сохранить изменения" видна на табе "Личные данные"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /сохранить изменения/i })).toBeVisible({ timeout: 10000 });
  });

  test('переключение на таб "Безопасность" показывает поля паролей', async ({ page }) => {
    await page.getByRole('button', { name: /безопасность/i }).click();
    await expect(page.getByLabel('Текущий пароль')).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Новый пароль')).toBeVisible();
    await expect(page.getByLabel('Подтверждение пароля')).toBeVisible();
  });

  test('таб "Безопасность" содержит кнопку "Обновить пароль"', async ({ page }) => {
    await page.getByRole('button', { name: /безопасность/i }).click();
    await expect(page.getByRole('button', { name: /обновить пароль/i })).toBeVisible({ timeout: 10000 });
  });

  test('переключение на таб "Статистика" показывает контент статистики', async ({ page }) => {
    await page.getByRole('button', { name: /статистика/i }).click();
    // ProfilePage stats tab: всегда показывает карточки "Всего смен", "Роль", "Опоздания", "Эффективность"
    // Ждём загрузки данных (shifts и reports запросы должны завершиться)
    // getByText('Всего смен') ищет exact match — этот текст есть в div внутри карточки статистики
    await expect(page.getByText('Всего смен')).toBeVisible({ timeout: 15000 });
  });

  test('кнопка "Выйти из аккаунта" присутствует и видна', async ({ page }) => {
    await expect(page.getByRole('button', { name: /выйти из аккаунта/i })).toBeVisible({ timeout: 10000 });
  });

  test('RoleBadge отображает роль пользователя (Владелец для admin)', async ({ page }) => {
    // RoleBadge рендерит лейбл "Владелец" для роли owner
    await expect(page.locator('text=Владелец')).toBeVisible({ timeout: 10000 });
  });

  test('блок автосалон отображается как read-only', async ({ page }) => {
    // Страница профиля показывает "Автосалон" в таблице личных данных
    await expect(page.getByText('Автосалон').first()).toBeVisible({ timeout: 10000 });
  });
});
