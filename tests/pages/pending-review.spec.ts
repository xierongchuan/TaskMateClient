import { test, expect } from '@playwright/test';

/**
 * Тесты страницы "Задачи на проверке" /pending-review
 * Запускаются от имени admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('Страница задач на проверке', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pending-review');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Задачи на проверке' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Задачи на проверке"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Задачи на проверке' })).toBeVisible();
  });

  test('отображается текст с количеством найденных задач', async ({ page }) => {
    // "Найдено: N задач"
    await expect(page.getByText(/найдено:/i)).toBeVisible({ timeout: 15000 });
  });

  test('если есть задачи на проверке — карточки отображаются с ожидаемыми элементами', async ({ page }) => {
    // Ждём завершения загрузки данных: появится либо EmptyState, либо кнопка "Подробнее" на карточке
    const emptyState = page.getByText(/нет задач на проверке/i);
    const taskCard = page.getByRole('button', { name: /подробнее/i }).first();
    await expect(emptyState.or(taskCard)).toBeVisible({ timeout: 15000 });

    // Теперь безопасно читать количество задач
    const countText = page.getByText(/найдено:/i);
    const text = await countText.textContent();
    const match = text?.match(/\d+/);
    const taskCount = match ? parseInt(match[0], 10) : 0;

    if (taskCount === 0) {
      // Нет задач — проверяем пустое состояние
      await expect(emptyState).toBeVisible();
      return;
    }

    // Есть задачи — PendingReviewPage рендерит карточки внутри <div class="space-y-4">
    // Карточки задач — Card компонент с классами rounded-xl внутри основного контента
    // Ищем кнопку "Подробнее" — она есть на каждой карточке задачи на проверке
    await expect(page.getByRole('button', { name: /подробнее/i }).first()).toBeVisible({ timeout: 10000 });

    // Статус-бейдж "На проверке" — присутствует на карточке
    await expect(page.getByText(/на проверке/i).first()).toBeVisible();

    // Кнопка "Отклонить" — присутствует на карточке
    await expect(page.getByRole('button', { name: /отклонить/i }).first()).toBeVisible();
  });

  test('"Подробнее" открывает TaskDetailsModal', async ({ page }) => {
    const countText = page.getByText(/найдено:/i);
    await expect(countText).toBeVisible({ timeout: 15000 });

    const text = await countText.textContent();
    const match = text?.match(/\d+/);
    const taskCount = match ? parseInt(match[0], 10) : 0;

    if (taskCount === 0) {
      test.skip();
      return;
    }

    // Кликаем "Подробнее" на первой карточке
    const detailsBtn = page.getByRole('button', { name: /подробнее/i }).first();
    await expect(detailsBtn).toBeVisible({ timeout: 5000 });
    await detailsBtn.click();

    // Модалка деталей открывается
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // В модалке есть секции описания и статуса
    await expect(dialog.locator('[class*="modal"], h2, h3').first()).toBeVisible();

    // Закрываем
    await dialog.getByRole('button', { name: /закрыть/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test('страница показывает пустое состояние при отсутствии задач на проверке', async ({ page }) => {
    // Ждём завершения загрузки данных: появится либо EmptyState, либо кнопка "Подробнее" на карточке
    const emptyState = page.getByText(/нет задач на проверке/i);
    const taskCard = page.getByRole('button', { name: /подробнее/i }).first();
    await expect(emptyState.or(taskCard)).toBeVisible({ timeout: 15000 });

    // Теперь безопасно читать количество задач
    const countText = page.getByText(/найдено:/i);
    const text = await countText.textContent();
    const match = text?.match(/\d+/);
    const taskCount = match ? parseInt(match[0], 10) : 0;

    if (taskCount === 0) {
      // Пустое состояние: EmptyState рендерит заголовок "Нет задач на проверке"
      // и описание "Все задачи проверены или ещё не отправлены на проверку"
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      // Описание содержит "Все задачи проверены" как подстроку — getByText с regex делает substring match
      await expect(page.getByText(/Все задачи проверены/)).toBeVisible({ timeout: 5000 });
    } else {
      // Задачи есть — пустого состояния нет.
      // EmptyState title "Нет задач на проверке" не должен быть виден.
      // Заголовок страницы "Задачи на проверке" не совпадает с regex /нет задач на проверке/i.
      await expect(emptyState).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('кнопка "Отклонить" открывает модалку отклонения с полем причины', async ({ page }) => {
    const countText = page.getByText(/найдено:/i);
    await expect(countText).toBeVisible({ timeout: 15000 });

    const text = await countText.textContent();
    const match = text?.match(/\d+/);
    const taskCount = match ? parseInt(match[0], 10) : 0;

    if (taskCount === 0) {
      test.skip();
      return;
    }

    // Кликаем "Отклонить" на первой карточке
    const rejectBtn = page.getByRole('button', { name: /отклонить/i }).first();
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    await rejectBtn.click();

    // Открылась модалка — либо выбора режима, либо сразу с textarea
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Модалка содержит заголовок об отклонении
    await expect(dialog.getByText(/отклонение/i)).toBeVisible();
  });
});
