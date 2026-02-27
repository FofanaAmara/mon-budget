import { test, expect } from '@playwright/test';

test.describe('Revenus UI — source badges & Variable', () => {
  test('/revenus page loads without error', async ({ page }) => {
    await page.goto('/revenus');
    await expect(page).not.toHaveURL(/error|500/);
  });

  test('/revenus page shows add button (FAB)', async ({ page }) => {
    await page.goto('/revenus');
    const fab = page.getByLabel('Ajouter un revenu');
    await expect(fab).toBeVisible();
  });

  test('/revenus shows income list or empty state', async ({ page }) => {
    await page.goto('/revenus');
    const hasIncomes = await page.locator('text=/Emploi|Business|Investissement|Autre|Aucun revenu/').first().isVisible();
    expect(hasIncomes).toBeTruthy();
  });

  test('/revenus modal has source picker when opened', async ({ page }) => {
    await page.goto('/revenus');
    await page.getByLabel('Ajouter un revenu').click();
    // Source selector should be visible in the modal
    await expect(page.getByText('Source')).toBeVisible();
  });
});
