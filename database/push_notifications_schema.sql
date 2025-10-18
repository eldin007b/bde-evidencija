-- 📱 Push Notifications Settings Schema
-- Granularna kontrola svih tipova push notifikacija iz admin panela

-- Push notification settings table
CREATE TABLE push_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Global settings
  push_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  
  -- Statistics notifications
  statistics_updates JSONB DEFAULT '{
    "enabled": true,
    "frequency": "daily",
    "timeRange": {
      "start": "08:00",
      "end": "18:00"
    },
    "workDaysOnly": true,
    "minDeliveryThreshold": 1
  }'::jsonb,
  
  -- Achievement notifications
  achievement_notifications JSONB DEFAULT '{
    "enabled": true,
    "types": {
      "perfectMonth": true,
      "efficiency": true,
      "punctuality": true,
      "milestones": true,
      "financial": true,
      "delivery": true
    },
    "immediateOnly": false,
    "summaryEnabled": true
  }'::jsonb,
  
  -- Payroll notifications
  payroll_notifications JSONB DEFAULT '{
    "enabled": true,
    "timing": "immediate",
    "scheduledTime": "09:00",
    "reminderEnabled": true,
    "reminderDays": 3
  }'::jsonb,
  
  -- Extra ride alerts
  extra_ride_alerts JSONB DEFAULT '{
    "enabled": true,
    "adminOnly": true,
    "autoApproveThreshold": null,
    "urgentKeywords": ["hitno", "urgent", "asap"]
  }'::jsonb,
  
  -- System alerts
  system_alerts JSONB DEFAULT '{
    "enabled": true,
    "severity": "medium",
    "types": ["maintenance", "updates", "errors"],
    "adminOnly": false
  }'::jsonb,
  
  -- Target audience settings
  target_users JSONB DEFAULT '{
    "allDrivers": true,
    "specificDrivers": [],
    "admins": true,
    "excludeInactive": true
  }'::jsonb,
  
  -- Advanced settings
  advanced_settings JSONB DEFAULT '{
    "batchingEnabled": true,
    "maxDailyPerUser": 10,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "07:00"
    },
    "retryAttempts": 3,
    "fallbackToInApp": true
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User push subscriptions table
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- driver name or admin ID
  user_type TEXT DEFAULT 'driver' CHECK (user_type IN ('driver', 'admin')),
  
  -- Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Device/browser info
  user_agent TEXT,
  platform TEXT,
  browser TEXT,
  
  -- Subscription preferences
  preferences JSONB DEFAULT '{
    "enabled": true,
    "types": {
      "statistics": true,
      "achievements": true,
      "payroll": true,
      "extraRides": true,
      "system": true
    }
  }'::jsonb,
  
  -- Status tracking
  active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

-- Push notification logs table
CREATE TABLE push_notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Target info
  user_id TEXT NOT NULL,
  user_type TEXT DEFAULT 'driver',
  
  -- Notification data
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  
  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'clicked')),
  sent_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Settings snapshot
  settings_snapshot JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX idx_push_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX idx_push_logs_type ON push_notification_logs(type);
CREATE INDEX idx_push_logs_status ON push_notification_logs(status);
CREATE INDEX idx_push_logs_created_at ON push_notification_logs(created_at);

-- RLS Policies
ALTER TABLE push_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin can manage all push settings
CREATE POLICY "Admin can manage push settings" ON push_settings
  FOR ALL USING (true);

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (true);

-- Users can view their own notification logs
CREATE POLICY "Users can view own logs" ON push_notification_logs
  FOR SELECT USING (true);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON push_notification_logs
  FOR ALL USING (true);

-- Insert default settings
INSERT INTO push_settings (push_enabled) VALUES (true) ON CONFLICT DO NOTHING;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_settings_updated_at BEFORE UPDATE ON push_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();