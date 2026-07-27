import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import webPush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@chorequest.app';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({
          error:
            'VAPID keys (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) not set in Edge Function secrets',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Configure VAPID details for RFC 8292 signing & payload encryption
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const { family_id, title, body, url, tag, exclude_device_id } = await req.json();

    if (!family_id || !title) {
      return new Response(JSON.stringify({ error: 'family_id and title are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch target family devices that have a push subscription registered
    let query = supabase
      .from('devices')
      .select('id, push_subscription')
      .eq('family_id', family_id)
      .not('push_subscription', 'is', null);

    if (exclude_device_id) {
      query = query.neq('id', exclude_device_id);
    }

    const { data: devices, error: devErr } = await query;

    if (devErr) throw devErr;

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: 'No target push devices found', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sending Web Push to ${devices.length} devices for family ${family_id}...`);

    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/',
      tag: tag || `push-${Date.now()}`,
      icon: '/pwa-192x192.png',
      badge: '/favicon-196.png',
    });

    let successCount = 0;

    for (const dev of devices) {
      const sub = dev.push_subscription;
      if (!sub || !sub.endpoint) continue;

      try {
        // Send VAPID encrypted push notification using npm:web-push
        await webPush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        console.error(`Failed to deliver push to device ${dev.id}:`, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired/invalidated by FCM/Apple, clean up database row
          await supabase.from('devices').update({ push_subscription: null }).eq('id', dev.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, targetCount: devices.length, deliveredCount: successCount }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-push edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
