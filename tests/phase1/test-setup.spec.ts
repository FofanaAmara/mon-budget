import { test, expect } from '@playwright/test';

test.describe('Setup & Availability', () => {
  test('homepage returns 200 with title Mon Budget', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle('Mon Budget');
  });

  test('manifest.json is accessible and valid', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name).toBe('Mon Budget');
    expect(json.display).toBe('standalone');
    expect(Array.isArray(json.icons)).toBe(true);
    expect(json.icons.length).toBeGreaterThan(0);
  });

  test('service worker file is accessible', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.status()).toBe(200);
  });

  test('404 page is handled gracefully', async ({ page }) => {
    const response = await page.goto('/page-inexistante');
    expect(response?.status()).toBe(404);
  });
});
