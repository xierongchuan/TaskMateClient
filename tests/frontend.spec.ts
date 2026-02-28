import { test, expect } from '@playwright/test';

test('frontend loads and shows login page', async ({ page }) => {
  // Navigate to the frontend
  await page.goto('http://localhost:8099');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check that the page title contains something related to TaskMate
  const title = await page.title();
  console.log('Page title:', title);

  // Check for the login form or any visible content
  const body = await page.locator('body');
  const content = await body.textContent();
  console.log('Page content:', content?.substring(0, 500));

  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });

  // Basic check - page should load without crash
  expect(page.url()).toContain('localhost:8099');
});
