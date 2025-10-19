-- Fix Row Level Security policies for push_subscriptions table

-- First, check if RLS is enabled and disable it temporarily if needed
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated and matches the driver_id or is admin
        auth.uid() IS NOT NULL AND (
            driver_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM drivers 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Policy 2: Allow users to view their own subscriptions
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
    FOR SELECT USING (
        -- Allow if user is authenticated and matches the driver_id or is admin
        auth.uid() IS NOT NULL AND (
            driver_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM drivers 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Policy 3: Allow users to update their own subscriptions
CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
    FOR UPDATE USING (
        -- Allow if user is authenticated and matches the driver_id or is admin
        auth.uid() IS NOT NULL AND (
            driver_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM drivers 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Policy 4: Allow users to delete their own subscriptions
CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
    FOR DELETE USING (
        -- Allow if user is authenticated and matches the driver_id or is admin
        auth.uid() IS NOT NULL AND (
            driver_id::text = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM drivers 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Alternative: If the above doesn't work due to auth complexities, 
-- we can temporarily disable RLS entirely for push_subscriptions
-- Uncomment the line below if needed:
-- ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;