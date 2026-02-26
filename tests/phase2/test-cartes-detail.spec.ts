import { test, expect } from '@playwright/test';

test.describe('Cartes — vue détaillée /cartes/[id]', () => {
  test('/cartes page loads', async ({ page }) => {
    await page.goto('/cartes');
    await expect(page.getByRole('heading', { name: 'Cartes' })).toBeVisible();
  });

  test('can navigate to card detail page', async ({ page }) => {
    await page.goto('/cartes');

    // If there are cards, click the first one
    const cardLinks = page.locator('a[href^="/cartes/"]');
    const count = await cardLinks.count();
    if (count > 0) {
      await cardLinks.first().click();
      await expect(page).toHaveURL(/\/cartes\/.+/);
      await expect(page.locator('body')).not.toContainText('Application error');
    } else {
      // No cards yet — create one first
      await page.getByRole('button', { name: 'Nouvelle carte' }).click();
      await page.getByPlaceholder('Visa principale').fill('Test Visa');
      await page.getByRole('button', { name: 'Sauvegarder' }).click();
      await page.waitForTimeout(2000);
      await page.reload();
      const newLinks = page.locator('a[href^="/cartes/"]');
      await expect(newLinks.first()).toBeVisible();
      await newLinks.first().click();
      await expect(page).toHaveURL(/\/cartes\/.+/);
    }
  });
});
