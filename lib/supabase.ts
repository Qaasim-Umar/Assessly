import { createClient } from "@supabase/supabase-js";

// These two public Supabase values are explicitly bundled in next.config.ts.
// Never add a Supabase secret/service-role key to that bundle.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Public content must not inherit a possibly expired user/admin session from
// localStorage. This client always uses the public key and never persists auth.
export const publicSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
