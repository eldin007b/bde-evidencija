-- Update send_custom_push function to not check push_settings table
-- This is part of the simplified push system where notifications are always enabled

CREATE OR REPLACE FUNCTION send_custom_push(
    p_message TEXT,
    p_title TEXT DEFAULT 'BD Evidencija',
    p_target_users TEXT[] DEFAULT NULL, -- NULL = svi aktivni
    p_target_type TEXT DEFAULT 'all' -- 'drivers', 'admins', 'all'
)
RETURNS TABLE(sent_count INTEGER, failed_count INTEGER) AS $$
DECLARE
    result_sent INTEGER := 0;
    result_failed INTEGER := 0;
BEGIN
    -- Push notifikacije su uvijek omogućene u uprošćenom sistemu
    
    -- Pozovi Edge Function za slanje custom push-a
    BEGIN
        PERFORM http_post(
            'https://uwgwsrswmdvbfdpkskmg.supabase.co/functions/v1/auto-push',
            jsonb_build_object(
                'type', 'custom_message',
                'title', p_title,
                'message', p_message,
                'target_users', COALESCE(p_target_users, ARRAY[]::TEXT[]),
                'target_type', p_target_type
            ),
            'application/json',
            jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
            )
        );
        result_sent := 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to send push notification: %', SQLERRM;
        result_failed := 1;
    END;
    
    RETURN QUERY SELECT result_sent, result_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;