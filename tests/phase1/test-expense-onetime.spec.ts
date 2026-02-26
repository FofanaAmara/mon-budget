import { test, expect } from '@playwright/test';

test.describe('Expense ONE_TIME', () => {
  test('can create a one-time expense with due date', async ({ page }) => {
    await page.goto('/depenses');

    // Open modal
    await page.getByRole('button', { name: /Ajouter/ }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();

    // Fill name
    await page.getByPlaceholder(/Loyer, Netflix/).fill('Impôts');

    // Fill amount
    await page.getByPlaceholder('0.00').click();
    await page.getByPlaceholder('0.00').press('Control+a');
    await page.getByPlaceholder('0.00').type('500');

    // Switch to ONE_TIME
    await page.getByRole('button', { name: /Ponctuel/ }).click();

    // Set due date to 3 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(dateStr);

    // Submit
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const add = btns.find(b => b.textContent?.trim() === 'Ajouter' && !b.disabled);
      if (add) add.click();
    });

    await page.waitForTimeout(4000);
    await page.reload();
    await expect(page.getByText('Impôts').first()).toBeVisible();
  });

  test('one-time expense appears in upcoming 7 days on dashboard', async ({ page }) => {
    await page.goto('/');
    // The "Prochaines (7 jours)" widget should be visible
    await expect(page.getByText('Prochaines (7 jours)')).toBeVisible();
    // Impôts created with 3-day due date should appear — use first() to avoid strict mode
    await expect(page.getByText('Impôts').first()).toBeVisible();
  });
});
