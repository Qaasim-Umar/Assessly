import { supabase } from "./supabase";

const LEGACY_ADMIN_EMAIL_SUFFIX = "@assessly.admin";
const LEGACY_STUDENT_EMAIL_SUFFIX = "@assessly.student";

export type AdminProfile = {
  id: string;
  username: string;
  school_code: string;
};

export type StudentProfile = {
  id: string;
  username: string;
  display_name: string;
  account_type: "individual_student" | "school_pupil";
  school_id: string | null;
  membership_id: string | null;
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
function isLegacyStudentEmail(email?: string | null) {
  return email?.toLowerCase().endsWith(LEGACY_STUDENT_EMAIL_SUFFIX) ?? false;
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
      : `${window.location.origin}/auth/email-verified?account=admin`;
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
  email: string,
  password: string,
): Promise<{ requiresEmailConfirmation: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanDisplayName = displayName.trim();
  if (!cleanEmail || !isEmail(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (isLegacyStudentEmail(cleanEmail)) {
    throw new Error("Enter a real email address that you can access.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        account_type: "individual_student",
        display_name: cleanDisplayName,
        username: cleanEmail,
      },
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("That email is already connected to an account.");
    }
    throw new Error(error.message);
  }
  const userId = data.user?.id;
  if (!userId) throw new Error("Account created but no user ID returned.");

  // When email confirmation is disabled, the user already has a session and
  // the RLS-protected profile can be created immediately. Otherwise it is
  // completed after confirmation on the first successful sign-in.
  if (data.session && data.user) await ensureIndividualStudentProfile(data.user);

  return { requiresEmailConfirmation: !data.session };
}

export async function signInStudent(
  identifier: string,
  password: string,
): Promise<void> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const email = isEmail(cleanIdentifier)
    ? cleanIdentifier
    : toStudentEmail(cleanIdentifier);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error("Invalid email, phone number/username, or password.");

  const profile = await ensureIndividualStudentProfile(data.user);

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error("No student account found.");
  }
}

type IndividualStudentProfileRow = {
  id: string;
  username: string;
  display_name: string;
};

async function ensureIndividualStudentProfile(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): Promise<IndividualStudentProfileRow | null> {
  const { data: existing, error: readError } = await supabase
    .from("student_profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (existing) return existing;

  if (user.app_metadata?.account_type === "school_pupil") return null;

  const metadata = user.user_metadata ?? {};
  if (metadata.account_type !== "individual_student") return null;

  const displayName =
    typeof metadata.display_name === "string"
      ? metadata.display_name.trim()
      : "";
  const username =
    typeof metadata.username === "string"
      ? metadata.username.trim().toLowerCase()
      : user.email?.trim().toLowerCase() ?? "";
  if (!displayName || !username) return null;

  const { data: created, error: insertError } = await supabase
    .from("student_profiles")
    .insert({ id: user.id, username, display_name: displayName })
    .select("id, username, display_name")
    .single();
  if (insertError) throw new Error(insertError.message);
  return created;
}

export async function needsStudentEmailMigration(): Promise<boolean> {
  const profile = await getStudentProfile();
  if (!profile || profile.account_type !== "individual_student") return false;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return false;
  return isLegacyStudentEmail(user.email);
}

export async function requestStudentEmailChange(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isEmail(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (isLegacyStudentEmail(cleanEmail)) {
    throw new Error("Enter a real email address that you can access.");
  }

  const profile = await getStudentProfile();
  if (!profile || profile.account_type !== "individual_student") {
    throw new Error("No Individual student account found.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Your session has expired. Sign in again.");
  if (!isLegacyStudentEmail(user.email)) {
    throw new Error("This account already has a real email address.");
  }

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/auth/email-verified?account=student`;
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

export async function sendStudentPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !isEmail(cleanEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (isLegacyStudentEmail(cleanEmail)) {
    throw new Error("Use the real email connected to your Individual student account.");
  }

  const redirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/student/reset-password`;
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

export async function updateStudentPassword(password: string): Promise<void> {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const profile = await getStudentProfile();
  if (!profile || profile.account_type !== "individual_student") {
    throw new Error("This recovery link is not for an Individual student account.");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

type SchoolPupilLoginResult = {
  session?: {
    accessToken?: string;
    refreshToken?: string;
  };
  error?: string;
};

async function pupilLoginErrorMessage(error: unknown): Promise<string> {
  const candidate = error as { message?: string; context?: unknown } | null;
  if (candidate?.context instanceof Response) {
    try {
      const body = await candidate.context.clone().json() as { error?: unknown };
      if (typeof body.error === "string" && body.error.trim()) return body.error;
    } catch {
      // Use the SDK error when the function did not return JSON.
    }
  }
  return candidate?.message?.trim() || "Could not reach the pupil login service.";
}

export async function signInSchoolPupil(
  schoolCode: string,
  admissionNumber: string,
  pin: string,
): Promise<StudentProfile> {
  const { data, error } = await supabase.functions.invoke<SchoolPupilLoginResult>(
    "login-school-pupil",
    {
      body: {
        schoolCode: schoolCode.trim().toUpperCase(),
        admissionNumber: admissionNumber.trim().toUpperCase(),
        pin,
      },
    },
  );

  if (error) throw new Error(await pupilLoginErrorMessage(error));
  if (data?.error) throw new Error(data.error);

  const accessToken = data?.session?.accessToken;
  const refreshToken = data?.session?.refreshToken;
  if (!accessToken || !refreshToken) {
    throw new Error("The pupil login did not return a valid session. Try again.");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw new Error("The pupil session could not be started. Try again.");

  const profile = await getStudentProfile();
  if (!profile || profile.account_type !== "school_pupil") {
    await supabase.auth.signOut();
    throw new Error("No active School pupil account was found.");
  }

  return profile;
}

export async function getStudentProfile(): Promise<StudentProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const { data: storedIndividualProfile } = await supabase
    .from("student_profiles")
    .select("id, username, display_name")
    .eq("id", session.user.id)
    .maybeSingle();

  const individualProfile =
    storedIndividualProfile
    ?? await ensureIndividualStudentProfile(session.user);

  if (individualProfile) {
    return {
      ...individualProfile,
      account_type: "individual_student",
      school_id: null,
      membership_id: null,
    };
  }

  if (session.user.app_metadata?.account_type !== "school_pupil") return null;

  const { data: pupilMembership } = await supabase
    .from("school_memberships")
    .select("id, school_id, user_id, display_name, admission_number")
    .eq("user_id", session.user.id)
    .eq("role", "student")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!pupilMembership) return null;

  return {
    id: pupilMembership.user_id,
    username: pupilMembership.admission_number?.trim() || "pupil",
    display_name:
      pupilMembership.display_name?.trim()
      || pupilMembership.admission_number?.trim()
      || "School pupil",
    account_type: "school_pupil",
    school_id: pupilMembership.school_id,
    membership_id: pupilMembership.id,
  };
}

export async function studentSignOut(): Promise<void> {
  await supabase.auth.signOut();
}
