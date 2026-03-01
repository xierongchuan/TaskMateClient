import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, 'tests', '.auth');

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 30000,
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8099',
    trace: 'on-first-retry',
    screenshot: 'on',
  },
  projects: [
    // 1. Setup — логинимся и сохраняем storageState для каждой роли
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Тесты логина — без аутентификации
    {
      name: 'login',
      testDir: './tests/auth',
      use: { ...devices['Desktop Chrome'] },
    },

    // 3. Основные тесты — запускаются от admin (owner)
    {
      name: 'chromium',
      testDir: './tests/pages',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'admin.json'),
      },
      dependencies: ['setup'],
    },

    // 4. Role-specific тесты (файлы с .role-*.spec.ts)
    {
      name: 'role-tests',
      testDir: './tests/roles',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
