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
   * 🧪 Test all notification methods
   */
  async testAllMethods() {
    this.log('🧪 Starting comprehensive push notification test...', 'info');
    
    try {
      // Test 1: Browser API
      this.log('Test 1: Browser Notification API...', 'info');
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            // Check if we're on mobile and need Service Worker
            const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            
            if (isMobile) {
              // Use Service Worker for mobile
              const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
              if (registration) {
                await registration.showNotification('🧪 Mobile API Test', {
                  body: 'Mobile browser API test radi!',
                  icon: '/bde-evidencija/icon-192x192.png'
                });
                this.log('✅ Mobile Browser API test uspešan', 'success');
              } else {
                this.log('❌ Mobile Browser API: Service Worker nije dostupan', 'error');
              }
            } else {
              // Use direct API for desktop
              const notification = new Notification('🧪 Desktop API Test', {
                body: 'Desktop browser API test radi!',
                icon: '/bde-evidencija/icon-192x192.png'
              });
              setTimeout(() => notification.close(), 3000);
              this.log('✅ Desktop Browser API test uspešan', 'success');
            }
          } catch (error) {
            this.log(`❌ Browser API greška: ${error.message}`, 'error');
          }
        } else {
          this.log('❌ Browser API: Nema dozvolu za notifikacije', 'error');
        }
      } else {
        this.log('❌ Browser API: Nije podržan', 'error');
      }
      
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
      
      this.log('🏁 Test završen - proveri notifikacije!', 'success');
      
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