-- 🔔 Push Subscriptions Table - Simple Version
-- Alternativa bez foreign key constraint za slučaj problema

-- Drop existing table
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- Create table without foreign key constraint (safer)
CREATE TABLE public.push_subscriptions (
  id SERIAL PRIMARY KEY,
  
  -- Link to drivers (without foreign key constraint)
  driver_id INTEGER, -- References drivers.id but no constraint
  driver_tura TEXT,  -- Backup reference to drivers.tura
  
  -- Push subscription data
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Device/browser information
  user_agent TEXT,
  platform TEXT,
  browser TEXT,
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_driver_id ON public.push_subscriptions(driver_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- Enable Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations" ON public.push_subscriptions;

-- RLS Policy: Allow all operations
CREATE POLICY "Allow all operations" ON public.push_subscriptions
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Test query
SELECT 'push_subscriptions table created successfully' as status;