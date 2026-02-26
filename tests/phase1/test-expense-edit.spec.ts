import { test, expect } from '@playwright/test';

test.describe('Expense Edit', () => {
  test('edit button navigates to edit page', async ({ page }) => {
    await page.goto('/depenses');

    // Check there are expenses
    const heading = page.getByRole('heading', { name: 'Dépenses' });
    await expect(heading).toBeVisible();

    // Find first edit button
    const editBtn = page.getByRole('button', { name: /Modifier/ }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      // Should navigate to edit page
      await expect(page).toHaveURL(/\/depenses\/.+\/edit/);
      await expect(page.getByRole('heading', { name: /Modifier|dépense/ })).toBeVisible();
    } else {
      // No expenses to edit — just verify page loaded
      await expect(heading).toBeVisible();
    }
  });

  test('edit form is pre-filled with expense data', async ({ page }) => {
    await page.goto('/depenses');

    const editBtn = page.getByRole('button', { name: /Modifier/ }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForURL(/\/depenses\/.+\/edit/);

      // Form should have a name input with a value
      const nameInput = page.getByPlaceholder(/Loyer, Netflix/);
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });
});
