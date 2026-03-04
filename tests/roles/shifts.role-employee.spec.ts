import { test, expect } from '@playwright/test';
import { EMPLOYEE_STATE } from '../setup/helpers';

/**
 * Тесты страницы смен (/shifts) под ролью employee.
 */
test.use({ storageState: EMPLOYEE_STATE });

test.describe('ShiftsPage (employee)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shifts');
    await page.waitForLoadState('networkidle');
  });

  test('сотрудник видит компонент управления сменой (ShiftControl)', async ({ page }) => {
    // ShiftControl рендерит кнопку открытия/закрытия смены
    // Ищем любую кнопку с текстом "Открыть смену" или "Закрыть смену"
    const shiftControlBtn = page.getByRole('button', { name: /открыть смену|закрыть смену/i });
    await expect(shiftControlBtn).toBeVisible({ timeout: 15000 });
  });

  test('сотрудник видит страницу смен с историей своих смен', async ({ page }) => {
    // Используем exact: true чтобы различить h1 заголовок страницы от h2 в секциях
    await expect(page.getByRole('heading', { name: 'Смены', exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=История смен')).toBeVisible({ timeout: 15000 });
  });
});
