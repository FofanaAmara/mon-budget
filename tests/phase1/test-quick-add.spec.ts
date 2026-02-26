import { test, expect } from '@playwright/test';

test.describe('Quick Add Expense', () => {
  test('FAB opens expense modal', async ({ page }) => {
    await page.goto('/depenses');
    const fab = page.getByRole('button', { name: /Ajouter/ });
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();
  });

  test('adding expense via FAB takes less than 30 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/depenses');

    // Open modal
    await page.getByRole('button', { name: /Ajouter/ }).click();

    // Fill required fields
    await page.getByPlaceholder(/Loyer, Netflix/).fill('Test Rapide');
    await page.getByPlaceholder('0.00').click();
    await page.getByPlaceholder('0.00').press('Control+a');
    await page.getByPlaceholder('0.00').type('99');

    // Submit
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const add = btns.find(b => b.textContent?.trim() === 'Ajouter' && !b.disabled);
      if (add) add.click();
    });

    await page.waitForTimeout(1500);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(30000);

    await page.reload();
    // Use .first() to avoid strict mode when test runs multiple times
    await expect(page.getByText('Test Rapide').first()).toBeVisible();
  });
});
