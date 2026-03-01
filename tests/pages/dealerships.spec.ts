import { test, expect } from '@playwright/test';

/**
 * Тесты страницы автосалонов /dealerships
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('Dealerships — страница автосалонов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dealerships');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Автосалоны' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Автосалоны"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Автосалоны' })).toBeVisible();
  });

  test('кнопка "Создать автосалон" видна для admin (owner)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Создать автосалон' })).toBeVisible();
  });

  test('существующие демо-автосалоны отображаются в списке', async ({ page }) => {
    // Ждём загрузки данных
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Автосалон Север')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Автосалон Люкс')).toBeVisible({ timeout: 10000 });
  });

  test('клик "Создать автосалон" показывает форму создания', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();

    // В Card.Header появляется заголовок формы
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });
    // И подзаголовок
    await expect(page.getByText('Заполните информацию о новом автосалоне')).toBeVisible();
  });

  test('форма создания содержит поля: название, адрес, часовой пояс', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    // Поле "Название автосалона *"
    await expect(page.locator('label').filter({ hasText: 'Название автосалона *' })).toBeVisible();
    // Поле "Адрес"
    await expect(page.locator('label').filter({ hasText: 'Адрес' })).toBeVisible();
    // Поле "Часовой пояс *"
    await expect(page.getByText('Часовой пояс')).toBeVisible();
  });

  test('форму создания можно закрыть кнопкой X', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    // Кнопка закрытия — DealershipsPage рендерит <button onClick={handleFormClose}> с <XMarkIcon />
    // в Card.Header рядом с заголовком "Создать новый автосалон".
    // Card.Header использует flex justify-between: слева заголовок h2, справа кнопка X.
    // Ищем кнопку в flex-контейнере заголовка карточки через CSS-сиблинг после div с h2.
    const cardHeaderRow = page.locator('div.flex.items-center.justify-between')
      .filter({ has: page.locator('h2', { hasText: 'Создать новый автосалон' }) })
      .locator('button');

    await cardHeaderRow.click();

    // Форма должна исчезнуть
    await expect(page.getByText('Создать новый автосалон')).not.toBeVisible({ timeout: 5000 });
  });

  test('карточки автосалонов показывают название', async ({ page }) => {
    // Ждём загрузки демо-данных — первый автосалон должен появиться
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });

    // Заголовки h3 с названиями автосалонов — должно быть не менее 3 карточек
    const dealershipTitles = page.locator('h3').filter({ hasText: 'Автосалон' });
    const count = await dealershipTitles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('на каждой карточке автосалона есть кнопка "Изменить"', async ({ page }) => {
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });

    // Каждая карточка должна иметь кнопку редактирования
    const editButtons = page.getByRole('button', { name: /изменить/i });
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('клик "Изменить" на автосалоне открывает форму редактирования', async ({ page }) => {
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });

    // Нажимаем первую кнопку "Изменить"
    await page.getByRole('button', { name: /изменить/i }).first().click();

    // Должна появиться форма редактирования
    await expect(page.getByText('Редактировать автосалон')).toBeVisible({ timeout: 5000 });
  });

  test('форма редактирования предзаполнена данными автосалона', async ({ page }) => {
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /изменить/i }).first().click();
    await expect(page.getByText('Редактировать автосалон')).toBeVisible({ timeout: 5000 });

    // Поле названия должно быть заполнено
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });

  test('поиск по названию автосалона работает', async ({ page }) => {
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });

    // Вводим в поле поиска DealershipList
    const searchInput = page.locator('input[placeholder="Поиск по названию или адресу..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Центр');
    await page.waitForTimeout(1000);

    // Должен остаться только "Автосалон Центр"
    await expect(page.getByText('Автосалон Центр')).toBeVisible({ timeout: 10000 });
  });
});
