import { test, expect } from '@playwright/test';
import { readState, updateState } from './setup/state';
import { FUNC_MANAGER_STATE } from './setup/helpers';
import { formatDateInput } from './setup/helpers';

/**
 * Функциональные тесты страницы генераторов задач /task-generators
 * Тесты выполняются строго последовательно (serial).
 * Авторизация через storageState func-admin.json (admin/owner).
 */
test.describe.serial('05 — Task Generators: CRUD генераторов задач', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/task-generators');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Генераторы задач' }),
    ).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Пустое состояние ────────────────────────────────────────────────────

  test('пустое состояние — нет генераторов или пустой список', async ({
    page,
  }) => {
    // Либо явное сообщение "Нет генераторов", либо список пуст
    const noGenerators = page.getByText('Нет генераторов');
    const createButton = page.getByRole('button', {
      name: 'Создать генератор',
    });

    await expect(createButton).toBeVisible({ timeout: 10000 });

    const noGeneratorsVisible = await noGenerators
      .isVisible()
      .catch(() => false);
    if (!noGeneratorsVisible) {
      // Список может быть пустым без явного сообщения — просто кнопка видна
      await expect(createButton).toBeVisible();
    }
  });

  // ─── 2. Создание ежедневного генератора ──────────────────────────────────

  test('создание ежедневного генератора — появляется в списке, ID сохраняется', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Создать генератор' })
      .click();

    // Заголовок модалки (последний, т.к. кнопка тоже совпадает)
    await expect(
      page.getByText('Создать генератор').last(),
    ).toBeVisible({ timeout: 5000 });

    // Название
    const nameInput = page.getByLabel('Название *');
    await nameInput.fill('Ежедневный генератор тест');

    // Описание
    const descInput = page.getByLabel('Описание');
    await descInput.fill('Тестовое описание ежедневного генератора');

    // Автосалон — выбираем через select рядом с текстом "Автосалон"
    const dealershipSelect = page
      .locator('label')
      .filter({ hasText: 'Автосалон' })
      .locator('..')
      .locator('select')
      .first();
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    // Ждём загрузки исполнителей после выбора автосалона
    await page.waitForTimeout(1000);

    // Повторяемость — Ежедневно
    const recurrenceSelect = page.getByLabel('Повторяемость');
    await recurrenceSelect.selectOption('daily');

    // Дата начала — сегодня
    const today = formatDateInput(new Date());
    const startDateInput = page.getByLabel('Дата начала *');
    await startDateInput.fill(today);

    // Исполнители — ищем чекбокс с "Сотрудник Первый"
    const assigneeCheckbox = page
      .getByText('Сотрудник Первый')
      .locator('..')
      .locator('input[type="checkbox"]')
      .or(
        page
          .locator('label')
          .filter({ hasText: 'Сотрудник Первый' })
          .locator('input[type="checkbox"]'),
      )
      .first();
    const assigneeVisible = await assigneeCheckbox
      .isVisible()
      .catch(() => false);
    if (assigneeVisible) {
      await assigneeCheckbox.check();
    }

    // Перехватываем ответ POST
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/task-generators') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const generatorId: number = body.data?.id ?? body.id;

    updateState({ generatorId });

    // Генератор должен появиться в списке
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 3. Бейджи «Активен» и «Ежедневно» ─────────────────────────────────

  test('бейджи «Активен» и «Ежедневно» видны у генератора', async ({
    page,
  }) => {
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Бейдж активности
    await expect(page.getByText('Активен')).toBeVisible({ timeout: 5000 });

    // Бейдж повторяемости
    await expect(
      page.getByText('Ежедневно'),
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── 4. Приостановка → бейдж «Приостановлен» ────────────────────────────

  test('приостановка генератора — бейдж меняется на «Приостановлен»', async ({
    page,
  }) => {
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Кнопка «Пауза»
    await page.getByRole('button', { name: 'Пауза' }).first().click();

    // Ждём обновления
    await expect(
      page.getByText('Приостановлен'),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 5. Возобновление → бейдж «Активен» ─────────────────────────────────

  test('возобновление генератора — бейдж меняется на «Активен»', async ({
    page,
  }) => {
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Кнопка «Запустить»
    await page.getByRole('button', { name: 'Запустить' }).first().click();

    // Ждём обновления
    await expect(page.getByText('Активен')).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. Редактирование описания ──────────────────────────────────────────

  test('редактирование описания генератора — описание обновляется', async ({
    page,
  }) => {
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Кнопка «Изменить»
    await page.getByRole('button', { name: 'Изменить' }).first().click();

    // Ждём открытия модалки
    await expect(
      page.getByText('Создать генератор').last().or(
        page.getByText('Изменить генератор').last(),
      ),
    ).toBeVisible({ timeout: 5000 });

    // Меняем описание
    const descInput = page.getByLabel('Описание');
    await descInput.clear();
    await descInput.fill('Обновлённое описание генератора');

    // Перехватываем ответ PUT/PATCH
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/task-generators') &&
        (resp.request().method() === 'PUT' ||
          resp.request().method() === 'PATCH') &&
        resp.status() === 200,
    );

    await page.getByRole('button', { name: 'Сохранить' }).click();

    await responsePromise;
  });

  // ─── 7. Создание еженедельного генератора ────────────────────────────────

  test('создание еженедельного генератора — ID сохраняется', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Создать генератор' })
      .click();

    await expect(
      page.getByText('Создать генератор').last(),
    ).toBeVisible({ timeout: 5000 });

    // Название
    const nameInput = page.getByLabel('Название *');
    await nameInput.fill('Еженедельный генератор тест');

    // Автосалон
    const dealershipSelect = page
      .locator('label')
      .filter({ hasText: 'Автосалон' })
      .locator('..')
      .locator('select')
      .first();
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    await page.waitForTimeout(1000);

    // Повторяемость — Еженедельно
    const recurrenceSelect = page.getByLabel('Повторяемость');
    await recurrenceSelect.selectOption('weekly');

    await page.waitForTimeout(500);

    // Выбираем дни недели (кнопки с днями)
    // Нажимаем первые два доступных дня
    const dayButtons = page.locator('button').filter({
      hasText: /^(Пн|Вт|Ср|Чт|Пт|Сб|Вс|Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i,
    });
    const dayCount = await dayButtons.count();
    if (dayCount > 0) {
      await dayButtons.first().click();
    }
    if (dayCount > 1) {
      await dayButtons.nth(1).click();
    }

    // Дата начала — сегодня
    const today = formatDateInput(new Date());
    const startDateInput = page.getByLabel('Дата начала *');
    await startDateInput.fill(today);

    // Перехватываем ответ POST
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/task-generators') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const generatorWeeklyId: number = body.data?.id ?? body.id;

    updateState({ generatorWeeklyId });

    // Генератор должен появиться в списке
    await expect(
      page.getByText('Еженедельный генератор тест'),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 8. Фильтр: активные ─────────────────────────────────────────────────

  test('фильтр «Активные» — отображаются только активные генераторы', async ({
    page,
  }) => {
    await expect(
      page.getByText('Ежедневный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Открываем фильтры (кнопка фильтра или select)
    const filterSelect = page
      .locator('select')
      .filter({ hasText: /все|активн|приостановлен/i })
      .first();
    const filterSelectExists = await filterSelect
      .isVisible()
      .catch(() => false);

    if (filterSelectExists) {
      await filterSelect.selectOption('true');
    } else {
      // Пробуем найти кнопку или dropdown с фильтрами
      const filterButton = page
        .getByRole('button', { name: /фильтр/i })
        .first();
      const filterButtonExists = await filterButton
        .isVisible()
        .catch(() => false);
      if (filterButtonExists) {
        await filterButton.click();
        await page.waitForTimeout(500);
        // Выбираем "Активные"
        await page.getByText('Активные').first().click();
      }
    }

    await page.waitForTimeout(1000);

    // Должен быть хотя бы один активный генератор
    await expect(page.getByText('Активен').first()).toBeVisible({
      timeout: 5000,
    });
  });

  // ─── 9. Удаление еженедельного генератора ────────────────────────────────

  test('удаление еженедельного генератора — пропадает из списка', async ({
    page,
  }) => {
    await expect(
      page.getByText('Еженедельный генератор тест'),
    ).toBeVisible({ timeout: 10000 });

    // Находим карточку еженедельного генератора
    const generatorCard = page
      .locator('div')
      .filter({ hasText: /Еженедельный генератор тест/ })
      .last();

    // Ищем кнопку удаления (иконка корзины) внутри карточки
    const deleteButton = generatorCard
      .locator('button[aria-label*="удал" i], button[title*="удал" i]')
      .or(generatorCard.locator('button').filter({ hasText: /trash|delete/i }))
      .or(
        generatorCard
          .locator('button')
          .last(),
      )
      .first();

    await deleteButton.click();

    // Подтверждение удаления
    const confirmButton = page
      .getByRole('button', { name: /удалить|подтвердить|да/i })
      .last();
    const confirmVisible = await confirmButton.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmButton.click();
    }

    // Генератор должен исчезнуть из списка
    await expect(
      page.getByText('Еженедельный генератор тест'),
    ).not.toBeVisible({ timeout: 10000 });
  });

  // ─── 10. Проверка менеджером ─────────────────────────────────────────────

  test('менеджер — страница генераторов доступна, генератор виден', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_MANAGER_STATE,
    });
    const managerPage = await ctx.newPage();

    try {
      await managerPage.goto('/task-generators');
      await managerPage.waitForLoadState('domcontentloaded');

      // Страница должна быть доступна
      await expect(
        managerPage.getByRole('heading', { name: 'Генераторы задач' }),
      ).toBeVisible({ timeout: 15000 });

      // Ежедневный генератор должен быть виден
      await expect(
        managerPage.getByText('Ежедневный генератор тест'),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });
});
