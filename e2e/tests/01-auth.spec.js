const { test, expect } = require('@playwright/test');
const { login } = require('./utils');

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('authToken'));
  });

  test('unauthenticated user is redirected to the shop on protected routes', async ({ page }) => {
    await page.goto('/products');
    await page.waitForURL('**/shop');
    await expect(page.locator('.sn-shop-page')).toBeVisible();
  });

  test('login form renders username, password and submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Enter username')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('submitting the login form logs the user in and shows the dashboard', async ({ page }) => {
    await login(page);
    await expect(page.locator('.sidebar-brand')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('logout clears the session and returns to login', async ({ page }) => {
    await login(page);
    await page.getByText('Logout').click();
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });
});
