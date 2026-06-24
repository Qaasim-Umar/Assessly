import { supabase } from "./supabase";

const EMAIL_SUFFIX = "@assessly.generaladmin";

export async function signInGeneralAdmin(username: string, password: string) {
  const email = `${username.trim().toLowerCase()}${EMAIL_SUFFIX}`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Verify this user actually has is_general_admin = true
  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("is_general_admin")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile?.is_general_admin) {
    await supabase.auth.signOut();
    throw new Error("Invalid credentials.");
  }

  return data;
}

export async function signOutGeneralAdmin() {
  await supabase.auth.signOut();
}

export async function getGeneralAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_general_admin")
    .eq("id", session.user.id)
    .single();

  return profile?.is_general_admin ? session : null;
}
