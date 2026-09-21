import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URLS } from '../api/config';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getCategoryImage } from '../utils/categoryImages';
import { isLoggedIn } from '../utils/auth';
import './Shop.css';
import {
  Search, Phone, MapPin, Mail, ShoppingBag, ChevronUp,
  Sparkles, X, Package, MessageCircle, Star, Flame, Gift, Zap,
  Plus, Minus, ShoppingCart, Trash2, Send, ChevronRight, ArrowLeft,
  CheckCircle2, Info, Eye, Facebook, Instagram, Twitter, Youtube,
  CreditCard, Truck, ShieldCheck, Heart, Lock, User
} from 'lucide-react';
import { notify } from '../utils/dialogs';

/* ── Motion presets ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

const SHOP_API = API_URLS.BASE.replace('/api', '/api/shop');

// Number the floating WhatsApp chat button messages (+91 80989 67376).
const WHATSAPP_NUMBER = '918098967376';

/* rAF-throttled 3D tilt: caps state updates to once per frame instead of once per raw mousemove event */
const useTilt = (maxX = 16, maxY = 18) => {
  const ref = useRef(null);
  const rafId = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    if (rafId.current) return;
    const { clientX, clientY } = e;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -maxX, y: px * maxY });
    });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return { ref, tilt, handleMove, resetTilt };
};

/* ── Navbar ─── */
const ShopNavbar = ({ shopInfo, cartCount, onOpenCart, onScrollToProducts, onAdminClick }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sn-header">
      <div className="sn-topbar">
        <div className="sn-topbar-inner">
          <span className="sn-topbar-item">
            <Phone size={13} /> {shopInfo.phone || '+91 98765 43210'}
          </span>
          <span className="sn-topbar-item">
            <Mail size={13} /> {shopInfo.email || 'contact@sivakasicrackers.com'}
          </span>
          <span className="sn-topbar-item sn-hide-mobile">
            <MapPin size={13} /> Factory Outlet: Sivakasi, TN
          </span>
        </div>
      </div>
      <nav className={`sn-navbar ${scrolled ? 'sn-navbar-scrolled' : ''}`}>
        <div className="sn-navbar-inner">
          <div className="sn-brand" onClick={() => window.scrollTo({top:0, behavior:'smooth'})} style={{cursor:'pointer'}}>
            <span className="sn-brand-icon">🧨</span>
            <div className="sn-brand-text-group">
              <span className="sn-brand-text">{shopInfo.shopName || 'Sri Saravana Crackers'}</span>
              <span className="sn-brand-sub">Sivakasi's No.1 Online Store</span>
            </div>
          </div>
          <div className="sn-nav-links">
            <a href="#hero" className="sn-nav-link">Home</a>
            <a href="#categories" className="sn-nav-link" onClick={onScrollToProducts}>Booking</a>
            <div className="sn-nav-cart" onClick={onOpenCart}>
              <ShoppingCart size={22} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    className="sn-cart-badge"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <button className="sn-nav-admin-btn" onClick={onAdminClick}>
              <Lock size={16} /> <span className="sn-hide-mobile">Admin</span>
            </button>
            <a href={`tel:${shopInfo.phone || '+919876543210'}`} className="sn-nav-cta">
              <Phone size={14} /> Call & Order
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

/* ── 3D Showcase (pure CSS 3D transforms: perspective + rotateX/Y/Z + translateZ) ─── */
const Hero3DShowcase = () => {
  const { ref, tilt, handleMove, resetTilt } = useTilt(16, 18);

  return (
    <div
      className="sn-hero-3d-wrap"
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={resetTilt}
    >
      <div className="sn-hero-3d-glow" />
      <div className="sn-hero-3d-ring" />
      <div className="sn-hero-3d-ring ring2" />

      <div
        className="sn-hero-3d-tilt"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="sn-hero-3d-cube">
          <div className="sn-cube-face sn-face-front">🎆</div>
          <div className="sn-cube-face sn-face-back">🧨</div>
          <div className="sn-cube-face sn-face-right">✨</div>
          <div className="sn-cube-face sn-face-left">🎇</div>
          <div className="sn-cube-face sn-face-top">🎁</div>
          <div className="sn-cube-face sn-face-bottom">⭐</div>
        </div>
      </div>

      <div className="sn-float-particle p1"><Sparkles size={22} /></div>
      <div className="sn-float-particle p2"><Star size={16} /></div>
      <div className="sn-float-particle p3"><Zap size={18} /></div>
      <div className="sn-float-particle p4"><Gift size={20} /></div>
      <div className="sn-float-particle p5"><Flame size={16} /></div>
    </div>
  );
};

/* ── Hero Banner ─── */
const HeroBanner = ({ shopInfo, totalProducts, categories }) => (
  <section className="sn-hero" id="hero">
    <div className="sn-hero-overlay"></div>
    <div className="sn-hero-sparkle-field">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="sn-sparkle-dot" style={{
          left: `${(i * 37) % 100}%`,
          top: `${(i * 53) % 100}%`,
          animationDelay: `${(i % 6) * 0.6}s`,
          animationDuration: `${3 + (i % 4)}s`
        }} />
      ))}
    </div>
    <div className="sn-hero-grid">
      <motion.div
        className="sn-hero-content"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="sn-hero-badge"><Sparkles size={14} /> {new Date().getFullYear()} Diwali Booking is Open!</motion.div>
        <motion.h1 variants={fadeUp} className="sn-hero-title">
          The Best Crackers <br /> <span>At Lowest Factory Price</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="sn-hero-desc">
          Order premium quality fireworks directly from Sivakasi factory.
          Guaranteed quality and wholesale pricing for your family celebrations.
        </motion.p>
        <motion.div variants={fadeUp} className="sn-hero-ctas">
          <a href="#categories" className="sn-hero-btn sn-hero-btn-primary">
            <ShoppingBag size={18} /> Shop Products
          </a>
        </motion.div>
        <motion.div variants={fadeUp} className="sn-hero-trust">
          <div className="sn-trust-item"><Flame size={16} /> Eco-Friendly</div>
          <div className="sn-trust-item"><Zap size={16} /> Fast Delivery</div>
          <div className="sn-trust-item"><Star size={16} /> 25+ Years Trust</div>
        </motion.div>
      </motion.div>

      <motion.div
        className="sn-hero-visual"
        initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        <Hero3DShowcase />
      </motion.div>
    </div>
  </section>
);

