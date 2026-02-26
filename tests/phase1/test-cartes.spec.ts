import { test, expect } from '@playwright/test';

test.describe('Cartes CRUD', () => {
  test('cartes page loads and shows add button', async ({ page }) => {
    await page.goto('/cartes');
    await expect(page.getByRole('heading', { name: 'Mes Cartes' })).toBeVisible();
    // Either header "+ Nouvelle" button or empty-state "Ajouter une carte"
    const addBtn = page.getByRole('button', { name: /Nouvelle|Ajouter/ }).first();
    await expect(addBtn).toBeVisible();
  });

  test('can open add card modal', async ({ page }) => {
    await page.goto('/cartes');
    await page.getByRole('button', { name: /Nouvelle|Ajouter/ }).first().click();
    await expect(page.getByRole('heading', { name: /Nouvelle carte|Modifier/ })).toBeVisible();
    await page.getByRole('button', { name: 'Annuler' }).click();
  });

  test('can create a card', async ({ page }) => {
    await page.goto('/cartes');
    await page.getByRole('button', { name: /Nouvelle|Ajouter/ }).first().click();
    await expect(page.getByRole('heading', { name: /Nouvelle carte/ })).toBeVisible();

    // Fill name using click + type to ensure React state updates
    const nameInput = page.getByPlaceholder(/Ex :/).first();
    await nameInput.click();
    await nameInput.fill('Visa Test');

    // Click Sauvegarder directly (not via evaluate)
    await page.getByRole('button', { name: 'Sauvegarder' }).click();

    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Visa Test').first()).toBeVisible();
  });
});
