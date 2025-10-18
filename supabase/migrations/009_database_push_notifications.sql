-- Create a simplified push notification function that works directly in the database
-- This bypasses the Edge function authentication issues

CREATE OR REPLACE FUNCTION send_push_notifications(
    notification_data JSONB
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    subscription RECORD;
    notification_count INTEGER := 0;
    target_users TEXT[];
    user_rec RECORD;
BEGIN
    -- Log the incoming request
    INSERT INTO push_notification_logs (
        notification_type,
        target_user_id,
        title,
        message,
        status,
        created_at
    ) VALUES (
        notification_data->>'type',
        COALESCE(notification_data->>'user_id', 'system'),
        COALESCE(notification_data->>'title', 'BD Evidencija'),
        notification_data->>'message',
        'processing',
        NOW()
    );

    -- Handle custom messages
    IF notification_data->>'type' = 'custom_message' THEN
        -- Determine target users
        IF notification_data->'target_users' IS NOT NULL AND jsonb_array_length(notification_data->'target_users') > 0 THEN
            -- Use specified users
            SELECT array_agg(value::text) INTO target_users 
            FROM jsonb_array_elements_text(notification_data->'target_users');
        ELSE
            -- Get users based on target_type
            IF notification_data->>'target_type' = 'drivers' THEN
                SELECT array_agg(DISTINCT user_id) INTO target_users
                FROM push_subscriptions 
                WHERE user_type = 'driver' AND active = true;
            ELSIF notification_data->>'target_type' = 'admins' THEN
                SELECT array_agg(DISTINCT user_id) INTO target_users
                FROM push_subscriptions 
                WHERE user_type = 'admin' AND active = true;
            ELSE
                -- All users
                SELECT array_agg(DISTINCT user_id) INTO target_users
                FROM push_subscriptions 
                WHERE active = true;
            END IF;
        END IF;

        -- Create notification records for each target user
        FOR user_rec IN 
            SELECT UNNEST(target_users) AS user_id
        LOOP
            -- Log each notification attempt
            INSERT INTO push_notification_logs (
                notification_type,
                target_user_id,
                title,
                message,
                status,
                metadata,
                created_at
            ) VALUES (
                'custom_message',
                user_rec.user_id,
                notification_data->>'title',
                notification_data->>'message',
                'queued',
                jsonb_build_object(
                    'target_type', notification_data->>'target_type',
                    'sent_via', 'database_function'
                ),
                NOW()
            );
            
            notification_count := notification_count + 1;
        END LOOP;
    END IF;

    -- Return success response
    result := jsonb_build_object(
        'success', true,
        'notifications_created', notification_count,
        'message', format('Queued %s notifications for processing', notification_count)
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO push_notification_logs (
        notification_type,
        target_user_id,
        title,
        message,
        status,
        error_message,
        created_at
    ) VALUES (
        COALESCE(notification_data->>'type', 'unknown'),
        'system',
        'Error',
        'Failed to process notification',
        'failed',
        SQLERRM,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;