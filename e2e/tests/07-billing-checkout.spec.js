const { test, expect } = require('@playwright/test');
const { login, apiLogin, apiCreateProduct, apiDeleteProduct } = require('./utils');

test.describe('Billing / POS — full sale', () => {
  let token;
  let product;

  test.beforeEach(async ({ request }) => {
    token = await apiLogin(request);
    product = await apiCreateProduct(request, token, { name: `E2E Billing Product ${Date.now()}` });
  });

  test.afterEach(async ({ request }) => {
    await apiDeleteProduct(request, token, product._id);
  });

  test('add a product to the cart and complete a Quick Entry sale', async ({ page }) => {
    await login(page);
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    // Find the seeded product in the catalog and add it to the cart.
    const card = page.locator('.pos-item-card', { hasText: product.name });
    await expect(card).toBeVisible();
    await card.click();

    // Cart should now show exactly one item.
    await expect(page.getByText('Cart (1)')).toBeVisible();
    await expect(page.locator('.cart-item-row', { hasText: product.name })).toBeVisible();

    // Quick Entry skips the customer-details requirement entirely.
    await page.getByRole('button', { name: /quick entry/i }).click();

    // Receipt modal confirms the sale and lists the product.
    await expect(page.getByText('Sale Completed!')).toBeVisible();
    await expect(page.locator('.receipt-box')).toContainText(product.name);

    // Void the bill to restore stock and keep the run repeatable.
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /void bill/i }).click();
    await expect(page.getByText('Sale Completed!')).toHaveCount(0);
  });
});
