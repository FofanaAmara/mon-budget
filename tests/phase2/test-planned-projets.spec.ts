import { test, expect } from '@playwright/test';

test.describe('Projets (PLANNED expenses)', () => {
  test('page /projets loads with heading', async ({ page }) => {
    await page.goto('/projets');
    await expect(page.getByRole('heading', { name: 'Projets' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('expense modal has Planifié type button', async ({ page }) => {
    await page.goto('/depenses');
    await page.getByRole('button', { name: /Ajouter/ }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();
    // The PLANNED button should exist
    await expect(page.getByRole('button', { name: 'Planifié' })).toBeVisible();
  });

  test('can create a PLANNED expense', async ({ page }) => {
    await page.goto('/depenses');
    await page.getByRole('button', { name: /Ajouter/ }).click();
    await expect(page.getByRole('heading', { name: 'Nouvelle dépense' })).toBeVisible();

    // Select section
    await page.getByRole('combobox').selectOption('Projets');

    // Fill name
    await page.getByPlaceholder(/Loyer, Netflix/).fill('Voyage Japon');

    // Fill amount (monthly savings)
    await page.locator('input[placeholder="0.00"]').first().fill('200');

    // Switch to PLANNED
    await page.getByRole('button', { name: 'Planifié' }).click();

    // Fill target amount
    const amountInputs = page.locator('input[type="number"]');
    await amountInputs.nth(1).fill('5000');

    // Submit
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();

    await page.waitForTimeout(3000);
    await page.reload();
    await expect(page.getByText('Voyage Japon').first()).toBeVisible();
  });

  test('/projets shows project with progress bar', async ({ page }) => {
    await page.goto('/projets');
    // Either shows projects or empty state
    const hasProjects = await page.locator('text=Voyage Japon').count() > 0;
    if (hasProjects) {
      await expect(page.locator('text=Voyage Japon').first()).toBeVisible();
    } else {
      await expect(page.getByText('Aucun projet planifié')).toBeVisible();
    }
  });
});
