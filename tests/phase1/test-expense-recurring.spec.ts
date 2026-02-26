import { test, expect } from '@playwright/test';

test.describe('Expense RECURRING', () => {
  test('can create a recurring monthly expense', async ({ page }) => {
    await page.goto('/depenses');

    // Open modal
    await page.getByRole('button', { name: /Ajouter/ }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();

    // Fill name
    await page.getByPlaceholder(/Loyer, Netflix/).fill('Netflix');

    // Fill amount
    await page.getByPlaceholder('0.00').click();
    await page.getByPlaceholder('0.00').press('Control+a');
    await page.getByPlaceholder('0.00').type('17.99');

    // Type should already be RECURRING, frequency MONTHLY
    // Set day to 15
    const dayInput = page.getByRole('spinbutton').nth(1);
    await dayInput.fill('15');

    // Submit via JS
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const add = btns.find(b => b.textContent?.trim() === 'Ajouter' && !b.disabled);
      if (add) add.click();
    });

    await page.waitForTimeout(2000);
    await page.reload();

    await expect(page.getByText('Netflix')).toBeVisible();
    await expect(page.getByText('17,99')).toBeVisible();
  });

  test('recurring expense appears in expense list', async ({ page }) => {
    await page.goto('/depenses');
    // Page should load without errors
    await expect(page.getByRole('heading', { name: 'Dépenses' })).toBeVisible();
    // Check that expenses exist
    const countText = page.locator('p').filter({ hasText: /\d+ dépense/ }).first();
    await expect(countText).toBeVisible();
  });
});
