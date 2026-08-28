const { test, expect } = require('@playwright/test');
const { login } = require('./utils');

test.describe('Pending Payments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/pending');
    await page.waitForLoadState('networkidle');
  });

  test('record a new credit and delete it', async ({ page }) => {
    const name = `E2E Credit Customer ${Date.now()}`;
    const phone = String(Math.floor(6000000000 + Math.random() * 3999999999));

    await page.getByRole('button', { name: /add new/i }).click();
    await page.getByPlaceholder('Full name...').fill(name);
    await page.getByPlaceholder('10-digit mobile...').fill(phone);
    await page.getByPlaceholder('0.00').fill('1500');
    await page.getByRole('button', { name: /add credit record/i }).click();

    await page.getByPlaceholder('Search by customer name or phone...').fill(name);
    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible();
    await expect(row).toContainText('₹1,500');

    page.once('dialog', (d) => d.accept());
    await row.locator('button.btn-outline-danger').click();
    await expect(row).toHaveCount(0);
  });
});
