import { test, expect } from '@playwright/test';

test.describe('Cash Flow sections', () => {
  test('/cash-flow displays Entrées section', async ({ page }) => {
    await page.goto('/cash-flow');
    // Use exact match to avoid strict mode violation with partial matches
    await expect(page.getByText('Entrées', { exact: true })).toBeVisible();
  });

  test('/cash-flow displays Sorties section', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page.getByText('Sorties', { exact: true })).toBeVisible();
  });

  test('/cash-flow displays month navigation arrows', async ({ page }) => {
    await page.goto('/cash-flow');
    await expect(page.getByLabel('Mois précédent')).toBeVisible();
    await expect(page.getByLabel('Mois suivant')).toBeVisible();
  });

  test('month navigation changes month in URL', async ({ page }) => {
    await page.goto('/cash-flow');
    await page.getByLabel('Mois précédent').click();
    await expect(page).toHaveURL(/cash-flow\?month=/);
  });
});
