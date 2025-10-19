// Provjeri PWA status i background notification mogućnosti
export const checkPWAAndBackgroundSupport = async () => {
  console.log('📱 === PWA I BACKGROUND SUPPORT ===');
  
  const results = {
    pwa: {
      standalone: false,
      installable: false,
      installed: false
    },
    permissions: {
      notifications: 'default',
      backgroundSync: false,
      persistentNotification: false
    },
    browser: {
      name: '',
      backgroundAppsSupport: false
    },
    recommendations: []
  };
  
  try {
    // 1. PWA Status
    console.log('🔍 Provjera PWA statusa...');
    
    // Da li je app pokrenut kao standalone PWA
    results.pwa.standalone = window.matchMedia('(display-mode: standalone)').matches || 
                              window.navigator.standalone === true;
    
    // Da li je PWA instaliran (heuristics)
    results.pwa.installed = results.pwa.standalone || 
                            document.referrer.includes('android-app://');
    
    // Da li se može instalirati (beforeinstallprompt event)
    results.pwa.installable = window.deferredPrompt !== undefined;
    
    console.log('📱 PWA Status:', results.pwa);
    
    // 2. Notification Permissions
    console.log('🔒 Provjera dozvola...');
    
    if ('Notification' in window) {
      results.permissions.notifications = Notification.permission;
    }
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      results.permissions.persistentNotification = 'showNotification' in registration;
    }
    
    // Background Sync check
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      results.permissions.backgroundSync = true;
    }
    
    console.log('🔒 Permissions:', results.permissions);
    
    // 3. Browser Info
    console.log('🌐 Analiza browser-a...');
    
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) {
      results.browser.name = 'Chrome';
      results.browser.backgroundAppsSupport = true; // Chrome ima background apps
    } else if (userAgent.includes('Firefox')) {
      results.browser.name = 'Firefox';
      results.browser.backgroundAppsSupport = false; // Firefox nema background apps
    } else if (userAgent.includes('Safari')) {
      results.browser.name = 'Safari';
      results.browser.backgroundAppsSupport = false; // Safari limitiran
    } else if (userAgent.includes('Edge')) {
      results.browser.name = 'Edge';
      results.browser.backgroundAppsSupport = true; // Edge ima background apps
    }
    
    console.log('🌐 Browser:', results.browser);
    
    // 4. Generiraj preporuke
    console.log('💡 Generiranje preporuka...');
    
    if (!results.pwa.installed) {
      results.recommendations.push('📱 Instalirajte aplikaciju kao PWA za bolje background notifikacije');
    }
    
    if (results.permissions.notifications !== 'granted') {
      results.recommendations.push('🔔 Omogućite notifikacije u browser postavkama');
    }
    
    if (results.browser.name === 'Chrome' && !results.browser.backgroundAppsSupport) {
      results.recommendations.push('⚙️ Chrome: Omogućite "Continue running background apps when Chrome is closed"');
    }
    
    if (results.browser.name === 'Firefox') {
      results.recommendations.push('🦊 Firefox: Background notifikacije rade samo dok je browser otvoren');
    }
    
    if (!results.permissions.persistentNotification) {
      results.recommendations.push('🔧 Service Worker notifications nisu podržane');
    }
    
    // 5. Prikaži rezultate
    console.log('📊 === FINALNI REZULTATI ===');
    console.log('PWA Status:', results.pwa);
    console.log('Permissions:', results.permissions);
    console.log('Browser:', results.browser);
    console.log('Preporuke:', results.recommendations);
    
    // Alert s preporukama
    const alertMessage = `
📱 PWA & BACKGROUND STATUS

🔍 PWA Status:
${results.pwa.installed ? '✅' : '❌'} PWA instalirana
${results.pwa.standalone ? '✅' : '❌'} Standalone mode

🔒 Dozvole:
${results.permissions.notifications === 'granted' ? '✅' : '❌'} Notifikacije (${results.permissions.notifications})
${results.permissions.persistentNotification ? '✅' : '❌'} Service Worker notifications

🌐 Browser: ${results.browser.name}
${results.browser.backgroundAppsSupport ? '✅' : '❌'} Background apps support

💡 PREPORUKE:
${results.recommendations.map(r => `• ${r}`).join('\n')}

${results.recommendations.length === 0 ? '🎉 Sve je optimalno za background notifikacije!' : ''}
`;
    
    alert(alertMessage);
    
    return results;
    
  } catch (error) {
    console.error('💥 Greška u PWA check:', error);
    return { success: false, error, results };
  }
};

export default checkPWAAndBackgroundSupport;