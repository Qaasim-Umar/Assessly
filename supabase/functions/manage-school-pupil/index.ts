import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pinPattern = /^\d{6}$/;

type PupilAction = "create" | "update" | "reset_pin";

type RequestBody = {
  action?: PupilAction;
  schoolId?: unknown;
  membershipId?: unknown;
  displayName?: unknown;
  admissionNumber?: unknown;
  classId?: unknown;
  pin?: unknown;
};

type EnrollmentRow = {
  id: string;
  class_id: string;
  status: "active" | "transferred" | "completed" | "withdrawn";
};

class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function requiredUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new RequestError(400, `${label} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requiredUuid(value, label);
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

function requiredPin(value: unknown): string {
  if (typeof value !== "string" || !pinPattern.test(value)) {
    throw new RequestError(400, "PIN must contain exactly 6 digits.");
  }
  return value;
}

function databaseMessage(error: { code?: string; message?: string }, fallback: string): string {
  if (error.code === "23505") return "That Pupil ID is already in use for this school.";
  if (error.code === "23514") return "Check the pupil details and try again.";
  return error.message || fallback;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      throw new RequestError(401, "Sign in before managing pupils.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new RequestError(500, "The pupil service is not configured.");
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.slice(7).trim();
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) throw new RequestError(401, "Your session has expired. Sign in again.");

    let body: RequestBody;
    try {
      body = await request.json() as RequestBody;
    } catch {
      throw new RequestError(400, "Invalid request body.");
    }

    const schoolId = requiredUuid(body.schoolId, "School");
    if (!body.action || !["create", "update", "reset_pin"].includes(body.action)) {
      throw new RequestError(400, "Pupil action is invalid.");
    }

    const { data: staffMembership, error: staffError } = await adminClient
      .from("school_memberships")
      .select("id, role")
      .eq("school_id", schoolId)
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (staffError) throw new RequestError(500, "Could not verify your School permissions.");
    if (!staffMembership) {
      throw new RequestError(403, "Only a School owner or administrator can manage pupil accounts.");
    }

    const writeAuditLog = async (action: string, membershipId: string, metadata: Record<string, unknown> = {}) => {
      const { error } = await adminClient.from("school_audit_logs").insert({
        school_id: schoolId,
        actor_user_id: authData.user.id,
        action,
        entity_type: "school_membership",
        entity_id: membershipId,
        metadata,
      });
      if (error) console.error("Pupil audit log failed", error.message);
    };

    const validateClass = async (value: unknown): Promise<string | null> => {
      const classId = optionalUuid(value, "Class");
      if (!classId) return null;
      const { data, error } = await adminClient
        .from("school_classes")
        .select("id")
        .eq("id", classId)
        .eq("school_id", schoolId)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw new RequestError(500, "Could not verify the selected class.");
      if (!data) throw new RequestError(400, "Choose an active class from this school.");
      return classId;
    };

    if (body.action === "create") {
      const displayName = requiredText(body.displayName, "Pupil name", 120);
      const admissionNumber = requiredText(body.admissionNumber, "Pupil ID", 80).toUpperCase();
      const classId = await validateClass(body.classId);
      const pin = requiredPin(body.pin);
      const internalEmail = `pupil-${crypto.randomUUID()}@auth.assessly.invalid`;

      const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: internalEmail,
        password: pin,
        email_confirm: true,
        app_metadata: {
          account_type: "school_pupil",
          school_id: schoolId,
        },
        user_metadata: {
          display_name: displayName,
          admission_number: admissionNumber,
        },
      });

      if (createAuthError || !createdAuth.user) {
        const message = createAuthError?.message.toLowerCase().includes("password")
          ? "The PIN was not accepted by the current password policy."
          : "Could not create the pupil account.";
        throw new RequestError(400, message);
      }

      const authUserId = createdAuth.user.id;
      const rollbackAuthUser = async () => {
        const { error } = await adminClient.auth.admin.deleteUser(authUserId);
        if (error) console.error("Pupil Auth rollback failed", error.message);
      };

      const { data: membership, error: membershipError } = await adminClient
        .from("school_memberships")
        .insert({
          school_id: schoolId,
          user_id: authUserId,
          role: "student",
          status: "active",
          display_name: displayName,
          admission_number: admissionNumber,
          invited_by: authData.user.id,
          joined_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (membershipError || !membership) {
        await rollbackAuthUser();
        throw new RequestError(400, databaseMessage(membershipError ?? {}, "Could not save the pupil profile."));
      }

      if (classId) {
        const { error: enrollmentError } = await adminClient
          .from("school_class_enrollments")
          .insert({
            school_id: schoolId,
            class_id: classId,
            school_membership_id: membership.id,
            status: "active",
            created_by: authData.user.id,
          });
        if (enrollmentError) {
          await rollbackAuthUser();
          throw new RequestError(400, "The pupil account could not be assigned to that class.");
        }
      }

      await writeAuditLog("pupil.created", membership.id, { class_id: classId });
      return json({
        pupil: {
          id: membership.id,
          displayName,
          admissionNumber,
          classId,
        },
      }, 201);
    }

    const membershipId = requiredUuid(body.membershipId, "Pupil");
    const { data: pupilMembership, error: pupilError } = await adminClient
      .from("school_memberships")
      .select("id, user_id, display_name, admission_number")
      .eq("id", membershipId)
      .eq("school_id", schoolId)
      .eq("role", "student")
      .eq("status", "active")
      .maybeSingle();

    if (pupilError) throw new RequestError(500, "Could not load the pupil account.");
    if (!pupilMembership) throw new RequestError(404, "Pupil account not found.");

    if (body.action === "reset_pin") {
      const pin = requiredPin(body.pin);
      const { error } = await adminClient.auth.admin.updateUserById(pupilMembership.user_id, { password: pin });
      if (error) {
        const message = error.message.toLowerCase().includes("password")
          ? "The PIN was not accepted by the current password policy."
          : "Could not reset the pupil PIN.";
        throw new RequestError(400, message);
      }
      await writeAuditLog("pupil.pin_reset", membershipId);
      return json({ success: true });
    }

    const displayName = requiredText(body.displayName, "Pupil name", 120);
    const admissionNumber = requiredText(body.admissionNumber, "Pupil ID", 80).toUpperCase();
    const targetClassId = await validateClass(body.classId);

    const { error: membershipUpdateError } = await adminClient
      .from("school_memberships")
      .update({ display_name: displayName, admission_number: admissionNumber })
      .eq("id", membershipId)
      .eq("school_id", schoolId);

    if (membershipUpdateError) {
      throw new RequestError(400, databaseMessage(membershipUpdateError, "Could not update the pupil profile."));
    }

    const { data: enrollmentData, error: enrollmentReadError } = await adminClient
      .from("school_class_enrollments")
      .select("id, class_id, status")
      .eq("school_id", schoolId)
      .eq("school_membership_id", membershipId);

    if (enrollmentReadError) throw new RequestError(500, "Could not load the pupil class assignment.");
    const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
    const activeEnrollment = enrollments.find((item) => item.status === "active") ?? null;

    if (activeEnrollment?.class_id !== targetClassId) {
      const endedAt = new Date().toISOString();
      if (activeEnrollment) {
        const { error } = await adminClient
          .from("school_class_enrollments")
          .update({ status: targetClassId ? "transferred" : "withdrawn", ended_at: endedAt })
          .eq("id", activeEnrollment.id)
          .eq("school_id", schoolId);
        if (error) throw new RequestError(400, "Could not end the pupil's current class assignment.");
      }

      if (targetClassId) {
        const existingTarget = enrollments.find((item) => item.class_id === targetClassId) ?? null;
        const assignmentResult = existingTarget
          ? await adminClient
            .from("school_class_enrollments")
            .update({ status: "active", ended_at: null })
            .eq("id", existingTarget.id)
            .eq("school_id", schoolId)
          : await adminClient
            .from("school_class_enrollments")
            .insert({
              school_id: schoolId,
              class_id: targetClassId,
              school_membership_id: membershipId,
              status: "active",
              created_by: authData.user.id,
            });

        if (assignmentResult.error) {
          if (activeEnrollment) {
            const { error: rollbackError } = await adminClient
              .from("school_class_enrollments")
              .update({ status: "active", ended_at: null })
              .eq("id", activeEnrollment.id)
              .eq("school_id", schoolId);
            if (rollbackError) console.error("Class transfer rollback failed", rollbackError.message);
          }
          throw new RequestError(400, "Could not assign the pupil to the selected class.");
        }
      }
    }

    const { error: authMetadataError } = await adminClient.auth.admin.updateUserById(
      pupilMembership.user_id,
      { user_metadata: { display_name: displayName, admission_number: admissionNumber } },
    );
    if (authMetadataError) console.error("Pupil Auth metadata sync failed", authMetadataError.message);

    await writeAuditLog("pupil.updated", membershipId, {
      previous_class_id: activeEnrollment?.class_id ?? null,
      class_id: targetClassId,
    });
    return json({
      pupil: {
        id: membershipId,
        displayName,
        admissionNumber,
        classId: targetClassId,
      },
    });
  } catch (caughtError: unknown) {
    if (caughtError instanceof RequestError) return json({ error: caughtError.message }, caughtError.status);
    console.error("Unexpected pupil management error", caughtError);
    return json({ error: "Could not complete the pupil request." }, 500);
  }
});
