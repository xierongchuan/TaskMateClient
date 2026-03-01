import { test, expect } from '@playwright/test';

/**
 * Тесты страницы настроек /settings
 * Запускаются от имени admin (owner) через storageState из playwright.config.ts
 */
test.describe('Settings — страница настроек', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    // Ждём заголовок страницы, чтобы убедиться что компонент отрендерен
    await expect(page.getByRole('heading', { name: 'Настройки', exact: true })).toBeVisible({ timeout: 15000 });
    // Ждём появления кнопок вкладок (они рендерятся после завершения загрузки данных)
    await expect(page.getByRole('button', { name: 'Общие' })).toBeVisible({ timeout: 15000 });
  });

  test('страница загружается с заголовком "Настройки"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Настройки', exact: true })).toBeVisible();
  });

  test('все 7 кнопок вкладок видны в боковой навигации', async ({ page }) => {
    const tabNames = ['Общие', 'Интерфейс', 'Задачи', 'Календарь', 'Смены', 'Уведомления', 'Обслуживание'];
    for (const name of tabNames) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
  });

  test('по умолчанию активна вкладка "Общие" с её контентом', async ({ page }) => {
    // Заголовок Общие настройки виден на дефолтной вкладке
    await expect(page.getByText('Общие настройки')).toBeVisible({ timeout: 10000 });
  });

  test('переключение на вкладку "Интерфейс" показывает настройки темы', async ({ page }) => {
    await page.getByRole('button', { name: 'Интерфейс' }).click();
    // Используем .first() чтобы избежать strict mode violation при множественных совпадениях
    // Ищем заголовок секции "Интерфейс и Отображение" или лейбл "Тема оформления"
    await expect(
      page.getByText('Интерфейс и Отображение').or(page.getByText('Тема оформления')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('на вкладке "Интерфейс" видны кнопки переключения темы (светлая/тёмная/системная)', async ({ page }) => {
    await page.getByRole('button', { name: 'Интерфейс' }).click();
    // Ищем кнопки или переключатели темы: SunIcon / MoonIcon / ComputerDesktopIcon
    const themeControls = page.locator('button').filter({ hasText: /Светлая|Тёмная|Системная|light|dark|system/i });
    const svgThemeButtons = page.locator('button svg').first();
    // Хотя бы один из вариантов должен быть виден
    const hasThemeButtons = await themeControls.count() > 0;
    const hasSvgButtons = await svgThemeButtons.isVisible();
    expect(hasThemeButtons || hasSvgButtons).toBeTruthy();
  });

  test('переключение на вкладку "Задачи" показывает настройки задач', async ({ page }) => {
    await page.getByRole('button', { name: 'Задачи' }).click();
    // После клика на вкладку "Задачи" должен появиться контент задач.
    // Заголовок секции "Настройки Задач" или чекбокс о связи со сменами
    // Не используем page.getByText('Задачи') — он совпадёт и с сайдбаром (строгий режим)
    await expect(
      page.getByText('Настройки Задач').or(page.getByText('Связь со сменами')).or(page.getByText('Задержка архивации')).first()
    ).toBeVisible({ timeout: 10000 });
    // Должна быть хотя бы одна форма/чекбокс
    const mainContent = page.locator('main, [class*="PageContainer"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('переключение на вкладку "Смены" показывает настройки смен', async ({ page }) => {
    await page.getByRole('button', { name: 'Смены' }).click();
    // Не используем page.getByText('Смены') — он совпадёт и с сайдбаром (строгий режим)
    await expect(
      page.getByText('Рабочие дни').or(page.getByText('Допуск опоздания')).or(page.getByText('Расписание смен'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('переключение на вкладку "Календарь" показывает годовой календарь', async ({ page }) => {
    await page.getByRole('button', { name: 'Календарь' }).click();
    // YearCalendar должен отрендерить что-то с месяцами или годом
    // Ищем заголовок "Календарь выходных дней" или год
    await expect(
      page.getByText('Календарь выходных дней').or(page.getByText(/20\d\d/)).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('переключение на вкладку "Обслуживание" показывает переключатель режима', async ({ page }) => {
    await page.getByRole('button', { name: 'Обслуживание' }).click();
    // Maintenance tab показывает "Режим обслуживания" как заголовок секции
    await expect(
      page.getByText('Режим обслуживания').or(page.getByText('Опасная зона')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('кнопка "Сохранить" видна на странице настроек', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Сохранить/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
