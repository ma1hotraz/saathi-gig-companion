import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The full worker journey against the real Supabase project and the real Gemini API.
 * Nothing is stubbed. Requires anonymous sign-ins enabled and the migration applied.
 */
const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}

test.describe.serial('worker journey', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
  });
  test.afterAll(async () => page.close());

  test('guest sign-in, then profile setup', async () => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue as guest' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tell us about your work' })).toBeVisible();
    await page.getByLabel('State you work in').selectOption('Karnataka');
    await page.getByLabel('Your work').selectOption('delivery');
    await page.getByLabel('Your age').selectOption('26-40');
    await page.getByLabel('Monthly income').selectOption('10k_20k');
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Hello/ })).toBeVisible();
    await expectAccessible(page);
  });

  test('log an earning, see it in the dashboard, and get AI insights', async () => {
    await page.goto('/earnings');
    await page.getByLabel('Platform or work').fill('Swiggy');
    await page.getByLabel(/Money earned/).fill('950');
    await page.getByLabel(/Expenses/).fill('200');
    await page.getByLabel('Hours worked').fill('8');
    await page.getByLabel('Trips').fill('13');
    await page.getByRole('button', { name: 'Save earning' }).click();
    await expect(page.getByText('₹750').first()).toBeVisible();
    await page.getByRole('button', { name: 'Explain my earnings' }).click();
    await expect(page.getByText(/Written by Gemini AI/)).toBeVisible({ timeout: 60_000 });
    await expectAccessible(page);
  });

  test('read earnings from a spoken-style sentence (real extraction)', async () => {
    await page.goto('/earnings');
    await page.getByRole('tab', { name: 'Speak' }).click();
    await page.getByRole('textbox').first().fill('aaj Zomato se 640 kamaye, 7 ghante, petrol 150');
    await page.getByRole('button', { name: /Read my earnings/ }).click();
    await expect(page.getByRole('button', { name: /Save these entries/ })).toBeVisible({ timeout: 60_000 });
  });

  test('ask Saathi and get a streamed answer', async () => {
    await page.goto('/ask');
    await page.getByRole('textbox', { name: 'Your question' }).fill('What should I do after a small road accident?');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('log').getByText(/./).nth(3)).toBeVisible({ timeout: 60_000 });
    await expectAccessible(page);
  });

  test('explain a document and hand over to the complaint writer', async () => {
    await page.goto('/docs');
    await page.getByLabel('Photo or PDF of your paper').setInputFiles(fixture('notice.pdf'));
    await page.getByRole('button', { name: 'Explain this paper' }).click();
    await expect(page.getByText(/deactivat/i).first()).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: /Write a complaint about this/ }).click();
    await expect(page).toHaveURL(/\/complaint$/);
    await expect(page.getByLabel('What happened?')).not.toBeEmpty();
  });

  test('write a complaint letter', async () => {
    await page.goto('/complaint');
    await page.getByLabel('Company or employer name').fill('QuickRide Logistics');
    await page.getByLabel('What happened?').fill('They stopped my account without notice and kept my pending payment of 3250 rupees.');
    await page.getByRole('button', { name: 'Write my letter' }).click();
    await expect(page.getByRole('button', { name: /Copy/ })).toBeVisible({ timeout: 90_000 });
    await expectAccessible(page);
  });

  test('find schemes with official sources', async () => {
    await page.goto('/rights');
    await page.getByRole('button', { name: 'Find schemes for me' }).click();
    await expect(page.getByRole('link', { name: /Official page/ }).first()).toBeVisible({ timeout: 90_000 });
  });

  test('safety guidance for a situation', async () => {
    await page.goto('/safety');
    await page.getByRole('button', { name: /Accident/ }).click();
    await expect(page.getByText(/Written by Gemini AI/)).toBeVisible({ timeout: 60_000 });
    await expectAccessible(page);
  });
});
