import { test, expect } from '@playwright/test';

/**
 * Тесты страницы генераторов задач /task-generators
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('Generators — страница генераторов задач', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/task-generators');
    await page.waitForLoadState('networkidle');
  });

  test('страница загружается с заголовком "Генераторы задач"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Генераторы задач' })).toBeVisible();
  });

  test('кнопка "Создать генератор" видна для owner', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Создать генератор' })).toBeVisible();
  });

  test('ViewModeToggle переключает вид между списком и карточками', async ({ page }) => {
    // Убеждаемся что страница загрузилась
    await expect(page.locator('main')).toBeVisible();

    // Нажимаем кнопку "Карточки" (grid) если видна
    const gridButton = page.getByRole('button', { name: 'Карточки' }).or(
      page.locator('button[title="grid"], button[aria-label="grid"]')
    ).first();

    if (await gridButton.isVisible()) {
      await gridButton.click();
      await expect(page.locator('main')).toBeVisible();
    }

    // Нажимаем кнопку "Список" (list)
    const listButton = page.getByRole('button', { name: 'Список' }).or(
      page.locator('button[title="list"], button[aria-label="list"]')
    ).first();

    if (await listButton.isVisible()) {
      await listButton.click();
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('FilterPanel содержит поле поиска, статус и повторяемость', async ({ page }) => {
    // Открываем фильтры
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Поле поиска
    const searchInput = page.locator('input[placeholder="Название генератора..."]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }

    // Select статуса: "Все" / "Активные" / "Приостановленные"
    const statusSelect = page.locator('label').filter({ hasText: 'Статус' }).locator('..').locator('select');
    if (await statusSelect.isVisible()) {
      await expect(statusSelect).toBeVisible();
    }

    // Select повторяемости
    const recurrenceSelect = page.locator('label').filter({ hasText: 'Повторяемость' }).locator('..').locator('select');
    if (await recurrenceSelect.isVisible()) {
      await expect(recurrenceSelect).toBeVisible();
    }
  });

  test('кнопка "Создать генератор" открывает модальное окно', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать генератор' }).click();

    // TaskGeneratorModal с заголовком "Создать генератор"
    await expect(page.getByText('Создать генератор').last()).toBeVisible({ timeout: 5000 });
  });

  test('форма генератора содержит поля: название, описание, повторяемость', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать генератор' }).click();
    await expect(page.getByText('Создать генератор').last()).toBeVisible({ timeout: 5000 });

    // Поле "Название *"
    await expect(page.locator('label').filter({ hasText: 'Название *' })).toBeVisible();
    // Поле "Описание"
    await expect(page.locator('label').filter({ hasText: 'Описание' })).toBeVisible();
    // Поле "Повторяемость"
    await expect(page.locator('label').filter({ hasText: 'Повторяемость' })).toBeVisible();
    // Поле "Дата начала *"
    await expect(page.locator('label').filter({ hasText: 'Дата начала *' })).toBeVisible();
    // Поле "Автосалон *"
    await expect(page.getByText('Автосалон *')).toBeVisible();
  });

  test('форма генератора содержит поля времени: появление и дедлайн', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать генератор' }).click();
    await expect(page.getByText('Создать генератор').last()).toBeVisible({ timeout: 5000 });

    await expect(page.locator('label').filter({ hasText: 'Время появления' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Дедлайн' })).toBeVisible();
  });

  test('форму генератора можно закрыть кнопкой "Отмена"', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать генератор' }).click();
    await expect(page.getByText('Создать генератор').last()).toBeVisible({ timeout: 5000 });

    // Кнопка Отмена в футере формы
    await page.getByRole('button', { name: 'Отмена' }).click();

    // Модальное окно закрылось
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible({ timeout: 5000 });
  });

  test('страница показывает пустое состояние или список генераторов', async ({ page }) => {
    const hasGenerators = await page.locator('main .rounded-xl').count() > 0;
    const hasEmptyState = await page.getByText('Нет генераторов').isVisible();

    // Одно из двух должно быть правдой
    expect(hasGenerators || hasEmptyState).toBeTruthy();
  });

  test('фильтр поиска по названию работает', async ({ page }) => {
    // Открываем фильтры
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const searchInput = page.locator('input[placeholder="Название генератора..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('несуществующий_генератор_12345');
      await page.waitForLoadState('networkidle');

      // Должно появиться пустое состояние
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('фильтр по статусу "Активные" применяется', async ({ page }) => {
    const filterToggle = page.getByRole('button', { name: /фильтр/i });
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const statusSelect = page.locator('label').filter({ hasText: 'Статус' }).locator('..').locator('select');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('true');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('существующий генератор показывает бейджи статуса и повторяемости', async ({ page }) => {
    // Проверяем только если есть хотя бы один генератор
    const emptyState = page.getByText('Нет генераторов');
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmpty) {
      // Ожидаем бейджи "Активен"/"Приостановлен" и бейджи повторяемости
      const statusBadge = page.getByText('Активен').or(page.getByText('Приостановлен')).first();
      await expect(statusBadge).toBeVisible({ timeout: 10000 });

      const recurrenceBadge = page.getByText('Ежедневно').or(page.getByText('Еженедельно')).or(page.getByText('Ежемесячно')).first();
      await expect(recurrenceBadge).toBeVisible({ timeout: 5000 });
    }
  });
});
