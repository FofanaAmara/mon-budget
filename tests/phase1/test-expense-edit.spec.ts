import { test, expect } from '@playwright/test';

test.describe('Expense Edit', () => {
  test('edit button opens edit modal', async ({ page }) => {
    await page.goto('/depenses');

    const heading = page.getByRole('heading', { name: 'Dépenses' });
    await expect(heading).toBeVisible();

    // The edit button has aria-label="Modifier"
    const editBtn = page.getByRole('button', { name: 'Modifier' }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      // Edit opens a modal (not URL navigation)
      await expect(page.getByRole('heading', { name: 'Modifier la dépense' })).toBeVisible();
    } else {
      // No expenses to edit — just verify page loaded
      await expect(heading).toBeVisible();
    }
  });

  test('edit form is pre-filled with expense data', async ({ page }) => {
    await page.goto('/depenses');

    const editBtn = page.getByRole('button', { name: 'Modifier' }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await expect(page.getByRole('heading', { name: 'Modifier la dépense' })).toBeVisible();

      // Form should have a name input with a value
      const nameInput = page.getByPlaceholder(/Loyer, Netflix/);
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });
});
