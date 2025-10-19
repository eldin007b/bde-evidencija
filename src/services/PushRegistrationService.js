// 🔔 Push Notification Registration Service
// Automatski registruje user-a za push notifikacije kada uđe u Admin Panel

import { supabase } from '../db/supabaseClient';

class PushRegistrationService {
  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BLeZWVsLWNC_Y-lzWnsrZQXIjCTxtPXHPSlDB4v6As_QyKzguPKE7AwxCb3h4PCEG9JaHhw0dgS3VhXCKohTyqE';
    this.isRegistered = false;
  }

  /**
   * 📱 Check if push notifications are supported
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * 🔐 Request permission and register for push notifications
   */
  async requestPermissionAndRegister(userId = 'admin', userType = 'admin') {
    if (!this.isSupported()) {
      console.warn('⚠️ Push notifications not supported in this browser');
      return { success: false, reason: 'not_supported' };
    }

    try {
      // 1. Request notification permission
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return { success: false, reason: 'permission_denied' };
      }

      console.log('✅ Notification permission granted');

      // 2. Register service worker
      console.log('🔧 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/bde-evidencija/sw.js');
      console.log('✅ Service worker registered');

      // 3. Subscribe to push notifications
      console.log('📱 Subscribing to push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('✅ Push subscription created:', subscription);

      // 4. Save subscription to database
      console.log('🔍 Subscription keys:', subscription.keys);
      console.log('🔍 Full subscription object:', subscription);
      
      // Get keys properly from subscription
      const subscriptionJson = subscription.toJSON();
      console.log('📋 Subscription JSON:', subscriptionJson);
      
      // Validate keys exist
      if (!subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error('Push subscription keys are missing. Browser may not support web push properly.');
      }
      
      const subscriptionData = {
        driver_id: parseInt(userId) || null, // Match drivers.id (serial)
        driver_tura: userType === 'admin' ? 'admin' : null, // Match drivers.tura if not admin
        endpoint: subscription.endpoint,
        p256dh_key: subscriptionJson.keys.p256dh,
        auth_key: subscriptionJson.keys.auth,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        browser: this.getBrowserName(),
        active: true,
        created_at: new Date().toISOString()
      };

      console.log('💾 Saving subscription to database...');
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'endpoint', // Use endpoint as unique constraint
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Failed to save subscription:', error);
        return { success: false, reason: 'database_error', error };
      }

      console.log('✅ Push subscription saved to database:', data);
      this.isRegistered = true;

      return { 
        success: true, 
        subscription: subscriptionData,
        message: 'Push notifications activated!' 
      };

    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
      return { success: false, reason: 'registration_error', error: error.message };
    }
  }

  /**
   * 🔄 Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * 🌐 Get browser name for tracking
   */
  getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * ✅ Check if user is already registered
   */
  async checkRegistrationStatus(userId = 'admin') {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('driver_id', parseInt(userId) || null)
        .eq('active', true)
        .limit(1);

      if (error) {
        console.warn('Push subscriptions table may not exist:', error);
        return false;
      }
      
      this.isRegistered = data && data.length > 0;
      return this.isRegistered;
    } catch (error) {
      console.error('❌ Failed to check registration status:', error);
      return false;
    }
  }

  /**
   * 🧪 Test push notification
   */
  async sendTestNotification() {
    if (!this.isRegistered) {
      console.warn('⚠️ Not registered for push notifications');
      return false;
    }

    try {
      // Skip Edge function for now and use browser fallback directly
      console.log('🧪 Using browser fallback for reliable testing...');
      let data = null;
      let error = { message: 'Bypassing Edge Function' };
      
      if (!error && data?.success) {
        console.log('✅ Edge function test successful:', data);
        return true;
      }
      
      // Use AutoPushService browser fallback (reliable method)
      console.log('🔄 Using AutoPushService browser fallback...');
      
      // Import visual debug if available
      let visualDebug = null;
      try {
        const debugModule = await import('../utils/visualDebugger.js');
        visualDebug = debugModule.default;
      } catch (e) {
        // Visual debug not available
      }
      
      if (visualDebug) {
        visualDebug.log('🧪 Sending test notification via AutoPushService...', 'info');
      }
      
      const { default: autoPushService } = await import('./AutoPushService.js');
      
      const result = await autoPushService.sendCustomMessage({
        title: '🧪 BD Evidencija Test',
        message: 'Test push notifikacija uspješno poslana! 🎉',
        targetType: 'all'
      });
      
      console.log('✅ Test notification result:', result);
      
      if (visualDebug) {
        if (result.success) {
          visualDebug.log('✅ Test notifikacija poslana uspješno!', 'success');
        } else {
          visualDebug.log('❌ Test notifikacija neuspješna', 'error');
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      return false;
    }
  }
}

// Singleton instance
const pushRegistrationService = new PushRegistrationService();

export default pushRegistrationService;