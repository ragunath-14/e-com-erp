const { test, expect } = require('@playwright/test');
const { login, apiLogin, apiCreateProduct, apiDeleteProduct } = require('./utils');

test.describe('Billing — pending payment checkbox', () => {
  let token;
  let product;
  const customerName = `E2E Pending Buyer ${Date.now()}`;
  const customerPhone = String(Math.floor(6000000000 + Math.random() * 3999999999));

  test.beforeEach(async ({ request }) => {
    token = await apiLogin(request);
    product = await apiCreateProduct(request, token, { name: `E2E Pending Product ${Date.now()}`, sellingPrice: 1000 });
  });

  test.afterEach(async ({ request }) => {
    await apiDeleteProduct(request, token, product._id);
  });

  test('completing a sale with "Mark as Pending Payment" records the balance due', async ({ page }) => {
    await login(page);
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Add the seeded product to the cart.
    await page.locator('.pos-item-card', { hasText: product.name }).click();
    await expect(page.getByText('Cart (1)')).toBeVisible();

    // Complete Sale requires a named customer (unlike Quick Entry).
    await page.getByPlaceholder('Search Customer Name...').fill(customerName);
    await page.getByPlaceholder('Search Mobile...').fill(customerPhone);

    // Tick the pending-payment box and record a partial amount paid now.
    await page.getByText('Mark as Pending Payment').click();
    await page.getByPlaceholder('0.00').fill('300');

    await page.getByRole('button', { name: /complete sale/i }).click();
    await expect(page.getByText('Sale Completed!')).toBeVisible();

    // Void the bill so stock/sales stay clean for repeated runs.
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /void bill/i }).click();

    // The Pending Payments page should show the balance due for this customer.
    // A partially-paid record only shows under the "Partial" tab (default tab is "Pending").
    await page.goto('/pending');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Partial', exact: true }).click();
    await page.getByPlaceholder('Search by customer name or phone...').fill(customerName);
    const row = page.locator('tr', { hasText: customerName });
    await expect(row).toBeVisible();
    await expect(row).toContainText('₹1,180'); // 1000 + 18% GST
    await expect(row).toContainText('₹300'); // paid so far
    await expect(row.locator('.badge')).toContainText('PARTIAL');

    // Clean up the pending-payment record.
    page.once('dialog', (d) => d.accept());
    await row.locator('button.btn-outline-danger').click();
    await expect(row).toHaveCount(0);
  });
});
