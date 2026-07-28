import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import webPush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (!supabaseUrl || !supabaseServiceKey || !vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all secondary devices with active push subscriptions
    const { data: devices, error: devErr } = await supabase
      .from('devices')
      .select('id, push_subscription, role')
      .neq('role', 'main')
      .not('push_subscription', 'is', null);

    if (devErr) throw devErr;

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: 'No secondary devices to ping', pinged: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📡 Pinging ${devices.length} secondary devices for liveness...`);

    const payload = JSON.stringify({
      tag: 'liveness-ping',
      silent: true,
    });

    let pinged = 0;
    let staleCount = 0;

    for (const dev of devices) {
      const sub = dev.push_subscription;
      if (!sub || !sub.endpoint) continue;

      pinged++;
      try {
        await webPush.sendNotification(sub, payload);
        // On 200 OK, update last_seen_at
        await supabase
          .from('devices')
          .update({ last_seen_at: new Date().toISOString(), is_stale: false })
          .eq('id', dev.id);
      } catch (err: any) {
        console.error(`Liveness ping failed for device ${dev.id}:`, err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription invalidated -> mark device as stale
          staleCount++;
          await supabase
            .from('devices')
            .update({ push_subscription: null, is_stale: true })
            .eq('id', dev.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, pinged, staleDetected: staleCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in ping-devices edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
