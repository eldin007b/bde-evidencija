import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 🚀 Auto Push Edge Function
// Automatski šalje push notifikacije na database trigger events

// Deno global declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

interface PushPayload {
  type: string
  driver_id?: string
  driver_name?: string
  delivery_count?: number
  date?: string
  earnings?: number
  file_name?: string
  neto_amount?: number
  bruto_amount?: number
  ride_details?: any
  status?: string
  target_user?: string
  target_type?: string
  title?: string
  message?: string
  target_users?: string[]
  reviewed_by?: string
  notes?: string
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: PushPayload = await req.json()
    console.log('🔔 Auto Push Triggered:', payload.type, payload)

    // Push notifications are always enabled (simplified system)
    console.log('✅ Push notifications enabled - simplified system')

    // Generate notification based on type
    let notifications: Array<{
      user_id: string
      user_type: string
      title: string
      body: string
      data: any
    }> = []

    switch (payload.type) {
      case 'daily_data':
        notifications.push({
          user_id: payload.driver_id!,
          user_type: 'driver',
          title: '📊 Podaci za danas',
          body: `${payload.delivery_count} dostava • ${payload.earnings}€ zarada`,
          data: {
            type: 'daily_statistics',
            delivery_count: payload.delivery_count,
            earnings: payload.earnings,
            date: payload.date,
            click_action: '/statistics'
          }
        })
        break

      case 'payroll_available':
        notifications.push({
          user_id: payload.driver_name!,
          user_type: 'driver',
          title: '💰 Nova platna lista',
          body: `Dostupna je nova platna lista • Neto: ${payload.neto_amount}€`,
          data: {
            type: 'payroll_available',
            file_name: payload.file_name,
            neto_amount: payload.neto_amount,
            bruto_amount: payload.bruto_amount,
            click_action: '/payroll'
          }
        })
        break

      case 'extra_ride_request':
        notifications.push({
          user_id: 'admin',
          user_type: 'admin',
          title: '🚗 Nova extra vožnja',
          body: `${payload.driver_name} je dodao zahtev za extra vožnju`,
          data: {
            type: 'extra_ride_request',
            driver_id: payload.driver_id,
            driver_name: payload.driver_name,
            ride_details: payload.ride_details,
            click_action: '/admin/extra-rides'
          }
        })
        break

      case 'extra_ride_approved':
      case 'extra_ride_rejected':
        const status = payload.status === 'approved' ? 'odobrena' : 'odbijena'
        const emoji = payload.status === 'approved' ? '✅' : '❌'
        
        notifications.push({
          user_id: payload.driver_id!,
          user_type: 'driver',
          title: `${emoji} Extra vožnja ${status}`,
          body: `Vaš zahtev za extra vožnju je ${status}`,
          data: {
            type: 'extra_ride_response',
            status: payload.status,
            ride_details: payload.ride_details,
            reviewed_by: payload.reviewed_by,
            notes: payload.notes,
            click_action: '/extra-rides'
          }
        })
        break

      case 'custom_message':
        // Custom message from admin
        console.log(`🔍 STARTING custom_message case for target_type: ${payload.target_type}`)
        let targetUsers: string[] = []
        
        if (payload.target_users && payload.target_users.length > 0) {
          console.log(`🔍 Using specified target_users:`, payload.target_users)
          targetUsers = payload.target_users
        } else {
          // Get all active users based on target_type
          console.log(`🔍 Getting all users for target_type: ${payload.target_type}`)
          let query = supabaseClient.from('push_subscriptions').select('driver_id, user_id, driver_tura')
          
          if (payload.target_type === 'drivers') {
            console.log(`🔍 Filtering for drivers (not admin)`)
            query = query.not('driver_tura', 'eq', 'admin')
          } else if (payload.target_type === 'admins') {
            console.log(`🔍 Filtering for admins`)
            query = query.eq('driver_tura', 'admin')
          } else {
            console.log(`🔍 No filter applied - getting all users`)
          }
          
          console.log(`🔍 About to execute query...`)
          const { data: users, error: usersError } = await query
          console.log(`🔍 All users query result:`, users)
          console.log(`🔍 All users query error:`, usersError)
          
          // Use driver_id if available, otherwise user_id  
          targetUsers = users?.map((u: any) => String(u.driver_id || u.user_id)).filter((id: any) => id) || []
          console.log(`🔍 Target users after mapping:`, targetUsers)
        }
        
        console.log(`🔍 Creating ${targetUsers.length} notifications...`)
        notifications = targetUsers.map(userId => ({
          user_id: userId,
          user_type: payload.target_type === 'drivers' ? 'driver' : 
                    payload.target_type === 'admins' ? 'admin' : 'driver',
          title: payload.title || '📢 BD Evidencija',
          body: payload.message!,
          data: {
            type: 'custom_message',
            custom: true,
            click_action: '/'
          }
        }))
        console.log(`🔍 FINISHED custom_message case - created ${notifications.length} notifications`)
        break

      default:
        console.log('❌ Unknown notification type:', payload.type)
        return new Response(
          JSON.stringify({ success: false, reason: 'Unknown notification type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    console.log(`🔍 AFTER switch statement - notifications array length: ${notifications.length}`)
    console.log(`🔍 Notifications array:`, notifications)

    if (notifications.length === 0) {
      console.log('ℹ️ No notifications to send (disabled or no targets)')
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: 'No notifications to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notifications
    const results = await Promise.allSettled(
      notifications.map(async (notification) => {
        return await sendPushNotification(supabaseClient, notification)
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`✅ Push notifications sent: ${sent}/${notifications.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent,
        failed,
        total: notifications.length,
        type: payload.type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Auto Push Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 📱 Send push notification to specific user
async function sendPushNotification(
  supabaseClient: any,
  notification: {
    user_id: string
    user_type: string
    title: string
    body: string
    data: any
  }
) {
  const { user_id, user_type, title, body, data } = notification

  // Get user's push subscriptions
  console.log(`🔍 Looking for subscriptions for user_id: ${user_id} (type: ${typeof user_id})`)
  console.log(`🔍 Parsed user_id as int: ${parseInt(user_id) || 0}`)
  
  const { data: subscriptions, error: subError } = await supabaseClient
    .from('push_subscriptions')
    .select('*')
    .or(`driver_id.eq.${parseInt(user_id) || 0},user_id.eq.${user_id}`) // Convert to INT for driver_id!
    .eq('active', true)

  console.log(`🔍 Subscriptions query result:`, subscriptions)
  console.log(`🔍 Subscriptions query error:`, subError)
  console.log(`🔍 Found ${subscriptions?.length || 0} active subscriptions`)

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`📵 No active subscriptions for user: ${user_id}`)
    return { success: false, reason: 'No active subscriptions' }
  }

  // Log notification
  await supabaseClient
    .from('push_notification_logs')
    .insert({
      user_id,
      user_type,
      title,
      body,
      type: data.type,
      data,
      status: 'pending'
    })

  // Send to all user's devices
  const webPush = await import('npm:web-push') as any
  
  // Configure VAPID
  webPush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@bd-evidencija.com',
    Deno.env.get('VITE_VAPID_PUBLIC_KEY') || '',
    Deno.env.get('VAPID_PRIVATE_KEY') || ''
  )

  const pushPayload = JSON.stringify({
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      ...data,
      timestamp: Date.now(),
      user_id,
      notification_id: crypto.randomUUID()
    }
  })

  const promises = subscriptions.map(async (subscription: any) => {
    try {
      const endpoint = subscription.endpoint
      const keys = subscription.keys

      await webPush.sendNotification(
        {
          endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth
          }
        },
        pushPayload
      )

      // Update log as sent
      await supabaseClient
        .from('push_notification_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('title', title)
        .eq('status', 'pending')

      return { success: true }
    } catch (error) {
      console.error(`❌ Push failed for ${user_id}:`, error)
      
      // Update log as failed
      await supabaseClient
        .from('push_notification_logs')
        .update({ 
          status: 'failed', 
          error_message: (error as Error).message,
          sent_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('title', title)
        .eq('status', 'pending')

      return { success: false, error: (error as Error).message }
    }
  })

  const results = await Promise.allSettled(promises)
  const successCount = results.filter(r => r.status === 'fulfilled').length

  return { 
    success: successCount > 0, 
    sent: successCount, 
    total: subscriptions.length 
  }
}