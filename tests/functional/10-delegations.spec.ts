import { test, expect } from '@playwright/test';
import { updateState } from './setup/state';
import {
  FUNC_EMPLOYEE1_STATE,
  FUNC_EMPLOYEE2_STATE,
  FUNC_ADMIN_STATE,
  formatDatetimeLocal,
} from './setup/helpers';

// FUNC_ADMIN_STATE используется в beforeEach через page (storageState из playwright.config)
// Импортируется для явного использования в тестах, где нужен отдельный контекст admin.
void FUNC_ADMIN_STATE;

/**
 * Функциональные тесты делегирования задач.
 * Тесты выполняются строго последовательно (serial).
 * Предполагает наличие пользователей func_emp1 и func_emp2 из 02-users.
 * Авторизация admin через storageState func-admin.json.
 */
test.describe.serial('Delegations — делегирование задач', () => {
  // ─── 1. Admin создаёт задачу для делегирования ────────────────────────────

  test('admin создаёт задачу для делегирования — ID сохраняется', async ({
    page,
  }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Задачи' }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Название задачи
    await dialog.getByLabel(/название/i).fill('Задача для делегирования');

    // Тип ответа: «На выполнение»
    await dialog.getByLabel(/тип ответа/i).selectOption({ label: 'На выполнение' });

    // Автосалон
    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    await dealershipBlock.locator('select').selectOption({ label: 'Автосалон Тест-1' });

    // Даты (дедлайн — через 2 дня)
    const now = new Date();
    const deadlineDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const appearDateInput = dialog.getByLabel(/дата появления/i);
    const deadlineInput = dialog.getByLabel(/дедлайн/i);
    const appearVisible = await appearDateInput.isVisible().catch(() => false);
    if (appearVisible) {
      await appearDateInput.fill(formatDatetimeLocal(now));
    }
    const deadlineVisible = await deadlineInput.isVisible().catch(() => false);
    if (deadlineVisible) {
      await deadlineInput.fill(formatDatetimeLocal(deadlineDate));
    }

    // Исполнитель — Сотрудник Первый
    await dialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await dialog.locator('label').filter({ hasText: 'Сотрудник Первый' }).click();

    // Перехватываем ответ API
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: /создать/i }).click();

    const response = await responsePromise;
    const body = await response.json();
    const delegationTaskId: number = body.data.id;
    expect(delegationTaskId).toBeGreaterThan(0);

    updateState({ delegationTaskId });

    // Модалка закрылась, задача видна в списке
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Задача для делегирования'),
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── 2. employee1 делегирует задачу employee2 ─────────────────────────────

  test('employee1 делегирует задачу employee2 с причиной', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();

    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

      // Ждём загрузки задач
      await page.waitForTimeout(2000);

      // Находим задачу и открываем детали
      const taskTitle = page.getByText('Задача для делегирования');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка «Делегировать» в деталях задачи
      const delegateBtn = dialog.getByRole('button', { name: /делегировать/i });
      await expect(delegateBtn).toBeVisible({ timeout: 10000 });
      await delegateBtn.click();

      // Открывается модальное окно делегирования
      await expect(
        page.getByText('Делегировать задачу'),
      ).toBeVisible({ timeout: 10000 });

      // Выбираем сотрудника из select
      const delegateDialog = page
        .getByRole('dialog')
        .filter({ hasText: 'Делегировать задачу' })
        .or(page.getByRole('dialog').last());

      const employeeSelect = delegateDialog
        .locator('select')
        .or(delegateDialog.getByLabel(/кому делегировать/i))
        .first();

      await expect(employeeSelect).toBeVisible({ timeout: 5000 });
      await employeeSelect.selectOption({ label: 'Сотрудник Второй' });

      // Заполняем причину делегирования (необязательно)
      const reasonTextarea = delegateDialog
        .locator('textarea')
        .or(delegateDialog.getByPlaceholder(/укажите причину/i))
        .first();
      const reasonVisible = await reasonTextarea.isVisible().catch(() => false);
      if (reasonVisible) {
        await reasonTextarea.fill('Не могу выполнить сегодня');
      }

      // Перехватываем ответ API делегирования
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/') &&
          (resp.url().includes('delegat') || resp.url().includes('delegate')) &&
          (resp.request().method() === 'POST' || resp.request().method() === 'PATCH') &&
          resp.status() < 300,
        { timeout: 15000 },
      );

      // Нажимаем «Делегировать» в модалке делегирования
      await delegateDialog
        .getByRole('button', { name: /делегировать/i })
        .last()
        .click();

      await responsePromise;

      // Модалка делегирования закрылась
      await expect(
        page.getByText('Делегировать задачу'),
      ).not.toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  // ─── 3. employee2 видит входящую делегацию ────────────────────────────────

  test('employee2 видит входящую делегацию со статусом «Ожидает»', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE2_STATE });
    const page = await ctx.newPage();

    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

      await page.waitForTimeout(2000);

      // Задача должна быть видна employee2 (как входящая делегация)
      const taskTitle = page.getByText('Задача для делегирования');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Секция делегирования со статусом «Ожидает»
      const delegationSection = dialog
        .getByText('Делегирование')
        .or(dialog.getByText('Ожидает'))
        .first();
      await expect(delegationSection).toBeVisible({ timeout: 10000 });

      // Кнопки «Принять» и «Отклонить»
      const acceptBtn = dialog.getByRole('button', { name: /принять/i });
      const rejectBtn = dialog.getByRole('button', { name: /отклонить/i });
      await expect(acceptBtn).toBeVisible({ timeout: 5000 });
      await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  // ─── 4. employee2 принимает делегацию ─────────────────────────────────────

  test('employee2 принимает делегацию — статус обновляется', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE2_STATE });
    const page = await ctx.newPage();

    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const taskTitle = page.getByText('Задача для делегирования');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка «Принять»
      const acceptBtn = dialog.getByRole('button', { name: /принять/i });
      await expect(acceptBtn).toBeVisible({ timeout: 10000 });

      // Перехватываем ответ API
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/') &&
          (resp.url().includes('accept') ||
            resp.url().includes('delegat') ||
            resp.url().includes('delegate')) &&
          (resp.request().method() === 'POST' || resp.request().method() === 'PATCH') &&
          resp.status() < 300,
        { timeout: 15000 },
      );

      await acceptBtn.click();
      await responsePromise;

      // Статус делегирования обновился — кнопка «Принять» исчезла или статус изменился
      await page.waitForTimeout(1500);
      const acceptBtnGone = await acceptBtn
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const hasNewStatus = await dialog
        .getByText(/принято|делегировано|назначен/i)
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(!acceptBtnGone || hasNewStatus).toBeTruthy();
    } finally {
      await ctx.close();
    }
  });

  // ─── 5. Делегирование с отклонением ──────────────────────────────────────

  test('делегирование с отклонением — employee2 отклоняет с причиной', async ({
    page,
    browser,
  }) => {
    // Шаг 1: admin создаёт новую задачу «Задача для отклонения делегации»
    await page.goto('/tasks');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Задачи' }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /создать задачу/i }).click();

    const createDialog = page.getByRole('dialog');
    await expect(createDialog).toBeVisible({ timeout: 5000 });

    await createDialog.getByLabel(/название/i).fill('Задача для отклонения делегации');
    await createDialog
      .getByLabel(/тип ответа/i)
      .selectOption({ label: 'На выполнение' });

    const dealershipBlock = createDialog.getByText('Автосалон *', { exact: true }).locator('..');
    await dealershipBlock.locator('select').selectOption({ label: 'Автосалон Тест-1' });

    await createDialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await createDialog
      .locator('label')
      .filter({ hasText: 'Сотрудник Первый' })
      .click();

    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await createDialog.getByRole('button', { name: /создать/i }).click();
    await createResponsePromise;
    await expect(createDialog).not.toBeVisible({ timeout: 10000 });

    // Шаг 2: employee1 делегирует employee2
    const emp1Ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const emp1Page = await emp1Ctx.newPage();

    try {
      await emp1Page.goto('/tasks');
      await emp1Page.waitForLoadState('domcontentloaded');
      await emp1Page.waitForTimeout(2000);

      const taskTitle = emp1Page.getByText('Задача для отклонения делегации');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const detailsDialog = emp1Page.getByRole('dialog');
      await expect(detailsDialog).toBeVisible({ timeout: 10000 });

      const delegateBtn = detailsDialog.getByRole('button', {
        name: /делегировать/i,
      });
      await expect(delegateBtn).toBeVisible({ timeout: 10000 });
      await delegateBtn.click();

      await expect(
        emp1Page.getByText('Делегировать задачу'),
      ).toBeVisible({ timeout: 10000 });

      const delegateModal = emp1Page
        .getByRole('dialog')
        .filter({ hasText: 'Делегировать задачу' })
        .or(emp1Page.getByRole('dialog').last());

      const employeeSelect = delegateModal
        .locator('select')
        .or(delegateModal.getByLabel(/кому делегировать/i))
        .first();
      await expect(employeeSelect).toBeVisible({ timeout: 5000 });
      await employeeSelect.selectOption({ label: 'Сотрудник Второй' });

      const delegateResponse = emp1Page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/') &&
          (resp.url().includes('delegat') || resp.url().includes('delegate')) &&
          (resp.request().method() === 'POST' || resp.request().method() === 'PATCH') &&
          resp.status() < 300,
        { timeout: 15000 },
      );

      await delegateModal
        .getByRole('button', { name: /делегировать/i })
        .last()
        .click();
      await delegateResponse;
    } finally {
      await emp1Ctx.close();
    }

    // Шаг 3: employee2 отклоняет делегацию
    const emp2Ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE2_STATE });
    const emp2Page = await emp2Ctx.newPage();

    try {
      await emp2Page.goto('/tasks');
      await emp2Page.waitForLoadState('domcontentloaded');
      await emp2Page.waitForTimeout(2000);

      const taskTitle = emp2Page.getByText('Задача для отклонения делегации');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = emp2Page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка «Отклонить»
      const rejectBtn = dialog.getByRole('button', { name: /отклонить/i });
      await expect(rejectBtn).toBeVisible({ timeout: 10000 });
      await rejectBtn.click();

      // Появляется форма причины отклонения
      const rejectionReason = emp2Page
        .getByPlaceholder(/укажите причину отклонения/i)
        .or(emp2Page.locator('textarea').last());
      await expect(rejectionReason).toBeVisible({ timeout: 10000 });
      await rejectionReason.fill('Занят другой задачей');

      // Подтверждаем отклонение
      const confirmRejectBtn = emp2Page
        .getByRole('button', { name: /отклонить/i })
        .last();

      const rejectResponse = emp2Page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/') &&
          (resp.url().includes('reject') ||
            resp.url().includes('delegat') ||
            resp.url().includes('delegate')) &&
          (resp.request().method() === 'POST' || resp.request().method() === 'PATCH') &&
          resp.status() < 300,
        { timeout: 15000 },
      );

      await confirmRejectBtn.click();
      await rejectResponse;

      // Отклонение зафиксировано
      await emp2Page.waitForTimeout(1500);
      const isRejected = await emp2Page
        .getByText(/отклонено|rejected/i)
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const formClosed = await rejectionReason
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      // Либо появился статус «Отклонено», либо форма закрылась
      expect(isRejected || !formClosed).toBeTruthy();
    } finally {
      await emp2Ctx.close();
    }
  });
});
