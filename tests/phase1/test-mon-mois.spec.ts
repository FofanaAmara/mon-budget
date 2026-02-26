import { test, expect } from '@playwright/test';

test.describe('Mon Mois — Vue mensuelle', () => {
  test('page loads with current month heading', async ({ page }) => {
    await page.goto('/mon-mois');
    // Heading contains the month navigation (prev/next + month label)
    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Page should not show an error
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
  });

  test('progress bar section is visible', async ({ page }) => {
    await page.goto('/mon-mois');
    // Progress bar container (the outer grey bar)
    const progressContainer = page.locator('.rounded-full').first();
    await expect(progressContainer).toBeVisible();
  });

  test('month navigation backward works', async ({ page }) => {
    await page.goto('/mon-mois');
    // Current URL has no ?month param (defaults to current month)
    const prevBtn = page.getByRole('button', { name: '←' });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    // After clicking previous, URL should contain a ?month= param
    await page.waitForURL(/\?month=/);
    expect(page.url()).toContain('?month=');
  });

  test('month navigation cannot go to future month', async ({ page }) => {
    await page.goto('/mon-mois');
    // The "next month" button should be disabled when on current month
    const nextBtn = page.getByRole('button', { name: '→' });
    await expect(nextBtn).toBeVisible();
    await expect(nextBtn).toBeDisabled();
  });

  test('section filter chips are rendered', async ({ page }) => {
    await page.goto('/mon-mois');
    // There should be at least one filter chip ("Toutes")
    const toutesChip = page.getByRole('button', { name: 'Toutes' });
    await expect(toutesChip).toBeVisible();
  });

  test('dashboard shows Mon mois widget with link', async ({ page }) => {
    await page.goto('/');
    // Dashboard "Mon mois" widget (only shown if count > 0)
    // At minimum, after deployment the widget link should be present
    const monMoisLink = page.getByRole('link', { name: /Mon mois/i });
    await expect(monMoisLink).toBeVisible();
  });

  test('dashboard Mon mois widget links to /mon-mois', async ({ page }) => {
    await page.goto('/');
    const monMoisLink = page.getByRole('link', { name: /Mon mois/i });
    await monMoisLink.click();
    await expect(page).toHaveURL(/\/mon-mois/);
  });

  test('parametres has Contact section with email and phone fields', async ({ page }) => {
    await page.goto('/parametres');
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await expect(page.getByPlaceholder('votre@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('+1 514 000 0000')).toBeVisible();
  });
});
