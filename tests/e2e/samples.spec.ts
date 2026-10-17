import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Every one-tap sample goes through the real analysis; nothing is canned. */
test('sample files are served and lightweight', async ({ request }) => {
  for (const [path, type] of [
    ['/samples/deactivation-notice.pdf', 'application/pdf'],
    ['/samples/payout-screenshot.jpg', 'image/jpeg'],
  ] as const) {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain(type);
    expect((await res.body()).length).toBeLessThan(60_000);
  }
});

test.describe.serial('one-tap samples', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue as guest' }).click();
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Hello/ })).toBeVisible();
  });
  test.afterAll(async () => page.close());

  test('sample notice is explained', async () => {
    await page.goto('/docs');
    await page.getByRole('button', { name: 'Try a sample notice' }).click();
    await expect(page.getByText(/deactivat/i).first()).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/3 days|three days/i).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });

  test('sample payout screenshot is read into a draft entry', async () => {
    await page.goto('/earnings');
    await page.getByRole('tab', { name: 'Photo' }).click();
    await page.getByRole('button', { name: 'Try a sample payout screenshot' }).click();
    await expect(page.getByRole('button', { name: /Save these entries/ })).toBeVisible({ timeout: 90_000 });
  });

  test('sample sentence is read into a draft entry', async () => {
    await page.goto('/earnings');
    await page.getByRole('tab', { name: 'Speak' }).click();
    await page.getByRole('button', { name: 'Use a sample sentence' }).click();
    await page.getByRole('button', { name: /Read my earnings/ }).click();
    await expect(page.getByRole('button', { name: /Save these entries/ })).toBeVisible({ timeout: 90_000 });
  });

  test('sample complaint becomes a letter', async () => {
    await page.goto('/complaint');
    await page.getByRole('button', { name: 'Fill in a sample complaint' }).click();
    await expect(page.getByLabel('Company or employer name')).toHaveValue('QuickRide Logistics');
    await page.getByRole('button', { name: 'Write my letter' }).click();
    await expect(page.getByRole('button', { name: /Copy/ })).toBeVisible({ timeout: 90_000 });
  });
});
