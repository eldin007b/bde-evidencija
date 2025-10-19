// 🔔 Visual Debug System for Production
// Alternative to console.log that works in production builds

class VisualDebugger {
  constructor() {
    this.logs = [];
    this.container = null;
    this.isVisible = false;
  }

  /**
   * 📱 Show debug message visually (works in production)
   */
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    // Store in memory
    this.logs.push({ message: logEntry, type, timestamp });
    
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs.shift();
    }
    
    // Show as notification
    this.showNotification(logEntry, type);
    
    // Also try console (may be removed in production)
    try {
      console.log(logEntry);
    } catch (e) {
      // Console not available
    }
  }

  /**
   * 🔔 Show visual notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      word-wrap: break-word;
      ${this.getTypeStyles(type)}
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  /**
   * 🎨 Get styles based on message type
   */
  getTypeStyles(type) {
    switch (type) {
      case 'success':
        return 'background: #10B981; color: white;';
      case 'error':
        return 'background: #EF4444; color: white;';
      case 'warning':
        return 'background: #F59E0B; color: white;';
      default:
        return 'background: #3B82F6; color: white;';
    }
  }

  /**
   * 📊 Show debug panel
   */
  showDebugPanel() {
    if (this.container) {
      this.container.remove();
    }
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 600px;
      height: 400px;
      background: #1F2937;
      color: #F3F4F6;
      border-radius: 12px;
      padding: 20px;
      z-index: 999999;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-y: auto;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #374151;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; color: #60A5FA;">🐛 Push Notifications Debug Log</h3>
      <button id="closeDebug" style="
        background: #EF4444;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      ">Zatvori</button>
    `;
    
    const logsContainer = document.createElement('div');
    logsContainer.innerHTML = this.logs.map(log => `
      <div style="margin-bottom: 8px; padding: 8px; border-radius: 4px; background: #374151;">
        ${log.message}
      </div>
    `).join('');
    
    this.container.appendChild(header);
    this.container.appendChild(logsContainer);
    document.body.appendChild(this.container);
    
    // Close button
    document.getElementById('closeDebug').onclick = () => {
      this.container.remove();
      this.container = null;
    };
    
    this.isVisible = true;
  }

  /**
   * 🧪 Test browser notification API with mobile/desktop detection
   */
  async testBrowserAPI() {
    this.log('Test 1: Browser Notification API...', 'info');
    
    if (!('Notification' in window)) {
      this.log('❌ Browser API: Nije podržan', 'error');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      this.log('❌ Browser API: Nema dozvolu za notifikacije', 'error');
      return;
    }
    
    try {
      // Always try Service Worker first (mobile browsers require this)
      if ('serviceWorker' in navigator) {
        this.log('� Using Service Worker API for notification test', 'info');
        try {
          const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
          if (registration) {
            await registration.showNotification('🧪 Browser API Test', {
              body: 'Service Worker notification test radi!',
              icon: '/bde-evidencija/icon-192x192.png',
              badge: '/bde-evidencija/badge-96x96.png',
              tag: 'browser-test',
              requireInteraction: false
            });
            this.log('✅ Service Worker Browser API test uspešan', 'success');
            return;
          } else {
            this.log('⚠️ Service Worker nije registrovan, probavam direktno...', 'warn');
          }
        } catch (swError) {
          this.log(`⚠️ Service Worker greška: ${swError.message}, probavam direktno...`, 'warn');
        }
      }
      
      // Fallback to safe helper that prefers Service Worker
      this.log('🖥️ Using safe notification helper (desktop fallback)', 'info');
      try {
        const { showNotification } = await import('./notifyHelper');
        await showNotification({ title: '🧪 Desktop API Test', body: 'Desktop browser API test radi!', icon: '/bde-evidencija/icon-192x192.png' });
        this.log('✅ Desktop Browser API test uspešan', 'success');
      } catch (directError) {
        throw new Error(`Direktna Notification API greška: ${directError.message}`);
      }
    } catch (error) {
      this.log(`❌ Browser API greška: ${error.message}`, 'error');
      this.log('💡 Savjet: Koristite Service Worker za mobilne uređaje', 'info');
    }
  }

  /**
   * 🧪 Test all notification methods
   */
  async testAllMethods() {
    this.log('🧪 Starting comprehensive push notification test...', 'info');
    
    // Test 0: Check notification permissions thoroughly
    this.log('Test 0: Detaljno proveri dozvole...', 'info');
    this.log(`Notification permission: ${Notification.permission}`, 'info');
    this.log(`Navigator permissions API: ${!!navigator.permissions}`, 'info');
    
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
        this.log(`Permissions API status: ${permissionStatus.state}`, 'info');
      } catch (permError) {
        this.log(`Permissions API greška: ${permError.message}`, 'warn');
      }
    }
    
    try {
      // Test 1: Browser API
      await this.testBrowserAPI();
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 2: Service Worker
      this.log('Test 2: Service Worker...', 'info');
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
          if (registration) {
            this.log('✅ Service Worker registrovan', 'success');
            
            if (registration.active) {
              registration.active.postMessage({
                type: 'SHOW_NOTIFICATION',
                payload: {
                  title: '🧪 SW Test',
                  body: 'Service Worker test radi!',
                  icon: '/bde-evidencija/icon-192x192.png'
                }
              });
              this.log('✅ Service Worker poruka poslana', 'success');
            }
          } else {
            this.log('❌ Service Worker nije registrovan', 'error');
          }
        } catch (error) {
          this.log(`❌ Service Worker greška: ${error.message}`, 'error');
        }
      }
      
      // Test 3: Push Subscription
      this.log('Test 3: Push Subscription...', 'info');
      try {
        const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            this.log('✅ Push subscription postoji', 'success');
            this.log(`Endpoint: ${subscription.endpoint.substring(0, 50)}...`, 'info');
          } else {
            this.log('❌ Push subscription ne postoji', 'error');
          }
        }
      } catch (error) {
        this.log(`❌ Push subscription greška: ${error.message}`, 'error');
      }
      
      // Test 4: Direct Push Simulation
      this.log('Test 4: Simulacija push poruke...', 'info');
      try {
        const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
        if (registration && registration.active) {
          // Simulate push message
          registration.active.postMessage({
            type: 'SIMULATE_PUSH',
            payload: {
              title: '🧪 Simulacija Push-a',
              body: 'Test simulacije push poruke direktno u SW!',
              icon: '/bde-evidencija/icon-192x192.png',
              data: {
                type: 'test',
                url: '/',
                test: true
              }
            }
          });
          this.log('✅ Push simulacija poslana u Service Worker', 'success');
        }
      } catch (error) {
        this.log(`❌ Push simulacija greška: ${error.message}`, 'error');
      }

      // Test 5: Force Direct Notification
      this.log('Test 5: Forsirana direktna notifikacija...', 'info');
      try {
        const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
        if (registration) {
          await registration.showNotification('🚨 FORÇA TEST', {
            body: 'Ako vidite ovu notifikaciju, sve radi!',
            icon: '/bde-evidencija/icon-192x192.png',
            badge: '/bde-evidencija/badge-96x96.png',
            tag: 'force-test',
            requireInteraction: true,
            vibrate: [300, 200, 300, 200, 300]
          });
          this.log('✅ Forsirana notifikacija uspešno poslana!', 'success');
        }
      } catch (forceError) {
        this.log(`❌ Forsirana notifikacija greška: ${forceError.message}`, 'error');
      }
      
      // Test 6: Simple Direct Notification
      this.log('Test 6: Jednostavna direktna notifikacija...', 'info');
      try {
        if (Notification.permission === 'granted') {
          new Notification('🔔 Direktna notifikacija', {
            body: 'Ovo je direktna browser notifikacija!',
            icon: '/bde-evidencija/icon-192x192.png'
          });
          this.log('✅ Direktna browser notifikacija poslana!', 'success');
        } else {
          this.log('❌ Nema dozvolu za direktne notifikacije', 'error');
        }
      } catch (directError) {
        this.log(`❌ Direktna notifikacija greška: ${directError.message}`, 'error');
      }

      this.log('🏁 Test završen - proveri notifikacije!', 'success');
      this.log('💡 Ako ne vidite notifikacije, proverite browser settings!', 'info');
      
    } catch (error) {
      this.log(`❌ Globalna greška: ${error.message}`, 'error');
    }
  }
}

// Create global instance
const visualDebug = new VisualDebugger();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Make available globally
window.debugPush = visualDebug;

export default visualDebug;