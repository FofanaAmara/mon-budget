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

    // Fill required fields (section is required for form validity)
    await page.getByRole('combobox').selectOption('Maison');
    await page.getByPlaceholder(/Loyer, Netflix/).fill('Test Rapide');
    await page.getByPlaceholder('0.00').click();
    await page.getByPlaceholder('0.00').press('Control+a');
    await page.getByPlaceholder('0.00').type('99');

    // Submit — exact: true to avoid matching FAB aria-label "Ajouter une dépense"
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();

    await page.waitForTimeout(4000);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(30000);

    await page.reload();
    // Use .first() to avoid strict mode when test runs multiple times
    await expect(page.getByText('Test Rapide').first()).toBeVisible();
  });
});
