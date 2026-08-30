import { createClient } from "npm:@supabase/supabase-js@^2";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

const responseHeaders = {
  ...corsHeaders,
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};

const schoolCodePattern = /^[A-Z0-9]{6,12}$/;
const pinPattern = /^\d{6}$/;
const minimumFailureDurationMs = 350;

type RequestBody = {
  schoolCode?: unknown;
  admissionNumber?: unknown;
  pin?: unknown;
};

type LoginAttemptRow = {
  attempt_id: number | null;
  school_id: string | null;
  pupil_user_id: string | null;
  allowed: boolean;
};

class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new RequestError(400, `${label} is required.`);
  const normalized = value.trim();
  if (!normalized) throw new RequestError(400, `${label} is required.`);
  if (normalized.length > maxLength) {
    throw new RequestError(400, `${label} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function waitForMinimumFailureDuration(startedAt: number) {
  const remaining = minimumFailureDurationMs - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: responseHeaders });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const startedAt = Date.now();

  try {
    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch {
      throw new RequestError(400, "Invalid request body.");
    }

    const schoolCode = requiredText(body.schoolCode, "School Code", 12).toUpperCase();
    const admissionNumber = requiredText(body.admissionNumber, "Pupil ID", 80).toUpperCase();
    const pin = requiredText(body.pin, "PIN", 6);

    if (!schoolCodePattern.test(schoolCode)) {
      throw new RequestError(400, "Enter a valid School Code.");
    }
    if (!pinPattern.test(pin)) {
      throw new RequestError(400, "PIN must contain exactly 6 digits.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new RequestError(500, "School pupil login is not configured.");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const identifierHash = await sha256Hex(`${schoolCode}\u0000${admissionNumber}`);
    const { data: attemptData, error: attemptError } = await adminClient.rpc(
      "begin_school_pupil_login_attempt",
      {
        p_school_code: schoolCode,
        p_admission_number: admissionNumber,
        p_identifier_hash: identifierHash,
      },
    );

    if (attemptError) {
      console.error("Could not begin pupil login attempt", attemptError.message);
      throw new RequestError(500, "Could not check the pupil login. Try again.");
    }

    const attempt = (Array.isArray(attemptData) ? attemptData[0] : attemptData) as LoginAttemptRow | null;
    if (!attempt?.allowed) {
      await waitForMinimumFailureDuration(startedAt);
      return json({ error: "Too many failed attempts. Wait 15 minutes and try again." }, 429);
    }

    const invalidCredentials = async () => {
      await waitForMinimumFailureDuration(startedAt);
      return json({ error: "Invalid School Code, Pupil ID, or PIN." }, 401);
    };

    if (!attempt.attempt_id || !attempt.school_id || !attempt.pupil_user_id) {
      return await invalidCredentials();
    }

    const { data: pupilAuth, error: pupilAuthError } = await adminClient.auth.admin.getUserById(
      attempt.pupil_user_id,
    );
    const pupilUser = pupilAuth.user;
    if (
      pupilAuthError
      || !pupilUser?.email
      || pupilUser.app_metadata?.account_type !== "school_pupil"
      || pupilUser.app_metadata?.school_id !== attempt.school_id
    ) {
      return await invalidCredentials();
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: pupilUser.email,
      password: pin,
    });

    if (
      signInError
      || !signInData.session
      || !signInData.user
      || signInData.user.id !== attempt.pupil_user_id
    ) {
      return await invalidCredentials();
    }

    const { error: successError } = await adminClient.rpc("mark_school_pupil_login_success", {
      p_attempt_id: attempt.attempt_id,
    });
    if (successError) {
      console.error("Could not mark pupil login success", successError.message);
    }

    return json({
      session: {
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
      },
    });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("Unexpected School pupil login error", error);
    return json({ error: "Could not sign in. Try again." }, 500);
  }
});
