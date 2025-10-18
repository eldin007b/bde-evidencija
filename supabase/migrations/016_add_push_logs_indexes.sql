-- Add indexes to push_notification_logs table for better performance

-- Create indexes only if columns exist
DO $$ 
BEGIN
    -- Add index on target_user_id if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='target_user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON push_notification_logs(target_user_id);
    END IF;

    -- Add index on notification_type if column exists  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='notification_type') THEN
        CREATE INDEX IF NOT EXISTS idx_push_notification_logs_type ON push_notification_logs(notification_type);
    END IF;

    -- Add index on status if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='status') THEN
        CREATE INDEX IF NOT EXISTS idx_push_notification_logs_status ON push_notification_logs(status);
    END IF;

    -- Add index on created_at if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_push_notification_logs_created_at ON push_notification_logs(created_at);
    END IF;
END $$;