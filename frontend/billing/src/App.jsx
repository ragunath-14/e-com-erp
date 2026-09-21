import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { SettingsProvider } from './context/SettingsContext';
import DialogHost from './components/common/DialogHost';
import { isLoggedIn, hasPageAccess, isAdmin, firstAccessiblePagePath } from './utils/auth';

// ── Lazy-loaded pages (only downloaded when visited) ───────────────────────────
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Products       = lazy(() => import('./pages/Products'));
const Billing        = lazy(() => import('./pages/Billing'));
const PendingPayments = lazy(() => import('./pages/PendingPayments'));
const Customers      = lazy(() => import('./pages/Customers'));
const Settings       = lazy(() => import('./pages/Settings'));
const Shop           = lazy(() => import('./pages/Shop'));
const Categories     = lazy(() => import('./pages/Categories'));
const OnlineOrders   = lazy(() => import('./pages/OnlineOrders'));
const OnlineBilling  = lazy(() => import('./pages/OnlineBilling'));
const Users          = lazy(() => import('./pages/Users'));
const UserActivityLog = lazy(() => import('./pages/UserActivityLog'));
const Login          = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
    <div className="spinner-border text-primary" />
  </div>
);

/* Admin routes require a valid (non-expired) session token; otherwise send
   visitors to the public storefront rather than exposing the admin login. */
const ProtectedRoute = ({ children }) => {
  return isLoggedIn() ? children : <Navigate to="/shop" replace />;
};

/* Gates an individual admin page behind the logged-in user's page permissions.
   Admin always passes; staff without the page get sent to their first
   accessible page (never a hardcoded route, to avoid redirect loops for staff
   who don't have dashboard access either). */
const PageRoute = ({ page, adminOnly, children }) => {
  const allowed = adminOnly ? isAdmin() : hasPageAccess(page);
  if (allowed) return children;

  const fallback = firstAccessiblePagePath();
  if (fallback) return <Navigate to={fallback} replace />;
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '60vh' }}>
      <h4 className="fw-bold mb-2">No pages assigned</h4>
      <p className="text-muted">Contact your administrator to get access to a page.</p>
    </div>
  );
};

const NotFound = () => (
  <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '60vh' }}>
    <h1 className="fw-bold display-4 mb-2">404</h1>
    <h5 className="fw-bold mb-2">Page not found</h5>
    <p className="text-muted">The page you are looking for doesn't exist or has moved.</p>
    <Link to={firstAccessiblePagePath() || '/'} className="btn btn-primary rounded-pill px-4">Go to dashboard</Link>
  </div>
);

/* Admin layout wrapper (sidebar + topbar) */
const AdminLayout = ({ sidebarOpen, setSidebarOpen }) => (
  <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
    <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
    <Sidebar onLogoClick={() => setSidebarOpen(false)} />
    <div className="main-area">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="page-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<PageRoute page="dashboard"><Dashboard /></PageRoute>} />
            <Route path="/products"  element={<PageRoute page="products"><Products /></PageRoute>} />
            <Route path="/billing"   element={<PageRoute page="billing"><Billing /></PageRoute>} />
            <Route path="/pending"   element={<PageRoute page="pending"><PendingPayments /></PageRoute>} />
            <Route path="/customers" element={<PageRoute page="customers"><Customers /></PageRoute>} />
            <Route path="/categories" element={<PageRoute page="categories"><Categories /></PageRoute>} />
            <Route path="/orders"     element={<PageRoute page="orders"><OnlineOrders /></PageRoute>} />
            <Route path="/online-billing" element={<PageRoute page="online-billing"><OnlineBilling /></PageRoute>} />
            <Route path="/settings"  element={<PageRoute page="settings"><Settings /></PageRoute>} />
            <Route path="/users"     element={<PageRoute adminOnly><Users /></PageRoute>} />
            <Route path="/users/logs" element={<PageRoute adminOnly><UserActivityLog /></PageRoute>} />
            <Route path="*"          element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  </div>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <SettingsProvider>
      <DialogHost />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public e-commerce storefront (no sidebar/topbar) */}
            <Route path="/shop" element={<Shop />} />
            <Route path="/login" element={<Login />} />

            {/* Admin panel with sidebar layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AdminLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </Router>
    </SettingsProvider>
  );
}

export default App;

