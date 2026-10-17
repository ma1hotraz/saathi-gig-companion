import { expect, test } from '@playwright/test';

/**
 * The server sends a strict CSP (no inline styles, no inline scripts). This visits every screen,
 * opens the dialog, and fails on any browser-reported policy violation, so the policy is proven
 * compatible with the real UI and not just present.
 */
test('no Content-Security-Policy violations anywhere in the app', async ({ page }) => {
  await page.addInitScript(() => {
    const win = window as unknown as { __csp: string[] };
    win.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => win.__csp.push(`${e.violatedDirective} ${e.blockedURI} @ ${e.sourceFile}:${e.lineNumber}:${e.columnNumber} sample=${e.sample.slice(0, 80)}`));
  });
  const consoleCsp: string[] = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) consoleCsp.push(m.text());
  });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue as guest' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByRole('heading', { level: 1, name: /Hello/ }).waitFor();

  for (const path of ['/', '/earnings', '/ask', '/docs', '/rights', '/complaint', '/safety', '/settings']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  await page.goto('/');
  await page.getByRole('button', { name: 'SOS' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
  expect([...violations, ...consoleCsp]).toEqual([]);
});
