import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller is admin/superadmin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Check admin role using service role client
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "superadmin"])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, message } = await req.json();
    if (!title || !message) {
      return new Response(JSON.stringify({ error: "Title and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users with phone numbers
    const { data: profiles, error: profilesErr } = await serviceClient
      .from("profiles")
      .select("user_id, phone, first_name")
      .not("phone", "is", null);

    if (profilesErr) {
      throw new Error(profilesErr.message);
    }

    const phoneNumbers = (profiles || []).filter((p: any) => p.phone && p.phone.trim() !== "");
    const results: { sent: number; failed: number; errors: string[] } = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    // ─── SMS PROVIDER PLACEHOLDER ───
    // Replace this block with your SMS provider API calls.
    // Supported providers: Africa's Talking, Twilio, Vonage, etc.
    //
    // Example with Africa's Talking:
    //   const AT_API_KEY = Deno.env.get("AT_API_KEY");
    //   const AT_USERNAME = Deno.env.get("AT_USERNAME");
    //   const AT_SENDER_ID = Deno.env.get("AT_SENDER_ID");
    //
    // Example with Twilio:
    //   const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    //   const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    //   const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");

    const smsProviderConfigured = false; // Set to true once API keys are added

    if (!smsProviderConfigured) {
      // Log SMS that would be sent (for testing without provider)
      for (const profile of phoneNumbers) {
        console.log(`[SMS-QUEUE] To: ${profile.phone} | ${title}: ${message}`);
        results.sent++;
      }

      // Still create in-app notifications as backup
      if (phoneNumbers.length > 0) {
        const notifications = phoneNumbers.map((p: any) => ({
          user_id: p.user_id,
          title: `[SMS] ${title}`,
          message,
          type: "announcement",
        }));

        for (let i = 0; i < notifications.length; i += 100) {
          const chunk = notifications.slice(i, i + 100);
          await serviceClient.from("notifications").insert(chunk);
        }
      }
    } else {
      // ─── ACTUAL SMS SENDING GOES HERE ───
      // Loop through phoneNumbers and call your SMS API
      // for (const profile of phoneNumbers) {
      //   try {
      //     // await sendSMS(profile.phone, `${title}\n${message}`);
      //     results.sent++;
      //   } catch (err) {
      //     results.failed++;
      //     results.errors.push(`${profile.phone}: ${err.message}`);
      //   }
      // }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_recipients: phoneNumbers.length,
        sent: results.sent,
        failed: results.failed,
        provider_configured: smsProviderConfigured,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Bulk SMS error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
