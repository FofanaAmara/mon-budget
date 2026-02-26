import { test, expect } from '@playwright/test';

test.describe('Revenus', () => {
  test('page /revenus loads with heading', async ({ page }) => {
    await page.goto('/revenus');
    await expect(page.getByRole('heading', { name: 'Revenus' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('page /revenus shows monthly total card', async ({ page }) => {
    await page.goto('/revenus');
    await expect(page.getByText('Total mensuel net')).toBeVisible();
  });

  test('can add a monthly income', async ({ page }) => {
    await page.goto('/revenus');
    await page.getByRole('button', { name: 'Ajouter un revenu' }).click();
    await expect(page.getByRole('heading', { name: 'Nouveau revenu' })).toBeVisible();

    await page.getByPlaceholder(/Salaire/).fill('Salaire principal');
    await page.locator('input[type="number"]').fill('3500');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // After close, income should appear
    await expect(page.getByText('Salaire principal').first()).toBeVisible();
  });

  test('dashboard shows Reste à vivre widget', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Reste à vivre')).toBeVisible();
  });

  test('dashboard Reste à vivre widget links to /revenus', async ({ page }) => {
    await page.goto('/');
    const widget = page.locator('a[href="/revenus"]');
    await expect(widget).toBeVisible();
    await widget.first().click();
    await expect(page).toHaveURL(/\/revenus/);
  });
});
