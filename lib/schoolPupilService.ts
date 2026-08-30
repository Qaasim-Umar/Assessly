import { supabase } from "./supabase";

export type CreateSchoolPupilInput = {
  schoolId: string;
  displayName: string;
  admissionNumber: string;
  classId: string | null;
  pin: string;
};

export type UpdateSchoolPupilInput = Omit<CreateSchoolPupilInput, "pin"> & {
  membershipId: string;
};

export type SchoolPupilMutationResult = {
  id: string;
  displayName: string;
  admissionNumber: string;
  classId: string | null;
};

type FunctionResult = {
  pupil?: SchoolPupilMutationResult;
  success?: boolean;
  error?: string;
};

async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const candidate = error as { message?: string; context?: unknown } | null;
  const context = candidate?.context;
  if (context instanceof Response) {
    try {
      const body = await context.clone().json() as { error?: unknown };
      if (typeof body.error === "string" && body.error.trim()) return body.error;
    } catch {
      // Fall through to the SDK error when the response body is not JSON.
    }
  }
  return candidate?.message?.trim() || fallback;
}

async function invokePupilFunction(body: Record<string, unknown>): Promise<FunctionResult> {
  const { data, error } = await supabase.functions.invoke<FunctionResult>("manage-school-pupil", { body });
  if (error) throw new Error(await functionErrorMessage(error, "Could not reach the pupil service."));
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export async function createSchoolPupil(
  input: CreateSchoolPupilInput,
): Promise<SchoolPupilMutationResult> {
  const result = await invokePupilFunction({
    action: "create",
    schoolId: input.schoolId,
    displayName: input.displayName,
    admissionNumber: input.admissionNumber,
    classId: input.classId,
    pin: input.pin,
  });
  if (!result.pupil) throw new Error("The pupil was created but could not be returned.");
  return result.pupil;
}

export async function updateSchoolPupil(
  input: UpdateSchoolPupilInput,
): Promise<SchoolPupilMutationResult> {
  const result = await invokePupilFunction({
    action: "update",
    schoolId: input.schoolId,
    membershipId: input.membershipId,
    displayName: input.displayName,
    admissionNumber: input.admissionNumber,
    classId: input.classId,
  });
  if (!result.pupil) throw new Error("The pupil was updated but could not be returned.");
  return result.pupil;
}

export async function resetSchoolPupilPin(
  schoolId: string,
  membershipId: string,
  pin: string,
): Promise<void> {
  const result = await invokePupilFunction({
    action: "reset_pin",
    schoolId,
    membershipId,
    pin,
  });
  if (!result.success) throw new Error("The pupil PIN could not be reset.");
}

export function generatePupilPin(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}
