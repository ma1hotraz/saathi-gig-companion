import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('sign-in page is accessible and shows the three ways in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /guest/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
});

test('unauthenticated visitors are sent to sign in', async ({ page }) => {
  await page.goto('/earnings');
  await expect(page).toHaveURL(/\/login$/);
});

test('the language switcher changes the interface language', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Language').selectOption('hi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/साथी/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
});

test('API refuses unauthenticated AI calls', async ({ request }) => {
  const res = await request.post('/api/chat', { data: { messages: [{ role: 'user', text: 'hi' }], language: 'en' } });
  expect(res.status()).toBe(401);
});
