import { supabase } from "./supabase";

const LEGACY_ADMIN_EMAIL_SUFFIX = "@assessly.admin";

export type AdminProfile = {
  id: string;
  username: string;
  school_code: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function toStudentEmail(username: string) {
  return `${username.trim().toLowerCase()}@assessly.student`;
}
function toAdminEmail(username: string) {
  return `${username.trim().toLowerCase()}${LEGACY_ADMIN_EMAIL_SUFFIX}`;
}

function isEmail(value: string) {
  return value.includes("@");
}

function isLegacyAdminEmail(email?: string | null) {
  return email?.toLowerCase().endsWith(LEGACY_ADMIN_EMAIL_SUFFIX) ?? false;
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
  email: string,
  password: string,
): Promise<{ requiresEmailConfirmation: boolean }> {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  const { data: existingUsername } = await supabase
    .from("admin_profiles")
    .select("id")
    .ilike("username", cleanUsername)
    .maybeSingle();
  if (existingUsername) throw new Error("This username is already taken.");

  const schoolCode = generateSchoolCode();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        account_type: "admin",
        username: cleanUsername,
        school_code: schoolCode,
      },
    },
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error("Account created but no user ID returned.");

  // With email confirmation enabled there is no session yet, so the profile is
  // completed after confirmation on the user's first authenticated visit.
  if (data.session && data.user) await ensureAdminProfile(data.user);

  return { requiresEmailConfirmation: !data.session };
}

export async function signInAdmin(
  identifier: string,
  password: string,
): Promise<void> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const email = isEmail(cleanIdentifier)
    ? cleanIdentifier
    : toAdminEmail(cleanIdentifier);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error("Invalid email/username or password.");

  // Confirm they are an admin, completing a newly confirmed admin profile when
  // this is their first authenticated visit.
  const profile = await ensureAdminProfile(data.user);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No admin account found. Please sign up first.");
  }
}

async function ensureAdminProfile(user: {
  id: string;
  user_metadata?: Record<string, unknown>;
}): Promise<AdminProfile | null> {
  const { data: existing, error: readError } = await supabase
    .from("admin_profiles")
    .select("id, username, school_code")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (existing) return existing;

  const metadata = user.user_metadata ?? {};
  if (metadata.account_type !== "admin") return null;

  const username =
    typeof metadata.username === "string" ? metadata.username.trim() : "";
  const storedSchoolCode =
    typeof metadata.school_code === "string"
      ? metadata.school_code.trim().toUpperCase()
      : "";
  if (!username) return null;

  // A collision is extremely unlikely, but retry with a fresh code if needed.
  let schoolCode = storedSchoolCode || generateSchoolCode();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: created, error: insertError } = await supabase
      .from("admin_profiles")
      .insert({ id: user.id, username, school_code: schoolCode })
      .select("id, username, school_code")
      .single();

    if (!insertError) return created;
    if (!insertError.message.toLowerCase().includes("school_code")) {
      throw new Error(insertError.message);
    }
    schoolCode = generateSchoolCode();
  }

  throw new Error("Could not generate a unique school code. Please try again.");
}

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const session = await getSession();
  if (!session) return null;
  return ensureAdminProfile(session.user);
}

export async function needsAdminEmailMigration(): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return false;
  return isLegacyAdminEmail(user.email);
}

export async function requestAdminEmailChange(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isEmail(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (isLegacyAdminEmail(cleanEmail)) {
    throw new Error("Enter a real email address that you can access.");
  }

  const profile = await getAdminProfile();
  if (!profile) throw new Error("No admin account found.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Your session has expired. Sign in again.");
  if (!isLegacyAdminEmail(user.email)) {
    throw new Error("This account already has a real email address.");
  }

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/dashboard`;
  const { error } = await supabase.auth.updateUser(
    { email: cleanEmail },
    redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  );
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("That email is already connected to another account.");
    }
    throw new Error(error.message);
  }
}

export async function sendAdminPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isEmail(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (isLegacyAdminEmail(cleanEmail)) {
    throw new Error("Use the real email connected to your admin account.");
  }

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/dashboard/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(
    cleanEmail,
    redirectTo ? { redirectTo } : undefined,
  );
  if (error) {
    if (error.message.toLowerCase().includes("rate")) {
      throw new Error("Please wait before requesting another reset email.");
    }
    throw new Error(error.message);
  }
}

export async function updateAdminPassword(password: string): Promise<void> {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const profile = await getAdminProfile();
  if (!profile) throw new Error("This recovery link is not for an admin account.");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
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
