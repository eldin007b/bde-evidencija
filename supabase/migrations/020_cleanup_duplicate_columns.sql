-- Fix duplicate columns in push_notification_logs
-- Drop the old user_id column since we have target_user_id

DO $$ 
BEGIN
    -- If both user_id and target_user_id exist, drop user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='user_id')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='target_user_id') THEN
        
        -- Drop the old user_id column
        ALTER TABLE push_notification_logs DROP COLUMN user_id;
        
        -- Make target_user_id nullable to avoid constraint issues
        ALTER TABLE push_notification_logs ALTER COLUMN target_user_id DROP NOT NULL;
        
        RAISE NOTICE 'Dropped duplicate user_id column, kept target_user_id';
    ELSE
        RAISE NOTICE 'No duplicate columns found';
    END IF;
    
    -- Also clean up any other duplicate columns we might have
    -- Drop old 'type' column if we have 'notification_type'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='type')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='notification_type') THEN
        
        ALTER TABLE push_notification_logs DROP COLUMN type;
        RAISE NOTICE 'Dropped duplicate type column, kept notification_type';
    END IF;
    
    -- Drop old 'body' column if we have 'message'  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='body')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema='public' AND table_name='push_notification_logs' AND column_name='message') THEN
        
        ALTER TABLE push_notification_logs DROP COLUMN body;
        RAISE NOTICE 'Dropped duplicate body column, kept message';
    END IF;
END $$;