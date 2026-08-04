const { test, expect } = require('@playwright/test');
const { login } = require('./utils');

test.describe('Categories CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
  });

  test('create, edit and delete a category', async ({ page }) => {
    const name = `E2E Category ${Date.now()}`;
    const renamed = `${name} Updated`;

    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByPlaceholder('e.g. Gift Boxes').fill(name);
    await page.getByPlaceholder('Optional details about this category').fill('Created by Playwright');
    await page.getByRole('button', { name: /save category/i }).click();

    await expect(page.getByText('New category created!')).toBeVisible();
    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible();

    // Edit
    await row.getByRole('button').first().click(); // edit icon button
    const nameInput = page.locator('.modal-overlay input.form-control').first();
    await nameInput.fill(renamed);
    await page.getByRole('button', { name: /update category/i }).click();
    await expect(page.getByText('Category updated successfully!')).toBeVisible();
    await expect(page.locator('tr', { hasText: renamed })).toBeVisible();

    // Delete
    page.once('dialog', (d) => d.accept());
    await page.locator('tr', { hasText: renamed }).getByRole('button').nth(1).click();
    await expect(page.locator('tr', { hasText: renamed })).toHaveCount(0);
  });
});
