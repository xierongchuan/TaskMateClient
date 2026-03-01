import { test as setup } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Аутентификация — сохраняет storageState для разных ролей.
 * Запускается один раз перед всеми тестами (project: 'setup').
 */

export const AUTH_DIR = path.join(__dirname, '..', '.auth');
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
export const MANAGER_STATE = path.join(AUTH_DIR, 'manager.json');
export const EMPLOYEE_STATE = path.join(AUTH_DIR, 'employee.json');
export const OBSERVER_STATE = path.join(AUTH_DIR, 'observer.json');

async function login(page: import('@playwright/test').Page, username: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="login"]', username);
  await page.fill('input[name="password"]', 'password');
  await page.getByRole('button', { name: /войти/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

setup('authenticate as admin (owner)', async ({ page }) => {
  await login(page, 'admin');
  await page.context().storageState({ path: ADMIN_STATE });
});

setup('authenticate as manager', async ({ page }) => {
  await login(page, 'manager1');
  await page.context().storageState({ path: MANAGER_STATE });
});

setup('authenticate as employee', async ({ page }) => {
  await login(page, 'emp1_1');
  await page.context().storageState({ path: EMPLOYEE_STATE });
});

setup('authenticate as observer', async ({ page }) => {
  await login(page, 'obs1');
  await page.context().storageState({ path: OBSERVER_STATE });
});
