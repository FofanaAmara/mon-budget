import { test, expect } from '@playwright/test';

test.describe('Adhoc expense — Mon Mois FAB', () => {
  test('/mon-mois has FAB button', async ({ page }) => {
    await page.goto('/mon-mois');
    // FAB for adhoc expense or existing add button should be present
    const fab = page.getByRole('button', { name: /Ajouter/ }).first();
    await expect(fab).toBeVisible();
  });

  test('adhoc modal opens on FAB click', async ({ page }) => {
    await page.goto('/mon-mois');
    const fab = page.getByRole('button', { name: /Ajouter/ }).first();
    await fab.click();
    // Modal should show a form with at least a name field
    const nameField = page.getByLabel(/[Nn]om/);
    await expect(nameField).toBeVisible();
  });
});
