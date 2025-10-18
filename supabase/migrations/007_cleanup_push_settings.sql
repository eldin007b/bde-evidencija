-- Clean up: Drop unnecessary push_settings table
-- We only need push_subscriptions and push_notification_logs for basic functionality

-- Drop push_settings table and related objects
DROP TABLE IF EXISTS push_settings CASCADE;

SELECT 'Unnecessary push_settings table dropped - system simplified!' as status;