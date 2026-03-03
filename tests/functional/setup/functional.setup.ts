import { test as setup } from '@playwright/test';
import { FUNC_ADMIN_STATE, loginAndSaveState } from './helpers';

/**
 * Setup для функциональных тестов — логин admin.
 * Запускается перед functional проектом.
 */
setup('authenticate as admin for functional tests', async ({ page }) => {
  await loginAndSaveState(page, 'admin', 'password', FUNC_ADMIN_STATE);
});
