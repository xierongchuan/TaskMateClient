import { fileURLToPath } from 'url';
import path from 'path';
import type { Page, Browser } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const AUTH_DIR = path.join(__dirname, '..', '..', '.auth');

export const FUNC_ADMIN_STATE = path.join(AUTH_DIR, 'func-admin.json');
export const FUNC_MANAGER_STATE = path.join(AUTH_DIR, 'func-manager.json');
export const FUNC_EMPLOYEE1_STATE = path.join(AUTH_DIR, 'func-employee1.json');
export const FUNC_EMPLOYEE2_STATE = path.join(AUTH_DIR, 'func-employee2.json');
export const FUNC_OBSERVER_STATE = path.join(AUTH_DIR, 'func-observer.json');

/**
 * Логин пользователя и сохранение storageState в файл.
 */
export async function loginAndSaveState(
  page: Page,
  username: string,
  password: string,
  statePath: string,
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="login"]', username);
  await page.fill('input[name="password"]', password);
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: statePath });
}

/**
 * Создаёт новый browser context с указанным storageState и возвращает page.
 * Вызывающий код должен закрыть context после использования.
 */
export async function createContextWithRole(
  browser: Browser,
  statePath: string,
): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ storageState: statePath });
  const page = await ctx.newPage();
  return {
    page,
    close: () => ctx.close(),
  };
}

/**
 * Форматирование даты для datetime-local input.
 */
export function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Форматирование даты для date input (YYYY-MM-DD).
 */
export function formatDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
