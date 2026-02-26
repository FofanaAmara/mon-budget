import { test, expect } from '@playwright/test';

test.describe('Cartes CRUD', () => {
  test('cartes page loads and shows add button', async ({ page }) => {
    await page.goto('/cartes');
    await expect(page.getByRole('heading', { name: 'Mes Cartes' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nouvelle carte|Ajouter/ })).toBeVisible();
  });

  test('can open add card modal', async ({ page }) => {
    await page.goto('/cartes');
    await page.getByRole('button', { name: /Nouvelle carte|Ajouter/ }).click();
    // Modal should appear
    await expect(page.getByRole('heading', { name: /Nouvelle carte|Modifier/ })).toBeVisible();
    // Close
    await page.getByRole('button', { name: 'Annuler' }).click();
  });

  test('can create a card', async ({ page }) => {
    await page.goto('/cartes');
    await page.getByRole('button', { name: /Nouvelle carte|Ajouter/ }).click();

    // Fill name
    const nameInput = page.getByPlaceholder(/Nom de la carte|Ex :/).first();
    await nameInput.fill('Visa Test');

    // Save via JS to avoid nav intercept
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const save = btns.find(b =>
        b.textContent?.includes('Enregistrer') ||
        b.textContent?.includes('Créer') ||
        b.textContent?.includes('Sauvegarder') ||
        b.textContent?.includes('Ajouter')
      );
      if (save && !save.disabled) save.click();
    });

    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Visa Test')).toBeVisible();
  });
});
