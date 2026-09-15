// Central API base URL setup
// In production builds, fall back to a relative path so the app works when
// the backend serves the built frontend from the same origin (e.g. Render).
// In dev, fall back to the standalone admin backend's dev server (backend-admin,
// port 5001 by default — not the shop's backend on 5000).
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

export const API_URLS = {
  SALES:     `${BASE_URL}/sales`,
  PRODUCTS:  `${BASE_URL}/products`,
  CUSTOMERS: `${BASE_URL}/customers`,
  SETTINGS:  `${BASE_URL}/settings`,
  ORDERS:    `${BASE_URL}/orders`,
  PAYMENTS:  `${BASE_URL}/payments`,
  USERS:     `${BASE_URL}/users`,
  BASE:      BASE_URL
};

export default BASE_URL;
