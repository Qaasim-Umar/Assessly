import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Analytics service is not configured" }, 500);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const token = authHeader.slice("Bearer ".length);
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Your session has expired. Sign in again." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("admin_profiles")
      .select("is_general_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("General admin profile lookup failed", profileError);
      return jsonResponse({ error: "Could not verify general administrator access" }, 500);
    }
    if (!profile?.is_general_admin) {
      return jsonResponse({ error: "General administrator access is required" }, 403);
    }

    const { data, error } = await adminClient.rpc(
      "get_general_admin_cbt_analytics_snapshot",
      {
        p_requesting_user_id: user.id,
      },
    );

    if (error) {
      console.error("CBT analytics snapshot lookup failed", error);
      return jsonResponse({ error: "Could not load the daily CBT analytics snapshot" }, 500);
    }

    return jsonResponse(data);
  } catch (error) {
    console.error("General admin analytics failed", error);
    return jsonResponse({ error: "Could not load CBT analytics" }, 500);
  }
});
