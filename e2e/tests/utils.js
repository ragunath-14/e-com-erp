// Shared helpers for the billing software e2e suite

/** Logs in via the (simulated) login form and waits for the dashboard to appear. */
async function login(page) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter username').fill('admin');
  await page.getByPlaceholder('••••••••').fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/');
  await page.waitForSelector('.sidebar-brand');
}

/** Attaches console-error / page-error collectors; call .assertNoErrors() at the end of a test. */
function trackConsoleErrors(page, ignorePatterns = []) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!ignorePatterns.some((p) => p.test(text))) errors.push(text);
    }
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const DEFAULT_IGNORE = [
  /favicon/i,
  /ERR_CONNECTION_REFUSED.*5000/i, // backend momentarily unreachable during navigation
];

const API_BASE = 'http://localhost:5000/api';

/** Logs in via the backend API directly (no browser) — for seeding/cleanup data outside a test's own UI flow. */
async function apiLogin(request) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  });
  const body = await res.json();
  return body.token;
}

/** Creates a product via the API so tests that exercise a *different* flow (e.g. billing) don't
 *  need to drive the Products UI just to have something in the catalog. Returns the saved product. */
async function apiCreateProduct(request, token, overrides = {}) {
  const res = await request.post(`${API_BASE}/products`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: `E2E Seed Product ${Date.now()}`,
      brand: 'Playwright Brand',
      buyingPrice: 50,
      sellingPrice: 100,
      stock: 20,
      ...overrides,
    },
  });
  return res.json();
}

async function apiDeleteProduct(request, token, id) {
  await request.delete(`${API_BASE}/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function apiDeleteUser(request, token, id) {
  await request.delete(`${API_BASE}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function apiCreateOrder(request, overrides = {}) {
  const res = await request.post(`${API_BASE}/orders`, {
    data: {
      customer: { name: 'E2E Order Customer', phone: '9998887771', address: '1 Playwright Lane' },
      items: [{ productId: '000000000000000000000000', name: 'E2E Order Item', qty: 2, price: 100, total: 200 }],
      totalAmount: 200,
      source: 'Online Store',
      ...overrides,
    },
  });
  return res.json();
}

async function apiDeleteOrder(request, token, id) {
  await request.delete(`${API_BASE}/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

module.exports = {
  login, trackConsoleErrors, DEFAULT_IGNORE,
  apiLogin, apiCreateProduct, apiDeleteProduct, apiDeleteUser, apiCreateOrder, apiDeleteOrder,
};
