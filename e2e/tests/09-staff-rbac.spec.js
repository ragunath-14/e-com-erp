const { test, expect } = require('@playwright/test');
const { login, apiLogin, apiDeleteUser } = require('./utils');

test.describe('Staff accounts — page-level access control', () => {
  let adminToken;
  const staffUsername = `e2e_staff_${Date.now()}`;
  const staffPassword = 'staffpass123';
  let staffId;

  test.beforeAll(async ({ request }) => {
    adminToken = await apiLogin(request);
  });

  test.afterAll(async ({ request }) => {
    if (staffId) await apiDeleteUser(request, adminToken, staffId);
  });

  test('a staff account limited to Inventory can only see that page', async ({ page, request }) => {
    // ── Admin creates a staff login with only the "Inventory" page checked ──
    await login(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /add user/i }).click();
    await page.getByPlaceholder('e.g. billing_staff').fill(staffUsername);
    await page.getByPlaceholder('Minimum 6 characters').fill(staffPassword);
    await page.getByLabel('Inventory').check();
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByText('New user created!')).toBeVisible();

    const row = page.locator('tr', { hasText: staffUsername });
    await expect(row).toBeVisible();

    const usersRes = await request.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const users = await usersRes.json();
    staffId = users.find((u) => u.username === staffUsername)?._id;
    expect(staffId).toBeTruthy();

    // Log out the admin session.
    await page.getByText('Logout').click();
    await page.waitForURL('**/login');

    // ── Staff logs in and should land straight on their one allowed page ──
    await page.getByPlaceholder('Enter username').fill(staffUsername);
    await page.getByPlaceholder('••••••••').fill(staffPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/products');
    await expect(page.getByRole('heading', { name: 'Stock & Operations' })).toBeVisible();

    // The sidebar should only list pages the staff account was granted.
    await expect(page.getByText('Inventory', { exact: true })).toBeVisible();
    await expect(page.getByText('Customers', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Staff Management')).toHaveCount(0);

    // Directly navigating to a page outside their grant bounces back to Inventory.
    await page.goto('/customers');
    await page.waitForURL('**/products');

    // Admin-only Staff Management is likewise off-limits.
    await page.goto('/users');
    await page.waitForURL('**/products');

    await page.getByText('Logout').click();
    await page.waitForURL('**/login');
  });
});
