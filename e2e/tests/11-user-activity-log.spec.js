const { test, expect } = require('@playwright/test');
const { login, apiLogin, apiDeleteUser } = require('./utils');

test.describe('User Activity Log', () => {
  let adminToken;
  const staffUsername = `e2e_log_staff_${Date.now()}`;
  let staffId;

  test.beforeAll(async ({ request }) => {
    adminToken = await apiLogin(request);
  });

  test.afterAll(async ({ request }) => {
    if (staffId) await apiDeleteUser(request, adminToken, staffId);
  });

  test('create/update/delete of a staff account is recorded and visible to the admin', async ({ page, request }) => {
    await login(page);
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Create
    await page.getByRole('button', { name: /add user/i }).click();
    await page.getByPlaceholder('e.g. billing_staff').fill(staffUsername);
    await page.getByPlaceholder('Minimum 6 characters').fill('staffpass123');
    await page.getByLabel('Inventory').check();
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByText('New user created!')).toBeVisible();

    const usersRes = await request.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    staffId = (await usersRes.json()).find((u) => u.username === staffUsername)?._id;
    expect(staffId).toBeTruthy();

    // Update — grant an extra page. Row buttons are [Active/Disabled toggle, Edit, Delete].
    const row = page.locator('tr', { hasText: staffUsername });
    await row.getByRole('button').nth(1).click();
    await page.getByLabel('Categories').check();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('User updated successfully!')).toBeVisible();

    // Delete
    page.once('dialog', (d) => d.accept());
    await row.getByRole('button').nth(2).click();
    await expect(row).toHaveCount(0);
    staffId = null; // already gone — afterAll doesn't need to clean it up

    // ── The activity log should show all three actions, newest first ──
    await page.getByRole('button', { name: /activity log/i }).click();
    await page.waitForURL('**/users/logs');
    await page.waitForLoadState('networkidle');

    const logRows = page.locator('tr', { hasText: staffUsername });
    await expect(logRows).toHaveCount(3);
    await expect(logRows.filter({ hasText: 'Created' })).toBeVisible();
    await expect(logRows.filter({ hasText: 'Updated' })).toContainText('pages:');
    await expect(logRows.filter({ hasText: 'Deleted' })).toBeVisible();
    await expect(logRows.first()).toContainText('admin'); // performedBy
  });
});
