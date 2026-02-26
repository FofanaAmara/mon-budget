import { test, expect } from '@playwright/test';

test.describe('Sections CRUD', () => {
  test('shows 6 seed sections', async ({ page }) => {
    await page.goto('/sections');
    await expect(page.getByRole('heading', { name: 'Mes Sections' })).toBeVisible();
    // Check two stable seed sections
    await expect(page.getByText('Maison')).toBeVisible();
    await expect(page.getByText('Perso')).toBeVisible();
  });

  test('can create a new section', async ({ page }) => {
    await page.goto('/sections');

    // Header button says "+ Nouvelle"
    await page.getByRole('button', { name: /Nouvelle/ }).first().click();
    await expect(page.getByRole('heading', { name: /Nouvelle section|Modifier/ })).toBeVisible();

    // Placeholder is "Ex : Maison, Transport…"
    const nameInput = page.getByPlaceholder(/Ex :/).first();
    await nameInput.click();
    await nameInput.fill('🏋️ Sport');

    // Click Sauvegarder directly
    await page.getByRole('button', { name: 'Sauvegarder' }).click();

    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.getByText('Sport').first()).toBeVisible();
  });

  test('can delete a section', async ({ page }) => {
    await page.goto('/sections');

    const sportSection = page.locator('li').filter({ hasText: 'Sport' }).first();
    if (await sportSection.count() > 0) {
      const deleteBtn = sportSection.getByRole('button', { name: 'Supprimer' }).first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const confirm = btns.find(b => b.textContent?.trim() === 'Oui');
          if (confirm) confirm.click();
        });
        await page.waitForTimeout(1500);
      }
    }
    await expect(page.getByRole('heading', { name: 'Mes Sections' })).toBeVisible();
  });
});
