import { test, expect } from '@playwright/test';

test.describe('Adhoc expense — Mon Mois FAB', () => {
  test('/mon-mois has FAB button', async ({ page }) => {
    await page.goto('/mon-mois');
    // FAB for adhoc expense
    const fab = page.getByLabel('Ajouter une dépense adhoc');
    await expect(fab).toBeVisible();
  });

  test('adhoc modal opens on FAB click', async ({ page }) => {
    await page.goto('/mon-mois');
    await page.getByLabel('Ajouter une dépense adhoc').click();
    // AdhocModal shows a "Description" label and a "Section" label
    await expect(page.getByText('Description')).toBeVisible();
  });
});
