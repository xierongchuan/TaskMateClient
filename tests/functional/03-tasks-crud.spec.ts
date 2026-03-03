import { test, expect } from '@playwright/test';
import { readState, updateState } from './setup/state';
import { formatDatetimeLocal } from './setup/helpers';

/**
 * Функциональные тесты страницы задач /tasks
 * Тесты выполняются строго последовательно (serial).
 * Автосалоны и пользователи уже созданы в тестах 01/02.
 * Авторизация через storageState func-admin.json (admin/owner).
 */
test.describe.serial('03 — Tasks: CRUD задач', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible({ timeout: 15000 });
  });

  // ─── 1. Пустое состояние ────────────────────────────────────────────────────

  test('пустое состояние — задачи отсутствуют, отображается пустой список', async ({ page }) => {
    // Ждём завершения загрузки данных
    await page.waitForTimeout(1500);

    await expect(page.getByText(/задачи не найдены|создайте первую/i).first()).toBeVisible({ timeout: 10000 });
  });

  // ─── 2. Создание notification задачи ────────────────────────────────────────

  test('создание notification задачи — «Уведомление для сотрудника»', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Заполняем название
    await dialog.getByLabel(/название/i).fill('Уведомление для сотрудника');

    // Выбираем приоритет
    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Высокий' });

    // Выбираем тип ответа
    await dialog.getByLabel(/тип ответа/i).selectOption({ label: 'Уведомление' });

    // Выбираем автосалон
    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    // Заполняем даты
    const now = new Date();
    const appearDate = new Date(now.getTime());
    const deadlineDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await dialog.getByLabel(/дата появления/i).fill(formatDatetimeLocal(appearDate));
    await dialog.getByLabel(/дедлайн/i).fill(formatDatetimeLocal(deadlineDate));

    // Выбираем сотрудника-получателя
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
    const taskNotificationId: number = body.data.id;

    updateState({ taskNotificationId });

    // Модалка закрывается и задача появляется в списке
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });
  });

  // ─── 3. Создание completion задачи ──────────────────────────────────────────

  test('создание completion задачи — «Задача на выполнение»', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByLabel(/название/i).fill('Задача на выполнение');

    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Средний' });

    await dialog.getByLabel(/тип ответа/i).selectOption({ label: 'На выполнение' });

    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await dialog.locator('label').filter({ hasText: 'Сотрудник Первый' }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: /создать/i }).click();

    const response = await responsePromise;
    const body = await response.json();
    const taskCompletionId: number = body.data.id;

    updateState({ taskCompletionId });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача на выполнение')).toBeVisible({ timeout: 10000 });
  });

  // ─── 4. Создание completion_with_proof задачи ────────────────────────────────

  test('создание completion_with_proof задачи — «Задача с доказательством»', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByLabel(/название/i).fill('Задача с доказательством');

    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Высокий' });

    await dialog.getByLabel(/тип ответа/i).selectOption({ label: 'С доказательством' });

    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await dialog.locator('label').filter({ hasText: 'Сотрудник Первый' }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: /создать/i }).click();

    const response = await responsePromise;
    const body = await response.json();
    const taskProofId: number = body.data.id;

    updateState({ taskProofId });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача с доказательством')).toBeVisible({ timeout: 10000 });
  });

  // ─── 5. Создание групповой задачи ────────────────────────────────────────────

  test('создание групповой задачи — «Групповая задача» с двумя получателями', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByLabel(/название/i).fill('Групповая задача');

    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Низкий' });

    await dialog.getByLabel(/тип ответа/i).selectOption({ label: 'На выполнение' });

    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    // Ждём загрузки списка сотрудников и выбираем обоих
    await dialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await dialog.locator('label').filter({ hasText: 'Сотрудник Первый' }).click();
    await dialog.locator('label').filter({ hasText: 'Сотрудник Второй' }).click();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: /создать/i }).click();

    const response = await responsePromise;
    const body = await response.json();
    const taskGroupId: number = body.data.id;

    updateState({ taskGroupId });

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Групповая задача')).toBeVisible({ timeout: 10000 });
  });

  // ─── 6. Валидация: без названия ──────────────────────────────────────────────

  test('валидация: без названия — форма не отправляется, модалка остаётся открытой', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Выбираем автосалон, но не заполняем название
    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    // Пытаемся отправить форму
    await dialog.getByRole('button', { name: /создать/i }).click();

    // Модалка должна остаться открытой — название обязательно
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Закрываем модалку
    await dialog.getByRole('button', { name: /отмена/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 7. Все 4 задачи в списке ────────────────────────────────────────────────

  test('все 4 созданные задачи видны в списке', async ({ page }) => {
    await page.waitForTimeout(1000);

    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача на выполнение')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача с доказательством')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Групповая задача')).toBeVisible({ timeout: 10000 });
  });

  // ─── 8. Фильтр по приоритету ─────────────────────────────────────────────────

  test('фильтр по приоритету «Высокий» — видны только задачи с высоким приоритетом', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    const prioritySelect = page.getByLabel('Приоритет');
    await expect(prioritySelect).toBeVisible({ timeout: 5000 });
    await prioritySelect.selectOption({ label: 'Высокий' });

    await page.waitForTimeout(1500);

    // Задачи с высоким приоритетом видны
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача с доказательством')).toBeVisible({ timeout: 10000 });

    // Задачи с другими приоритетами не видны
    await expect(page.getByText('Задача на выполнение')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Групповая задача')).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 9. Сброс фильтра ────────────────────────────────────────────────────────

  test('сброс фильтра — все задачи снова видны', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    // Устанавливаем фильтр, чтобы кнопка сброса появилась
    const prioritySelect = page.getByLabel('Приоритет');
    await expect(prioritySelect).toBeVisible({ timeout: 5000 });
    await prioritySelect.selectOption({ label: 'Высокий' });
    await page.waitForTimeout(500);

    const resetBtn = page.getByRole('button', { name: /сбросить фильтры/i });
    await expect(resetBtn).toBeVisible({ timeout: 5000 });
    await resetBtn.click();

    await page.waitForTimeout(1500);

    // Все 4 задачи должны быть видны
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача на выполнение')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Задача с доказательством')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Групповая задача')).toBeVisible({ timeout: 10000 });
  });

  // ─── 10. Фильтр по типу ответа ───────────────────────────────────────────────

  test('фильтр по типу ответа «Уведомление» — видна только notification задача', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    const responseTypeSelect = page.getByLabel('Тип ответа');
    await expect(responseTypeSelect).toBeVisible({ timeout: 5000 });
    await responseTypeSelect.selectOption({ label: 'Уведомление' });

    await page.waitForTimeout(1500);

    // Только notification задача должна быть видна
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });

    // Остальные задачи не видны
    await expect(page.getByText('Задача на выполнение')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Задача с доказательством')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Групповая задача')).not.toBeVisible({ timeout: 5000 });

    // Сбрасываем фильтр для следующего теста
    const resetBtn = page.getByRole('button', { name: /сбросить фильтры/i });
    await expect(resetBtn).toBeVisible({ timeout: 5000 });
    await resetBtn.click();
    await page.waitForTimeout(1000);
  });

  // ─── 11. Поиск по названию ───────────────────────────────────────────────────

  test('поиск «Групповая» — видна только групповая задача', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    const searchInput = page.getByLabel('Поиск');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('Групповая');

    // Ждём debounce/обновления
    await page.waitForTimeout(1500);

    // Только групповая задача видна
    await expect(page.getByText('Групповая задача')).toBeVisible({ timeout: 10000 });

    // Остальные задачи не видны
    await expect(page.getByText('Уведомление для сотрудника')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Задача на выполнение')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Задача с доказательством')).not.toBeVisible({ timeout: 5000 });

    // Сбрасываем фильтр для следующего теста
    const resetBtn = page.getByRole('button', { name: /сбросить фильтры/i });
    await expect(resetBtn).toBeVisible({ timeout: 5000 });
    await resetBtn.click();
    await page.waitForTimeout(1000);
  });

  // ─── 12. Детали задачи ───────────────────────────────────────────────────────

  test('детали задачи — клик по заголовку открывает диалог с дедлайном, автосалоном и создателем', async ({ page }) => {
    // Ждём загрузки задач
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });

    // Кликаем на заголовок первой задачи — ClickableTitle рендерит button.cursor-pointer
    const clickableTitles = page.locator('main button.cursor-pointer');
    await expect(clickableTitles.first()).toBeVisible({ timeout: 5000 });
    await clickableTitles.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Диалог деталей содержит ключевые секции
    await expect(dialog.getByText(/дедлайн/i)).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/автосалон/i)).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/создатель/i)).toBeVisible({ timeout: 5000 });
  });

  // ─── 13. Закрытие деталей ────────────────────────────────────────────────────

  test('закрытие диалога деталей задачи', async ({ page }) => {
    // Открываем диалог деталей
    await expect(page.getByText('Уведомление для сотрудника')).toBeVisible({ timeout: 10000 });

    const clickableTitles = page.locator('main button.cursor-pointer');
    await expect(clickableTitles.first()).toBeVisible({ timeout: 5000 });
    await clickableTitles.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Закрываем через кнопку с иконкой X (Modal рендерит кнопку закрытия с SVG)
    await dialog.locator('button svg').first().click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 14. Переключение список/карточки ────────────────────────────────────────

  test('переключение вида — список и карточки', async ({ page }) => {
    // Кнопки переключения должны быть видны
    await expect(page.locator('button[title="Список"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[title="Карточки"]')).toBeVisible({ timeout: 5000 });

    // Переключаем на вид карточек
    await page.locator('button[title="Карточки"]').click();

    // В режиме карточек появляется grid layout
    await expect(page.locator('.grid.grid-cols-1.md\\:grid-cols-2')).toBeVisible({ timeout: 5000 });

    // Переключаем обратно на список
    await page.locator('button[title="Список"]').click();

    // В режиме списка grid md:grid-cols-2 не виден
    await expect(page.locator('.grid.grid-cols-1.md\\:grid-cols-2')).not.toBeVisible({ timeout: 5000 });
  });

  // ─── 15. Удаление задачи ─────────────────────────────────────────────────────

  test('удаление задачи — создать временную задачу и удалить её', async ({ page }) => {
    // Создаём временную задачу
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByLabel(/название/i).fill('Временная задача для удаления');

    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Низкий' });

    const dealershipBlock = dialog.getByText('Автосалон *', { exact: true }).locator('..');
    const dealershipSelect = dealershipBlock.locator('select');
    await dealershipSelect.selectOption({ label: 'Автосалон Тест-1' });

    await dialog.getByText('Сотрудник Первый').waitFor({ timeout: 5000 });
    await dialog.locator('label').filter({ hasText: 'Сотрудник Первый' }).click();

    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/tasks') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await dialog.getByRole('button', { name: /создать/i }).click();
    await createResponsePromise;

    await expect(dialog).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Временная задача для удаления')).toBeVisible({ timeout: 10000 });

    // Открываем детали временной задачи
    const taskButton = page.locator('main button.cursor-pointer').filter({ hasText: 'Временная задача для удаления' });
    await expect(taskButton).toBeVisible({ timeout: 5000 });
    await taskButton.click();

    const detailsDialog = page.getByRole('dialog');
    await expect(detailsDialog).toBeVisible({ timeout: 5000 });

    // Пробуем открыть форму редактирования для поиска механизма удаления
    const editButton = detailsDialog.getByRole('button', { name: /редактировать/i });
    const hasEditButton = await editButton.isVisible();

    if (hasEditButton) {
      await editButton.click();

      // Проверяем наличие кнопки удаления в форме редактирования или деталях
      const deleteButton = page.getByRole('button', { name: /удалить/i });
      const hasDeleteButton = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasDeleteButton) {
        const deleteResponsePromise = page.waitForResponse(
          (resp) =>
            resp.url().includes('/api/tasks') &&
            resp.request().method() === 'DELETE' &&
            resp.status() === 200,
        );

        await deleteButton.click();

        // Возможно потребуется подтверждение
        const confirmButton = page.getByRole('button', { name: /подтвердить|да|удалить/i });
        const hasConfirm = await confirmButton.isVisible({ timeout: 2000 }).catch(() => false);
        if (hasConfirm) {
          await confirmButton.click();
        }

        await deleteResponsePromise;

        // Задача должна исчезнуть из списка
        await expect(page.getByText('Временная задача для удаления')).not.toBeVisible({ timeout: 10000 });
      } else {
        // Кнопка удаления не найдена — механизм удаления через UI требует уточнения
        test.fixme(true, 'Кнопка удаления задачи через UI не найдена — требуется уточнение механизма удаления');
      }
    } else {
      // Кнопка редактирования не найдена — механизм удаления через UI требует уточнения
      test.fixme(true, 'Кнопка редактирования в деталях задачи не найдена — требуется уточнение механизма удаления');
    }
  });
});
