import { test, expect } from '@playwright/test';

test.describe('Mon Mois — Entrées block', () => {
  test('/mon-mois affiche section Entrées', async ({ page }) => {
    await page.goto('/mon-mois');
    await expect(page.getByText('Entrées')).toBeVisible();
  });

  test('/mon-mois affiche section Sorties', async ({ page }) => {
    await page.goto('/mon-mois');
    await expect(page.getByText('Sorties')).toBeVisible();
  });
});
