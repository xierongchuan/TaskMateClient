import { test, expect } from '@playwright/test';
import { ADMIN_STATE } from '../setup/helpers';
import { formatDateInput } from '../functional/setup/helpers';

test.describe('Generators timezone handling', () => {
  test('converts generator times to UTC on save and back to local time in UI', async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      storageState: ADMIN_STATE,
      timezoneId: 'Asia/Tashkent',
    });
    const page = await context.newPage();
    const generatorName = `TZ Generator ${Date.now()}`;

    try {
      await page.goto(`${baseURL}/task-generators`);
      await expect(page.getByRole('heading', { name: 'Генераторы задач' })).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: 'Создать генератор' }).click();
      await expect(page.getByText('Создать генератор').last()).toBeVisible({ timeout: 5000 });

      await page.getByLabel('Название *').fill(generatorName);

      const dealershipSelect = page.getByText('Автосалон *', { exact: true }).locator('..').locator('select');
      await dealershipSelect.waitFor({ state: 'visible' });
      const dealershipOptions = await dealershipSelect.locator('option').evaluateAll((options) =>
        options
          .map((option) => ({ value: option.getAttribute('value') ?? '', disabled: option.disabled }))
          .filter((option) => option.value !== '' && !option.disabled)
      );
      expect(dealershipOptions.length).toBeGreaterThan(0);
      await dealershipSelect.selectOption(dealershipOptions[0].value);

      await page.waitForTimeout(1000);

      await page.getByLabel('Время появления').fill('09:00');
      await page.getByLabel('Дедлайн').fill('18:00');
      await page.getByLabel('Дата начала *').fill(formatDateInput(new Date()));

      const firstAssignee = page.locator('input[type="checkbox"]').first();
      await expect(firstAssignee).toBeVisible({ timeout: 10000 });
      await firstAssignee.check();

      const createRequestPromise = page.waitForRequest((request) =>
        request.url().includes('/task-generators') && request.method() === 'POST'
      );
      const createResponsePromise = page.waitForResponse((response) =>
        response.url().includes('/task-generators') &&
        response.request().method() === 'POST' &&
        response.status() === 201
      );

      await page.getByRole('button', { name: 'Создать' }).click();

      const createRequest = await createRequestPromise;
      const createPayload = createRequest.postDataJSON() as {
        recurrence_time: string;
        deadline_time: string;
      };
      expect(createPayload.recurrence_time).toBe('04:00');
      expect(createPayload.deadline_time).toBe('13:00');

      await createResponsePromise;

      const generatorCard = page.locator('div').filter({ hasText: generatorName }).first();
      await expect(generatorCard).toBeVisible({ timeout: 10000 });
      await expect(generatorCard.getByText('09:00 → 18:00')).toBeVisible({ timeout: 10000 });

      await generatorCard.getByRole('button', { name: 'Изменить' }).click();
      await expect(page.getByRole('button', { name: 'Сохранить' })).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel('Время появления')).toHaveValue('09:00');
      await expect(page.getByLabel('Дедлайн')).toHaveValue('18:00');
    } finally {
      await context.close();
    }
  });
});
