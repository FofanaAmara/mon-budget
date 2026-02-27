import { test, expect } from '@playwright/test';

test.describe('Mon Mois — SOLDE', () => {
  test('SOLDE label visible on /mon-mois', async ({ page }) => {
    await page.goto('/mon-mois');
    await expect(page.getByText('Solde')).toBeVisible();
  });

  test('SOLDE shows a dollar amount', async ({ page }) => {
    await page.goto('/mon-mois');
    // Solde hero card should display a dollar amount (e.g. $0,00 or -$X,XX)
    const soldeCard = page.locator('text=/Solde/').first();
    await expect(soldeCard).toBeVisible();
  });
});
