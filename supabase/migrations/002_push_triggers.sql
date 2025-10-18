-- 🚀 BD Evidencija Push Notifications - Additional Setup
-- This script adds only missing components

-- Create extra_rides table if not exists
CREATE TABLE IF NOT EXISTS extra_rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    ride_details JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for extra_rides if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'extra_rides' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE extra_rides ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for extra_rides if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'extra_rides' 
        AND policyname = 'Drivers can view own rides'
    ) THEN
        CREATE POLICY "Drivers can view own rides" ON extra_rides
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'extra_rides' 
        AND policyname = 'Drivers can insert own rides'
    ) THEN
        CREATE POLICY "Drivers can insert own rides" ON extra_rides
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'extra_rides' 
        AND policyname = 'Admins can view all rides'
    ) THEN
        CREATE POLICY "Admins can view all rides" ON extra_rides
            FOR ALL USING (true);
    END IF;
END $$;

-- Create http extension if not exists
CREATE EXTENSION IF NOT EXISTS http;

-- Novi trigger funkcije (with DROP IF EXISTS)
-- 📊 TRIGGER: Novi podaci za vozače (dnevne dostave)
CREATE OR REPLACE FUNCTION notify_new_delivery_data()
RETURNS TRIGGER AS $$
DECLARE
    driver_name TEXT;
    delivery_count INTEGER;
    is_push_enabled BOOLEAN;
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
    
    -- Pozovi Edge Function za slanje push-a
    PERFORM http_post(
        'https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push',
        jsonb_build_object(
            'type', 'daily_data',
            'driver_id', NEW.driver,
            'driver_name', driver_name,
            'delivery_count', delivery_count,
            'date', NEW.date,
            'earnings', COALESCE(NEW.produktivitaet_stops * 18, 0) -- Aproximacija zarade
        ),
        'application/json',
        jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 💰 TRIGGER: Nova platna lista uploadovana
CREATE OR REPLACE FUNCTION notify_new_payroll()
RETURNS TRIGGER AS $$
DECLARE
    is_push_enabled BOOLEAN;
    settings_payroll JSONB;
BEGIN
    -- Provjeri da li su push notifikacije omogućene
    SELECT push_enabled, payroll_notifications 
    INTO is_push_enabled, settings_payroll
    FROM push_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT is_push_enabled OR NOT (settings_payroll->>'enabled')::boolean THEN
        RETURN NEW;
    END IF;
    
    -- Pozovi Edge Function za slanje push-a
    PERFORM http_post(
        'https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push',
        jsonb_build_object(
            'type', 'payroll_available',
            'driver_name', NEW.driver_name,
            'file_name', NEW.file_name,
            'neto_amount', COALESCE(NEW.neto, 0),
            'bruto_amount', COALESCE(NEW.bruto, 0),
            'created_at', NEW.created_at
        ),
        'application/json',
        jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🚗 Extra rides trigger function
CREATE OR REPLACE FUNCTION notify_extra_ride_event()
RETURNS TRIGGER AS $$
DECLARE
    is_push_enabled BOOLEAN;
    settings_extra JSONB;
    notification_type TEXT;
    target_user TEXT;
    target_type TEXT;
BEGIN
    -- Provjeri da li su push notifikacije omogućene
    SELECT push_enabled, extra_rides_notifications 
    INTO is_push_enabled, settings_extra
    FROM push_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT is_push_enabled OR NOT (settings_extra->>'enabled')::boolean THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Različite notifikacije ovisno o operation
    IF TG_OP = 'INSERT' THEN
        -- Nova extra vožnja - notifikuj admin-a
        notification_type := 'extra_ride_request';
        target_user := 'admin';
        target_type := 'admin';
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        -- Odobrena/odbijena extra vožnja - notifikuj vozača
        notification_type := 'extra_ride_' || NEW.status;
        target_user := NEW.driver_id;
        target_type := 'driver';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Pozovi Edge Function za slanje push-a
    PERFORM http_post(
        'https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push',
        jsonb_build_object(
            'type', notification_type,
            'driver_id', COALESCE(NEW.driver_id, OLD.driver_id),
            'driver_name', COALESCE(NEW.driver_name, OLD.driver_name),
            'ride_details', COALESCE(NEW.ride_details, OLD.ride_details),
            'status', COALESCE(NEW.status, OLD.status),
            'target_user', target_user,
            'target_type', target_type,
            'reviewed_by', NEW.reviewed_by,
            'notes', NEW.notes
        ),
        'application/json',
        jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (with DROP IF EXISTS)
DROP TRIGGER IF EXISTS auto_push_new_delivery ON deliveries;
CREATE TRIGGER auto_push_new_delivery
    AFTER INSERT ON deliveries
    FOR EACH ROW
    WHEN (NEW.produktivitaet_stops > 0) -- Samo kad ima stvarnih dostava
    EXECUTE FUNCTION notify_new_delivery_data();

DROP TRIGGER IF EXISTS auto_push_new_payroll ON payroll_amounts;
CREATE TRIGGER auto_push_new_payroll
    AFTER INSERT ON payroll_amounts
    FOR EACH ROW
    WHEN (NEW.neto > 0 OR NEW.bruto > 0) -- Samo kad ima validne iznose
    EXECUTE FUNCTION notify_new_payroll();

DROP TRIGGER IF EXISTS auto_push_extra_ride_events ON extra_rides;
CREATE TRIGGER auto_push_extra_ride_events
    AFTER INSERT OR UPDATE ON extra_rides
    FOR EACH ROW
    EXECUTE FUNCTION notify_extra_ride_event();

-- 📢 CUSTOM PUSH: Funkcija za admin custom poruke
CREATE OR REPLACE FUNCTION send_custom_push(
    p_message TEXT,
    p_title TEXT DEFAULT 'BD Evidencija',
    p_target_users TEXT[] DEFAULT NULL, -- NULL = svi aktivni
    p_target_type TEXT DEFAULT 'all' -- 'drivers', 'admins', 'all'
)
RETURNS TABLE(sent_count INTEGER, failed_count INTEGER) AS $$
DECLARE
    is_push_enabled BOOLEAN;
    result_sent INTEGER := 0;
    result_failed INTEGER := 0;
BEGIN
    -- Provjeri da li su push notifikacije omogućene
    SELECT push_enabled INTO is_push_enabled 
    FROM push_settings 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT is_push_enabled THEN
        RETURN QUERY SELECT 0, 1;
        RETURN;
    END IF;
    
    -- Pozovi Edge Function za slanje custom push-a
    BEGIN
        PERFORM http_post(
            'https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/auto-push',
            jsonb_build_object(
                'type', 'custom_message',
                'title', p_title,
                'message', p_message,
                'target_users', COALESCE(p_target_users, ARRAY[]::TEXT[]),
                'target_type', p_target_type
            ),
            'application/json',
            jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
            )
        );
        result_sent := 1;
    EXCEPTION WHEN OTHERS THEN
        result_failed := 1;
    END;
    
    RETURN QUERY SELECT result_sent, result_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 Helper funkcije za testiranje
CREATE OR REPLACE FUNCTION test_push_notification(
    p_type TEXT,
    p_driver_id TEXT DEFAULT 'test_driver'
)
RETURNS TEXT AS $$
BEGIN
    CASE p_type
        WHEN 'daily_data' THEN
            INSERT INTO deliveries (driver, date, produktivitaet_stops) 
            VALUES (p_driver_id, CURRENT_DATE, 25);
            RETURN 'Test daily data notification sent';
            
        WHEN 'payroll' THEN
            INSERT INTO payroll_amounts (driver_name, file_name, neto, bruto) 
            VALUES ('test vozač', 'test_10_2025.pdf', 1250.50, 1680.75);
            RETURN 'Test payroll notification sent';
            
        WHEN 'extra_ride' THEN
            INSERT INTO extra_rides (driver_id, driver_name, ride_details) 
            VALUES (p_driver_id, 'Test Vozač', '{"destination": "Test lokacija", "time": "14:30"}');
            RETURN 'Test extra ride notification sent';
            
        ELSE
            RETURN 'Unknown notification type: ' || p_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 📊 Views za monitoring
CREATE OR REPLACE VIEW push_trigger_stats AS
SELECT 
    'deliveries' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE date >= CURRENT_DATE) as today
FROM deliveries
WHERE produktivitaet_stops > 0

UNION ALL

SELECT 
    'payroll_amounts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
FROM payroll_amounts

UNION ALL

SELECT 
    'extra_rides' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
FROM extra_rides;

-- Set configuration variables for triggers
SELECT set_config('app.supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbHRwaXVwYmZvcHl2dWlxZmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mjc3MzcsImV4cCI6MjA2NTUwMzczN30.suu_OSbTBSEkM3YMiPDFIAgDnX3bDavcD8BX4ZfYZxw', false);

-- Uspješno kreiranje
SELECT '🚀 BD Evidencija Push Triggers and Functions Setup Complete! 🎉' as status;