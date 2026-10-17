/**
 * Records the product demo video by driving the LIVE site in real Chrome (real Supabase, real Gemini).
 * Run: BASE_URL=https://... npx tsx scripts/record-demo.ts   (then convert the .webm if needed)
 */
import { chromium, devices, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'https://saathi-gig-companion-mu.vercel.app';
const OUT = process.env.DEMO_OUT_DIR ?? 'demo/raw';

async function caption(page: Page, text: string) {
  await page.evaluate((t) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      Object.assign(el.style, {
        position: 'fixed', left: '12px', right: '12px', bottom: '84px', zIndex: '99999', background: '#16202b', color: '#fff',
        padding: '10px 14px', borderRadius: '12px', font: '700 16px/1.3 system-ui, sans-serif', textAlign: 'center',
        border: '2px solid #ffc400', pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

const browser = await chromium.launch({ channel: 'chrome' });
// Viewport and video size must match, otherwise Playwright pads the frame with grey.
const SIZE = { width: 540, height: 1200 };
const context = await browser.newContext({
  ...devices['Pixel 7'],
  viewport: SIZE,
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: SIZE },
});
const page = await context.newPage();
const nav = (name: string) => page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name });
const pause = (ms: number) => page.waitForTimeout(ms);
const t0 = Date.now();

// 1. Sign in with the demo account shown on the sign-in page
await page.goto(`${BASE}/login`);
await caption(page, 'Saathi: AI help for gig and informal workers');
await pause(1500);
await page.getByRole('button', { name: 'Fill in the demo login' }).click();
await pause(500);
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await page.getByRole('heading', { level: 1, name: /Hello/ }).waitFor();
await caption(page, 'Works in 11 languages, with voice');
await pause(1200);

// 2. Earnings from a sentence
await nav('Earnings').click();
await caption(page, 'Earnings: say or type it, Gemini reads it');
await page.getByRole('tab', { name: 'Speak' }).click();
await page.getByRole('button', { name: 'Use a sample sentence' }).click();
await pause(700);
await page.getByRole('button', { name: /Read my earnings/ }).click();
await page.getByRole('button', { name: /Save these entries/ }).waitFor({ timeout: 60_000 });
await caption(page, 'You confirm before anything is saved');
await pause(1300);
await page.getByRole('button', { name: /Save these entries/ }).click();
await page.getByText('₹750').first().waitFor();
await caption(page, 'Net income after costs, tracked');
await pause(1300);

// 3. A paper explained, then handed to the complaint writer
await nav('Papers').click({ force: true });
await caption(page, 'Papers: Gemini explains a notice in simple words');
await page.getByRole('button', { name: 'Try a sample notice' }).click();
// The file name also contains "deactivation", so wait for the AI notice that only the result shows.
await page.getByText(/Written by Gemini AI/).first().waitFor({ timeout: 90_000 });
await pause(1500);
await page.mouse.wheel(0, 650);
await pause(1300);
await caption(page, 'One tap to a complaint letter');
await page.getByRole('button', { name: /Write a complaint about this/ }).click();
await page.getByLabel('Company or employer name').pressSequentially('QuickRide Logistics', { delay: 30 });
await page.getByRole('button', { name: 'Write my letter' }).click();
await page.getByRole('button', { name: /Copy/ }).first().waitFor({ timeout: 90_000 });
await caption(page, 'Formal letter, ready to send or print');
await pause(1500);

// 4. SOS
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole('button', { name: 'SOS' }).first().click();
await caption(page, 'SOS: helplines and share my location');
await pause(1500);
await page.keyboard.press('Escape');

// 5. Welfare schemes with official sources
await nav('Rights').click({ force: true });
await caption(page, 'Rights: schemes you can get, from official pages');
await page.getByRole('button', { name: 'Find schemes for me' }).click();
await page.getByRole('link', { name: /Official page/ }).first().waitFor({ timeout: 90_000 });
await pause(1500);
await page.mouse.wheel(0, 500);
await pause(1200);

// 6. Ask in Hindi
await nav('Ask').click({ force: true });
await page.locator('#lang').selectOption('hi');
await caption(page, 'Ask in your own language (Hindi)');
await pause(600);
const box = page.getByRole('textbox').first();
await box.pressSequentially('दुर्घटना होने पर मुझे क्या करना चाहिए?', { delay: 25 });
await box.press('Enter');
await page.getByText(/Gemini AI/).first().waitFor({ timeout: 60_000 });
await caption(page, 'Real Gemini answers. No mock data.');
await pause(2000);

console.log(`recorded ${((Date.now() - t0) / 1000).toFixed(1)}s of actions`);
await context.close();
await browser.close();
