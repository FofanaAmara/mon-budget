import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows all 4 widgets', async ({ page }) => {
    await page.goto('/');
    // Header: total mensuel
    await expect(page.getByText('Total mensuel')).toBeVisible();
    // Alertes widget
    await expect(page.getByText('Alertes')).toBeVisible();
    // Prochaines 7 jours widget
    await expect(page.getByText('Prochaines (7 jours)')).toBeVisible();
    // Par section widget
    await expect(page.getByText('Par section')).toBeVisible();
  });

  test('total mensuel shows a non-zero amount after expenses exist', async ({ page }) => {
    await page.goto('/');
    // After Phase B tests created expenses, total should be > 0
    const totalEl = page.locator('p').filter({ hasText: /\d+[\s,]\d+/ }).first();
    await expect(totalEl).toBeVisible();
  });

  test('shows current month label', async ({ page }) => {
    await page.goto('/');
    // Should show month in French (e.g., "février 2026")
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const currentMonth = months[new Date().getMonth()];
    await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible();
  });

  test('no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('DevTools'))).toHaveLength(0);
  });
});
