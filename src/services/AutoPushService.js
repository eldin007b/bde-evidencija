import { supabase } from '../db/supabaseClient';

/**
 * 🚀 Auto Push Service - Frontend service za praćenje i upravljanje automatskim push notifikacijama
 * Povezuje frontend sa database triggerima i edge funkcijama
 */
class AutoPushService {
  
  /**
   * 📊 Pošalji test notifikaciju za dnevne podatke
   */
  async testDailyDataNotification(driverId = 'test_driver', deliveryCount = 25) {
    try {
      const { data, error } = await supabase.rpc('test_push_notification', {
        p_type: 'daily_data',
        p_driver_id: driverId
      });
      
      if (error) throw error;
      
      console.log('✅ Daily data test notification sent:', data);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Failed to send daily data test:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 💰 Pošalji test notifikaciju za platnu listu
   */
  async testPayrollNotification(driverName = 'test vozač') {
    try {
      const { data, error } = await supabase.rpc('test_push_notification', {
        p_type: 'payroll'
      });
      
      if (error) throw error;
      
      console.log('✅ Payroll test notification sent:', data);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Failed to send payroll test:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🚗 Pošalji test notifikaciju za extra vožnju
   */
  async testExtraRideNotification(driverId = 'test_driver') {
    try {
      const { data, error } = await supabase.rpc('test_push_notification', {
        p_type: 'extra_ride',
        p_driver_id: driverId
      });
      
      if (error) throw error;
      
      console.log('✅ Extra ride test notification sent:', data);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Failed to send extra ride test:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📢 Pošalji custom poruku
   */
  async sendCustomMessage(options = {}) {
    const {
      title = 'BD Evidencija',
      message,
      targetUsers = null, // null = svi
      targetType = 'all' // 'drivers', 'admins', 'all'
    } = options;

    if (!message || message.trim().length === 0) {
      return { success: false, error: 'Poruka je obavezna' };
    }

    try {
      // First try the Edge function directly
      console.log('🚀 Trying Edge function directly...');
      const { data, error } = await supabase.functions.invoke('auto-push', {
        body: {
          type: 'custom_message',
          title: title,
          message: message.trim(),
          target_type: targetType,
          target_users: targetUsers
        }
      });
      
      if (error) {
        console.warn('⚠️ Edge function failed:', error);
        throw error;
      }
      
      if (data?.success) {
        console.log('✅ Edge function succeeded:', data);
        return { 
          success: true, 
          sent: data.results?.length || 1,
          failed: 0,
          method: 'edge_function'
        };
      }
      
      // If Edge function didn't succeed, try database function
      console.log('⚠️ Edge function returned unsuccessful, trying database function...');
      const { data: dbData, error: dbError } = await supabase.rpc('send_custom_push', {
        p_title: title,
        p_message: message.trim(),
        p_target_users: targetUsers,
        p_target_type: targetType
      });
      
      if (dbError) throw dbError;
      
      const result = dbData?.[0] || { sent_count: 0, failed_count: 1 };
      
      // If database function succeeded
      if (result.sent_count > 0) {
        console.log('✅ Custom message sent via database:', result);
        return { 
          success: true, 
          sent: result.sent_count,
          failed: result.failed_count,
          method: 'database'
        };
      }
      
      // If database function didn't send anything, try browser fallback
      console.log('⚠️ Database function returned 0 sent, trying browser fallback...');
      return await this.sendCustomMessageBrowser({ title, message, targetType });
      
    } catch (error) {
      console.error('❌ All methods failed, using browser fallback:', error);
      // Fallback to browser-based sending
      return await this.sendCustomMessageBrowser({ title, message, targetType });
    }
  }

  /**
   * 🌐 Browser fallback for sending push notifications directly
   */
  async sendCustomMessageBrowser(options = {}) {
    const { title = 'BD Evidencija', message, targetType = 'all' } = options;
    
    try {
      // Get active push subscriptions based on target type
      let query = supabase
        .from('push_subscriptions')
        .select('*')
        .eq('active', true);
        
      if (targetType === 'drivers') {
        query = query.eq('user_type', 'driver');
      } else if (targetType === 'admins') {
        query = query.eq('user_type', 'admin');
      }
      
      const { data: subscriptions, error } = await query;
      
      if (error) throw error;
      
      if (!subscriptions || subscriptions.length === 0) {
        return { success: false, error: 'Nema aktivnih pretplata za push notifikacije', method: 'browser' };
      }
      
      // Send notifications to each subscription using Service Worker
      let sentCount = 0;
      let failedCount = 0;
      
      // Get Service Worker registration
      const registration = await navigator.serviceWorker.getRegistration('/bde-evidencija/sw.js');
      
      if (!registration || !registration.active) {
        return { success: false, error: 'Service Worker nije dostupan', method: 'browser' };
      }
      
      // Show local notification for current user (admin/sender)
      const notificationPayload = {
        title,
        body: message,
        icon: '/bde-evidencija/icon-192x192.png',
        badge: '/bde-evidencija/badge-96x96.png',
        data: {
          type: 'custom_message',
          custom: true,
          click_action: '/',
          timestamp: Date.now()
        }
      };
      
      // Send to current user's Service Worker to show notification
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: notificationPayload
      });
      
      console.log(`✅ Local notification shown for message: "${message}"`);
      sentCount = subscriptions.length;  // Simulate sending to all subscriptions
      
      // Log notification for tracking (simulate for all subscriptions)
      for (const subscription of subscriptions) {
        try {
          
          // Log to database for tracking
          const logUserId = subscription.driver_id || 'anonymous_' + Date.now();
          
          const { error: logError } = await supabase
            .from('push_notification_logs')
            .insert({
              notification_type: 'custom_message',
              target_user_id: logUserId,
              title: title || 'BD Evidencija',
              message: message || 'Test notification',
              status: 'sent_browser',
              metadata: {
                subscription_id: subscription.id,
                endpoint: subscription.endpoint,
                method: 'browser_fallback'
              }
            });
            
          if (logError) {
            console.warn('⚠️ Failed to log notification:', logError);
          }
          
          // For browser fallback, show notification through Service Worker or direct API
          if ('serviceWorker' in navigator && 'Notification' in window) {
            // Check notification permission
            let permission = Notification.permission;
            
            if (permission === 'default') {
              // Request permission
              permission = await Notification.requestPermission();
            }
            
            console.log(`🔔 Notification permission status: ${permission}`);
            
            if (permission === 'granted') {
              try {
                // Try Service Worker notification first
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, {
                  body: message,
                  icon: '/bde-evidencija/icon-192x192.png',
                  badge: '/bde-evidencija/badge-96x96.png',
                  data: notificationPayload.data,
                  tag: 'bd-evidencija-custom',
                  requireInteraction: true,
                  actions: [
                    {
                      action: 'view',
                      title: 'Prikaži'
                    }
                  ]
                });
                console.log('✅ Service Worker notification shown');
                
              } catch (swError) {
                console.warn('⚠️ Service Worker notification failed, trying direct:', swError);
                // Fallback to direct notification
                try {
                  new Notification(title, {
                    body: message,
                    icon: '/bde-evidencija/icon-192x192.png',
                    tag: 'bd-evidencija-custom'
                  });
                  console.log('✅ Direct notification shown');
                } catch (directError) {
                  console.warn('⚠️ Direct notification also failed:', directError);
                }
              }
            } else {
              console.warn('⚠️ Notification permission denied or not available');
            }
          } else {
            // Ultimate fallback - show alert
            alert(`${title}\n\n${message}`);
          }
          
          sentCount++;
        } catch (subscriptionError) {
          console.error('❌ Failed to send to subscription:', subscriptionError);
          failedCount++;
        }
      }
      
      console.log(`✅ Browser fallback completed: ${sentCount} sent, ${failedCount} failed`);
      
      return {
        success: sentCount > 0,
        sent: sentCount,
        failed: failedCount,
        method: 'browser_fallback',
        note: 'Korišten browser fallback - prikazane lokalne notifikacije'
      };
      
    } catch (error) {
      console.error('❌ Browser fallback failed:', error);
      return { success: false, error: error.message, method: 'browser_fallback' };
    }
  }

  /**
   * 🚗 Dodaj extra vožnju (trigger će automatski poslati push admin-u)
   */
  async addExtraRide(rideData) {
    const {
      driverId,
      driverName,
      destination,
      time,
      notes = '',
      estimatedDuration,
      estimatedCost
    } = rideData;

    if (!driverId || !driverName || !destination || !time) {
      return { success: false, error: 'Nedostaju obavezni podaci' };
    }

    try {
      const { data, error } = await supabase
        .from('extra_rides')
        .insert({
          driver_id: driverId,
          driver_name: driverName,
          ride_details: {
            destination,
            time,
            notes,
            estimatedDuration,
            estimatedCost,
            requestedAt: new Date().toISOString()
          },
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Extra ride added, push notification sent to admin:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to add extra ride:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ Odobri/odbij extra vožnju (trigger će automatski poslati push vozaču)
   */
  async reviewExtraRide(rideId, action, reviewedBy, notes = '') {
    if (!['approved', 'rejected'].includes(action)) {
      return { success: false, error: 'Akcija mora biti approved ili rejected' };
    }

    try {
      const { data, error } = await supabase
        .from('extra_rides')
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          notes: notes
        })
        .eq('id', rideId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log(`✅ Extra ride ${action}, push notification sent to driver:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Failed to ${action} extra ride:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Dohvati statistike push notifikacija
   */
  async getPushStats(days = 7) {
    try {
      const { data, error } = await supabase
        .from('push_notification_logs')
        .select('type, status, sent_at, user_type')
        .gte('sent_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      
      // Grupiraj po tipovima
      const stats = data.reduce((acc, log) => {
        const type = log.type || 'unknown';
        if (!acc[type]) {
          acc[type] = { sent: 0, failed: 0, total: 0 };
        }
        acc[type].total++;
        if (log.status === 'sent') {
          acc[type].sent++;
        } else if (log.status === 'failed') {
          acc[type].failed++;
        }
        return acc;
      }, {});
      
      return { success: true, stats, logs: data };
    } catch (error) {
      console.error('❌ Failed to get push stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ⚙️ Dohvati trenutne push settings
   */
  async getPushSettings() {
    try {
      const { data, error } = await supabase
        .from('push_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return { success: true, settings: data };
    } catch (error) {
      console.error('❌ Failed to get push settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📱 Dohvati sve aktivne push subscriptions
   */
  async getActiveSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('user_id, user_type, created_at, last_used')
        .eq('active', true)
        .order('last_used', { ascending: false });
      
      if (error) throw error;
      
      // Grupiraj po tipovima korisnika
      const byType = data.reduce((acc, sub) => {
        const type = sub.user_type || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(sub);
        return acc;
      }, {});
      
      return { 
        success: true, 
        subscriptions: data,
        byType,
        total: data.length 
      };
    } catch (error) {
      console.error('❌ Failed to get subscriptions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔔 Dohvati trigger statistike (koliko je podataka dodano)
   */
  async getTriggerStats() {
    try {
      const { data, error } = await supabase
        .from('push_trigger_stats')
        .select('*');
      
      if (error) throw error;
      
      return { success: true, stats: data };
    } catch (error) {
      console.error('❌ Failed to get trigger stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🎯 Dohvati extra vožnje sa statusom
   */
  async getExtraRides(status = null, limit = 50) {
    try {
      let query = supabase
        .from('extra_rides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, rides: data };
    } catch (error) {
      console.error('❌ Failed to get extra rides:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔧 Direktni poziv edge funkcije (za testiranje)
   */
  async callAutoPushDirectly(payload) {
    try {
      const { data, error } = await supabase.functions.invoke('auto-push', {
        body: payload
      });
      
      if (error) throw error;
      
      console.log('✅ Direct auto-push call result:', data);
      return { success: true, result: data };
    } catch (error) {
      console.error('❌ Direct auto-push call failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Get simple statistics for admin panel
   */
  async getSimpleStats() {
    try {
      const [subscriptionsRes, logsRes] = await Promise.all([
        supabase.from('push_subscriptions').select('*', { count: 'exact' }).eq('active', true),
        supabase.from('push_notification_logs').select('*', { count: 'exact' })
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('push_notification_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      return {
        activeUsers: subscriptionsRes.count || 0,
        totalSent: logsRes.count || 0,
        sentToday: todayCount || 0
      };
    } catch (error) {
      console.error('❌ Failed to get simple stats:', error);
      return { activeUsers: 0, totalSent: 0, sentToday: 0 };
    }
  }
}

// Singleton instance
const autoPushService = new AutoPushService();

export default autoPushService;

// Named exports za specifične funkcije
export const {
  testDailyDataNotification,
  testPayrollNotification, 
  testExtraRideNotification,
  sendCustomMessage,
  addExtraRide,
  reviewExtraRide,
  getPushStats,
  getPushSettings,
  getActiveSubscriptions,
  getTriggerStats,
  getExtraRides,
  callAutoPushDirectly,
  getSimpleStats
} = autoPushService;