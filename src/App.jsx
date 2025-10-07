import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import { DriversProvider } from './context/DriversContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';
import { LocalizationProvider } from './context/LocalizationContext/index.jsx';

// Novi auth sistem
import useSimpleAuth from './hooks/useSimpleAuth.js';
import AuthFlowManager from './components/AuthFlowManager.jsx';
import UserMenu from './components/UserMenu.jsx';
import PasswordChangeModal from './components/common/PasswordChangeModal.jsx';

// Postojeći ekrani
import DeliveriesScreen from './screens/DeliveriesScreen.jsx';
import DriversScreen from './screens/DriversScreen.jsx';
import ExtraRidesScreen from './screens/ExtraRidesScreen.jsx';
import AdminPanelScreen from './screens/AdminPanelScreen.jsx';
import PayrollScreen from './screens/PayrollScreen.jsx';
import AboutScreen from './screens/AboutScreenModern.jsx';
import HomeScreenModern from './screens/HomeScreenModern.jsx';

import './App.css';

/**
 * AppHeader - Header s navigacijom i user menu
 */
function AppHeader({ user, onChangePassword, onLogout }) {
  // Prikaz verzije/timestamp u headeru
  const buildTimestamp = document.querySelector('meta[name="build-timestamp"]')?.content || '';
  const appVersion = 'v4.0.0';
  const versionInfo = `${appVersion} | Build: ${buildTimestamp}`;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenHomeSidebar = () => {
    // Ako nismo na home, idi na home pa togglaj sidebar kratko nakon navigacije
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('homeSidebarToggle')); } catch (e) {}
      }, 80);
    } else {
      try { window.dispatchEvent(new CustomEvent('homeSidebarToggle')); } catch (e) {}
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    const cls = 'no-scroll-mobile-menu';
    if (mobileMenuOpen) {
      document.body.classList.add(cls);
    } else {
      document.body.classList.remove(cls);
    }
    return () => document.body.classList.remove(cls);
  }, [mobileMenuOpen]);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="app-logo">
          {/* Mobile: hamburger left */}
          <button
            className="mobile-nav-trigger"
            aria-label="Otvori meni"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link to="/" className="logo-link">
            <h1>B&D Evidencija</h1>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link to="/deliveries">
            <span className="nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5"></path>
                <path d="M8 3H3v5"></path>
                <path d="M12 22v-8.3a4 4 0 0 0-4-4H3"></path>
                <path d="M3 9a9 9 0 0 1 9 9"></path>
              </svg>
            </span>
            <span>Dostave</span>
          </Link>
          <Link to="/drivers">
            <span className="nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <span>Vozači</span>
          </Link>
          <Link to="/extra-rides">
            <span className="nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path>
              </svg>
            </span>
            <span>Extra vožnje</span>
          </Link>
          <Link to="/about">
            <span className="nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </span>
            <span>O aplikaciji</span>
          </Link>
        </nav>

        {/* Mobile: center trigger to open Home sidebar */}
        <button
          className="mobile-center-trigger"
          aria-label="Prebaci Sidebar/Mapa"
          onClick={handleOpenHomeSidebar}
        >
          <svg width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Sidebar panel (lijevo) */}
            <rect x="2" y="3" width="24" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"></rect>
            <line x1="5" y1="7" x2="20" y2="7" strokeWidth="1.5"></line>
            <line x1="5" y1="10" x2="16" y2="10" strokeWidth="1.5"></line>
            <line x1="5" y1="13" x2="18" y2="13" strokeWidth="1.5"></line>
            <line x1="5" y1="16" x2="14" y2="16" strokeWidth="1.5"></line>
            
            {/* Switch slider u sredini */}
            <rect x="28" y="8" width="24" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"></rect>
            <circle cx="33" cy="12" r="2.5" fill="currentColor" opacity="0.8">
              <animate attributeName="cx" values="33;47;33" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text x="40" y="6" fontSize="4" fill="currentColor" opacity="0.7" textAnchor="middle">TOGGLE</text>
            
            {/* Mapa panel (desno) */}
            <rect x="34" y="3" width="24" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"></rect>
            <path d="M38 8 L42 12 L46 8 L50 12 L54 8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7"></path>
            <circle cx="45" cy="10" r="2" fill="currentColor" opacity="0.9"></circle>
            <path d="M41 16 L43 14 L45 16 L47 14 L49 16" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"></path>
            <circle cx="50" cy="15" r="1" fill="currentColor" opacity="0.6"></circle>
            
            {/* Strelice koje pokazuju smjer */}
            <path d="M26 6 L30 9 L26 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M54 6 L50 9 L54 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/>
            </path>
          </svg>
        </button>

        <UserMenu 
          user={user}
          onChangePassword={onChangePassword}
          onLogout={onLogout}
        />
      </div>

      {/* Mobile dropdown menu (screens) */}
      {mobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          <button className="mobile-menu-item" onClick={() => { navigate('/'); closeMobileMenu(); }}>
            <span className="mmi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
            </span>
            Početna
          </button>
          <button className="mobile-menu-item" onClick={() => { navigate('/deliveries'); closeMobileMenu(); }}>
            <span className="mmi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5"></path>
                <path d="M8 3H3v5"></path>
                <path d="M12 22v-8.3a4 4 0 0 0-4-4H3"></path>
                <path d="M3 9a9 9 0 0 1 9 9"></path>
              </svg>
            </span>
            Dostave
          </button>
          <button className="mobile-menu-item" onClick={() => { navigate('/drivers'); closeMobileMenu(); }}>
            <span className="mmi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            Vozači
          </button>
          <button className="mobile-menu-item" onClick={() => { navigate('/extra-rides'); closeMobileMenu(); }}>
            <span className="mmi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5"></path>
              </svg>
            </span>
            Extra vožnje
          </button>
          {user.role === 'admin' && (
            <button className="mobile-menu-item" onClick={() => { navigate('/admin'); closeMobileMenu(); }}>
              <span className="mmi-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              Admin
            </button>
          )}
          <button className="mobile-menu-item" onClick={() => { navigate('/about'); closeMobileMenu(); }}>
            <span className="mmi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </span>
            O aplikaciji
          </button>
        </div>
      )}
    </header>
  );
}

