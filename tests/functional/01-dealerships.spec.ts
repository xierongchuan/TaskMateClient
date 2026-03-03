import { test, expect } from '@playwright/test';
import { readState, updateState } from './setup/state';

/**
 * Функциональные тесты страницы автосалонов /dealerships
 * Тесты выполняются строго последовательно (serial).
 * БД содержит только пользователя admin/password — автосалонов нет.
 * Авторизация через storageState func-admin.json (admin/owner).
 */
test.describe.serial('01 — Dealerships: CRUD автосалонов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dealerships');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Автосалоны' })).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Пустое состояние ────────────────────────────────────────────────────

  test('пустое состояние — нет автосалонов, кнопка создания видна', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Создать автосалон' })).toBeVisible({ timeout: 10000 });
  });

  // ─── 2. Валидация: пустое название ──────────────────────────────────────────

  test('валидация: пустое название — форма не отправляется', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    // Нажимаем submit без заполнения обязательных полей
    await page.getByRole('button', { name: 'Создать автосалон', exact: true }).last().click();

    // Форма должна остаться открытой — заголовок всё ещё виден
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 3000 });
  });

  // ─── 3. Валидация: название < 2 символов ────────────────────────────────────

  test('валидация: название менее 2 символов — ошибка валидации', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    await nameInput.fill('А');

    // Нажимаем submit
    await page.getByRole('button', { name: 'Создать автосалон', exact: true }).last().click();

    // Должна появиться ошибка валидации
    await expect(
      page.getByText('Название должно содержать минимум 2 символа')
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── 4. Создание «Автосалон Тест-1» ─────────────────────────────────────────

  test('создание «Автосалон Тест-1» — появляется в списке, ID сохраняется', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    // Заполняем форму
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    await nameInput.fill('Автосалон Тест-1');

    const addressInput = page.locator('input[placeholder="Например: г. Москва, ул. Ленинградская, д. 15"]');
    await addressInput.fill('ул. Тестовая, 1');

    const phoneInput = page.locator('input[placeholder="+998 99 495 85 14"]');
    await phoneInput.fill('+79001234567');

    // Выбираем часовой пояс UTC+3
    const timezoneSelect = page.locator('select').filter({ hasText: /UTC/ }).or(
      page.locator('label').filter({ hasText: 'Часовой пояс' }).locator('..').locator('select')
    ).first();
    await timezoneSelect.selectOption('+03:00');

    // Перехватываем ответ API
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dealerships') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );

    await page.getByRole('button', { name: 'Создать автосалон', exact: true }).last().click();

    const response = await responsePromise;
    const body = await response.json();
    const dealership1Id: number = body.data.id;
    const dealership1Name: string = body.data.name;

    updateState({ dealership1Id, dealership1Name });

    // Автосалон должен появиться в списке
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });
  });

  // ─── 5. Создание «Автосалон Тест-2» ─────────────────────────────────────────

  test('создание «Автосалон Тест-2» — появляется в списке, ID сохраняется', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать автосалон' }).click();
    await expect(page.getByText('Создать новый автосалон')).toBeVisible({ timeout: 5000 });

    // Заполняем форму
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    await nameInput.fill('Автосалон Тест-2');

    const addressInput = page.locator('input[placeholder="Например: г. Москва, ул. Ленинградская, д. 15"]');
    await addressInput.fill('ул. Тестовая, 2');

    // Выбираем часовой пояс UTC+5
    const timezoneSelect = page.locator('select').filter({ hasText: /UTC/ }).or(
      page.locator('label').filter({ hasText: 'Часовой пояс' }).locator('..').locator('select')
    ).first();
    await timezoneSelect.selectOption('+05:00');

    // Перехватываем ответ API
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dealerships') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201
    );

    await page.getByRole('button', { name: 'Создать автосалон', exact: true }).last().click();

    const response = await responsePromise;
    const body = await response.json();
    const dealership2Id: number = body.data.id;
    const dealership2Name: string = body.data.name;

    updateState({ dealership2Id, dealership2Name });

    // Автосалон должен появиться в списке
    await expect(page.getByText('Автосалон Тест-2')).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. Список показывает оба автосалона ────────────────────────────────────

  test('список показывает оба созданных автосалона', async ({ page }) => {
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Автосалон Тест-2')).toBeVisible({ timeout: 10000 });
  });

  // ─── 7. Поиск по названию ───────────────────────────────────────────────────

  test('поиск «Тест-1» — виден только первый автосалон', async ({ page }) => {
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder="Поиск по названию или адресу..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Тест-1');

    // Ждём debounce
    await page.waitForTimeout(1000);

    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Автосалон Тест-2')).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 8. Поиск несуществующего ────────────────────────────────────────────────

  test('поиск несуществующего — пустой результат', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Поиск по названию или адресу..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Несуществующий xyz');

    // Ждём debounce
    await page.waitForTimeout(1000);

    await expect(page.getByText('Автосалон Тест-1')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Автосалон Тест-2')).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 9. Очистка поиска ───────────────────────────────────────────────────────

  test('очистка поиска — оба автосалона снова видны', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Поиск по названию или адресу..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Вводим фильтр, потом очищаем
    await searchInput.fill('Тест-1');
    await page.waitForTimeout(1000);
    await searchInput.fill('');

    // Ждём debounce после очистки
    await page.waitForTimeout(1000);

    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Автосалон Тест-2')).toBeVisible({ timeout: 10000 });
  });

  // ─── 10. Открытие формы редактирования ──────────────────────────────────────

  test('открытие формы редактирования — форма с предзаполненным названием', async ({ page }) => {
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });

    // Кликаем первую кнопку «Изменить»
    await page.getByRole('button', { name: /изменить/i }).first().click();

    // Форма редактирования должна появиться
    await expect(page.getByText('Редактировать автосалон')).toBeVisible({ timeout: 5000 });

    // Поле названия должно быть предзаполнено
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);
  });

  // ─── 11. Редактирование названия ─────────────────────────────────────────────

  test('редактирование — название обновляется в списке', async ({ page }) => {
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });

    // Находим карточку «Автосалон Тест-1» и кликаем её кнопку «Изменить»
    const card1 = page.locator('div').filter({ hasText: /^Автосалон Тест-1/ }).or(
      page.locator('h3').filter({ hasText: 'Автосалон Тест-1' }).locator('../..')
    ).first();
    const editButton = card1.getByRole('button', { name: /изменить/i }).or(
      page.getByRole('button', { name: /изменить/i }).first()
    ).first();
    await editButton.click();

    await expect(page.getByText('Редактировать автосалон')).toBeVisible({ timeout: 5000 });

    // Меняем название
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    await nameInput.clear();
    await nameInput.fill('Автосалон Тест-1 Изменён');

    // Перехватываем ответ PUT/PATCH
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dealerships') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH') &&
        resp.status() === 200
    );

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await responsePromise;

    // Обновлённое название должно появиться в списке
    await expect(page.getByText('Автосалон Тест-1 Изменён')).toBeVisible({ timeout: 10000 });
  });

  // ─── 12. Вернуть исходное название ───────────────────────────────────────────

  test('редактирование — вернуть исходное название «Автосалон Тест-1»', async ({ page }) => {
    await expect(page.getByText('Автосалон Тест-1 Изменён')).toBeVisible({ timeout: 10000 });

    // Открываем форму редактирования для изменённого автосалона
    const editButtons = page.getByRole('button', { name: /изменить/i });
    await editButtons.first().click();

    await expect(page.getByText('Редактировать автосалон')).toBeVisible({ timeout: 5000 });

    // Проверяем что поле содержит изменённое название и сбрасываем на исходное
    const nameInput = page.locator('input[placeholder="Например: Автомир Premium"]');
    await expect(nameInput).toHaveValue('Автосалон Тест-1 Изменён', { timeout: 3000 });

    await nameInput.clear();
    await nameInput.fill('Автосалон Тест-1');

    // Перехватываем ответ PUT/PATCH
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dealerships') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH') &&
        resp.status() === 200
    );

    await page.getByRole('button', { name: 'Сохранить изменения' }).click();

    await responsePromise;

    // Исходное название снова в списке
    await expect(page.getByText('Автосалон Тест-1')).toBeVisible({ timeout: 10000 });

    // Обновляем сохранённое имя в state
    updateState({ dealership1Name: 'Автосалон Тест-1' });
  });
});
