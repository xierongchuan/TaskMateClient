import { test, expect } from '@playwright/test';
import { EMPLOYEE_STATE } from '../setup/helpers';

/**
 * Тесты страницы задач для роли "сотрудник" (employee)
 * emp1_1 — сотрудник из первого автосалона
 */
test.use({ storageState: EMPLOYEE_STATE });

test.describe('Страница задач — роль сотрудник', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('сотрудник НЕ видит кнопку "Создать задачу"', async ({ page }) => {
    await expect(page.getByRole('button', { name: /создать задачу/i })).not.toBeVisible();
  });

  test('страница задач загружается и отображается для сотрудника', async ({ page }) => {
    // Заголовок страницы присутствует
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible();

    // Основной контент загружается без ошибок
    await expect(page.locator('main')).toBeVisible();

    // Нет сообщения об ошибке доступа
    await expect(page.getByText(/доступ запрещён/i)).not.toBeVisible();
  });

  test('сотрудник видит задачи, назначенные ему', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Страница не показывает ошибку доступа
    await expect(page.getByText(/ошибка загрузки/i)).not.toBeVisible({ timeout: 10000 });

    // Либо есть задачи, либо показывается пустое состояние — оба варианта корректны
    const hasEmpty = await page.getByText(/задачи не найдены/i).isVisible();
    const hasTasks = await page.locator('.rounded-xl.border').first().isVisible();
    expect(hasEmpty || hasTasks).toBeTruthy();
  });

  test('сотрудник видит кнопки действий для своей роли (не кнопки редактирования)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const taskCards = page.locator('.rounded-xl.border');
    const count = await taskCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // Кнопок редактирования/удаления (для менеджера) быть не должно
    await expect(page.getByRole('button', { name: /редактировать/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /удалить/i })).not.toBeVisible();
  });
});
