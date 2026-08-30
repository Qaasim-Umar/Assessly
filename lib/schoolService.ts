import { getAdminProfile, getStudentProfile } from "./authService";
import { supabase } from "./supabase";

export type SchoolRole = "owner" | "admin" | "teacher" | "student";

export type School = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_path: string | null;
  school_type: "primary" | "secondary" | "combined" | "tertiary" | "academy" | "other";
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country_code: string;
  state: string | null;
  city: string | null;
  address_line1: string | null;
  timezone: string;
  onboarding_completed_at: string | null;
};

export type SchoolMembership = {
  id: string;
  school_id: string;
  user_id: string;
  role: SchoolRole;
  status: "invited" | "active" | "suspended" | "left";
};

export type AdminSchoolContext = {
  admin: {
    id: string;
    username: string;
    displayName: string;
  };
  school: School;
  membership: SchoolMembership;
  joinCode: string | null;
};

export type StudentSchoolContext = {
  student: {
    id: string;
    username: string;
    displayName: string;
  };
  school: School;
  membership: SchoolMembership;
};

const schoolColumns = [
  "id",
  "name",
  "short_name",
  "slug",
  "logo_path",
  "school_type",
  "description",
  "email",
  "phone",
  "website",
  "country_code",
  "state",
  "city",
  "address_line1",
  "timezone",
  "onboarding_completed_at",
].join(", ");

async function getActiveMembership(
  userId: string,
  preferredSchoolId?: string | null,
  roles?: SchoolRole[],
): Promise<SchoolMembership | null> {
  let query = supabase
    .from("school_memberships")
    .select("id, school_id, user_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (roles?.length) query = query.in("role", roles);
  if (preferredSchoolId) query = query.eq("school_id", preferredSchoolId);

  const { data, error } = await query.order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SchoolMembership | null) ?? null;
}

async function getSchool(schoolId: string): Promise<School> {
  const { data, error } = await supabase
    .from("schools")
    .select(schoolColumns)
    .eq("id", schoolId)
    .single();

  if (error || !data) throw new Error(error?.message ?? "School not found.");
  return data as unknown as School;
}

export async function getActiveSchoolContext(): Promise<AdminSchoolContext | null> {
  const profile = await getAdminProfile();
  if (!profile) return null;

  let membership = await getActiveMembership(
    profile.id,
    null,
    ["owner", "admin", "teacher"],
  );

  if (!membership) {
    const { error } = await supabase.rpc("bootstrap_school_mode", {
      p_school_name: `${profile.username}'s School`,
    });
    if (error) throw new Error(error.message);
    membership = await getActiveMembership(profile.id, null, ["owner", "admin", "teacher"]);
  }
  if (!membership) return null;

  const school = await getSchool(membership.school_id);
  let joinCode: string | null = null;

  if (membership.role === "owner" || membership.role === "admin") {
    const { data, error } = await supabase
      .from("school_join_codes")
      .select("code")
      .eq("school_id", membership.school_id)
      .eq("is_active", true)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    joinCode = data?.code ?? null;
  }

  return {
    admin: {
      id: profile.id,
      username: profile.username,
      displayName: profile.username,
    },
    school,
    membership,
    joinCode,
  };
}

export async function getStudentSchoolContext(
  preferredSchoolId?: string | null,
): Promise<StudentSchoolContext | null> {
  const profile = await getStudentProfile();
  if (!profile) return null;

  const membership = await getActiveMembership(
    profile.id,
    preferredSchoolId,
    ["student"],
  );
  if (!membership) return null;

  return {
    student: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
    },
    school: await getSchool(membership.school_id),
    membership,
  };
}

export type SchoolProfileInput = Pick<
  School,
  | "name"
  | "short_name"
  | "school_type"
  | "description"
  | "email"
  | "phone"
  | "website"
  | "country_code"
  | "state"
  | "city"
  | "address_line1"
  | "timezone"
>;

const schoolTypes: School["school_type"][] = [
  "primary",
  "secondary",
  "combined",
  "tertiary",
  "academy",
  "other",
];

function validatedSchoolProfile(input: SchoolProfileInput) {
  const name = input.name.trim();
  const shortName = input.short_name?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  const website = input.website?.trim() || null;
  const countryCode = input.country_code.trim().toUpperCase();

  if (name.length < 2 || name.length > 160) {
    throw new Error("Enter a School name between 2 and 160 characters.");
  }
  if (shortName && (shortName.length < 2 || shortName.length > 60)) {
    throw new Error("The short name must be between 2 and 60 characters.");
  }
  if (!schoolTypes.includes(input.school_type)) {
    throw new Error("Choose a valid School type.");
  }
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error("The country code must contain two letters.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid official School email address.");
  }
  if (website) {
    try {
      const parsedWebsite = new URL(website);
      if (parsedWebsite.protocol !== "http:" && parsedWebsite.protocol !== "https:") throw new Error();
    } catch {
      throw new Error("Enter a complete School website beginning with http:// or https://.");
    }
  }

  return {
    ...input,
    name,
    short_name: shortName,
    description: input.description?.trim() || null,
    email,
    phone: input.phone?.trim() || null,
    website,
    country_code: countryCode,
    state: input.state?.trim() || null,
    city: input.city?.trim() || null,
    address_line1: input.address_line1?.trim() || null,
    timezone: input.timezone.trim() || "Africa/Lagos",
    onboarding_completed_at: new Date().toISOString(),
  };
}

export async function updateSchoolProfile(
  schoolId: string,
  input: SchoolProfileInput,
): Promise<School> {
  const payload = validatedSchoolProfile(input);

  const { data, error } = await supabase
    .from("schools")
    .update(payload)
    .eq("id", schoolId)
    .select(schoolColumns)
    .single();

  if (error?.code === "42501") {
    throw new Error("You do not have permission to update this School profile.");
  }
  if (error?.code === "23514") {
    throw new Error("Check the School name, short name, type, and country, then try again.");
  }
  if (error || !data) throw new Error(error?.message ?? "Could not update the school profile.");
  return data as unknown as School;
}
