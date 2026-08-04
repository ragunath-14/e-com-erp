const { test, expect } = require('@playwright/test');
const { login } = require('./utils');

test.describe('Customers CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
  });

  test('add a new customer and see it listed', async ({ page }) => {
    const name = `E2E Customer ${Date.now()}`;
    const mobile = String(Math.floor(6000000000 + Math.random() * 3999999999));

    await page.getByRole('button', { name: /add customer/i }).first().click();
    const modal = page.locator('.modal.show');
    await modal.locator('input[type="text"], input:not([type])').first().fill(name);
    await modal.locator('input[type="tel"]').fill(mobile);
    await modal.getByRole('button', { name: /^save$/i }).click();

    // The customer list is paginated (10/page) and sorted by name, so with enough
    // existing rows the new one can land past page 1 — search narrows it back down
    // to a single row regardless of where it'd otherwise paginate to.
    await page.getByPlaceholder('Find customer by name or mobile...').fill(name);
    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible();

    // Clean up so repeated runs don't pile up customers and shift pagination.
    // Row buttons are [Check History, Edit, Delete] — Delete is the third.
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button').nth(2).click();
    await expect(row).toHaveCount(0);
  });
});
