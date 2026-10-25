import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('all bottles keep the same visible height and baseline through the full cycle', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const boxes = [];
  for (const id of ['white', 'red', 'rose', 'white']) {
    await expect(page.locator('body')).toHaveAttribute('data-wine', id);
    await expect(page.locator('.bottle-current img')).toHaveJSProperty('complete', true);
    const main = await page.locator('.bottle-current').boundingBox();
    const preview = await page.locator('.bottle-preview').boundingBox();
    expect(Math.abs(main.height - preview.height)).toBeLessThan(0.1);
    expect(Math.abs(main.y + main.height - preview.y - preview.height)).toBeLessThan(0.1);
    boxes.push(main);
    await page.getByRole('button', { name: 'Next wine', exact: true }).click();
  }
  for (const box of boxes) {
    expect(Math.abs(box.height - boxes[0].height)).toBeLessThan(0.1);
    expect(Math.abs(box.y - boxes[0].y)).toBeLessThan(0.1);
  }
});

test('Next fills its entire circular target; the vertical rail does not activate it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const next = page.getByRole('button', { name: 'Next wine', exact: true });
  const box = await next.boundingBox();
  const fill = () => next.evaluate((element) => getComputedStyle(element).backgroundColor);
  const normal = await fill();
  for (const [x, y] of [
    [box.x + box.width / 2, box.y + 4],
    [box.x + 4, box.y + box.height / 2],
    [box.x + box.width - 4, box.y + box.height / 2],
    [box.x + box.width / 2, box.y + box.height - 4],
  ]) {
    await page.mouse.move(x, y);
    expect(await fill()).toBe('rgb(41, 40, 32)');
    expect(
      await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y).closest('button')?.getAttribute('aria-label'),
        { x, y },
      ),
    ).toBe('Next wine');
  }
  await page.mouse.click(box.x + box.width / 2, box.y - 18);
  await expect(page.locator('body')).toHaveAttribute('data-wine', 'white');
  expect(await fill()).toBe(normal);
  await page.mouse.click(box.x + 7, box.y + box.height / 2);
  await expect(page.locator('body')).toHaveAttribute('data-wine', 'red');
});

test('rapid input, keyboard navigation and selection indicators remain consistent', async ({
  page,
}) => {
  const next = page.getByRole('button', { name: 'Next wine', exact: true });
  for (let index = 0; index < 8; index++) await next.click();
  await expect(page.locator('body')).toHaveAttribute('data-wine', 'rose');
  const red = page.getByRole('button', { name: 'Show Malbec', exact: true });
  await red.click();
  await red.press('End');
  await expect(page.locator('body')).toHaveAttribute('data-wine', 'rose');
  await red.press('Home');
  await expect(page.locator('body')).toHaveAttribute('data-wine', 'white');
  await expect(page.getByRole('button', { name: 'Show Colombard Sauvignon' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('collection adds, totals, persists, removes and restores focus after Escape', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add Colombard Sauvignon to your selection' }).click();
  await page.getByRole('button', { name: 'Add Colombard Sauvignon to your selection' }).click();
  await page.getByRole('button', { name: 'Show Malbec', exact: true }).click();
  await page.getByRole('button', { name: 'Add Malbec to your selection' }).click();
  await page.reload();
  const open = page.getByRole('button', { name: 'Open your selection, 3 bottles' });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.collection-total')).toHaveText('€411');
  await dialog.getByRole('button', { name: 'Remove Colombard Sauvignon from selection' }).click();
  await expect(dialog.locator('.collection-total')).toHaveText('€135');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.collection-button')).toBeFocused();
});

test('invalid saved data cannot add unknown wines or unbounded quantities', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem(
      'domaine-laffitte-selection-v1',
      JSON.stringify({ white: -2, red: 100, rose: 1.5, unknown: 90 }),
    ),
  );
  await page.reload();
  await expect(page.locator('.collection-count')).toHaveText('0');
  await page.evaluate(() => localStorage.setItem('domaine-laffitte-selection-v1', '{broken'));
  await page.reload();
  await page.getByRole('button', { name: 'Add Colombard Sauvignon to your selection' }).click();
  await expect(page.locator('.collection-count')).toHaveText('1');
});

test('storage failures do not disable the carousel or in-memory collection', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Next wine', exact: true }).click();
  await page.getByRole('button', { name: 'Add Malbec to your selection' }).click();
  await expect(page.locator('.collection-count')).toHaveText('1');
});

test('responsive layouts have no page overflow, text collisions or moving bottle baselines', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const baselines = [];
    for (const label of ['Show Colombard Sauvignon', 'Show Malbec', 'Show Rosé']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(overflow, `page overflow at ${width}px`).toBe(false);
      // Clicking a selector can scroll it into view. Compare page coordinates,
      // so browser auto-scroll is not mistaken for a layout/baseline change.
      const bottle = await page.locator('.bottle-current').evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { y: rect.y + scrollY, height: rect.height };
      });
      baselines.push(bottle.y + bottle.height);
      const name = await page.locator('.wine-name').boundingBox();
      const next = await page.locator('.next-button').boundingBox();
      const overlaps =
        name.x < next.x + next.width &&
        name.x + name.width > next.x &&
        name.y < next.y + next.height &&
        name.y + name.height > next.y;
      expect(overlaps, `wine name overlaps Next at ${width}px`).toBe(false);
    }
    expect(
      Math.max(...baselines) - Math.min(...baselines),
      `document baseline at ${width}px`,
    ).toBeLessThan(0.1);
  }
});

test('mobile menu, internal links and keyboard focus work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Our story' }).click();
  await expect(page).toHaveURL(/#story$/);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  for (const id of ['about', 'wines', 'story', 'contact', 'tasting'])
    await expect(page.locator(`#${id}`)).toHaveCount(1);
});

test('local assets load and the static preview does not expose source/configuration', async ({
  page,
  request,
}) => {
  const images = await page
    .locator('img')
    .evaluateAll((elements) => elements.map((image) => image.complete && image.naturalWidth > 0));
  expect(images.every(Boolean)).toBe(true);
  expect((await request.get('/app.js')).headers()['content-type']).toContain('javascript');
  for (const path of [
    '/package.json',
    '/server.mjs',
    '/.git/config',
    '/assets/%2e%2e/package.json',
  ])
    expect((await request.get(path)).status()).toBe(404);
});
