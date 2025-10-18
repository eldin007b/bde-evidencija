-- Update send_custom_push to use the database function instead of Edge function
-- This provides a fallback when Edge function has authentication issues

CREATE OR REPLACE FUNCTION send_custom_push(
    p_message TEXT,
    p_title TEXT DEFAULT 'BD Evidencija',
    p_target_users TEXT[] DEFAULT NULL,
    p_target_type TEXT DEFAULT 'all'
)
RETURNS TABLE(sent_count INTEGER, failed_count INTEGER) AS $$
DECLARE
    notification_data JSONB;
    result JSONB;
    result_sent INTEGER := 0;
    result_failed INTEGER := 0;
BEGIN
    -- Build notification data
    notification_data := jsonb_build_object(
        'type', 'custom_message',
        'title', p_title,
        'message', p_message,
        'target_users', CASE 
            WHEN p_target_users IS NOT NULL THEN to_jsonb(p_target_users)
            ELSE NULL
        END,
        'target_type', p_target_type
    );

    -- Call our database push notification function
    SELECT send_push_notifications(notification_data) INTO result;
    
    -- Check if successful
    IF (result->>'success')::boolean THEN
        result_sent := COALESCE((result->>'notifications_created')::integer, 0);
        
        -- If no notifications were created, consider it a failure
        IF result_sent = 0 THEN
            result_failed := 1;
            result_sent := 0;
        END IF;
    ELSE
        result_failed := 1;
        RAISE WARNING 'Push notification failed: %', result->>'error';
    END IF;
    
    RETURN QUERY SELECT result_sent, result_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;