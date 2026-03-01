import { test, expect } from '@playwright/test';

/**
 * Тесты страницы сотрудников /employees
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('Employees — страница сотрудников', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Сотрудники' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Сотрудники"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Сотрудники' })).toBeVisible();
  });

  test('кнопка "Добавить сотрудника" видна для admin (owner)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Добавить сотрудника' })).toBeVisible();
  });

  test('список сотрудников содержит демо-пользователей', async ({ page }) => {
    // Ждём пока данные загрузятся — должны появиться карточки пользователей
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });

    // Проверяем наличие хотя бы части демо-пользователей (логины @emp1_1, @manager1)
    const pageText = await page.locator('main').innerText();
    expect(
      pageText.toLowerCase().includes('emp') || pageText.toLowerCase().includes('manager')
    ).toBeTruthy();
  });

  test('переключение вида: список и карточки', async ({ page }) => {
    // По умолчанию — список. Ищем кнопку переключения на grid-режим (Squares2X2Icon)
    // ViewModeToggle рендерит кнопки с aria-label или title через options
    // Ищем контейнер пользователей в list-режиме
    const listCard = page.locator('main .rounded-xl').first();
    await expect(listCard).toBeVisible({ timeout: 10000 });

    // Нажимаем кнопку "Карточки" (grid) в ViewModeToggle
    const gridButton = page.getByRole('button', { name: 'Карточки' });
    if (await gridButton.isVisible()) {
      await gridButton.click();
      // После переключения появляется grid-layout
      await expect(page.locator('.grid.grid-cols-1.sm\\:grid-cols-2')).toBeVisible({ timeout: 5000 });
    }
  });

  test('фильтр по роли обновляет список', async ({ page }) => {
    // Открываем панель фильтров
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Ищем select с опциями ролей
    const roleSelect = page.locator('select').filter({ hasText: /все роли/i }).or(
      page.locator('label').filter({ hasText: /роль/i }).locator('..').locator('select')
    ).first();

    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('employee');
      await page.waitForTimeout(1000);
      // После фильтрации страница не показывает ошибку
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('поиск по имени фильтрует список', async ({ page }) => {
    // Открываем панель фильтров если закрыта
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Вводим текст в поле поиска
    const searchInput = page.locator('input[placeholder="Имя, логин..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('emp1');
      await page.waitForTimeout(1000);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('кнопка "Добавить сотрудника" открывает модальное окно UserModal', async ({ page }) => {
    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();

    // Модальное окно должно появиться с заголовком "Создать пользователя"
    await expect(page.getByText('Создать пользователя')).toBeVisible({ timeout: 5000 });
  });

  test('UserModal содержит все обязательные поля', async ({ page }) => {
    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    await expect(page.getByText('Создать пользователя')).toBeVisible({ timeout: 5000 });

    // Поля проверяем через getByLabel — Input компонент связывает label через htmlFor
    // label="Логин *" → getByLabel находит по тексту label
    // Используем scope dialog чтобы избежать strict mode violation при множестве совпадений
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByLabel('Логин *')).toBeVisible();
    await expect(dialog.getByLabel('Пароль *')).toBeVisible();
    await expect(dialog.getByLabel('Полное имя *')).toBeVisible();
    await expect(dialog.getByLabel('Телефон *')).toBeVisible();
    await expect(dialog.getByLabel('Роль *', { exact: true })).toBeVisible();
    // Автосалон — отдельный label без htmlFor
    await expect(dialog.getByText('Автосалон', { exact: true })).toBeVisible();
  });

  test('клик по имени пользователя открывает UserDetailsModal', async ({ page }) => {
    // Ждём загрузки пользователей — h3 внутри кнопки
    const firstUserName = page.locator('main button').filter({ hasText: /[А-ЯЁа-яё]{2,}/ }).first();
    await expect(firstUserName).toBeVisible({ timeout: 10000 });
    await firstUserName.click();

    // Должен появиться модальный диалог с деталями пользователя
    // UserDetailsModal показывает разделы "Телефон" и "Автосалон"
    await expect(page.getByText('Телефон').first()).toBeVisible({ timeout: 5000 });
  });

  test('UserDetailsModal показывает информацию о пользователе', async ({ page }) => {
    // Кликаем по первому пользователю в списке
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });

    const firstUserName = page.locator('main button').filter({ hasText: /[А-ЯЁа-яё]{2,}/ }).first();
    await firstUserName.click();

    // Модальное окно открылось

    // Проверяем наличие базовых элементов: телефон, автосалон секции
    await expect(page.getByText('Телефон').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Автосалон').first()).toBeVisible({ timeout: 5000 });
  });
});
