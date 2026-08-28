const { test, expect } = require('@playwright/test');
const { login } = require('./utils');

test.describe('Products / Inventory CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('create a new product and see it in the inventory table', async ({ page }) => {
    const name = `E2E Product ${Date.now()}`;

    await page.getByRole('button', { name: /new stock/i }).click();
    await page.getByPlaceholder('e.g. 10cm Sparklers').fill(name);
    await page.getByPlaceholder('e.g. Standard').fill('Playwright Brand');
    await page.locator('input[type=number]').nth(0).fill('50');   // Cost Price
    await page.locator('input[type=number]').nth(1).fill('99');   // Selling Price
    await page.locator('input[type=number]').nth(2).fill('20');   // Stock Quantity
    await page.getByRole('button', { name: /save product/i }).click();

    await page.getByPlaceholder('Filter stock by name...').fill(name);
    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible();

    // Clean up so repeated runs don't pile up products in inventory.
    await row.getByTitle('Delete Product').click();
    await page.getByRole('button', { name: /yes, delete/i }).click();
    await expect(row).toHaveCount(0);
  });

  test('inventory stats and stock filters render', async ({ page }) => {
    // Scope to the filter pill row — the topbar also has a "Low Stock Alerts" bell
    // button whose accessible name would otherwise collide with the /low stock/i filter.
    const filters = page.locator('.table-card').first();
    await expect(filters.getByRole('button', { name: /all inventory/i })).toBeVisible();
    await filters.getByRole('button', { name: '⚠️ Low Stock' }).click();
    await filters.getByRole('button', { name: '⛔ Out of Stock' }).click();
    await filters.getByRole('button', { name: /all inventory/i }).click();
  });
});
