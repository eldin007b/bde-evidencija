import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSimpleAuth from '../hooks/useSimpleAuth';
import DriverInitScreen from '../screens/DriverInitScreen';
import DriverConfirmScreen from '../screens/DriverConfirmScreen';
import PasswordSetupScreen from '../screens/PasswordSetupScreen';
import LoginScreen from '../screens/LoginScreen';
import toast from 'react-hot-toast';

function AuthFlowManager() {
  const [currentStep, setCurrentStep] = useState('init'); 
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false); // Lokalno stanje za loading
  
  const navigate = useNavigate();
  
  const {
    checkDriverExists,
    setInitialPassword,
    login: simpleLogin
  } = useSimpleAuth();

  const handleDriverSelected = async (tura) => {
    console.log('[AuthFlowManager] handleDriverSelected:', tura);
    setLoading(true); // Eksplicitno pokreni loading
    try {
      const driver = await checkDriverExists(tura);
      console.log('[AuthFlowManager] Driver found:', driver);
      setSelectedDriver(driver);
      setCurrentStep('confirm'); // Odmah prebaci korak
    } catch (error) {
      console.error('[AuthFlowManager] Driver check failed:', error);
      toast.error('Greška pri provjeri ture.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverConfirmed = () => {
    console.log('[AuthFlowManager] Driver confirmed, hasPassword:', selectedDriver?.hasPassword);
    if (selectedDriver.hasPassword) {
      setCurrentStep('login');
    } else {
      setCurrentStep('setup');
    }
  };

  const handlePasswordSet = async (password, rememberMe = false) => {
    console.log('[AuthFlowManager] Setting initial password');
    try {
      await setInitialPassword(selectedDriver.id, password);
      await handleLogin(selectedDriver.tura, password, rememberMe);
    } catch (error) {
      console.error('[AuthFlowManager] Password setup failed:', error);
      toast.error('Greška pri postavljanju lozinke.');
    }
  };

  const handleLogin = async (tura, password, rememberMe = false) => {
    console.log('[AuthFlowManager] handleLogin triggered');
    try {
      const user = await simpleLogin(tura, password);
      console.log('[AuthFlowManager] Login uspješan, user:', user);
      
      if (rememberMe) localStorage.setItem('bde_remember_me', 'true');
      if (user?.name || user?.ime) localStorage.setItem('DRIVER_NAME', user.name || user.ime);
      
      // Spašavamo loginTime za sistem prisilne odjave
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Osvježavamo globalni UserContext
      if (window.__USER_CONTEXT__ && typeof window.__USER_CONTEXT__.refreshStatus === 'function') {
        window.__USER_CONTEXT__.refreshStatus();
      }
      
      console.log('[AuthFlowManager] Navigacija počinje...');
      // Forsiraj navigaciju na Home
      navigate('/', { replace: true });
      // Reload za sigurnost ako navigacija ne osvježi stablo
      window.location.reload(); 
      
    } catch (error) {
      console.error('[AuthFlowManager] Login failed:', error);
      toast.error('Pogrešna lozinka ili greška pri prijavi.');
    }
  };

  const handleBack = () => {
    setCurrentStep('init');
    setSelectedDriver(null);
  };

  const handleBackToConfirm = () => {
    setCurrentStep('confirm');
  };

  if (currentStep === 'init') {
    return <DriverInitScreen onDriverSelected={handleDriverSelected} loading={loading} />;
  }

  if (currentStep === 'confirm') {
    return (
      <DriverConfirmScreen
        driver={selectedDriver}
        onContinue={handleDriverConfirmed}
        onLogin={handleLogin}
        onBack={handleBack}
        loading={loading}
      />
    );
  }

  if (currentStep === 'setup') {
    return (
      <PasswordSetupScreen
        driver={selectedDriver}
        onPasswordSet={handlePasswordSet}
        onBack={handleBackToConfirm}
        loading={loading}
      />
    );
  }

  if (currentStep === 'login') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        loading={loading}
        onBack={handleBackToConfirm}
      />
    );
  }

  return null;
}

export default AuthFlowManager;
