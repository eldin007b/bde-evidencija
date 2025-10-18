-- Fix push_notification_logs table column naming issue
-- The table has 'user_id' column but our code expects 'target_user_id'

DO $$ 
BEGIN
    -- Check if user_id column exists and target_user_id doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='user_id')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='target_user_id') THEN
        -- Rename user_id to target_user_id
        ALTER TABLE push_notification_logs RENAME COLUMN user_id TO target_user_id;
    END IF;
    
    -- Ensure target_user_id is NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='target_user_id') THEN
        -- Remove NOT NULL constraint temporarily, then add it back
        ALTER TABLE push_notification_logs ALTER COLUMN target_user_id DROP NOT NULL;
        ALTER TABLE push_notification_logs ALTER COLUMN target_user_id SET NOT NULL;
    END IF;
END $$;