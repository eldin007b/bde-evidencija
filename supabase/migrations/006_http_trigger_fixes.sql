-- Final fixes for HTTP extension and trigger stability
-- This ensures http_post function is available for triggers

-- Enable http extension explicitly  
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;

-- Alternative function that doesn't require http extension for initial testing
CREATE OR REPLACE FUNCTION trigger_push_via_function(
    notification_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN := false;
BEGIN
    -- This function can be called by triggers to queue notifications
    -- For now, it just logs to push_notification_logs
    
    INSERT INTO push_notification_logs (
        user_id,
        user_type, 
        title,
        body,
        type,
        data,
        status
    ) VALUES (
        notification_data->>'driver_id',
        'driver',
        'BD Evidencija Notification',
        notification_data->>'message',
        notification_data->>'type',
        notification_data,
        'queued'
    );
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers to use this function as fallback
CREATE OR REPLACE FUNCTION notify_new_delivery_data()
RETURNS TRIGGER AS $$
DECLARE
    driver_name TEXT;
    delivery_count INTEGER;
    is_push_enabled BOOLEAN;
    notification_data JSONB;
BEGIN
    -- Provjeri da li su push notifikacije omogućene
    SELECT push_enabled INTO is_push_enabled 
    FROM push_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT is_push_enabled THEN
        RETURN NEW;
    END IF;
    
    -- Dohvati ime vozača
    SELECT ime INTO driver_name 
    FROM drivers 
    WHERE tura = NEW.driver AND aktivan = true;
    
    IF driver_name IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Brojka dostava za danas
    delivery_count := COALESCE(NEW.produktivitaet_stops, 0);
    
    -- Pripremi notification data
    notification_data := jsonb_build_object(
        'type', 'daily_data',
        'driver_id', NEW.driver,
        'driver_name', driver_name,
        'delivery_count', delivery_count,
        'date', NEW.date,
        'earnings', COALESCE(NEW.produktivitaet_stops * 18, 0),
        'message', driver_name || ' ima ' || delivery_count || ' dostava danas!'
    );
    
    -- Try http_post first, fallback to logging
    BEGIN
        PERFORM extensions.http_post(
            'https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push',
            notification_data,
            'application/json',
            jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
            )
        );
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to logging function
        PERFORM trigger_push_via_function(notification_data);
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS auto_push_new_delivery ON deliveries;
CREATE TRIGGER auto_push_new_delivery
    AFTER INSERT ON deliveries
    FOR EACH ROW
    WHEN (NEW.produktivitaet_stops > 0)
    EXECUTE FUNCTION notify_new_delivery_data();

SELECT 'HTTP extension and trigger fixes applied!' as status;