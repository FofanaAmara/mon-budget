import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('bottom nav has 5 tabs', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(nav).toBeVisible();
    const links = nav.getByRole('link');
    await expect(links).toHaveCount(5);
  });

  test('can navigate to /sections', async ({ page }) => {
    await page.goto('/sections');
    await expect(page.getByRole('heading', { name: 'Sections' })).toBeVisible();
  });

  test('can navigate to /cartes', async ({ page }) => {
    await page.goto('/cartes');
    await expect(page.getByRole('heading', { name: 'Cartes' })).toBeVisible();
  });

  test('can navigate to /depenses', async ({ page }) => {
    await page.goto('/depenses');
    await expect(page.getByRole('heading', { name: 'Dépenses' })).toBeVisible();
  });

  test('can navigate to /parametres', async ({ page }) => {
    await page.goto('/parametres');
    await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();
  });

  test('responsive at 375px — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });
});