/**
 * AppContent - Glavni sadržaj aplikacije kada je korisnik ulogovan
 */
function AppContent({ onLogout }) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { currentUser, changePassword, logout, loading } = useSimpleAuth();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handlePasswordChanged = async (oldPassword, newPassword) => {
    await changePassword(oldPassword, newPassword);
  };

  const handleLogout = () => {
    if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
      logout();
      onLogout && onLogout(); // Pozovi callback iz glavni App komponente
    }
  };

  // Provjeri da currentUser postoji prije renderovanja
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-content">
      <AppHeader 
        user={currentUser}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
      />

      <main className={`app-main${isHome ? ' home-fullbleed' : ''}`}>
        <Routes>
          <Route path="/" element={<HomeScreenModern />} />
          <Route path="/deliveries" element={<DeliveriesScreen />} />
          <Route path="/drivers" element={<DriversScreen />} />
          <Route path="/extra-rides" element={<ExtraRidesScreen />} />
          <Route path="/admin" element={
            currentUser?.role === 'admin' ? <AdminPanelScreen /> : <Navigate to="/" />
          } />
          <Route path="/payroll" element={
            currentUser?.role !== 'admin' 
              ? <PayrollScreen user={currentUser} />
              : <Navigate to="/" />
          } />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {isChangePasswordOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <PasswordChangeModal
            onClose={() => setIsChangePasswordOpen(false)}
            onSubmit={async (formData) => {
              await handlePasswordChanged(formData.oldPassword, formData.newPassword);
              setIsChangePasswordOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Glavni App component
 */
export default function App() {
  const { currentUser, isAuthenticated } = useSimpleAuth();
  const [authCompleted, setAuthCompleted] = useState(false);
  const [logoutCompleted, setLogoutCompleted] = useState(false);

  const handleAuthSuccess = (user) => {
    setAuthCompleted(true);
    setLogoutCompleted(false); // Reset logout flag kada se login
    // currentUser će biti automatski ažuriran kroz hook
  };

  const handleLogout = () => {
    setLogoutCompleted(true);
    setAuthCompleted(false); // Reset auth flag kada se logout
  };

  // Reset authCompleted ako se user logout-uje
  useEffect(() => {
    if (!currentUser && !isAuthenticated) {
      setAuthCompleted(false);
    }
    // Reset logoutCompleted ako se user login-uje
    if (currentUser && isAuthenticated) {
      setLogoutCompleted(false);
    }
  }, [currentUser, isAuthenticated]);

  return (
    <Router basename="/bde-evidencija">
      <LocalizationProvider>
        <UserProvider>
          <DriversProvider>
            <SyncProvider>
              <div className="app">
                {(isAuthenticated || authCompleted) && !logoutCompleted ? (
                  <AppContent onLogout={handleLogout} />
                ) : (
                  <AuthFlowManager onAuthSuccess={handleAuthSuccess} />
                )}
              </div>
            </SyncProvider>
          </DriversProvider>
        </UserProvider>
      </LocalizationProvider>
    </Router>
  );
}