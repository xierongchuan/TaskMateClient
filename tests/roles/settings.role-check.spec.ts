import { test, expect } from '@playwright/test';
import { MANAGER_STATE, EMPLOYEE_STATE } from '../setup/helpers';

/**
 * Ролевые проверки для страницы настроек /settings
 * Только owner может открывать /settings.
 */
test.describe('Settings — ограничение по ролям', () => {
  test('сотрудник (employee) при переходе на /settings видит запрет доступа', async ({ browser }) => {
    const context = await browser.newContext({ storageState: EMPLOYEE_STATE });
    const page = await context.newPage();

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Страница должна показать ErrorState "Доступ запрещен" или перенаправить.
    // Используем .first() чтобы избежать strict mode violation при нескольких совпадениях.
    const isAccessDenied = await page.getByText(/Доступ запрещен|Доступ запрещён|нет прав|не авторизован/i).first().isVisible({ timeout: 10000 }).catch(() => false);
    const isRedirected = !page.url().includes('/settings');

    expect(isAccessDenied || isRedirected).toBeTruthy();

    await context.close();
  });

  test('управляющий (manager) при переходе на /settings видит запрет доступа', async ({ browser }) => {
    const context = await browser.newContext({ storageState: MANAGER_STATE });
    const page = await context.newPage();

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Используем .first() чтобы избежать strict mode violation при нескольких совпадениях.
    const isAccessDenied = await page.getByText(/Доступ запрещен|Доступ запрещён|нет прав|не авторизован/i).first().isVisible({ timeout: 10000 }).catch(() => false);
    const isRedirected = !page.url().includes('/settings');

    expect(isAccessDenied || isRedirected).toBeTruthy();

    await context.close();
  });
});
