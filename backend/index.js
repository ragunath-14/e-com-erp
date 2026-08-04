require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

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

const app = express();

// Render (and most PaaS hosts) sit in front of the app behind a single reverse
// proxy — trust exactly one hop so req.ip / X-Forwarded-For reflect the real
// client instead of the proxy, which the login rate limiter keys on.
app.set('trust proxy', 1);

const compression = require('compression');
app.use(compression());
// CSP is left off: several pages render inline <style> blocks, which helmet's
// default policy would block. The rest of helmet's headers (frame options,
// no-sniff, HSTS, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('Backend is running... Use Frontend dev server for UI.'));
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server on http://localhost:${PORT}`));
