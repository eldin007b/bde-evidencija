import React, { useState } from 'react';
import useSimpleAuth from '../hooks/useSimpleAuth';
import DriverInitScreen from '../screens/DriverInitScreen';
import DriverConfirmScreen from '../screens/DriverConfirmScreen';
import PasswordSetupScreen from '../screens/PasswordSetupScreen';
import LoginScreen from '../screens/LoginScreen';

/**
 * AuthFlowManager - Upravlja cijelim auth procesom
 */
function AuthFlowManager({ onAuthSuccess }) {
  const [currentStep, setCurrentStep] = useState('init'); // 'init', 'confirm', 'setup', 'login'
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  const {
    loading,
    error,
    checkDriverExists,
    setInitialPassword,
    login
  } = useSimpleAuth();

  // Korak 1: Vozač unese turu
  const handleDriverSelected = async (tura) => {
    try {
      const driver = await checkDriverExists(tura);
      setSelectedDriver(driver);
      
      // Debug info removed for production
      
      // Uvijek idi na confirm ekran da pokaže podatke
      setCurrentStep('confirm');
      
    } catch (error) {
      console.error('Driver check failed:', error);
      // Greška će biti prikazana kroz error state u hook-u
    }
  };

  // Korak 2: Potvrdi vozača i nastavi na odgovarajući ekran
  const handleDriverConfirmed = () => {
    if (selectedDriver.hasPassword) {
      // Vozač već ima lozinku, idi na login
      setCurrentStep('login');
    } else {
      // Prvi put, postavi lozinku
      setCurrentStep('setup');
    }
  };

  // Korak 2: Postavljanje početne lozinke
  const handlePasswordSet = async (password, rememberMe = false) => {
    try {
      await setInitialPassword(selectedDriver.id, password);
      
      // Automatski login nakon postavljanja lozinke
  const user = await login(selectedDriver.tura, password);
  console.log('[AuthFlowManager] Login user:', user);
      
      // Ako je "Zapamti me" označeno, produžiti sesiju
      if (rememberMe) {
        localStorage.setItem('bde_remember_me', 'true');
      }
      
      if (user?.name) {
        localStorage.setItem('DRIVER_NAME', user.name);
        if (window.__USER_CONTEXT__?.refreshStatus) window.__USER_CONTEXT__.refreshStatus();
      }
      onAuthSuccess(user);
      
    } catch (error) {
      console.error('Password setup failed:', error);
    }
  };

  // Korak 3: Normalan login sa turom i lozinkom
  const handleLogin = async (tura, password, rememberMe = false) => {
    try {
  const user = await login(tura, password);
  console.log('[AuthFlowManager] Login user:', user);
      
      // Ako je "Zapamti me" označeno, produžiti sesiju
      if (rememberMe) {
        // Možemo dodati logiku za duže čuvanje sesije
        localStorage.setItem('bde_remember_me', 'true');
      }
      
      if (user?.ime) {
        localStorage.setItem('DRIVER_NAME', user.ime);
        if (window.__USER_CONTEXT__?.refreshStatus) window.__USER_CONTEXT__.refreshStatus();
      }
      onAuthSuccess(user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Nazad na početak
  const handleBack = () => {
    setCurrentStep('init');
    setSelectedDriver(null);
  };

  // Nazad na confirm
  const handleBackToConfirm = () => {
    setCurrentStep('confirm');
  };

  if (currentStep === 'init') {
    return (
      <DriverInitScreen
        onDriverSelected={handleDriverSelected}
        loading={loading}
      />
    );
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