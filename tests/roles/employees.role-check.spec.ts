import { test, expect } from '@playwright/test';
import { EMPLOYEE_STATE, OBSERVER_STATE } from '../setup/helpers';

/**
 * Ролевые проверки страницы /employees.
 * Этот файл соответствует паттерну .role-*.spec.ts и запускается в проекте 'role-tests'
 * без глобального storageState — каждый describe задаёт свой.
 */

test.describe('Employees — доступ сотрудника (employee)', () => {
  test.use({ storageState: EMPLOYEE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('сотрудник перенаправляется с /employees или видит ограниченный доступ', async ({ page }) => {
    // Сотрудник не должен видеть страницу управления пользователями.
    // Возможны два варианта: редирект на /dashboard или страница показывает пустой список / заглушку.
    const currentUrl = page.url();
    const isDashboard = currentUrl.includes('/dashboard');
    const isEmployees = currentUrl.includes('/employees');

    if (isDashboard) {
      // Редирект — корректное поведение
      await expect(page.locator('main')).toBeVisible();
    } else if (isEmployees) {
      // Страница открылась, но кнопки создания быть не должно
      const addButton = page.getByRole('button', { name: 'Добавить сотрудника' });
      await expect(addButton).not.toBeVisible();
    }
  });
});

test.describe('Employees — доступ наблюдателя (observer)', () => {
  test.use({ storageState: OBSERVER_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');
  });

  test('наблюдатель видит список сотрудников', async ({ page }) => {
    // Наблюдатель может просматривать — страница /employees должна быть доступна
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
  });

  test('наблюдатель не видит кнопку "Добавить сотрудника"', async ({ page }) => {
    // canCreateUsers = false для роли observer
    const addButton = page.getByRole('button', { name: 'Добавить сотрудника' });
    await expect(addButton).not.toBeVisible({ timeout: 5000 });
  });

  test('наблюдатель не видит кнопки редактирования и удаления', async ({ page }) => {
    // Ждём загрузки данных
    await page.waitForLoadState('networkidle');

    // ActionButtons (edit/delete) не должны отображаться
    const editButton = page.getByTitle('Редактировать').or(
      page.getByRole('button', { name: /изменить/i })
    ).first();

    const deleteButton = page.getByTitle('Удалить').or(
      page.getByRole('button', { name: /удалить/i })
    ).first();

    // Кнопки не должны быть видны (observer не имеет canCreateUsers)
    await expect(editButton).not.toBeVisible({ timeout: 5000 });
    await expect(deleteButton).not.toBeVisible({ timeout: 5000 });
  });
});
