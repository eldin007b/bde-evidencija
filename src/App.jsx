import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast'; // Fix: Ensure Toaster is imported for App
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import { DriversProvider } from './context/DriversContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';
import { LocalizationProvider } from './context/LocalizationContext/index.jsx';

// Novi auth sistem
import useSimpleAuth from './hooks/useSimpleAuth.js';
import AuthFlowManager from './components/AuthFlowManager.jsx';
import PasswordChangeModal from './components/common/PasswordChangeModal.jsx';
import realtimeService from './services/RealtimeService.js';

// PWA komponente
import PWAInstallPrompt from './components/shared/PWAInstallPrompt.jsx';

// Lazy loading za bolje performanse - komponente se učitavaju tek kad su potrebne
const HomeScreenModern = React.lazy(() => import('./screens/HomeScreenModern.jsx'));
const DeliveriesScreen = React.lazy(() => import('./screens/DeliveriesScreen.jsx'));
const DriversScreen = React.lazy(() => import('./screens/DriversScreen.jsx'));
const ExtraRidesScreen = React.lazy(() => import('./screens/ExtraRidesScreen.jsx'));
const AdminPanelScreen = React.lazy(() => import('./screens/AdminPanelScreen.jsx'));
const PayrollScreen = React.lazy(() => import('./screens/PayrollScreen.jsx'));
const AboutScreen = React.lazy(() => import('./screens/AboutScreenModern.jsx'));
const StatistikaScreen = React.lazy(() => import('./screens/StatistikaScreen.jsx'));
const NavigacijaScreen = React.lazy(() => import('./screens/NavigacijaScreen.jsx'));
const ImenikScreen = React.lazy(() => import('./screens/ImenikScreen.jsx')); // <-- DODANO ZA IMENIK

import UserMenu from './components/UserMenu.jsx';

/**
 * AppContent - Glavni sadržaj aplikacije kada je korisnik ulogovan
 */
function AppContent({ currentUser, logout, changePassword }) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const navigate = useNavigate(); 
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handlePasswordChanged = async (oldPassword, newPassword) => {
    await changePassword(oldPassword, newPassword);
  };

  const handleLogout = async () => {
    if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
      await logout();
      navigate('/login'); 
    }
  };

  // 🔄 Start realtime service kad je korisnik ulogovan
  useEffect(() => {
    if (currentUser) {
      console.log('🚀 Starting realtime service for user:', currentUser.name);
      realtimeService.start();
      
      return () => {
        console.log('🛑 Stopping realtime service');
        realtimeService.stop();
      };
    }
  }, [currentUser]);

  // Provjeri da currentUser postoji prije renderovanja
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={`app-main${isHome ? ' home-fullbleed' : ''}`}>
        <React.Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Učitava se...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomeScreenModern />} />
            <Route path="/statistika" element={<StatistikaScreen />} />
            <Route path="/navigacija" element={<NavigacijaScreen />} />
            <Route path="/deliveries" element={<DeliveriesScreen />} />
            <Route path="/drivers" element={<DriversScreen />} />
            <Route path="/extra-rides" element={<ExtraRidesScreen />} />
            <Route path="/imenik" element={<ImenikScreen />} />
            <Route path="/admin" element={
              currentUser?.role === 'admin' ? <AdminPanelScreen /> : <Navigate to="/" />
            } />
            <Route path="/payroll-list" element={
              currentUser?.role !== 'admin' 
                ? <PayrollScreen user={currentUser} />
                : <Navigate to="/" />
            } />
            <Route path="/about" element={<AboutScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </React.Suspense>
      </main>

        {isChangePasswordOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PasswordChangeModal
              user={currentUser}
              onClose={() => setIsChangePasswordOpen(false)}
              onChangePassword={async (formData) => {
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
  const { currentUser, isAuthenticated, logout, changePassword } = useSimpleAuth();

  return (
    <Router 
      basename="/bde-evidencija"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <LocalizationProvider>
        <UserProvider>
          <DriversProvider>
            <SyncProvider>
              <div className="app">
                {isAuthenticated && currentUser ? (
                  <AppContent 
                    currentUser={currentUser} 
                    logout={logout} 
                    changePassword={changePassword} 
                  />
                ) : (
                  <AuthFlowManager />
                )}
                
                <PWAInstallPrompt />
                
                <Toaster position="top-center" reverseOrder={false} />
              </div>
            </SyncProvider>
          </DriversProvider>
        </UserProvider>
      </LocalizationProvider>
    </Router>
  );
}
