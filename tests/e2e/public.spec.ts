import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('sign-in page is accessible and shows the three ways in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /guest/i })).toBeVisible();
  await expect(page.locator('#auth-form').getByLabel('Email')).toBeVisible();

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

test('the demo login is on the sign-in page and really signs in', async ({ page }) => {
  test.skip(!process.env.VITE_DEMO_EMAIL, 'demo login is not configured (VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD)');
  await page.goto('/login');
  await expect(page.locator('#demo-email')).toHaveValue(process.env.VITE_DEMO_EMAIL ?? '');
  await expect(page.locator('#demo-password')).toHaveValue(process.env.VITE_DEMO_PASSWORD ?? '');
  await page.getByRole('button', { name: 'Fill in the demo login' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(setup)?$/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
