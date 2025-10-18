-- Fix push_notification_logs table schema by adding missing columns
-- This migration only adds columns that don't exist

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check and add notification_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='notification_type') THEN
        ALTER TABLE push_notification_logs ADD COLUMN notification_type TEXT DEFAULT 'custom_message';
    END IF;

    -- Check and add target_user_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='target_user_id') THEN
        ALTER TABLE push_notification_logs ADD COLUMN target_user_id TEXT;
    END IF;

    -- Check and add message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='message') THEN
        ALTER TABLE push_notification_logs ADD COLUMN message TEXT;
    END IF;

    -- Check and add metadata column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='metadata') THEN
        ALTER TABLE push_notification_logs ADD COLUMN metadata JSONB;
    END IF;

    -- Check and add error_message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='error_message') THEN
        ALTER TABLE push_notification_logs ADD COLUMN error_message TEXT;
    END IF;

    -- Update status column constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='status') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE push_notification_logs DROP CONSTRAINT IF EXISTS push_notification_logs_status_check;
        -- Add new constraint
        ALTER TABLE push_notification_logs ADD CONSTRAINT push_notification_logs_status_check 
            CHECK (status IN ('pending', 'sent', 'failed', 'queued', 'processing', 'sent_browser', 'sent_to_browser'));
    ELSE
        -- Add status column if it doesn't exist
        ALTER TABLE push_notification_logs ADD COLUMN status TEXT DEFAULT 'pending'
            CHECK (status IN ('pending', 'sent', 'failed', 'queued', 'processing', 'sent_browser', 'sent_to_browser'));
    END IF;
END $$;