/* ── Category Sidebar Filter ─── */
const CategorySidebar = ({ categories, active, onChange, totalCount }) => (
  <motion.aside
    className="sn-sidebar"
    id="categories"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.3 }}
    variants={staggerContainer}
  >
    <motion.h3 variants={fadeUp} className="sn-sidebar-title">Select Category</motion.h3>
    <motion.button
      variants={fadeUp}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      className={`sn-cat-btn ${active === 'All' ? 'active' : ''}`}
      onClick={() => onChange('All')}
    >
      <span>All Crackers</span>
      <span className="sn-cat-count">{totalCount}</span>
    </motion.button>
    {categories.map(c => (
      <motion.button
        variants={fadeUp}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.97 }}
        key={c.name}
        className={`sn-cat-btn ${active === c.name ? 'active' : ''}`}
        onClick={() => onChange(c.name)}
      >
        <span>{getCategoryIcon(c.name, categories)} {c.name}</span>
        <span className="sn-cat-count">{c.count}</span>
      </motion.button>
    ))}
  </motion.aside>
);

/* ── Amazon Style Product Card ─── */
const ProductCard = ({ product, cartItem, onUpdateCart, categories, onInfoClick }) => {
  const hasDiscount = product.hasOffer && product.discountValue > 0;
  const savings = hasDiscount ? (product.sellingPrice - product.finalPrice) : 0;
  const discountPct = hasDiscount ? Math.round((savings / product.sellingPrice) * 100) : 0;
  const { ref: cardRef, tilt: cardTilt, handleMove: handleCardMove, resetTilt: resetCardTilt } = useTilt(6, 6);

  const categoryIcon = useMemo(() => getCategoryIcon(product.category, categories), [categories, product.category]);
  const displayImage = product.imageUrl || getCategoryImage(product.category);

  const handleQtyChange = (val) => {
    const newQty = Math.max(0, val);
    onUpdateCart(product, newQty);
  };

  return (
    <motion.div
      ref={cardRef}
      className="sn-product-card-premium"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      onMouseMove={handleCardMove}
      onMouseLeave={resetCardTilt}
      style={{ rotateX: cardTilt.x, rotateY: cardTilt.y, transformPerspective: 900 }}
    >
      {hasDiscount && (
        <div className="sn-badge-discount">
          <Zap size={10} fill="currentColor" /> {discountPct}% OFF
        </div>
      )}
      
      <div className="sn-card-top">
        <div className="sn-category-tag">
          {categoryIcon} {product.category}
        </div>
        <div className="sn-card-img-container">
          {displayImage ? (
            <img src={displayImage} alt={product.name} className="sn-product-img" loading="lazy" decoding="async" />
          ) : (
            <div className="sn-placeholder-img">
              <span className="sn-emoji-large">{categoryIcon}</span>
              <div className="sn-img-pattern" />
            </div>
          )}
          {product.category === 'Gift Boxes' && onInfoClick && (
            <button
              type="button"
              className="sn-info-btn"
              onClick={(e) => { e.stopPropagation(); onInfoClick(product); }}
              aria-label={`View contents of ${product.name}`}
            >
              <Info size={14} /> Info
            </button>
          )}
        </div>
      </div>

      <div className="sn-card-body">
        <div className="sn-brand-line">
          <span className="sn-brand-name">{product.brand || 'Premium Quality'}</span>
          <div className="sn-rating">
            <Star size={10} fill="#fbbf24" color="#fbbf24" />
            <span>4.8</span>
          </div>
        </div>

        <h4 className="sn-product-title">{product.name}</h4>
        <div className="sn-product-meta">
          <span className="sn-unit-chip">{product.unit || '1 Box'}</span>
        </div>

        <div className="sn-price-container">
          <div className="sn-price-main">
            <span className="sn-currency">₹</span>
            <span className="sn-amount">{product.finalPrice.toFixed(0)}</span>
          </div>
          {hasDiscount && (
            <div className="sn-price-strike">
              <span className="sn-mrp">₹{product.sellingPrice.toFixed(0)}</span>
            </div>
          )}
        </div>

        <div className="sn-card-footer">
          {cartItem ? (
            <div className="sn-qty-widget">
              <button onClick={() => handleQtyChange(cartItem.qty - 1)}><Minus size={12} /></button>
              <span className="sn-qty-val">{cartItem.qty}</span>
              <button onClick={() => handleQtyChange(cartItem.qty + 1)}><Plus size={12} /></button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="sn-btn-add-premium"
              onClick={() => handleQtyChange(1)}
            >
              <Plus size={14} /> Add to Basket
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Gift Hampers Showcase (shown separately from the main catalog grid) ─── */
const GiftHampersSection = ({ giftBoxes, cart, onUpdateCart, categories, onInfoClick }) => {
  if (!giftBoxes.length) return null;
  return (
    <motion.section
      className="sn-gift-section"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={staggerContainer}
    >
      <div className="sn-gift-section-inner">
        <motion.div variants={fadeUp} className="sn-gift-heading">
          <h3><Gift size={22} /> Gift Hampers &amp; Combo Boxes</h3>
          <p>Ready-made assortments at a special bundle price — click Info to see what's inside.</p>
        </motion.div>
        <div className="sn-gift-scroll-row">
          {giftBoxes.map(product => (
            <div className="sn-gift-scroll-item" key={product._id}>
              <ProductCard
                product={product}
                cartItem={cart.find(item => item._id === product._id)}
                onUpdateCart={onUpdateCart}
                categories={categories}
                onInfoClick={onInfoClick}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

/* ── Gift Box Info Modal (lists everything inside the box) ─── */
const GiftBoxInfoModal = ({ product, onClose, onUpdateCart, cartItem }) => {
  if (!product) return null;
  const hasDiscount = product.hasOffer && product.discountValue > 0;
  const contents = product.boxContents || [];

  return (
    <div className="sn-modal-overlay-checkout" onClick={onClose}>
      <div className="sn-modal-content-checkout" onClick={e => e.stopPropagation()}>
        <div className="sn-modal-header-checkout">
          <h3><Gift size={18} /> {product.name}</h3>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="sn-gift-info-body">
          <div className="sn-gift-info-price">
            <span className="sn-currency">₹</span>
            <span className="sn-amount">{product.finalPrice.toFixed(0)}</span>
            {hasDiscount && <span className="sn-mrp">₹{product.sellingPrice.toFixed(0)}</span>}
          </div>

          <h5 className="sn-gift-info-subhead">What's Inside</h5>
          {contents.length > 0 ? (
            <ul className="sn-gift-contents-list">
              {contents.map((item, idx) => <li key={idx}><CheckCircle2 size={14} /> {item}</li>)}
            </ul>
          ) : (
            <p className="sn-gift-contents-empty">Contents list not available for this box yet — please contact us for details.</p>
          )}

          <button
            type="button"
            className="sn-gift-add-btn"
            onClick={() => { onUpdateCart(product, (cartItem?.qty || 0) + 1); onClose(); }}
          >
            {cartItem ? `In Basket (${cartItem.qty}) — Add One More` : 'Add to Basket'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Premium Cart Drawer ─── */
const CartDrawer = ({ isOpen, onClose, cart, onUpdateCart, onCheckout, categories }) => {
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.finalPrice * item.qty), 0);
  const totalOriginal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.qty), 0);
  const totalSavings = totalOriginal - totalPrice;
  const minOrder = 1500;
  const progress = Math.min((totalPrice / minOrder) * 100, 100);
  const remaining = Math.max(minOrder - totalPrice, 0);

  return (
    <>
      <div className={`sn-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`sn-cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="sn-drawer-header">
          <div className="sn-drawer-title"><ShoppingCart size={22} /><div className="sn-drawer-title-stack"><span>My Basket</span><span className="sn-drawer-subtitle">{totalItems} Items</span></div></div>
          <button className="sn-drawer-close" onClick={onClose}><X size={24} /></button>
        </div>
        {cart.length > 0 && (
          <div className="sn-cart-progress-area">
            <div className="sn-progress-info">
              {remaining > 0 ? <span>Add <strong>₹{remaining.toFixed(0)}</strong> for delivery</span> : <span className="sn-success-msg"><CheckCircle2 size={14} /> Min. order reached!</span>}
              <span className="sn-progress-pct">{progress.toFixed(0)}%</span>
            </div>
            <div className="sn-progress-bar-bg"><div className="sn-progress-bar-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        <div className="sn-drawer-body">
          {cart.length === 0 ? <div className="sn-drawer-empty"><h3>Basket is empty</h3><button className="sn-drawer-shop-btn" onClick={onClose}>Shop Now</button></div> : (
            <div className="sn-cart-items-list-premium">
              {cart.map(item => (
                <div key={item._id} className="sn-cart-item-card-premium">
                  <div className="sn-cart-item-img-premium">{(item.imageUrl || getCategoryImage(item.category)) ? <img src={item.imageUrl || getCategoryImage(item.category)} alt={item.name} /> : <span>{getCategoryIcon(item.category, categories)}</span>}</div>
                  <div className="sn-cart-item-main">
                    <div className="sn-cart-item-header"><span className="sn-item-name">{item.name}</span><button className="sn-item-remove-btn" onClick={() => onUpdateCart(item, 0)}><X size={14} /></button></div>
                    <div className="sn-cart-item-footer">
                      <div className="sn-price-row"><span className="sn-price-final">₹{item.finalPrice.toFixed(0)}</span></div>
                      <div className="sn-qty-control-premium"><button onClick={() => onUpdateCart(item, item.qty - 1)}><Minus size={10} /></button><span>{item.qty}</span><button onClick={() => onUpdateCart(item, item.qty + 1)}><Plus size={10} /></button></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="sn-drawer-footer-premium">
            <div className="sn-footer-summary-premium"><div className="sn-sum-row sn-sum-grand"><span>Grand Total</span><span>₹{totalPrice.toFixed(0)}</span></div></div>
            <button className={`sn-drawer-checkout-btn-premium ${remaining > 0 ? 'disabled' : ''}`} onClick={onCheckout} disabled={remaining > 0}>{remaining > 0 ? `Add ₹${remaining.toFixed(0)} More` : 'Proceed to Checkout'}</button>
          </div>
        )}
      </div>
    </>
  );
};

/* ── Premium Footer ─── */
const ShopFooter = ({ shopInfo, categories, onAdminClick }) => (
  <footer className="sn-premium-footer">
    <motion.div
      className="sn-footer-top"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      <div className="sn-footer-container"><div className="sn-footer-grid">
        <motion.div variants={fadeUp} className="sn-footer-col"><h3>{shopInfo.shopName}</h3><p>Trusted fireworks since 1998.</p></motion.div>
        <motion.div variants={fadeUp} className="sn-footer-col"><h4>Quick Links</h4><ul className="sn-footer-links"><li><a href="#hero">Home</a></li><li onClick={onAdminClick} style={{cursor:'pointer'}}>Admin Portal</li></ul></motion.div>
        <motion.div variants={fadeUp} className="sn-footer-col"><h4>Contact</h4><p>{shopInfo.phone}<br/>{shopInfo.email}</p></motion.div>
      </div></div>
    </motion.div>
    <div className="sn-footer-bottom"><div className="sn-footer-container"><p>© {new Date().getFullYear()} {shopInfo.shopName}. All Rights Reserved.</p></div></div>
  </footer>
);

/* ── Floating Action Buttons (WhatsApp + Back to top) ─── */
const FloatingActions = ({ showBackToTop, onBackToTop }) => (
  <>
    <motion.a
      className="sn-whatsapp-fab"
      href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent('Hi, I have a question about your crackers.')}`}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
    >
      <MessageCircle size={26} />
    </motion.a>
    <AnimatePresence>
      {showBackToTop && (
        <motion.button
          className="sn-back-top"
          onClick={onBackToTop}
          initial={{ scale: 0, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ChevronUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  </>
);

/* ── Main Shop Component ─── */
const Shop = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopInfo, setShopInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [infoProduct, setInfoProduct] = useState(null);
  const onAdminClick = () => {
    navigate(isLoggedIn() ? '/' : '/login');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // For single-time authorization feel, we redirect to login page
    // where they can enter credentials once.
    navigate('/login');
  };

  useEffect(() => {
    axios.get(`${SHOP_API}/categories`).then(r => setCategories(r.data)).catch(() => {});
    axios.get(`${SHOP_API}/info`).then(r => setShopInfo(r.data)).catch(() => {});
    setLoading(true);
    axios.get(`${SHOP_API}/products`, { params: { limit: 1000 } }).then(r => setProducts(r.data.products)).catch(() => {}).finally(() => setLoading(false));
    const savedCart = localStorage.getItem('cracker_cart');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch (e) {}
  }, []);

  useEffect(() => { localStorage.setItem('cracker_cart', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const giftBoxes = useMemo(() => products.filter(p => p.category === 'Gift Boxes'), [products]);
  const updateCart = (p, q) => setCart(prev => { if (q === 0) return prev.filter(i => i._id !== p._id); const ex = prev.find(i => i._id === p._id); if (ex) return prev.map(i => i._id === p._id ? { ...i, qty: q } : i); return [...prev, { ...p, qty: q }]; });

  const submitOrder = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const orderData = {
        customer: customerInfo,
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          qty: item.qty,
          price: item.finalPrice,
          total: item.qty * item.finalPrice
        })),
        totalAmount: cart.reduce((acc, item) => acc + (item.qty * item.finalPrice), 0),
        source: 'Online Store'
      };

      // 1. Save to database
      const res = await axios.post(`${API_URLS.BASE}/orders`, orderData);
      const savedOrder = res.data;

      setCart([]);
      setShowCheckoutModal(false);
      setCompletedOrderId(savedOrder.orderId);
    } catch (err) {
      notify('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sn-shop-page">
      <ShopNavbar shopInfo={shopInfo} cartCount={cart.reduce((a, b) => a + b.qty, 0)} onOpenCart={() => setIsCartOpen(true)} onAdminClick={onAdminClick} />
      <HeroBanner shopInfo={shopInfo} totalProducts={categories.reduce((a,c)=>a+c.count, 0)} categories={categories.length} />
      <div className="sn-notice-bar"><Sparkles size={16} /><span>Diwali Sale Live! Factory wholesale rates. Min order ₹1500.</span></div>
      <GiftHampersSection giftBoxes={giftBoxes} cart={cart} onUpdateCart={updateCart} categories={categories} onInfoClick={setInfoProduct} />
      <div className="sn-main-layout">
        <CategorySidebar categories={categories} active={activeCategory} onChange={(cat) => { setActiveCategory(cat); window.scrollTo({ top: 400, behavior: 'smooth' }); }} totalCount={categories.reduce((a,c)=>a+c.count,0)} />
        <main className="sn-products-area">
          <div className="sn-search-bar"><Search size={18} /><input type="text" placeholder="Search crackers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="sn-search-input" />{searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}<div className="sn-search-count">{filteredProducts.length} Results</div></div>
          {loading ? <div className="sn-loading"><p>Syncing Catalog...</p></div> : (
            <div className="sn-products-grid">{filteredProducts.map(product => <ProductCard key={product._id} product={product} cartItem={cart.find(item => item._id === product._id)} onUpdateCart={updateCart} categories={categories} onInfoClick={setInfoProduct} />)}</div>
          )}
        </main>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} onUpdateCart={(p, q) => setCart(prev => { if (q===0) return prev.filter(i=>i._id!==p._id); return prev.map(i=>i._id===p._id?{...i, qty:q}:i); })} onCheckout={() => { if(cart.reduce((a,b)=>a+(b.qty*b.finalPrice),0) < 1500) notify('Min order ₹1500'); else { setIsCartOpen(false); setShowCheckoutModal(true); } }} categories={categories} />
      <GiftBoxInfoModal
        product={infoProduct}
        cartItem={infoProduct ? cart.find(item => item._id === infoProduct._id) : null}
        onUpdateCart={updateCart}
        onClose={() => setInfoProduct(null)}
      />
      {showCheckoutModal && (
        <div className="sn-modal-overlay-checkout"><div className="sn-modal-content-checkout"><div className="sn-modal-header-checkout"><h3>Delivery Details</h3><button className="btn-close" onClick={() => setShowCheckoutModal(false)} /></div>
        <form onSubmit={submitOrder} className="sn-checkout-form-checkout">
          <div className="sn-form-group-checkout"><label>Name</label><input required className="form-control" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} /></div>
          <div className="sn-form-group-checkout"><label>Phone</label><input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} title="Enter a 10-digit mobile number" className="form-control" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)})} /></div>
          <div className="sn-form-group-checkout"><label>Address</label><textarea required className="form-control" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} /></div>
          <button type="submit" className="sn-place-order-final-btn" disabled={submitting}>{submitting ? 'Placing Order...' : 'Place Order'}</button>
        </form></div></div>
      )}

      {completedOrderId && (
        <div className="sn-modal-overlay-checkout"><div className="sn-modal-content-checkout" style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ padding: '40px 30px' }}>
            <CheckCircle2 size={64} color="#16a34a" />
            <h3 style={{ margin: '16px 0 6px', fontWeight: 800 }}>Order Completed</h3>
            <p style={{ margin: 0, color: '#475569' }}>Your order has been placed successfully.</p>
            <p style={{ margin: '10px 0 22px', fontWeight: 700 }}>Order ID: {completedOrderId}</p>
            <button type="button" className="sn-place-order-final-btn" onClick={() => setCompletedOrderId(null)}>Close</button>
          </div>
        </div></div>
      )}

      <ShopFooter shopInfo={shopInfo} categories={categories} onAdminClick={onAdminClick} />
      <FloatingActions showBackToTop={showBackToTop} onBackToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
};

export default Shop;
