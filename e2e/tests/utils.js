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

module.exports = { login, trackConsoleErrors, DEFAULT_IGNORE };
