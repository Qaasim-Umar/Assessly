import { supabase } from "./supabase";

// ── Helpers ────────────────────────────────────────────────────────────────────
function toStudentEmail(username: string) {
  return `${username.trim().toLowerCase()}@assessly.student`;
}
function toAdminEmail(username: string) {
  return `${username.trim().toLowerCase()}@assessly.admin`;
}
function generateSchoolCode(): string {
  // 6 alphanumeric characters, uppercase (avoids O/0 confusion)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// ── Session ────────────────────────────────────────────────────────────────────
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ── Admin Auth ─────────────────────────────────────────────────────────────────
export async function signUpAdmin(
  username: string,
  password: string,
): Promise<void> {
  const email = toAdminEmail(username);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error("Account created but no user ID returned.");

  const schoolCode = generateSchoolCode();
  const { error: profileErr } = await supabase
    .from("admin_profiles")
    .insert({ id: userId, username: username.trim(), school_code: schoolCode });
  if (profileErr) throw new Error(profileErr.message);
}

export async function signInAdmin(
  username: string,
  password: string,
): Promise<void> {
  const email = toAdminEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error("Invalid username or password.");

  // Confirm they exist in admin_profiles (not a student account)
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No admin account found. Please sign up first.");
  }
}

export async function getAdminProfile(): Promise<{
  id: string;
  username: string;
  school_code: string;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("admin_profiles")
    .select("id, username, school_code")
    .eq("id", session.user.id)
    .single();
  return data ?? null;
}

// ── Student Auth ───────────────────────────────────────────────────────────────

export async function signUpStudent(
  displayName: string,
  username: string,
  password: string,
): Promise<void> {
  const uname = username.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("username", uname)
    .maybeSingle();
  if (existing) throw new Error("This phone number or username is already taken.");

  const { data, error } = await supabase.auth.signUp({
    email: toStudentEmail(uname),
    password,
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error("Account created but no user ID returned.");

  const { error: profileErr } = await supabase
    .from("student_profiles")
    .insert({ id: userId, username: uname, display_name: displayName.trim() });
  if (profileErr) throw new Error(profileErr.message);
}

export async function signInStudent(
  username: string,
  password: string,
): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toStudentEmail(username.trim()),
    password,
  });
  if (error) throw new Error("Invalid phone number/username or password.");

  const { data: profile } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No student account found.");
  }
}

export async function getStudentProfile(): Promise<{
  id: string;
  username: string;
  display_name: string;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("student_profiles")
    .select("id, username, display_name")
    .eq("id", session.user.id)
    .single();
  return data ?? null;
}

export async function studentSignOut(): Promise<void> {
  await supabase.auth.signOut();
}
