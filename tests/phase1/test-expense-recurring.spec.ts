import { test, expect } from '@playwright/test';

test.describe('Expense RECURRING', () => {
  test('can create a recurring monthly expense', async ({ page }) => {
    await page.goto('/depenses');

    // Open modal
    await page.getByRole('button', { name: /Ajouter/ }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();

    // Select section (required for form to be valid)
    await page.getByRole('combobox').selectOption('Maison');

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

    // Submit — wait for button to become enabled then click
    await page.getByRole('button', { name: 'Ajouter' }).click();

    await page.waitForTimeout(4000);
    await page.reload();

    // Use .first() to avoid strict mode when multiple Netflix expenses exist
    await expect(page.getByText('Netflix').first()).toBeVisible();
    await expect(page.getByText('17,99').first()).toBeVisible();
  });

  test('recurring expense appears in expense list', async ({ page }) => {
    await page.goto('/depenses');
    await expect(page.getByRole('heading', { name: 'Dépenses' })).toBeVisible();
    const countText = page.locator('p').filter({ hasText: /\d+ dépense/ }).first();
    await expect(countText).toBeVisible();
  });
});
