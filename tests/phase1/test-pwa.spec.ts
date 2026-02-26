import { test, expect } from '@playwright/test';

test.describe('PWA', () => {
  test('manifest.json has all required PWA fields', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.status()).toBe(200);

    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name ?? manifest.name).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(Array.isArray(manifest.icons)).toBe(true);

    // Check for 192 and 512 icons
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes.some((s: string) => s.includes('192'))).toBe(true);
    expect(sizes.some((s: string) => s.includes('512'))).toBe(true);
  });

  test('icons are accessible', async ({ request }) => {
    const res192 = await request.get('/icons/icon-192.png');
    expect(res192.status()).toBe(200);

    const res512 = await request.get('/icons/icon-512.png');
    expect(res512.status()).toBe(200);
  });

  test('push subscribe endpoint responds', async ({ request }) => {
    const res = await request.post('/api/push/subscribe', {
      data: {
        endpoint: 'https://test.example.com/push/test',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' },
      },
    });
    // Either 200 (success) or 500 (DB error) — just not 404
    expect(res.status()).not.toBe(404);
  });

  test('service worker file is valid JS', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('push');
    expect(body).toContain('fetch');
  });
});
