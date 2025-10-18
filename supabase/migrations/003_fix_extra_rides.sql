-- Fix extra_rides table schema issue
-- Drop and recreate the table with proper structure

DROP TABLE IF EXISTS extra_rides CASCADE;

CREATE TABLE extra_rides (
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

-- Enable RLS
ALTER TABLE extra_rides ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view own rides" ON extra_rides
    FOR SELECT USING (true);

CREATE POLICY "Drivers can insert own rides" ON extra_rides
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all rides" ON extra_rides
    FOR ALL USING (true);

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_push_extra_ride_events ON extra_rides;
CREATE TRIGGER auto_push_extra_ride_events
    AFTER INSERT OR UPDATE ON extra_rides
    FOR EACH ROW
    EXECUTE FUNCTION notify_extra_ride_event();

-- Update updated_at trigger
CREATE TRIGGER update_extra_rides_updated_at 
    BEFORE UPDATE ON extra_rides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Extra rides table fixed successfully!' as status;