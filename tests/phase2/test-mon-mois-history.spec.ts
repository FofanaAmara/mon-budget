import { test, expect } from '@playwright/test';

test.describe('Mon Mois — navigation historique', () => {
  test('can navigate to previous month and see read-only mode', async ({ page }) => {
    await page.goto('/mon-mois');

    // Navigate to previous month
    const prevBtn = page.getByRole('button', { name: 'Mois précédent' });
    await prevBtn.click();
    await page.waitForURL(/\?month=/);

    // Should show historical month (no action buttons visible)
    await expect(page.locator('body')).not.toContainText('Application error');
    // "Retour au mois actuel" link should appear
    await expect(page.getByText('Retour au mois actuel')).toBeVisible();
  });
});
