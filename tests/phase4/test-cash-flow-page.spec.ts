import { test, expect } from '@playwright/test';

test.describe('Cash Flow page', () => {
  test('accessible HTTP 200 — no error URL', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('shows heading Cash Flow', async ({ page }) => {
    await page.goto('/cash-flow');
    const heading = page.getByRole('heading', { name: /[Cc]ash [Ff]low/ });
    await expect(heading).toBeVisible();
  });

  test('shows Solde du mois label', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page.getByText('Solde du mois')).toBeVisible();
  });

  test('no console errors on /cash-flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/cash-flow');
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('DevTools') && !e.includes('favicon'))).toHaveLength(0);
  });
});
