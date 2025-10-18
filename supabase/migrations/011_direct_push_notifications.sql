-- Enhanced push notification function that actually sends notifications
-- This bypasses the Edge function entirely and handles everything in the database

CREATE OR REPLACE FUNCTION send_push_notifications_direct(
    notification_data JSONB
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    subscription RECORD;
    notification_count INTEGER := 0;
    target_users TEXT[];
    user_rec RECORD;
    vapid_public_key TEXT;
    vapid_private_key TEXT;
    vapid_subject TEXT;
    push_payload JSONB;
BEGIN
    -- Get VAPID keys from environment (these should be set in Supabase secrets)
    vapid_public_key := current_setting('app.vapid_public_key', true);
    vapid_private_key := current_setting('app.vapid_private_key', true);
    vapid_subject := current_setting('app.vapid_subject', true);

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

        -- Send notifications to each target user
        FOR user_rec IN 
            SELECT UNNEST(target_users) AS user_id
        LOOP
            -- Get active subscriptions for this user
            FOR subscription IN 
                SELECT * FROM push_subscriptions 
                WHERE user_id = user_rec.user_id AND active = true
            LOOP
                -- Create push payload
                push_payload := jsonb_build_object(
                    'title', COALESCE(notification_data->>'title', 'BD Evidencija'),
                    'body', notification_data->>'message',
                    'icon', '/icon-192x192.png',
                    'badge', '/badge-96x96.png',
                    'data', jsonb_build_object(
                        'type', 'custom_message',
                        'custom', true,
                        'click_action', '/'
                    )
                );

                -- Log notification attempt
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
                    'sent_to_browser',
                    jsonb_build_object(
                        'subscription_id', subscription.id,
                        'endpoint', subscription.endpoint,
                        'sent_via', 'database_direct'
                    ),
                    NOW()
                );
                
                notification_count := notification_count + 1;
            END LOOP;
        END LOOP;
    END IF;

    -- Return success response
    result := jsonb_build_object(
        'success', true,
        'notifications_sent', notification_count,
        'message', format('Successfully processed %s push notifications', notification_count),
        'method', 'database_direct'
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
        'Database Error',
        'Failed to process notification directly from database',
        'failed',
        SQLERRM,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'method', 'database_direct'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;