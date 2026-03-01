import { test, expect } from '@playwright/test';

/**
 * Тесты страницы задач /tasks
 * Запускаются от имени admin (owner) — storageState задан в playwright.config.ts
 */
test.describe('Страница задач', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('domcontentloaded');
    // Ждём рендера заголовка страницы
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Задачи"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible();
  });

  test('кнопка "Создать задачу" видна для admin', async ({ page }) => {
    await expect(page.getByRole('button', { name: /создать задачу/i })).toBeVisible();
  });

  test('кнопки переключения вида (список / карточки) присутствуют', async ({ page }) => {
    // ViewModeToggle рендерит кнопки с атрибутом title="Список" / title="Карточки"
    await expect(page.locator('button[title="Список"]')).toBeVisible();
    await expect(page.locator('button[title="Карточки"]')).toBeVisible();
  });

  test('можно переключиться между видом списка и видом карточек', async ({ page }) => {
    // Переключаем на вид карточек
    await page.locator('button[title="Карточки"]').click();
    // Ожидаем что появилась сетка карточек (grid layout)
    await expect(page.locator('.grid.grid-cols-1.md\\:grid-cols-2')).toBeVisible();

    // Переключаем обратно на список
    await page.locator('button[title="Список"]').click();
    // В режиме списка нет grid md:grid-cols-2
    await expect(page.locator('.grid.grid-cols-1.md\\:grid-cols-2')).not.toBeVisible();
  });

  test('панель фильтров разворачивается и сворачивается', async ({ page }) => {
    // По умолчанию панель свёрнута — содержимое скрыто
    const filterContent = page.locator('input[placeholder*="Название или описание"]');

    // Открываем фильтры (кнопка содержит текст "Показать")
    const toggleBtn = page.getByRole('button', { name: /фильтры/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // После раскрытия поле поиска видно
    await expect(filterContent).toBeVisible();

    // Сворачиваем снова
    await toggleBtn.click();
    await expect(filterContent).not.toBeVisible();
  });

  test('панель фильтров содержит поле поиска, статус и другие фильтры', async ({ page }) => {
    // Открываем фильтры
    await page.getByRole('button', { name: /фильтры/i }).click();

    await expect(page.getByLabel('Поиск')).toBeVisible();
    await expect(page.getByLabel('Статус')).toBeVisible();
    await expect(page.getByLabel('Приоритет')).toBeVisible();
    await expect(page.getByLabel('Тип задачи')).toBeVisible();
    await expect(page.getByLabel('Тип ответа')).toBeVisible();
  });

  test('URL-параметр ?action=create открывает модалку создания задачи', async ({ page }) => {
    // DashboardPage ссылается на /tasks?action=create — TasksPage должен обрабатывать этот параметр
    await page.goto('/tasks?action=create');
    await page.waitForLoadState('domcontentloaded');

    // Модалка должна открыться автоматически по URL-параметру
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /создать задачу/i })).toBeVisible();

    // URL-параметр action должен быть удалён после открытия модалки
    await expect(page).not.toHaveURL(/action=create/);
  });

  test('модалка создания задачи содержит все обязательные поля', async ({ page }) => {
    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Обязательные поля (Input и Textarea компоненты связывают label через htmlFor)
    await expect(dialog.getByLabel(/название/i)).toBeVisible();
    await expect(dialog.getByLabel(/описание/i)).toBeVisible();
    await expect(dialog.getByLabel(/комментарий/i)).toBeVisible();
    await expect(dialog.getByLabel(/теги/i)).toBeVisible();
    await expect(dialog.getByLabel(/приоритет/i)).toBeVisible();
    await expect(dialog.getByLabel(/тип ответа/i)).toBeVisible();
    await expect(dialog.getByLabel(/дата появления/i)).toBeVisible();
    await expect(dialog.getByLabel(/дедлайн/i)).toBeVisible();
    // DealershipSelector — label не связан через htmlFor, проверяем наличие текста
    await expect(dialog.getByText(/автосалон \*/i)).toBeVisible();

    // Кнопки формы
    await expect(dialog.getByRole('button', { name: /создать/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /отмена/i })).toBeVisible();
  });

  test('создание задачи: заполнить поля, выбрать автосалон, отправить — задача появляется в списке', async ({ page }) => {
    const taskTitle = `E2E задача ${Date.now()}`;

    await page.getByRole('button', { name: /создать задачу/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Заполняем название
    await dialog.getByLabel(/название/i).fill(taskTitle);

    // Выбираем автосалон — DealershipSelector рендерит <select> рядом с label "Автосалон *"
    // Находим select внутри блока, содержащего текст "Автосалон"
    const dealershipBlock = dialog.locator('div').filter({ hasText: /автосалон \*/i }).last();
    const dealershipSelect = dealershipBlock.locator('select');
    // Выбираем первый не-пустой вариант (опция с числовым значением)
    const dealershipOptions = await dealershipSelect.locator('option').all();
    for (const opt of dealershipOptions) {
      const val = await opt.getAttribute('value');
      if (val && val !== '') {
        await dealershipSelect.selectOption(val);
        break;
      }
    }

    // Выбираем приоритет — "Высокий"
    await dialog.getByLabel(/приоритет/i).selectOption({ label: 'Высокий' });

    // Заполняем обязательные даты (appear_date и deadline требуются backend-ом)
    const now = new Date();
    const appearDate = new Date(now.getTime());
    const deadlineDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 день

    const formatDatetimeLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    await dialog.getByLabel(/дата появления/i).fill(formatDatetimeLocal(appearDate));
    await dialog.getByLabel(/дедлайн/i).fill(formatDatetimeLocal(deadlineDate));

    // Отправляем форму
    await dialog.getByRole('button', { name: /создать/i }).click();

    // Модалка закрывается
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Задача появляется в списке
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('можно искать задачи по названию в фильтре', async ({ page }) => {
    // Открываем фильтры
    await page.getByRole('button', { name: /фильтры/i }).click();

    const searchInput = page.getByLabel('Поиск');
    await expect(searchInput).toBeVisible();

    // Вводим текст — страница обновляется
    await searchInput.fill('несуществующая задача xyz987');
    // Ждём обновления контента без networkidle (TanStack Query polling мешает)
    await page.waitForTimeout(1500);

    // Должен отобразиться пустой результат
    await expect(page.getByText(/задачи не найдены|создайте первую/i)).toBeVisible({ timeout: 10000 });
  });

  test('можно фильтровать задачи по статусу', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    const statusSelect = page.getByLabel('Статус');
    await expect(statusSelect).toBeVisible();

    // Выбираем "Ожидает"
    await statusSelect.selectOption({ label: 'Ожидает' });
    // Ждём обновления контента
    await page.waitForTimeout(1000);

    // Страница перезагружается без ошибок
    await expect(page.locator('main')).toBeVisible();
  });

  test('можно фильтровать задачи по приоритету', async ({ page }) => {
    await page.getByRole('button', { name: /фильтры/i }).click();

    const prioritySelect = page.getByLabel('Приоритет');
    await expect(prioritySelect).toBeVisible();

    await prioritySelect.selectOption({ label: 'Высокий' });
    await page.waitForTimeout(1000);

    await expect(page.locator('main')).toBeVisible();
  });

  test('кнопка "Сбросить фильтры" сбрасывает фильтры', async ({ page }) => {
    // Открываем фильтры и устанавливаем значение
    await page.getByRole('button', { name: /фильтры/i }).click();

    const searchInput = page.getByLabel('Поиск');
    await searchInput.fill('тест');

    // Кнопка "Сбросить фильтры" появляется только при наличии активных фильтров
    const clearBtn = page.getByRole('button', { name: /сбросить фильтры/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Поле поиска очищено
    await expect(searchInput).toHaveValue('');
  });

  test('клик на задаче открывает TaskDetailsModal с информацией о задаче', async ({ page }) => {
    // ClickableTitle рендерит <button> с классом cursor-pointer
    // Скоуп на main чтобы не попасть по кнопке смены в шапке Layout (тоже button.cursor-pointer)
    const clickableTitles = page.locator('main button.cursor-pointer');
    const count = await clickableTitles.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await clickableTitles.first().click();

    // Модалка деталей задачи должна открыться
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('TaskDetailsModal показывает дедлайн, автосалон, создателя и кнопку закрытия', async ({ page }) => {
    const clickableTitles = page.locator('main button.cursor-pointer');
    const count = await clickableTitles.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await clickableTitles.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // В модалке видны секции детальной информации
    await expect(dialog.getByText(/дедлайн/i)).toBeVisible();
    await expect(dialog.getByText(/автосалон/i)).toBeVisible();
    await expect(dialog.getByText(/создатель/i)).toBeVisible();

    // Кнопка закрытия присутствует — Modal рендерит кнопку с XMarkIcon (без текста),
    // поэтому ищем кнопку в заголовке модалки по наличию SVG-иконки закрытия
    await expect(dialog.locator('button svg').first()).toBeVisible();
  });
});
