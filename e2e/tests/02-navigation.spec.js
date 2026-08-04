const { test, expect } = require('@playwright/test');
const { login, trackConsoleErrors, DEFAULT_IGNORE } = require('./utils');

const routes = [
  { path: '/', label: 'Dashboard' },
  { path: '/billing', label: 'Billing' },
  { path: '/products', label: 'Inventory' },
  { path: '/categories', label: 'Categories' },
  { path: '/orders', label: 'Online Orders' },
  { path: '/online-billing', label: 'Online Billing' },
  { path: '/customers', label: 'Customers' },
  { path: '/pending', label: 'Pending Payments' },
  { path: '/settings', label: 'System Settings' },
];

test.describe('Admin navigation smoke test', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const r of routes) {
    test(`page "${r.label}" (${r.path}) loads without crashing`, async ({ page }) => {
      const errors = trackConsoleErrors(page, DEFAULT_IGNORE);

      await page.goto(r.path);
      await page.waitForLoadState('networkidle');

      // The React app should have rendered real content, not an error boundary / blank page.
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);
      await expect(page.locator('.sidebar-brand')).toBeVisible();

      await page.screenshot({ path: `screenshots${r.path === '/' ? '/dashboard' : r.path}.png`, fullPage: true });

      expect(errors, `Console/page errors on ${r.path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }

  test('sidebar links navigate to the correct routes', async ({ page }) => {
    await page.goto('/');
    const links = [
      ['Billing', '/billing'],
      ['Inventory', '/products'],
      ['Categories', '/categories'],
      ['Online Orders', '/orders'],
      ['Online Billing', '/online-billing'],
      ['Customers', '/customers'],
    ];
    for (const [label, path] of links) {
      await page.getByText(label, { exact: true }).click();
      await page.waitForURL(`**${path}`);
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[/]/g, '\\/')}$`));
    }
  });
});

test.describe('Public shop storefront', () => {
  test('shop page loads for unauthenticated visitors', async ({ page }) => {
    const errors = trackConsoleErrors(page, DEFAULT_IGNORE);
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
    await page.screenshot({ path: 'screenshots/shop.png', fullPage: true });
    expect(errors, `Console/page errors on /shop:\n${errors.join('\n')}`).toEqual([]);
  });
});
