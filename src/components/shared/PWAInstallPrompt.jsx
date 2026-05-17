/**
 * 📱 PWA Install Prompt Component
 * Prikazuje prompt za instalaciju aplikacije kada je dostupan
 */

import React, { useState, useEffect } from 'react';
import { usePWA } from '../../services/PWAService';
import styles from './PWAInstallPrompt.module.css';

const PWAInstallPrompt = () => {
  const { installInfo, showInstallPrompt } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Proverava li je prompt dismissed u sesiji
    const dismissedInSession = sessionStorage.getItem('pwa_install_dismissed');
    if (dismissedInSession) {
      setDismissed(true);
      return;
    }

    // Show prompt if app can be installed and not already dismissed
    if (installInfo.canInstall && !installInfo.isInstalled && !dismissed) {
      // Delay showing prompt for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [installInfo.canInstall, installInfo.isInstalled, dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    
    try {
      const accepted = await showInstallPrompt();
      if (accepted) {
        setShowPrompt(false);
      } else {
        handleDismiss();
      }
    } catch (error) {
      console.error('Install error:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  // iOS specific install instructions
  const IOSInstallInstructions = () => (
    <div className={styles.iosInstructions}>
      <div className={styles.instructionHeader}>
        <div className={styles.iosIcon}>📱</div>
        <h3>Dodaj na početni ekran</h3>
      </div>
      <div className={styles.instructionSteps}>
        <div className={styles.step}>
          <span className={styles.stepNumber}>1</span>
          <span>Pritisni dugme za Share</span>
          <div className={styles.shareIcon}>📤</div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>2</span>
          <span>Odaberi "Add to Home Screen"</span>
          <div className={styles.addIcon}>➕</div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>3</span>
          <span>Pritisni "Add"</span>
        </div>
      </div>
      <button className={styles.dismissBtn} onClick={handleDismiss}>
        Razumem
      </button>
    </div>
  );

  // Standard install prompt
  if (showPrompt && !dismissed) {
    return (
      <div className={styles.overlay}>
        <div className={styles.prompt}>
          {installInfo.shouldShowIOSInstructions ? (
            <IOSInstallInstructions />
          ) : (
            <>
              <div className={styles.header}>
                <div className={styles.icon}>🚀</div>
                <div className={styles.title}>
                  <h3>Instaliraj BDE Evidenciju</h3>
                  <p>Brži pristup i bolje performanse</p>
                </div>
                <button className={styles.closeBtn} onClick={handleDismiss}>
                  ✕
                </button>
              </div>
              
              <div className={styles.benefits}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>⚡</span>
                  <span>Brže učitavanje</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>📱</span>
                  <span>Radi offline</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🔔</span>
                  <span>Push notifikacije</span>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🏠</span>
                  <span>Početni ekran</span>
                </div>
              </div>
              
              <div className={styles.actions}>
                <button 
                  className={styles.installBtn} 
                  onClick={handleInstall}
                  disabled={installing}
                >
                  {installing ? (
                    <>
                      <span className={styles.spinner}></span>
                      Instaliranje...
                    </>
                  ) : (
                    <>
                      <span>📥</span>
                      Instaliraj aplikaciju
                    </>
                  )}
                </button>
                <button className={styles.laterBtn} onClick={handleDismiss}>
                  Možda kasnije
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallPrompt;