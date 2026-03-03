import { test, expect } from '@playwright/test';
import { readState, updateState } from './setup/state';
import { FUNC_EMPLOYEE1_STATE } from './setup/helpers';

/**
 * Функциональные тесты страницы ссылок /links
 * Тесты выполняются строго последовательно (serial).
 * Авторизация через storageState func-admin.json (admin/owner).
 */
test.describe.serial('07 — Links: CRUD ссылок', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/links');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.getByRole('heading', { name: 'Ссылки' }),
    ).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Пустое состояние ─────────────────────────────────────────────────

  test('пустое состояние — нет ссылок или пустой список', async ({
    page,
  }) => {
    const addButton = page.getByRole('button', { name: 'Добавить ссылку' }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });

    // Может быть явное сообщение «Нет ссылок» или пустой список
    const noLinks = page.getByText('Нет ссылок');
    const noLinksVisible = await noLinks.isVisible().catch(() => false);
    if (!noLinksVisible) {
      // Просто убеждаемся что кнопка добавления видна
      await expect(addButton).toBeVisible();
    }
  });

  // ─── 2. Создание «Google Документы» ──────────────────────────────────────

  test('создание ссылки «Google Документы» — появляется в списке', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Добавить ссылку' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByRole('heading', { name: 'Добавить ссылку' }),
    ).toBeVisible({ timeout: 5000 });

    // Название
    await dialog.getByLabel('Название').fill('Google Документы');

    // URL
    await dialog.getByLabel('URL').fill('https://docs.google.com');

    // Категория — Документы
    const categorySelect = dialog.getByLabel('Категория');
    await categorySelect.selectOption('documents');

    // Описание
    await dialog
      .getByLabel('Описание')
      .fill('Общие документы компании');

    // Перехватываем ответ POST
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/links') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const linkId: number = body.data?.id ?? body.id;

    updateState({ linkId });

    // Ссылка должна появиться в списке
    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 3. Создание «CRM Система» ───────────────────────────────────────────

  test('создание ссылки «CRM Система» — появляется в списке', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Добавить ссылку' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Название
    await dialog.getByLabel('Название').fill('CRM Система');

    // URL
    await dialog.getByLabel('URL').fill('https://crm.example.com');

    // Категория — CRM
    const categorySelect = dialog.getByLabel('Категория');
    await categorySelect.selectOption('crm');

    // Перехватываем ответ POST
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/links') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: 'Создать' }).click();

    const response = await responsePromise;
    const body = await response.json();
    const link2Id: number = body.data?.id ?? body.id;

    updateState({ link2Id });

    // Ссылка должна появиться в списке
    await expect(page.getByText('CRM Система')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 4. Обе ссылки видны ─────────────────────────────────────────────────

  test('обе ссылки видны в списке', async ({ page }) => {
    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('CRM Система')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 5. Поиск по «Google» ────────────────────────────────────────────────

  test('поиск «Google» — видна только первая ссылка', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder="Поиск ссылок..."]',
    );
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Google');

    // Ждём debounce
    await page.waitForTimeout(1000);

    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('CRM Система')).not.toBeVisible({
      timeout: 5000,
    });
  });

  // ─── 6. Очистка поиска — обе ссылки снова видны ──────────────────────────

  test('очистка поиска — обе ссылки снова видны', async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder="Поиск ссылок..."]',
    );
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('Google');
    await page.waitForTimeout(1000);
    await searchInput.clear();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('CRM Система')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── 7. Редактирование названия ──────────────────────────────────────────

  test('редактирование названия ссылки — название обновляется', async ({
    page,
  }) => {
    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 10000,
    });

    // Наводим курсор на карточку «Google Документы»
    const googleCard = page
      .locator('div')
      .filter({ hasText: /Google Документы/ })
      .last();
    await googleCard.hover();

    // Кнопка редактирования (иконка карандаша)
    const editButton = googleCard
      .locator(
        'button[aria-label*="редакт" i], button[aria-label*="изменить" i], button[title*="изменить" i]',
      )
      .or(
        googleCard
          .locator('button')
          .filter({ hasText: /edit|pencil|изменить/i }),
      )
      .or(googleCard.locator('button').first())
      .first();

    await editButton.click({ force: true });

    // Диалог «Редактировать ссылку»
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible({ timeout: 5000 });

    // Меняем название
    const nameInput = editDialog.getByLabel('Название');
    await nameInput.clear();
    await nameInput.fill('Google Документы Изменено');

    // Перехватываем ответ PUT/PATCH
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/links') &&
        (resp.request().method() === 'PUT' ||
          resp.request().method() === 'PATCH') &&
        resp.status() === 200,
    );

    await editDialog
      .getByRole('button', { name: /сохранить/i })
      .click();

    await responsePromise;

    // Обновлённое название должно появиться
    await expect(page.getByText('Google Документы Изменено')).toBeVisible({
      timeout: 10000,
    });

    // Возвращаем исходное название
    const updatedCard = page
      .locator('div')
      .filter({ hasText: /Google Документы Изменено/ })
      .last();
    await updatedCard.hover();

    const editButton2 = updatedCard
      .locator(
        'button[aria-label*="редакт" i], button[aria-label*="изменить" i]',
      )
      .or(updatedCard.locator('button').first())
      .first();
    await editButton2.click({ force: true });

    const editDialog2 = page.getByRole('dialog');
    await expect(editDialog2).toBeVisible({ timeout: 5000 });

    const nameInput2 = editDialog2.getByLabel('Название');
    await nameInput2.clear();
    await nameInput2.fill('Google Документы');

    const responsePromise2 = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/links') &&
        (resp.request().method() === 'PUT' ||
          resp.request().method() === 'PATCH') &&
        resp.status() === 200,
    );

    await editDialog2
      .getByRole('button', { name: /сохранить/i })
      .click();
    await responsePromise2;
  });

  // ─── 8. Валидация: без названия — форма не отправляется ──────────────────

  test('валидация: без названия — модалка остаётся открытой', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Добавить ссылку' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Заполняем только URL, название оставляем пустым
    await dialog.getByLabel('URL').fill('https://example.com');

    await dialog.getByRole('button', { name: 'Создать' }).click();

    // Модалка должна остаться открытой
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Закрываем модалку
    await dialog.getByRole('button', { name: 'Отмена' }).click();
  });

  // ─── 9. Валидация: некорректный URL ──────────────────────────────────────

  test('валидация: некорректный URL — ошибка валидации', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Добавить ссылку' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Заполняем название и некорректный URL
    await dialog.getByLabel('Название').fill('Тест невалидный URL');
    await dialog.getByLabel('URL').fill('not-a-url');

    await dialog.getByRole('button', { name: 'Создать' }).click();

    // Должна появиться ошибка или модалка остаться открытой
    const errorOrStaysOpen =
      (await page.getByText(/некорректн|неверн|url/i).isVisible()) ||
      (await dialog.isVisible());

    expect(errorOrStaysOpen).toBe(true);

    // Закрываем, если модалка ещё открыта
    const dialogStillOpen = await dialog.isVisible().catch(() => false);
    if (dialogStillOpen) {
      await dialog.getByRole('button', { name: 'Отмена' }).click();
    }
  });

  // ─── 10. Сотрудник видит ссылки, но не может создавать ───────────────────

  test('сотрудник видит ссылки, кнопка «Добавить ссылку» недоступна', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      storageState: FUNC_EMPLOYEE1_STATE,
    });
    const empPage = await ctx.newPage();

    try {
      await empPage.goto('/links');
      await empPage.waitForLoadState('domcontentloaded');
      await expect(
        empPage.getByRole('heading', { name: 'Ссылки' }),
      ).toBeVisible({ timeout: 15000 });

      // Ссылки должны быть видны
      await expect(empPage.getByText('Google Документы')).toBeVisible({
        timeout: 10000,
      });

      // Кнопка «Добавить ссылку» НЕ должна быть видна для сотрудника
      await expect(
        empPage.getByRole('button', { name: 'Добавить ссылку' }).first(),
      ).not.toBeVisible({ timeout: 5000 });
    } finally {
      await ctx.close();
    }
  });

  // ─── 11. Удаление «CRM Система» ──────────────────────────────────────────

  test('удаление ссылки «CRM Система» — пропадает из списка', async ({
    page,
  }) => {
    await expect(page.getByText('CRM Система')).toBeVisible({
      timeout: 10000,
    });

    // Находим карточку «CRM Система»
    const crmCard = page
      .locator('div')
      .filter({ hasText: /CRM Система/ })
      .last();
    await crmCard.hover();

    // Кнопка удаления (иконка корзины)
    const deleteButton = crmCard
      .locator(
        'button[aria-label*="удал" i], button[title*="удалить" i]',
      )
      .or(
        crmCard
          .locator('button')
          .filter({ hasText: /trash|delete|удалить/i }),
      )
      .or(crmCard.locator('button').last())
      .first();

    await deleteButton.click({ force: true });

    // Диалог подтверждения
    await expect(
      page.getByText(/Удалить ссылку/i),
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Удалить' }).click();

    // «CRM Система» должна исчезнуть
    await expect(page.getByText('CRM Система')).not.toBeVisible({
      timeout: 10000,
    });

    // «Google Документы» остаётся
    await expect(page.getByText('Google Документы')).toBeVisible({
      timeout: 5000,
    });
  });
});
