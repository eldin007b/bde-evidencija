/**
 * 🔔 Push Notifications Subscription Hook
 * Manages user subscriptions, permissions, and registration
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';

export const usePushNotifications = (userId, userRole = 'driver') => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registration, setRegistration] = useState(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      
      setIsSupported(supported);
      setPermission(Notification.permission);
      
      console.log('📱 Push notifications supported:', supported);
      console.log('📱 Current permission:', Notification.permission);
    };

    checkSupport();
  }, []);

  // Register service worker
  useEffect(() => {
    if (isSupported && !registration) {
      registerServiceWorker();
    }
  }, [isSupported]);

  // Load existing subscription
  useEffect(() => {
    if (userId && registration) {
      loadExistingSubscription();
    }
  }, [userId, registration]);

  const registerServiceWorker = async () => {
    try {
      console.log('📱 Registering service worker...');
      
      const reg = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      setRegistration(reg);
      console.log('✅ Service worker registered');

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found');
      });

    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      setError('Service worker registration failed');
    }
  };

  const loadExistingSubscription = async () => {
    try {
      // Check for existing push subscription
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        console.log('📱 Found existing push subscription');
        setSubscription(pushSubscription);
        
        // Verify it's in database
        await verifySubscriptionInDatabase(pushSubscription);
      } else {
        console.log('📱 No existing push subscription found');
      }
    } catch (error) {
      console.error('❌ Error loading existing subscription:', error);
    }
  };

  const verifySubscriptionInDatabase = async (pushSubscription) => {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', pushSubscription.endpoint)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('❌ Error verifying subscription:', error);
        return;
      }

      if (!data) {
        console.log('📱 Subscription not in database, saving...');
        await saveSubscriptionToDatabase(pushSubscription);
      } else {
        console.log('✅ Subscription verified in database');
      }
    } catch (error) {
      console.error('❌ Error verifying subscription:', error);
    }
  };

  // Request permission and subscribe
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (!registration) {
      throw new Error('Service worker not registered');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      console.log('📱 Permission granted, subscribing...');

      // Subscribe to push manager
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      console.log('✅ Push subscription created:', pushSubscription.endpoint);

      // Save to database
      await saveSubscriptionToDatabase(pushSubscription);
      
      setSubscription(pushSubscription);
      
      return pushSubscription;

    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, registration, userId, userRole]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      console.log('📱 No subscription to unsubscribe from');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      const success = await subscription.unsubscribe();
      
      if (success) {
        console.log('✅ Push subscription cancelled');
        
        // Remove from database
        await removeSubscriptionFromDatabase(subscription.endpoint);
        
        setSubscription(null);
      } else {
        throw new Error('Failed to unsubscribe');
      }

    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, userId]);

  // Save subscription to database
  const saveSubscriptionToDatabase = async (pushSubscription) => {
    try {
      const subscriptionData = {
        user_id: userId,
        user_type: userRole,
        endpoint: pushSubscription.endpoint,
        p256dh_key: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
        auth_key: arrayBufferToBase64(pushSubscription.getKey('auth')),
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        browser: getBrowserName(),
        preferences: {
          enabled: true,
          types: {
            statistics: true,
            achievements: true,
            payroll: true,
            extraRides: userRole === 'admin',
            system: true
          }
        }
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error('❌ Failed to save subscription:', error);
        throw error;
      }

      console.log('✅ Subscription saved to database');

    } catch (error) {
      console.error('❌ Error saving subscription:', error);
      throw error;
    }
  };

  // Remove subscription from database
  const removeSubscriptionFromDatabase = async (endpoint) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('❌ Failed to remove subscription:', error);
        throw error;
      }

      console.log('✅ Subscription removed from database');

    } catch (error) {
      console.error('❌ Error removing subscription:', error);
      throw error;
    }
  };

  // Update subscription preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ 
          preferences: newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to update preferences:', error);
        throw error;
      }

      console.log('✅ Preferences updated');

    } catch (error) {
      console.error('❌ Error updating preferences:', error);
      throw error;
    }
  }, [userId]);

  // Get current preferences
  const getPreferences = useCallback(async () => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('preferences')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Failed to get preferences:', error);
        return null;
      }

      return data?.preferences || null;

    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      return null;
    }
  }, [userId]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!subscription) {
      throw new Error('No active subscription');
    }

    try {
      // This would call your backend API to send a test push
      const response = await fetch('/api/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          title: '🧪 Test Notification',
          body: 'Ovo je test push notification!',
          type: 'test'
        })
      });

      if (!response.ok) {
        throw new Error('Test notification failed');
      }

      console.log('✅ Test notification sent');

    } catch (error) {
      console.error('❌ Test notification failed:', error);
      throw error;
    }
  }, [subscription, userId]);

  // Check if user has active subscription
  const hasActiveSubscription = useCallback(async () => {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('active', true)
        .limit(1);

      if (error) {
        console.error('❌ Error checking subscription:', error);
        return false;
      }

      return data && data.length > 0;

    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      return false;
    }
  }, [userId]);

  return {
    // State
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    
    // Actions
    subscribe,
    unsubscribe,
    updatePreferences,
    getPreferences,
    sendTestNotification,
    hasActiveSubscription,
    
    // Computed
    isSubscribed: !!subscription,
    canSubscribe: isSupported && permission !== 'denied',
    needsPermission: permission === 'default'
  };
};

// Utility functions
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

export default usePushNotifications;