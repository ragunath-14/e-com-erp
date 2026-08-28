const { test, expect } = require('@playwright/test');
const { login, apiLogin, apiCreateOrder, apiDeleteOrder } = require('./utils');

test.describe('Online Orders — admin management', () => {
  let token;
  let order;

  test.beforeEach(async ({ request }) => {
    token = await apiLogin(request);
    order = await apiCreateOrder(request, {
      customer: { name: `E2E Order Customer ${Date.now()}`, phone: '9998887771', address: '1 Playwright Lane' },
    });
  });

  test.afterEach(async ({ request }) => {
    await apiDeleteOrder(request, token, order._id);
  });

  test('a storefront order can be reviewed, updated and removed', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Order ID or Name...').fill(order.orderId);
    const row = page.locator('tr', { hasText: order.orderId });
    await expect(row).toBeVisible();
    await expect(row).toContainText(order.customer.name);
    await expect(row.locator('.badge')).toHaveText('Pending');

    await row.click();
    const details = page.locator('.card', { hasText: 'Order Details' });
    await expect(details).toBeVisible();
    await expect(details).toContainText(order.customer.address);

    await details.getByRole('button', { name: 'Confirmed' }).click();
    await expect(row.locator('.badge')).toHaveText('Confirmed');

    page.once('dialog', (d) => d.accept());
    await details.getByRole('button', { name: /remove order record/i }).click();
    await expect(row).toHaveCount(0);
  });
});

test.describe('Public storefront — add to basket', () => {
  test('a visitor can add a product to the basket from the shop', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const addButtons = page.getByRole('button', { name: /add to basket/i });
    if ((await addButtons.count()) === 0) test.skip(true, 'No in-stock products in the catalog to add.');

    await addButtons.first().click();
    await expect(page.locator('.sn-cart-badge')).toHaveText('1');

    await page.locator('.sn-nav-cart').click();
    await expect(page.locator('.sn-cart-drawer.open')).toBeVisible();
    await expect(page.locator('.sn-cart-item-card-premium')).toHaveCount(1);
  });
});
