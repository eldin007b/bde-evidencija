-- Fix the push_settings schema to match what trigger expects
-- Update the push_settings table to use the correct column names

-- Add the missing column for extra_rides_notifications
ALTER TABLE push_settings 
ADD COLUMN IF NOT EXISTS extra_rides_notifications JSONB DEFAULT '{
  "enabled": true,
  "adminAlerts": true,
  "driverUpdates": true,
  "statusChanges": true,
  "urgentOnly": false
}'::jsonb;

-- Update test function to avoid duplicates
CREATE OR REPLACE FUNCTION test_push_notification(
    p_type TEXT,
    p_driver_id TEXT DEFAULT 'test_driver'
)
RETURNS TEXT AS $$
DECLARE
    unique_id TEXT;
BEGIN
    unique_id := p_driver_id || '_' || extract(epoch from now())::text;
    
    CASE p_type
        WHEN 'daily_data' THEN
            -- Delete existing test records first
            DELETE FROM deliveries WHERE driver = unique_id;
            INSERT INTO deliveries (driver, date, produktivitaet_stops) 
            VALUES (unique_id, CURRENT_DATE, 25);
            RETURN 'Test daily data notification sent for ' || unique_id;
            
        WHEN 'payroll' THEN
            INSERT INTO payroll_amounts (driver_name, file_name, neto, bruto) 
            VALUES ('test vozač ' || unique_id, 'test_' || unique_id || '.pdf', 1250.50, 1680.75);
            RETURN 'Test payroll notification sent for ' || unique_id;
            
        WHEN 'extra_ride' THEN
            INSERT INTO extra_rides (driver_id, driver_name, ride_details) 
            VALUES (unique_id, 'Test Vozač', '{"destination": "Test lokacija", "time": "14:30"}');
            RETURN 'Test extra ride notification sent for ' || unique_id;
            
        ELSE
            RETURN 'Unknown notification type: ' || p_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

SELECT 'Schema fixes applied successfully!' as status;