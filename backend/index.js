require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ── Route imports ──────────────────────────────────────────────────────────────
const productRoutes  = require('./routes/productRoutes');
const saleRoutes     = require('./routes/saleRoutes');
const customerRoutes = require('./routes/customerRoutes');
const settingRoutes  = require('./routes/settingRoutes');
const shopRoutes     = require('./routes/shopRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const paymentRoutes  = require('./routes/paymentRoutes');
const authRoutes     = require('./routes/authRoutes');
const userRoutes     = require('./routes/userRoutes');

// ── Auth config guard ──────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
  console.error('❌  Missing JWT_SECRET / ADMIN_USERNAME / ADMIN_PASSWORD_HASH in .env — see backend/.env.example');
  process.exit(1);
}

// TEMPORARY diagnostic — prints to this service's own private Logs tab only
// (never returned to any HTTP client) to debug a live 401 that persists
// despite the dashboard showing the expected values. No secret value is
// printed, only lengths/prefixes and a compare against the known test
// password 'test1234'. Remove this block once the login issue is fixed.
(() => {
  const u = process.env.ADMIN_USERNAME || '';
  const h = process.env.ADMIN_PASSWORD_HASH || '';
  console.log(`[diag] ADMIN_USERNAME length=${u.length} trimmedEqualsAdmin=${u.trim() === 'admin'} hasSurroundingWhitespace=${u !== u.trim()}`);
  console.log(`[diag] ADMIN_PASSWORD_HASH length=${h.length} prefix=${JSON.stringify(h.slice(0, 7))}`);
  require('bcryptjs').compare('test1234', h || 'x')
    .then(r => console.log(`[diag] hash matches 'test1234': ${r}`))
    .catch(e => console.log(`[diag] compare error: ${e.message}`));
})();

const app = express();

// Render (and most PaaS hosts) sit in front of the app behind a single reverse
// proxy — trust exactly one hop so req.ip / X-Forwarded-For reflect the real
// client instead of the proxy, which the login rate limiter keys on.
app.set('trust proxy', 1);

const compression = require('compression');
app.use(compression());

// Several pages render inline <style> blocks and the app pulls Google Fonts,
// so those are explicitly allow-listed; everything else defaults to 'self'.
// This blocks injected <script>/remote content from exfiltrating data even if
// an XSS bug slips through React's default escaping.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// CORS: same-origin requests (the SPA served by this same app) always pass.
// Cross-origin browser requests are only allowed from origins explicitly
// listed in CORS_ORIGIN (comma-separated) or this service's own Render URL —
// everything else is rejected so a page on another site can't call the API
// on a logged-in admin's behalf. Wide open in development for convenience.
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = [process.env.RENDER_EXTERNAL_URL, ...(process.env.CORS_ORIGIN || '').split(',')]
  .map(s => s && s.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!isProd || !origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));

// 4mb headroom for product photos, which arrive as base64 data URIs
// (client-side compressed to ~900px/JPEG q0.8, but base64 adds ~33% overhead).
app.use(express.json({ limit: '4mb' }));

// General abuse/scraping brake across the whole API — generous enough for normal
// UI usage (dashboard pages fire several requests at once) while capping how much
// data an automated client can pull per IP. Login has its own, stricter limiter.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
}));

// ── Database (optimized connection) ────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crackers-shop', {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => console.log('✅  MongoDB connected (pooled)'))
  .catch(err => console.error('❌  MongoDB error:', err));

const path = require('path');
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/sales',     saleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings',  settingRoutes);
app.use('/api/shop',      shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);

// ── Static Frontend Serving (PROD) ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/billing/dist');
  const fs = require('fs');
  const Setting = require('./models/Setting');

  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getShopName = async () => {
    try {
      const setting = await Setting.findOne().select('shopName').lean();
      return (setting && setting.shopName && setting.shopName.trim()) || 'Billing';
    } catch { return 'Billing'; }
  };

  // Web app manifest — generated so the installed app's name follows the shop
  // name saved in Settings. Must be registered before express.static.
  app.get('/manifest.webmanifest', async (req, res) => {
    const name = await getShopName();
    res.set('Cache-Control', 'no-cache').type('application/manifest+json').send(JSON.stringify({
      id: '/',
      name,
      short_name: name,
      description: `${name} — billing, inventory and orders`,
      start_url: '/login',
      scope: '/',
      display: 'standalone',
      background_color: '#f8fafc',
      theme_color: '#1e40af',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }));
  });

  app.use(express.static(distPath, { index: false }));

  // SPA fallback: index.html with <title> set to the shop name from Settings so
  // the tab (and the installed app window) never shows a hardcoded name.
  let indexHtml;
  app.get('*', async (req, res) => {
    try {
      indexHtml = indexHtml || fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
      const title = escapeHtml(await getShopName());
      res.set('Cache-Control', 'no-cache').type('html')
        .send(indexHtml.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`));
    } catch {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => res.send('Backend is running... Use Frontend dev server for UI.'));
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server on http://localhost:${PORT}`));
