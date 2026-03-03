import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { readState } from './setup/state';
import {
  FUNC_EMPLOYEE1_STATE,
  FUNC_EMPLOYEE2_STATE,
  FUNC_MANAGER_STATE,
  FUNC_ADMIN_STATE,
} from './setup/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');

// Читаем состояние, созданное предыдущими тестами (03-tasks-crud).
// FUNC_ADMIN_STATE доступен для использования в расширенных сценариях.
const _state = readState();
void _state;
void FUNC_ADMIN_STATE;

/**
 * Функциональные тесты workflow (жизненный цикл) задач.
 * Тесты выполняются строго последовательно (serial).
 * Задачи созданы в 03-tasks-crud.spec.ts.
 * Используют несколько ролей: employee1, employee2, manager.
 */
test.describe.serial('Task Workflow — полный lifecycle задач', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Часть A: Notification task
  // ═══════════════════════════════════════════════════════════════════════════

  test('A1: employee1 видит уведомление', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

      // Ждём загрузки задач
      await page.waitForTimeout(2000);

      // Находим задачу "Уведомление для сотрудника" и кликаем на неё
      const taskTitle = page.getByText('Уведомление для сотрудника');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      // Диалог с деталями задачи должен открыться
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // В диалоге виден заголовок задачи
      await expect(dialog.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  test('A2: employee1 подтверждает уведомление', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Открываем задачу
      const taskTitle = page.getByText('Уведомление для сотрудника');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кликаем кнопку "Подтвердить" (action для notification type)
      const confirmBtn = dialog.getByRole('button', { name: /подтвердить/i });
      await expect(confirmBtn).toBeVisible({ timeout: 10000 });

      // Перехватываем ответ API на обновление статуса
      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          resp.url().includes('/status') &&
          resp.request().method() === 'PATCH',
        { timeout: 15000 },
      );

      await confirmBtn.click();
      await responsePromise;

      // Статус изменился — видно "Подтверждено" или "Выполнено"
      await page.waitForTimeout(2000);
      const completedText = dialog
        .getByText(/подтверждено/i)
        .or(dialog.getByText(/выполнено/i));
      await expect(completedText).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Часть B: Completion task
  // ═══════════════════════════════════════════════════════════════════════════

  test('B3: employee1 видит задачу на выполнение', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Находим задачу "Задача на выполнение"
      const taskTitle = page.getByText('Задача на выполнение');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await expect(dialog.getByText('Задача на выполнение')).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  test('B4: employee1 выполняет задачу — статус "На проверке"', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const taskTitle = page.getByText('Задача на выполнение');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка "Выполнить" для completion type
      const executeBtn = dialog.getByRole('button', { name: /выполнить/i });
      await expect(executeBtn).toBeVisible({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          resp.url().includes('/status') &&
          resp.request().method() === 'PATCH',
        { timeout: 15000 },
      );

      await executeBtn.click();
      await responsePromise;

      // Статус "На проверке"
      await page.waitForTimeout(2000);
      await expect(dialog.getByText(/на проверке/i)).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('B5: менеджер видит задачу на проверке', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/pending-review');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Задачи на проверке' }),
      ).toBeVisible({ timeout: 15000 });

      await page.waitForTimeout(2000);

      // Задача "Задача на выполнение" должна появиться в списке
      await expect(page.getByText('Задача на выполнение')).toBeVisible({ timeout: 15000 });
    } finally {
      await ctx.close();
    }
  });

  test('B6: менеджер одобряет задачу — статус "Одобрено"', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/pending-review');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Задачи на проверке' }),
      ).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Ищем карточку задачи "Задача на выполнение" и открываем детали
      const taskCard = page
        .locator('div')
        .filter({ hasText: 'Задача на выполнение' })
        .first();

      // Кликаем "Подробнее" в этой карточке
      const detailsBtn = taskCard
        .getByRole('button', { name: /подробнее/i })
        .or(page.getByRole('button', { name: /подробнее/i }).first());
      await expect(detailsBtn).toBeVisible({ timeout: 10000 });
      await detailsBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // VerificationPanel — кнопка "Одобрить"
      const approveBtn = dialog.getByRole('button', { name: /одобрить/i });
      await expect(approveBtn).toBeVisible({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/task-responses') &&
          resp.url().includes('/approve') &&
          resp.request().method() === 'POST',
        { timeout: 15000 },
      );

      await approveBtn.click();
      await responsePromise;

      // Статус изменился на "Одобрено" или "Выполнена"
      await page.waitForTimeout(2000);
      const approvedText = dialog
        .getByText(/одобрено/i)
        .or(dialog.getByText(/выполнена/i))
        .or(dialog.getByText(/выполнено/i));
      await expect(approvedText).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Часть C: Completion with proof (reject + resubmit)
  // ═══════════════════════════════════════════════════════════════════════════

  test('C7: employee1 загружает доказательство', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Находим задачу "Задача с доказательством"
      const taskTitle = page.getByText('Задача с доказательством');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка "Загрузить доказательство" для completion_with_proof type
      const uploadBtn = dialog.getByRole('button', { name: /загрузить доказательство/i });
      await expect(uploadBtn).toBeVisible({ timeout: 10000 });
      await uploadBtn.click();

      // Появляется интерфейс загрузки файла
      const fileInput = dialog.locator('input[type="file"]');
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(TEST_IMAGE);

      // Ждём загрузки файла и активации кнопки отправки
      await page.waitForTimeout(1000);

      // Отправляем форму / подтверждаем загрузку
      const submitBtn = dialog
        .getByRole('button', { name: /отправить/i })
        .or(dialog.getByRole('button', { name: /загрузить/i }).last())
        .or(dialog.getByRole('button', { name: /подтвердить/i }));
      await expect(submitBtn).toBeVisible({ timeout: 5000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          (resp.url().includes('/status') || resp.url().includes('/proof')) &&
          (resp.request().method() === 'PATCH' || resp.request().method() === 'POST'),
        { timeout: 20000 },
      );

      await submitBtn.click();
      await responsePromise;

      // Статус "На проверке"
      await page.waitForTimeout(2000);
      await expect(dialog.getByText(/на проверке/i)).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('C8: менеджер отклоняет доказательство', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/pending-review');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Задачи на проверке' }),
      ).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Ищем карточку задачи "Задача с доказательством"
      const taskCard = page
        .locator('div')
        .filter({ hasText: 'Задача с доказательством' })
        .first();

      const detailsBtn = taskCard
        .getByRole('button', { name: /подробнее/i })
        .or(page.getByRole('button', { name: /подробнее/i }).first());
      await expect(detailsBtn).toBeVisible({ timeout: 10000 });
      await detailsBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // VerificationPanel — кнопка "Отклонить"
      const rejectBtn = dialog.getByRole('button', { name: /отклонить/i });
      await expect(rejectBtn).toBeVisible({ timeout: 10000 });
      await rejectBtn.click();

      // Открывается модалка отклонения
      // Заголовок: "Отклонение доказательства"
      await expect(
        page.getByText(/отклонение доказательства/i),
      ).toBeVisible({ timeout: 10000 });

      // Вводим причину отклонения
      const reasonTextarea = page.getByLabel(/причина отклонения/i);
      await expect(reasonTextarea).toBeVisible({ timeout: 5000 });
      await reasonTextarea.fill('Нужно фото лучшего качества');

      // Подтверждаем отклонение
      const confirmRejectBtn = page.getByRole('button', { name: /отклонить/i }).last();
      await expect(confirmRejectBtn).toBeVisible({ timeout: 5000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/task-responses') &&
          resp.url().includes('/reject') &&
          resp.request().method() === 'POST',
        { timeout: 15000 },
      );

      await confirmRejectBtn.click();
      await responsePromise;

      // Статус обновлён
      await page.waitForTimeout(2000);
      await expect(
        page.getByText(/отклонено/i).or(page.getByRole('dialog').getByText(/отклонено/i)),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('C9: employee1 видит отклонение и загружает доказательство заново', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const taskTitle = page.getByText('Задача с доказательством');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Видна причина отклонения: "Отклонено (N раз): reason"
      await expect(
        dialog.getByText(/отклонено \(\d+ раз\)/i).or(dialog.getByText(/нужно фото лучшего качества/i)),
      ).toBeVisible({ timeout: 10000 });

      // Кнопка "Загрузить заново" (для proof type после отклонения)
      const reuploadBtn = dialog.getByRole('button', { name: /загрузить заново/i });
      await expect(reuploadBtn).toBeVisible({ timeout: 10000 });
      await reuploadBtn.click();

      // Появляется интерфейс загрузки файла
      const fileInput = dialog.locator('input[type="file"]');
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      await fileInput.setInputFiles(TEST_IMAGE);

      await page.waitForTimeout(1000);

      // Отправляем повторно
      const submitBtn = dialog
        .getByRole('button', { name: /отправить/i })
        .or(dialog.getByRole('button', { name: /загрузить/i }).last())
        .or(dialog.getByRole('button', { name: /подтвердить/i }));
      await expect(submitBtn).toBeVisible({ timeout: 5000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          (resp.url().includes('/status') || resp.url().includes('/proof')) &&
          (resp.request().method() === 'PATCH' || resp.request().method() === 'POST'),
        { timeout: 20000 },
      );

      await submitBtn.click();
      await responsePromise;

      // Снова "На проверке"
      await page.waitForTimeout(2000);
      await expect(dialog.getByText(/на проверке/i)).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('C10: менеджер одобряет повторную отправку', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/pending-review');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Задачи на проверке' }),
      ).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Ищем карточку "Задача с доказательством"
      const taskCard = page
        .locator('div')
        .filter({ hasText: 'Задача с доказательством' })
        .first();

      const detailsBtn = taskCard
        .getByRole('button', { name: /подробнее/i })
        .or(page.getByRole('button', { name: /подробнее/i }).first());
      await expect(detailsBtn).toBeVisible({ timeout: 10000 });
      await detailsBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // VerificationPanel — кнопка "Одобрить"
      const approveBtn = dialog.getByRole('button', { name: /одобрить/i });
      await expect(approveBtn).toBeVisible({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/task-responses') &&
          resp.url().includes('/approve') &&
          resp.request().method() === 'POST',
        { timeout: 15000 },
      );

      await approveBtn.click();
      await responsePromise;

      // Статус "Одобрено"
      await page.waitForTimeout(2000);
      const approvedText = dialog
        .getByText(/одобрено/i)
        .or(dialog.getByText(/выполнена/i))
        .or(dialog.getByText(/выполнено/i));
      await expect(approvedText).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Часть D: Group task
  // ═══════════════════════════════════════════════════════════════════════════

  test('D11: employee1 видит групповую задачу', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Находим "Групповую задачу"
      const taskTitle = page.getByText('Групповая задача');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await expect(dialog.getByText('Групповая задача')).toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  test('D12: employee1 выполняет свою часть групповой задачи', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE1_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const taskTitle = page.getByText('Групповая задача');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка "Выполнить" для completion type
      const executeBtn = dialog.getByRole('button', { name: /выполнить/i });
      await expect(executeBtn).toBeVisible({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          resp.url().includes('/status') &&
          resp.request().method() === 'PATCH',
        { timeout: 15000 },
      );

      await executeBtn.click();
      await responsePromise;

      // Частичное выполнение — задача переходит в "На проверке" (индивидуальная часть)
      await page.waitForTimeout(2000);
      // Статус может показывать "На проверке" или частичное выполнение
      await expect(
        dialog
          .getByText(/на проверке/i)
          .or(dialog.getByText(/выполнено/i))
          .or(dialog.getByText(/частично/i)),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('D13: employee2 выполняет свою часть групповой задачи', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_EMPLOYEE2_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/tasks');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Employee2 тоже видит "Групповую задачу"
      const taskTitle = page.getByText('Групповая задача');
      await expect(taskTitle).toBeVisible({ timeout: 15000 });
      await taskTitle.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Кнопка "Выполнить" доступна employee2
      const executeBtn = dialog.getByRole('button', { name: /выполнить/i });
      await expect(executeBtn).toBeVisible({ timeout: 10000 });

      const responsePromise = page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/tasks') &&
          resp.url().includes('/status') &&
          resp.request().method() === 'PATCH',
        { timeout: 15000 },
      );

      await executeBtn.click();
      await responsePromise;

      // Статус отправлен на проверку
      await page.waitForTimeout(2000);
      await expect(
        dialog
          .getByText(/на проверке/i)
          .or(dialog.getByText(/выполнено/i)),
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await ctx.close();
    }
  });

  test('D14: менеджер одобряет обе отправки групповой задачи', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: FUNC_MANAGER_STATE });
    const page = await ctx.newPage();
    try {
      await page.goto('/pending-review');
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.getByRole('heading', { name: 'Задачи на проверке' }),
      ).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Для групповой задачи может быть несколько записей на проверке.
      // Одобряем все найденные отправки "Групповой задачи".
      const approveGroupTask = async () => {
        // Ищем карточку с "Групповая задача" на странице
        const taskCard = page
          .locator('div')
          .filter({ hasText: 'Групповая задача' })
          .first();

        const isVisible = await taskCard.isVisible();
        if (!isVisible) {
          return false;
        }

        const detailsBtn = taskCard
          .getByRole('button', { name: /подробнее/i })
          .or(page.getByRole('button', { name: /подробнее/i }).first());
        await expect(detailsBtn).toBeVisible({ timeout: 10000 });
        await detailsBtn.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Одобряем все доступные отправки в диалоге
        const approveBtns = dialog.getByRole('button', { name: /одобрить/i });
        const btnCount = await approveBtns.count();

        for (let i = 0; i < btnCount; i++) {
          const btn = approveBtns.nth(i);
          const isVisible = await btn.isVisible();
          if (!isVisible) continue;

          const responsePromise = page.waitForResponse(
            (resp) =>
              resp.url().includes('/api/task-responses') &&
              resp.url().includes('/approve') &&
              resp.request().method() === 'POST',
            { timeout: 15000 },
          );

          await btn.click();
          await responsePromise;
          await page.waitForTimeout(1000);
        }

        // Закрываем диалог
        const closeBtn = dialog
          .getByRole('button', { name: /закрыть/i })
          .or(dialog.locator('button[aria-label*="закрыть"]').first())
          .or(dialog.locator('button').filter({ has: page.locator('svg') }).first());
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(dialog).not.toBeVisible({ timeout: 5000 });
        }

        return true;
      };

      // Одобряем первую отправку
      const found1 = await approveGroupTask();
      expect(found1).toBeTruthy();

      // Обновляем страницу и проверяем вторую отправку (если есть)
      await page.waitForTimeout(1000);
      const groupTaskStillVisible = await page
        .getByText('Групповая задача')
        .isVisible();

      if (groupTaskStillVisible) {
        await approveGroupTask();
      }

      // После одобрения всех отправок задача исчезает из списка
      // или отображается как полностью выполненная
      await page.waitForTimeout(2000);
    } finally {
      await ctx.close();
    }
  });
});
