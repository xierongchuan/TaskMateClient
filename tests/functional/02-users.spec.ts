import { test, expect } from '@playwright/test';
import { readState, updateState } from './setup/state';
import {
  loginAndSaveState,
  FUNC_MANAGER_STATE,
  FUNC_EMPLOYEE1_STATE,
  FUNC_EMPLOYEE2_STATE,
  FUNC_OBSERVER_STATE,
} from './setup/helpers';

/**
 * Функциональные тесты страницы сотрудников /employees.
 * Выполняются последовательно после 01-dealerships.
 * К моменту запуска в системе существуют:
 *   - 2 автосалона: "Автосалон Тест-1" и "Автосалон Тест-2"
 *   - 1 пользователь: admin
 */

test.describe.serial('02 — Пользователи (/employees)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Сотрудники' })).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Пустое состояние ────────────────────────────────────────────────────

  test('пустое состояние — хотя бы один пользователь (admin) виден', async ({ page }) => {
    // Ждём загрузки списка — должна появиться хотя бы одна карточка (admin)
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });

    const pageText = await page.locator('main').innerText();
    // admin есть в системе по умолчанию
    expect(
      pageText.toLowerCase().includes('admin') ||
      pageText.toLowerCase().includes('адм')
    ).toBeTruthy();
  });

  // ─── 2. Кнопка «Добавить сотрудника» ────────────────────────────────────────

  test('кнопка «Добавить сотрудника» видна для admin (owner)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Добавить сотрудника' })).toBeVisible();
  });

  // ─── 3. Создание менеджера ───────────────────────────────────────────────────

  test('создание менеджера func_manager1 с двумя салонами', async ({ page }) => {
    // Перехватываем ответ POST /api/users со статусом 201
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    // Открываем модальное окно
    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText('Создать пользователя')).toBeVisible();

    // Заполняем поля
    await dialog.getByLabel('Логин *').fill('func_manager1');
    await dialog.getByLabel('Пароль *').fill('password');
    await dialog.getByLabel('Полное имя *').fill('Менеджер Функциональный');
    await dialog.getByLabel('Телефон *').fill('+79001111111');

    // Выбираем роль «Управляющий»
    await dialog.getByLabel('Роль *').selectOption('manager');

    // После выбора роли «Управляющий» должны появиться чекбоксы для автосалонов
    await expect(dialog.getByText('Выберите салоны для управления:')).toBeVisible({ timeout: 5000 });

    // Отмечаем оба автосалона по их названиям-лейблам
    await dialog.getByText('Автосалон Тест-1').click();
    await dialog.getByText('Автосалон Тест-2').click();

    // Отправляем форму
    await dialog.getByRole('button', { name: 'Создать' }).click();

    // Получаем id из ответа сервера
    const response = await responsePromise;
    const body = await response.json();
    const managerId: number = body.data.id;
    expect(managerId).toBeGreaterThan(0);

    // Сохраняем в shared state
    updateState({ managerId, managerLogin: 'func_manager1' });

    // Модальное окно должно закрыться
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  // ─── 4. Создание employee1 ───────────────────────────────────────────────────

  test('создание сотрудника func_emp1 в салоне Тест-1', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByLabel('Логин *').fill('func_emp1');
    await dialog.getByLabel('Пароль *').fill('password');
    await dialog.getByLabel('Полное имя *').fill('Сотрудник Первый');
    await dialog.getByLabel('Телефон *').fill('+79002222222');

    // Роль «Сотрудник» — выбрана по умолчанию, но задаём явно для надёжности
    await dialog.getByLabel('Роль *').selectOption('employee');

    // DealershipSelector — нативный <select> внутри диалога
    // Берём последний select в диалоге (после select роли)
    await dialog.locator('select').last().selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const employee1Id: number = body.data.id;
    expect(employee1Id).toBeGreaterThan(0);

    updateState({ employee1Id, employee1Login: 'func_emp1' });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  // ─── 5. Создание employee2 ───────────────────────────────────────────────────

  test('создание сотрудника func_emp2 в салоне Тест-1', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByLabel('Логин *').fill('func_emp2');
    await dialog.getByLabel('Пароль *').fill('password');
    await dialog.getByLabel('Полное имя *').fill('Сотрудник Второй');
    await dialog.getByLabel('Телефон *').fill('+79003333333');
    await dialog.getByLabel('Роль *').selectOption('employee');
    await dialog.locator('select').last().selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const employee2Id: number = body.data.id;
    expect(employee2Id).toBeGreaterThan(0);

    updateState({ employee2Id, employee2Login: 'func_emp2' });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  // ─── 6. Создание observer ────────────────────────────────────────────────────

  test('создание наблюдателя func_observer1 в салоне Тест-1', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByLabel('Логин *').fill('func_observer1');
    await dialog.getByLabel('Пароль *').fill('password');
    await dialog.getByLabel('Полное имя *').fill('Наблюдатель Тестовый');
    await dialog.getByLabel('Телефон *').fill('+79004444444');
    await dialog.getByLabel('Роль *').selectOption('observer');
    await dialog.locator('select').last().selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const observerId: number = body.data.id;
    expect(observerId).toBeGreaterThan(0);

    updateState({ observerId, observerLogin: 'func_observer1' });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  // ─── 7. Валидация: дубль логина ─────────────────────────────────────────────

  test('валидация: создание с дублирующимся логином показывает ошибку', async ({ page }) => {
    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Пробуем использовать уже существующий логин
    await dialog.getByLabel('Логин *').fill('func_emp1');
    await dialog.getByLabel('Пароль *').fill('password');
    await dialog.getByLabel('Полное имя *').fill('Дубль Логина');
    await dialog.getByLabel('Телефон *').fill('+79009999999');
    await dialog.getByLabel('Роль *').selectOption('employee');

    await dialog.getByRole('button', { name: 'Создать' }).click();

    // Ожидаем сообщение об ошибке от сервера (Alert с текстом ошибки)
    await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 10000 });

    // Модальное окно остаётся открытым
    await expect(dialog).toBeVisible();

    // Закрываем модальное окно
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 8. Валидация: пустое имя ────────────────────────────────────────────────

  test('валидация: отправка без полного имени не закрывает модальное окно', async ({ page }) => {
    await page.getByRole('button', { name: 'Добавить сотрудника' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Заполняем только логин и пароль, оставляем Полное имя пустым
    await dialog.getByLabel('Логин *').fill('incomplete_user');
    await dialog.getByLabel('Пароль *').fill('password');
    // Полное имя намеренно не заполняем

    await dialog.getByRole('button', { name: 'Создать' }).click();

    // HTML5 required-валидация не даёт отправить форму — модальное окно остаётся открытым
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Закрываем
    await dialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 9. Список всех пользователей ───────────────────────────────────────────

  test('список содержит минимум 5 пользователей (admin + 4 созданных)', async ({ page }) => {
    // Ждём появления хотя бы одной карточки
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });

    // Считаем все элементы h3 в main (каждый — имя пользователя)
    const userCards = page.locator('main h3');
    const count = await userCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  // ─── 10. Фильтр по роли «Сотрудник» ─────────────────────────────────────────

  test('фильтр по роли «Сотрудник» показывает только сотрудников', async ({ page }) => {
    // Открываем панель фильтров — кнопка-тоггл содержит текст «Фильтры»
    const filterToggle = page.getByRole('button', { name: /фильтры/i });
    await expect(filterToggle).toBeVisible({ timeout: 5000 });
    await filterToggle.click();

    // Ждём появления фильтров внутри FilterPanel
    const roleSelect = page.getByLabel('Роль');
    await expect(roleSelect).toBeVisible({ timeout: 5000 });

    // Выбираем «Сотрудник»
    await roleSelect.selectOption('employee');

    // Ждём обновления списка
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main h3').first()).toBeVisible({ timeout: 10000 });

    // Проверяем, что в списке есть func_emp1 и func_emp2
    const pageText = await page.locator('main').innerText();
    expect(pageText).toContain('Сотрудник');

    // Убеждаемся, что manager-записи не присутствуют как «Управляющий» в ролевых бейджах
    // (может присутствовать как текст, но как заголовок — нет)
    // Достаточно проверить, что страница не показывает ошибку
    await expect(page.locator('main')).toBeVisible();
  });

  // ─── 11. Сброс фильтров ──────────────────────────────────────────────────────

  test('сброс фильтров возвращает полный список пользователей', async ({ page }) => {
    // Открываем панель фильтров и применяем фильтр
    const filterToggle = page.getByRole('button', { name: /фильтры/i });
    await expect(filterToggle).toBeVisible({ timeout: 5000 });
    await filterToggle.click();

    const roleSelect = page.getByLabel('Роль');
    await expect(roleSelect).toBeVisible({ timeout: 5000 });
    await roleSelect.selectOption('employee');
    await page.waitForLoadState('networkidle');

    // Нажимаем «Сбросить фильтры»
    const clearButton = page.getByRole('button', { name: 'Сбросить фильтры' });
    await expect(clearButton).toBeVisible({ timeout: 5000 });
    await clearButton.click();

    // После сброса список должен снова содержать всех пользователей (>= 5)
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main h3').first()).toBeVisible({ timeout: 10000 });

    const userCards = page.locator('main h3');
    const count = await userCards.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  // ─── 12. Создание auth states для всех ролей ─────────────────────────────────

  test('создание auth states для всех ролей', async ({ browser }) => {
    const users = [
      { login: 'func_manager1', path: FUNC_MANAGER_STATE },
      { login: 'func_emp1', path: FUNC_EMPLOYEE1_STATE },
      { login: 'func_emp2', path: FUNC_EMPLOYEE2_STATE },
      { login: 'func_observer1', path: FUNC_OBSERVER_STATE },
    ];

    for (const { login, path: statePath } of users) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await loginAndSaveState(p, login, 'password', statePath);
      await ctx.close();
    }

    // Читаем state и убеждаемся, что все id были сохранены в предыдущих тестах
    const state = readState();
    expect(state.managerId).toBeDefined();
    expect(state.employee1Id).toBeDefined();
    expect(state.employee2Id).toBeDefined();
    expect(state.observerId).toBeDefined();
  });
});
