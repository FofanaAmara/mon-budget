import { test, expect } from '@playwright/test';

test.describe('Mon Mois — Vue mensuelle', () => {
  test('page loads with current month heading', async ({ page }) => {
    await page.goto('/mon-mois');
    // h1 should show the current month name (e.g. "février 2026")
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).not.toHaveText('');
    // No server error
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('progress bar section is visible', async ({ page }) => {
    await page.goto('/mon-mois');
    // Progress card shows "X/Y dépenses complétées"
    await expect(page.locator('text=dépenses complétées')).toBeVisible();
  });

  test('month navigation backward works', async ({ page }) => {
    await page.goto('/mon-mois');
    // Button uses aria-label="Mois précédent"
    const prevBtn = page.getByRole('button', { name: 'Mois précédent' });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    // After clicking previous, URL should contain ?month=
    await page.waitForURL(/\?month=/);
    expect(page.url()).toContain('?month=');
  });

  test('month navigation cannot go to future month', async ({ page }) => {
    await page.goto('/mon-mois');
    // Button uses aria-label="Mois suivant" and should be disabled on current month
    const nextBtn = page.getByRole('button', { name: 'Mois suivant' });
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toBeDisabled();
  });

  test('section filter chips are rendered', async ({ page }) => {
    await page.goto('/mon-mois');
    // "Tout" is the all-sections filter chip — exact: true to avoid matching "Voir tout (32)"
    const toutBtn = page.getByRole('button', { name: 'Tout', exact: true });
    await expect(toutBtn).toBeVisible();
  });

  test('dashboard shows Mon mois widget with link', async ({ page }) => {
    await page.goto('/');
    // The widget is a Link to /mon-mois that contains "complétées" (vs the nav link which doesn't)
    const widgetLink = page.locator('a[href="/mon-mois"]').filter({ hasText: /complétées/ });
    await expect(widgetLink).toBeVisible();
  });

  test('dashboard Mon mois widget links to /mon-mois', async ({ page }) => {
    await page.goto('/');
    const widgetLink = page.locator('a[href="/mon-mois"]').filter({ hasText: /complétées/ });
    await widgetLink.click();
    await expect(page).toHaveURL(/\/mon-mois/);
  });

  test('parametres has Contact section with email and phone fields', async ({ page }) => {
    await page.goto('/parametres');
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('+1 514 000 0000')).toBeVisible();
  });
});
