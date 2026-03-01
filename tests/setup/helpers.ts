import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Пути к storageState файлам аутентификации.
 * Используй через test.use({ storageState: ADMIN_STATE }) или в playwright.config.ts.
 */
export const AUTH_DIR = path.join(__dirname, '..', '.auth');
export const ADMIN_STATE = path.join(AUTH_DIR, 'admin.json');
export const MANAGER_STATE = path.join(AUTH_DIR, 'manager.json');
export const EMPLOYEE_STATE = path.join(AUTH_DIR, 'employee.json');
export const OBSERVER_STATE = path.join(AUTH_DIR, 'observer.json');
