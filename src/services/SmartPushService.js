/**
 * 🧠 Smart Push Notification Service
 * Inteligentni sistem koji poštuje admin settings i pametno šalje notifikacije
 */

import { supabase } from '../db/supabaseClient';

class SmartPushService {
  constructor() {
    this.settings = null;
    this.lastSettingsLoad = null;
    this.settingsCacheTime = 5 * 60 * 1000; // 5 minuta cache
  }

  // 🔧 Load settings from database
  async loadSettings() {
    const now = Date.now();
    
    // Use cache if recent
    if (this.settings && this.lastSettingsLoad && 
        (now - this.lastSettingsLoad) < this.settingsCacheTime) {
      return this.settings;
    }

    try {
      const { data, error } = await supabase
        .from('push_settings')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Failed to load push settings:', error);
        return this.getDefaultSettings();
      }

      this.settings = data;
      this.lastSettingsLoad = now;
      
      console.log('⚙️ Push settings loaded:', this.settings);
      return this.settings;
      
    } catch (error) {
      console.error('❌ Error loading push settings:', error);
      return this.getDefaultSettings();
    }
  }

  // 📝 Default settings fallback
  getDefaultSettings() {
    return {
      push_enabled: true,
      statistics_updates: {
        enabled: true,
        frequency: 'daily',
        timeRange: { start: '08:00', end: '18:00' },
        workDaysOnly: true
      },
      achievement_notifications: {
        enabled: true,
        types: {
          perfectMonth: true,
          efficiency: true,
          punctuality: true,
          milestones: true
        }
      },
      payroll_notifications: {
        enabled: true,
        timing: 'immediate'
      },
      extra_ride_alerts: {
        enabled: true,
        adminOnly: true
      },
      target_users: {
        allDrivers: true,
        admins: true
      },
      advanced_settings: {
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00'
        },
        maxDailyPerUser: 10
      }
    };
  }

  // 🎯 Main method: Should we send this notification?
  async shouldSendPush(type, context = {}) {
    const settings = await this.loadSettings();
    
    // Global check
    if (!settings.push_enabled) {
      console.log('📴 Push notifications globally disabled');
      return false;
    }

    // Quiet hours check
    if (this.isQuietHours(settings.advanced_settings.quietHours)) {
      console.log('🌙 Quiet hours active, skipping push');
      return false;
    }

    // Daily limit check
    if (await this.exceedsDailyLimit(context.userId, settings.advanced_settings.maxDailyPerUser)) {
      console.log('🚫 Daily limit exceeded for user:', context.userId);
      return false;
    }

    // Type-specific checks
    switch (type) {
      case 'statistics':
        return this.shouldSendStatistics(settings, context);
      case 'achievement':
        return this.shouldSendAchievement(settings, context);
      case 'payroll':
        return this.shouldSendPayroll(settings, context);
      case 'extra_ride':
        return this.shouldSendExtraRide(settings, context);
      case 'system':
        return this.shouldSendSystem(settings, context);
      default:
        console.log('❓ Unknown notification type:', type);
        return false;
    }
  }

  // 📊 Statistics notifications check
  shouldSendStatistics(settings, context) {
    const stats = settings.statistics_updates;
    if (!stats.enabled) return false;

    // Work days only check
    if (stats.workDaysOnly && this.isWeekend()) {
      return false;
    }

    // Time range check
    if (!this.isInTimeRange(stats.timeRange)) {
      return false;
    }

    // Frequency check
    if (stats.frequency === 'daily') {
      return !this.wasSentToday(context.userId, 'statistics');
    }

    // Minimum delivery threshold
    if (stats.minDeliveryThreshold && 
        context.deliveryCount < stats.minDeliveryThreshold) {
      return false;
    }

    return true;
  }

  // 🏆 Achievement notifications check
  shouldSendAchievement(settings, context) {
    const achievements = settings.achievement_notifications;
    if (!achievements.enabled) return false;

    // Check if this achievement type is enabled
    if (context.achievementType && 
        !achievements.types[context.achievementType]) {
      return false;
    }

    return true;
  }

  // 💰 Payroll notifications check
  shouldSendPayroll(settings, context) {
    const payroll = settings.payroll_notifications;
    if (!payroll.enabled) return false;

    // Timing check
    if (payroll.timing === 'scheduled') {
      return this.isScheduledTime(payroll.scheduledTime);
    }

    return true; // immediate
  }

  // 🚗 Extra ride alerts check
  shouldSendExtraRide(settings, context) {
    const extraRide = settings.extra_ride_alerts;
    if (!extraRide.enabled) return false;

    // Admin only check
    if (extraRide.adminOnly && context.userRole !== 'admin') {
      return false;
    }

    return true;
  }

  // ⚠️ System alerts check
  shouldSendSystem(settings, context) {
    const system = settings.system_alerts;
    if (!system.enabled) return false;

    // Severity check
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const requiredLevel = severityLevels[system.severity] || 2;
    const messagLevel = severityLevels[context.severity] || 1;

    return messagLevel >= requiredLevel;
  }

  // 🕐 Time helper methods
  isQuietHours(quietHours) {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const start = this.timeToMinutes(quietHours.start);
    const end = this.timeToMinutes(quietHours.end);

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Crosses midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  isInTimeRange(timeRange) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const start = this.timeToMinutes(timeRange.start);
    const end = this.timeToMinutes(timeRange.end);

    return currentTime >= start && currentTime <= end;
  }

  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  isScheduledTime(scheduledTime) {
    const now = new Date();
    const scheduled = this.timeToMinutes(scheduledTime);
    const current = now.getHours() * 60 + now.getMinutes();

    // Within 30 minutes of scheduled time
    return Math.abs(current - scheduled) <= 30;
  }

  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // 📈 Daily limit tracking
  async exceedsDailyLimit(userId, maxDaily) {
    if (!maxDaily) return false;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { count, error } = await supabase
        .from('push_notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (error) {
        console.error('❌ Error checking daily limit:', error);
        return false;
      }

      return count >= maxDaily;
    } catch (error) {
      console.error('❌ Daily limit check failed:', error);
      return false;
    }
  }

  // 📅 Was sent today check
  async wasSentToday(userId, type) {
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('push_notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1);

      if (error) {
        console.error('❌ Error checking sent today:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('❌ Sent today check failed:', error);
      return false;
    }
  }

  // 🚀 Main send method
  async sendPushNotification(payload) {
    const { userId, title, body, type, data = {}, userRole = 'driver' } = payload;

    console.log('🚀 Attempting to send push:', { userId, title, type });

    // Check if we should send
    const shouldSend = await this.shouldSendPush(type, {
      userId,
      userRole,
      ...data
    });

    if (!shouldSend) {
      console.log('⏹️ Push notification blocked by settings');
      return { success: false, reason: 'blocked_by_settings' };
    }

    try {
      // Get user subscriptions
      const subscriptions = await this.getUserSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log('📱 No active subscriptions for user:', userId);
        return { success: false, reason: 'no_subscriptions' };
      }

      // Prepare notification payload
      const notificationPayload = {
        title,
        body,
        icon: this.getIconForType(type),
        badge: '/badge-72x72.png',
        data: {
          url: this.getUrlForType(type),
          type,
          timestamp: Date.now(),
          notificationId: this.generateNotificationId(),
          ...data
        },
        tag: type,
        requireInteraction: this.requiresInteraction(type)
      };

      // Send to all user's devices
      const results = [];
      for (const subscription of subscriptions) {
        const result = await this.sendToSubscription(subscription, notificationPayload);
        results.push(result);
      }

      // Log notification
      await this.logNotification(userId, userRole, notificationPayload, 'sent');

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Push sent to ${successCount}/${results.length} devices`);

      return {
        success: successCount > 0,
        sentTo: successCount,
        total: results.length,
        results
      };

    } catch (error) {
      console.error('❌ Push notification failed:', error);
      await this.logNotification(userId, userRole, { title, body, type }, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  // 🔔 Send to specific subscription
  async sendToSubscription(subscription, payload) {
    try {
      // Here you would use a push service like web-push
      // For now, we'll simulate the API call
      
      console.log('📤 Sending to subscription:', subscription.endpoint);
      
      // Simulate API call to push service
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          payload: JSON.stringify(payload)
        })
      });

      if (response.ok) {
        await this.updateSubscriptionUsage(subscription.id);
        return { success: true, subscription: subscription.id };
      } else {
        await this.handleSubscriptionError(subscription.id);
        return { success: false, error: 'API error', subscription: subscription.id };
      }

    } catch (error) {
      console.error('❌ Failed to send to subscription:', error);
      await this.handleSubscriptionError(subscription.id);
      return { success: false, error: error.message, subscription: subscription.id };
    }
  }

  // 📱 Get user subscriptions
  async getUserSubscriptions(userId) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        console.error('❌ Error fetching subscriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get subscriptions:', error);
      return [];
    }
  }

  // 📊 Log notification
  async logNotification(userId, userType, payload, status, errorMessage = null) {
    try {
      const { error } = await supabase
        .from('push_notification_logs')
        .insert({
          user_id: userId,
          user_type: userType,
          title: payload.title,
          body: payload.body,
          type: payload.type || payload.data?.type,
          data: payload.data,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          error_message: errorMessage,
          settings_snapshot: this.settings
        });

      if (error) {
        console.error('❌ Failed to log notification:', error);
      }
    } catch (error) {
      console.error('❌ Notification logging error:', error);
    }
  }

  // 🔧 Helper methods
  getIconForType(type) {
    const icons = {
      statistics: '/icons/stats-192x192.png',
      achievement: '/icons/trophy-192x192.png',
      payroll: '/icons/money-192x192.png',
      extra_ride: '/icons/car-192x192.png',
      system: '/icons/system-192x192.png'
    };
    return icons[type] || '/icon-192x192.png';
  }

  getUrlForType(type) {
    const urls = {
      statistics: '/statistics',
      achievement: '/achievements',
      payroll: '/payroll',
      extra_ride: '/admin/rides',
      system: '/admin'
    };
    return urls[type] || '/';
  }

  requiresInteraction(type) {
    return ['system', 'extra_ride'].includes(type);
  }

  generateNotificationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async updateSubscriptionUsage(subscriptionId) {
    try {
      await supabase
        .from('push_subscriptions')
        .update({ 
          last_used: new Date().toISOString(),
          error_count: 0
        })
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('❌ Failed to update subscription usage:', error);
    }
  }

  async handleSubscriptionError(subscriptionId) {
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('error_count')
        .eq('id', subscriptionId)
        .single();

      const errorCount = (data?.error_count || 0) + 1;
      
      await supabase
        .from('push_subscriptions')
        .update({ 
          error_count: errorCount,
          active: errorCount < 5 // Deactivate after 5 errors
        })
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('❌ Failed to handle subscription error:', error);
    }
  }

  // 🎯 Convenience methods for different notification types
  async sendStatisticsUpdate(driverName, statsData) {
    return await this.sendPushNotification({
      userId: driverName,
      title: '📊 Statistike ažurirane!',
      body: `${statsData.deliveries} dostava, ${statsData.earnings?.toFixed(2)}€`,
      type: 'statistics',
      data: {
        deliveries: statsData.deliveries,
        earnings: statsData.earnings,
        ...statsData
      }
    });
  }

  async sendAchievementNotification(driverName, achievement) {
    return await this.sendPushNotification({
      userId: driverName,
      title: `🏆 ${achievement.title}!`,
      body: achievement.description,
      type: 'achievement',
      data: {
        achievementType: achievement.type,
        achievement: achievement
      }
    });
  }

  async sendPayrollNotification(driverName, payrollData) {
    return await this.sendPushNotification({
      userId: driverName,
      title: '💰 Nova platna lista!',
      body: 'Tvoja platna lista je dostupna za preuzimanje',
      type: 'payroll',
      data: payrollData
    });
  }

  async sendExtraRideAlert(adminUser, rideData) {
    return await this.sendPushNotification({
      userId: adminUser,
      title: '🚗 Nova extra vožnja!',
      body: `${rideData.driverName} je dodao extra vožnju`,
      type: 'extra_ride',
      userRole: 'admin',
      data: {
        rideId: rideData.id,
        driverName: rideData.driverName,
        ...rideData
      }
    });
  }

  async sendSystemAlert(message, severity = 'medium', targetAll = false) {
    const users = targetAll ? await this.getAllActiveUsers() : await this.getAdminUsers();
    
    const results = [];
    for (const user of users) {
      const result = await this.sendPushNotification({
        userId: user.id,
        title: '⚠️ Sistemska obavest',
        body: message,
        type: 'system',
        userRole: user.role,
        data: { severity }
      });
      results.push(result);
    }
    
    return results;
  }

  async getAllActiveUsers() {
    // Implementation depends on your user system
    return [];
  }

  async getAdminUsers() {
    // Implementation depends on your user system
    return [];
  }
}

// Export singleton instance
const smartPushService = new SmartPushService();
export default smartPushService;