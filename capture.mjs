import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:4185';
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: '4185' },
  stdio: 'ignore',
});
let browser;
try {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(baseURL)).ok) break;
    } catch {
      /* Wait for the local preview server. */
    }
    if (attempt === 29) throw new Error('Preview server did not start');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await mkdir('docs', { recursive: true });
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/desktop.png' });
  await page.screenshot({ path: 'docs/desktop-full.png', fullPage: true });
  for (const [name, label] of [
    ['red', 'Show Malbec'],
    ['rose', 'Show Rosé'],
  ]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.locator('.bottle-current img').evaluate((image) => image.decode());
    await page.screenshot({ path: `docs/desktop-${name}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Show Colombard Sauvignon', exact: true }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: 'docs/mobile.png' });
  await page.screenshot({ path: 'docs/mobile-full.png', fullPage: true });
  await page.getByRole('button', { name: 'Add Colombard Sauvignon to your selection' }).click();
  await page.getByRole('button', { name: 'Open your selection, 1 bottle' }).click();
  await page.screenshot({ path: 'docs/selection-mobile.png' });
} finally {
  await browser?.close();
  server.kill();
}
