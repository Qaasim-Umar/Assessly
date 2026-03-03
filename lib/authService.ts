import { supabase } from "./supabase";

// ── Helpers ────────────────────────────────────────────────────────────────────
function toStudentEmail(username: string) {
  return `${username.trim().toLowerCase()}@assessly.internal`;
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
/**
 * Unified student login — validates the school code, then either:
 *  - signs in an existing account, or
 *  - auto-creates a new account on first access.
 */
export async function studentLogin(
  username: string,
  password: string,
  schoolCode: string,
): Promise<void> {
  const code = schoolCode.trim().toUpperCase();

  // 1. Validate school code exists (using anon key — select is open to all)
  const { data: adminRow } = await supabase
    .from("admin_profiles")
    .select("school_code")
    .eq("school_code", code)
    .single();
  if (!adminRow)
    throw new Error("Invalid school code. Check with your teacher.");

  const email = toStudentEmail(username);

  // 2. Try sign in
  const { data: signInData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (!signInErr && signInData.user) {
    // Signed in — upsert profile with latest school code
    await supabase
      .from("profiles")
      .upsert(
        {
          id: signInData.user.id,
          full_name: username.trim(),
          school_code: code,
        },
        { onConflict: "id" },
      );
    return;
  }

  // 3. Sign up might have failed because account doesn't exist yet
  //    Try creating the account. If the email is already taken → wrong password.
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpErr) {
    // "User already registered" → account exists → wrong password
    throw new Error("Invalid username or password.");
  }

  const userId = signUpData.user?.id;
  if (!userId) throw new Error("Sign-up succeeded but no user ID returned.");

  // Insert profile for the new student
  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: username.trim(), school_code: code });
  if (profileErr) throw new Error(profileErr.message);
}

// ── Student Profile ────────────────────────────────────────────────────────────
export async function getProfile(): Promise<{
  id: string;
  full_name: string;
  school_code: string;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, school_code")
    .eq("id", session.user.id)
    .single();
  return data as { id: string; full_name: string; school_code: string } | null;
}

// ── Legacy ─────────────────────────────────────────────────────────────────────
// Keep old signUp/signIn for any legacy callers (attempt page uses getProfile, no signIn)
export { studentLogin as signIn };
export async function signUp(
  username: string,
  password: string,
): Promise<void> {
  // No-op legacy shim — new flow uses studentLogin
  throw new Error("Use studentLogin() with a school code instead.");
}
