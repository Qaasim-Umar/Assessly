import { supabase } from "./supabase";

export type SchoolAssessmentStatus = "Live" | "Scheduled" | "Published" | "Draft" | "Closed";

export type SchoolDashboardAssessment = {
  id: string;
  title: string;
  subject: string;
  classNames: string[];
  startsAt: string | null;
  endsAt: string | null;
  durationMinutes: number;
  questionCount: number;
  status: SchoolAssessmentStatus;
  submittedCount: number;
  assignedStudentCount: number;
};

export type SchoolDashboardResult = {
  assessmentId: string;
  title: string;
  submittedCount: number;
  completedCount: number;
  needsGradingCount: number;
  latestSubmissionAt: string;
  averagePercentage: number;
};

export type SchoolDashboardClass = {
  id: string;
  name: string;
  gradeLevel: string | null;
  academicTermId: string | null;
  academicTermName: string | null;
  academicYear: string | null;
  status: "active" | "archived";
  displayOrder: number;
  studentCount: number;
  averagePercentage: number;
};

export type SchoolDashboardTerm = {
  id: string;
  academicYear: string;
  name: string;
  status: "draft" | "current" | "closed";
  startsOn: string | null;
  endsOn: string | null;
};

export type SchoolDashboardStudent = {
  id: string;
  displayName: string;
  admissionNumber: string | null;
  classId: string | null;
  className: string | null;
};

export type SchoolDashboardData = {
  metrics: {
    activeStudents: number;
    activeClasses: number;
    liveAssessments: number;
    pupilsInLiveAssessments: number;
    averagePercentage: number;
    submittedResults: number;
    needsGrading: number;
  };
  assessments: SchoolDashboardAssessment[];
  results: SchoolDashboardResult[];
  classes: SchoolDashboardClass[];
  terms: SchoolDashboardTerm[];
  students: SchoolDashboardStudent[];
};

type MembershipRow = {
  id: string;
  display_name: string | null;
  admission_number: string | null;
};

type ClassRow = {
  id: string;
  name: string;
  grade_level: string | null;
  academic_term_id: string | null;
  status: "active" | "archived";
  display_order: number;
};

type AcademicTermRow = {
  id: string;
  academic_year: string;
  name: string;
  status: "draft" | "current" | "closed";
  starts_on: string | null;
  ends_on: string | null;
};

type EnrollmentRow = {
  class_id: string;
  school_membership_id: string;
};

type AssessmentRow = {
  id: string;
  title: string;
  subject: string | null;
  duration_minutes: number | null;
  status: "Draft" | "Published" | "Live" | "Closed" | "Archived";
  question_count: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  assessment_id: string;
  class_id: string;
  status: "scheduled" | "live" | "closed" | "cancelled";
  starts_at: string | null;
  ends_at: string | null;
};

type SubmissionRow = {
  assessment_id: string;
  school_membership_id: string;
  class_id: string;
  percentage: number | string | null;
  final_percentage: number | string | null;
  theory_status: "not_required" | "pending" | "graded";
  submitted_at: string;
};

function percentageOf(row: SubmissionRow): number {
  const value = row.final_percentage ?? row.percentage ?? 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function assessmentStatus(
  assessment: AssessmentRow,
  assignments: AssignmentRow[],
): SchoolAssessmentStatus {
  const now = Date.now();
  const hasEnded = Boolean(assessment.ends_at && new Date(assessment.ends_at).getTime() <= now)
    || (assignments.length > 0 && assignments.every((item) => {
      const effectiveEnd = item.ends_at ?? assessment.ends_at;
      return item.status === "closed" || Boolean(effectiveEnd && new Date(effectiveEnd).getTime() <= now);
    }));
  if (assessment.status === "Closed" || hasEnded) {
    return "Closed";
  }
  const scheduledAndStarted = assignments.some((item) => {
    if (item.status !== "scheduled") return false;
    const effectiveStart = item.starts_at ?? assessment.starts_at;
    const effectiveEnd = item.ends_at ?? assessment.ends_at;
    return Boolean(effectiveStart && new Date(effectiveStart).getTime() <= now)
      && (!effectiveEnd || new Date(effectiveEnd).getTime() > now);
  });
  if (assessment.status === "Live" || assignments.some((item) => item.status === "live") || scheduledAndStarted) {
    return "Live";
  }
  if (assignments.some((item) => item.status === "scheduled")) return "Scheduled";
  if (assessment.status === "Published") return "Published";
  return "Draft";
}

function earliestDate(values: Array<string | null>): string | null {
  const dates = values.filter((value): value is string => Boolean(value)).sort();
  return dates[0] ?? null;
}

function latestDate(values: Array<string | null>): string | null {
  const dates = values.filter((value): value is string => Boolean(value)).sort();
  return dates.at(-1) ?? null;
}

export async function getSchoolDashboardData(schoolId: string): Promise<SchoolDashboardData> {
  const [membershipsResult, classesResult, termsResult, enrollmentsResult, assessmentsResult, assignmentsResult, submissionsResult] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, display_name, admission_number")
      .eq("school_id", schoolId)
      .eq("role", "student")
      .eq("status", "active")
      .order("display_name", { ascending: true, nullsFirst: false }),
    supabase
      .from("school_classes")
      .select("id, name, grade_level, academic_term_id, status, display_order")
      .eq("school_id", schoolId)
      .order("status", { ascending: true })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("academic_terms")
      .select("id, academic_year, name, status, starts_on, ends_on")
      .eq("school_id", schoolId)
      .order("status", { ascending: true })
      .order("academic_year", { ascending: false }),
    supabase
      .from("school_class_enrollments")
      .select("class_id, school_membership_id")
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabase
      .from("school_assessments")
      .select("id, title, subject, duration_minutes, status, question_count, starts_at, ends_at, created_at")
      .eq("school_id", schoolId)
      .neq("status", "Archived")
      .order("created_at", { ascending: false }),
    supabase
      .from("school_assessment_assignments")
      .select("id, assessment_id, class_id, status, starts_at, ends_at")
      .eq("school_id", schoolId)
      .neq("status", "cancelled"),
    supabase
      .from("school_submissions")
      .select("assessment_id, school_membership_id, class_id, percentage, final_percentage, theory_status, submitted_at")
      .eq("school_id", schoolId)
      .order("submitted_at", { ascending: false }),
  ]);

  const failedResult = [membershipsResult, classesResult, termsResult, enrollmentsResult, assessmentsResult, assignmentsResult, submissionsResult]
    .find((result) => result.error);
  if (failedResult?.error) throw new Error(failedResult.error.message);

  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const classes = (classesResult.data ?? []) as ClassRow[];
  const terms = (termsResult.data ?? []) as AcademicTermRow[];
  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[];
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[];
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];

  const classById = new Map(classes.map((item) => [item.id, item]));
  const termById = new Map(terms.map((item) => [item.id, item]));
  const enrollmentByMembershipId = new Map(enrollments.map((item) => [item.school_membership_id, item]));
  const enrollmentsByClassId = new Map<string, EnrollmentRow[]>();
  const assignmentsByAssessmentId = new Map<string, AssignmentRow[]>();
  const submissionsByAssessmentId = new Map<string, SubmissionRow[]>();
  const submissionsByClassId = new Map<string, SubmissionRow[]>();

  for (const enrollment of enrollments) {
    const current = enrollmentsByClassId.get(enrollment.class_id) ?? [];
    current.push(enrollment);
    enrollmentsByClassId.set(enrollment.class_id, current);
  }
  for (const assignment of assignments) {
    const current = assignmentsByAssessmentId.get(assignment.assessment_id) ?? [];
    current.push(assignment);
    assignmentsByAssessmentId.set(assignment.assessment_id, current);
  }
  for (const submission of submissions) {
    const assessmentRows = submissionsByAssessmentId.get(submission.assessment_id) ?? [];
    assessmentRows.push(submission);
    submissionsByAssessmentId.set(submission.assessment_id, assessmentRows);

    const classRows = submissionsByClassId.get(submission.class_id) ?? [];
    classRows.push(submission);
    submissionsByClassId.set(submission.class_id, classRows);
  }

  const dashboardAssessments = assessments.map<SchoolDashboardAssessment>((assessment) => {
    const assessmentAssignments = assignmentsByAssessmentId.get(assessment.id) ?? [];
    const assignedClassIds = [...new Set(assessmentAssignments.map((item) => item.class_id))];
    const startsAt = earliestDate([
      ...assessmentAssignments.map((item) => item.starts_at),
      assessment.starts_at,
    ]);
    const endsAt = latestDate([
      ...assessmentAssignments.map((item) => item.ends_at),
      assessment.ends_at,
    ]);

    return {
      id: assessment.id,
      title: assessment.title,
      subject: assessment.subject?.trim() || "No subject",
      classNames: assignedClassIds
        .map((classId) => classById.get(classId)?.name)
        .filter((name): name is string => Boolean(name)),
      startsAt,
      endsAt,
      durationMinutes: assessment.duration_minutes ?? 0,
      questionCount: assessment.question_count ?? 0,
      status: assessmentStatus(assessment, assessmentAssignments),
      submittedCount: submissionsByAssessmentId.get(assessment.id)?.length ?? 0,
      assignedStudentCount: assignedClassIds.reduce(
        (total, classId) => total + (enrollmentsByClassId.get(classId)?.length ?? 0),
        0,
      ),
    };
  });

  const statusOrder: Record<SchoolAssessmentStatus, number> = {
    Live: 0,
    Scheduled: 1,
    Published: 2,
    Draft: 3,
    Closed: 4,
  };
  dashboardAssessments.sort((left, right) => statusOrder[left.status] - statusOrder[right.status]);

  const results = assessments
    .map<SchoolDashboardResult | null>((assessment) => {
      const rows = submissionsByAssessmentId.get(assessment.id) ?? [];
      if (rows.length === 0) return null;
      const completedRows = rows.filter((row) => row.theory_status !== "pending");
      return {
        assessmentId: assessment.id,
        title: assessment.title,
        submittedCount: rows.length,
        completedCount: completedRows.length,
        needsGradingCount: rows.length - completedRows.length,
        latestSubmissionAt: rows[0].submitted_at,
        averagePercentage: average(completedRows.map(percentageOf)),
      };
    })
    .filter((item): item is SchoolDashboardResult => item !== null)
    .sort((left, right) => right.latestSubmissionAt.localeCompare(left.latestSubmissionAt));

  const dashboardClasses = classes.map<SchoolDashboardClass>((schoolClass) => {
    const classSubmissions = submissionsByClassId.get(schoolClass.id) ?? [];
    const completedClassSubmissions = classSubmissions.filter((item) => item.theory_status !== "pending");
    const term = schoolClass.academic_term_id
      ? termById.get(schoolClass.academic_term_id) ?? null
      : null;
    return {
      id: schoolClass.id,
      name: schoolClass.name,
      gradeLevel: schoolClass.grade_level,
      academicTermId: schoolClass.academic_term_id,
      academicTermName: term?.name ?? null,
      academicYear: term?.academic_year ?? null,
      status: schoolClass.status,
      displayOrder: schoolClass.display_order,
      studentCount: enrollmentsByClassId.get(schoolClass.id)?.length ?? 0,
      averagePercentage: average(completedClassSubmissions.map(percentageOf)),
    };
  });

  const dashboardStudents = memberships.map<SchoolDashboardStudent>((membership) => {
    const enrollment = enrollmentByMembershipId.get(membership.id);
    const enrolledClass = enrollment ? classById.get(enrollment.class_id) : null;
    return {
      id: membership.id,
      displayName: membership.display_name?.trim() || membership.admission_number?.trim() || "Unnamed pupil",
      admissionNumber: membership.admission_number?.trim() || null,
      classId: enrolledClass?.status === "active" ? enrolledClass.id : null,
      className: enrolledClass?.status === "active" ? enrolledClass.name : null,
    };
  });

  const liveAssessmentIds = new Set(
    dashboardAssessments.filter((item) => item.status === "Live").map((item) => item.id),
  );
  const liveClassIds = new Set(
    assignments
      .filter((item) => liveAssessmentIds.has(item.assessment_id) && classById.get(item.class_id)?.status === "active")
      .map((item) => item.class_id),
  );
  const pupilsInLiveAssessments = new Set(
    enrollments
      .filter((item) => liveClassIds.has(item.class_id))
      .map((item) => item.school_membership_id),
  ).size;
  const completedSubmissions = submissions.filter((item) => item.theory_status !== "pending");

  return {
    metrics: {
      activeStudents: memberships.length,
      activeClasses: classes.filter((item) => item.status === "active").length,
      liveAssessments: dashboardAssessments.filter((item) => item.status === "Live").length,
      pupilsInLiveAssessments,
      averagePercentage: average(completedSubmissions.map(percentageOf)),
      submittedResults: submissions.length,
      needsGrading: submissions.filter((item) => item.theory_status === "pending").length,
    },
    assessments: dashboardAssessments,
    results,
    classes: dashboardClasses,
    terms: terms.map((term) => ({
      id: term.id,
      academicYear: term.academic_year,
      name: term.name,
      status: term.status,
      startsOn: term.starts_on,
      endsOn: term.ends_on,
    })),
    students: dashboardStudents,
  };
}

export type SchoolClassInput = {
  name: string;
  gradeLevel: string | null;
  academicTermId: string | null;
  displayOrder: number;
};

export type SchoolTermInput = {
  academicYear: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
  makeCurrent: boolean;
};

function normalizedClassInput(input: SchoolClassInput) {
  return {
    name: input.name.trim(),
    grade_level: input.gradeLevel?.trim() || null,
    academic_term_id: input.academicTermId || null,
    display_order: Number.isInteger(input.displayOrder) && input.displayOrder >= 0
      ? input.displayOrder
      : 0,
  };
}

function classWriteError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error("A class with this name already exists for the selected academic term.");
  }
  if (error.code === "23514") {
    return new Error("Check the class name, level, and display order, then try again.");
  }
  if (error.code === "42501") {
    return new Error("You do not have permission to manage classes for this school.");
  }
  return new Error(error.message || "Could not save the class.");
}

async function authenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Your session has expired. Sign in again before managing the School workspace.");
  }
  return data.user.id;
}

function normalizedTermInput(input: SchoolTermInput) {
  const academicYear = input.academicYear.trim();
  const name = input.name.trim();
  const yearMatch = /^(\d{4})\/(\d{4})$/.exec(academicYear);
  if (!yearMatch || Number(yearMatch[2]) !== Number(yearMatch[1]) + 1) {
    throw new Error("Enter the academic year as two consecutive years, for example 2026/2027.");
  }
  if (name.length < 2 || name.length > 80) {
    throw new Error("Enter a term name between 2 and 80 characters.");
  }

  const startsOn = input.startsOn || null;
  const endsOn = input.endsOn || null;
  if (startsOn && Number.isNaN(new Date(`${startsOn}T00:00:00`).getTime())) {
    throw new Error("Choose a valid term start date.");
  }
  if (endsOn && Number.isNaN(new Date(`${endsOn}T00:00:00`).getTime())) {
    throw new Error("Choose a valid term end date.");
  }
  if (startsOn && endsOn && endsOn < startsOn) {
    throw new Error("The term end date must be on or after the start date.");
  }

  return { academicYear, name, startsOn, endsOn };
}

function termWriteError(error: { code?: string; message?: string }): Error {
  const message = error.message?.toLowerCase() ?? "";
  if (error.code === "23505" && message.includes("one_current")) {
    return new Error("Another term became current. Refresh the terms and try again.");
  }
  if (error.code === "23505") {
    return new Error("A term with this name already exists in that academic year.");
  }
  if (error.code === "23514") {
    return new Error("Check the term dates and status, then try again.");
  }
  if (error.code === "42501") {
    return new Error("Only a School owner or administrator can manage academic terms.");
  }
  return new Error(error.message?.trim() || "Could not save the academic term.");
}

async function currentSchoolTermId(schoolId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("academic_terms")
    .select("id")
    .eq("school_id", schoolId)
    .eq("status", "current")
    .limit(1)
    .maybeSingle();
  if (error) throw termWriteError(error);
  return data?.id ?? null;
}

async function closeCurrentSchoolTerm(schoolId: string, currentTermId: string | null): Promise<void> {
  if (!currentTermId) return;
  const { data, error } = await supabase
    .from("academic_terms")
    .update({ status: "closed" })
    .eq("school_id", schoolId)
    .eq("id", currentTermId)
    .eq("status", "current")
    .select("id")
    .maybeSingle();
  if (error) throw termWriteError(error);
  if (!data) throw new Error("The current term changed. Refresh the terms and try again.");
}

async function restoreCurrentSchoolTerm(schoolId: string, termId: string | null): Promise<boolean> {
  if (!termId) return true;
  const { data, error } = await supabase
    .from("academic_terms")
    .update({ status: "current" })
    .eq("school_id", schoolId)
    .eq("id", termId)
    .eq("status", "closed")
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

export async function createSchoolTerm(schoolId: string, input: SchoolTermInput): Promise<void> {
  const term = normalizedTermInput(input);
  await authenticatedUserId();
  const previousCurrentId = input.makeCurrent ? await currentSchoolTermId(schoolId) : null;
  if (input.makeCurrent) await closeCurrentSchoolTerm(schoolId, previousCurrentId);

  const { data, error } = await supabase
    .from("academic_terms")
    .insert({
      school_id: schoolId,
      academic_year: term.academicYear,
      name: term.name,
      starts_on: term.startsOn,
      ends_on: term.endsOn,
      status: input.makeCurrent ? "current" : "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    const restored = await restoreCurrentSchoolTerm(schoolId, previousCurrentId);
    if (!restored) {
      throw new Error("The term was not created and the previous current term could not be restored. Refresh the page before continuing.");
    }
    throw termWriteError(error ?? {});
  }
}

export async function makeSchoolTermCurrent(schoolId: string, termId: string): Promise<void> {
  await authenticatedUserId();
  const { data: target, error: targetError } = await supabase
    .from("academic_terms")
    .select("id, status")
    .eq("school_id", schoolId)
    .eq("id", termId)
    .maybeSingle();
  if (targetError) throw termWriteError(targetError);
  if (!target) throw new Error("The term was not found or you do not have permission to update it.");
  if (target.status === "current") return;
  if (target.status !== "draft") throw new Error("Only an upcoming term can be made current.");

  const previousCurrentId = await currentSchoolTermId(schoolId);
  await closeCurrentSchoolTerm(schoolId, previousCurrentId);

  const { data, error } = await supabase
    .from("academic_terms")
    .update({ status: "current" })
    .eq("school_id", schoolId)
    .eq("id", termId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    const restored = await restoreCurrentSchoolTerm(schoolId, previousCurrentId);
    if (!restored) {
      throw new Error("The new term could not be activated and the previous term could not be restored. Refresh the page before continuing.");
    }
    throw termWriteError(error ?? {});
  }
}

export async function createSchoolClass(
  schoolId: string,
  input: SchoolClassInput,
): Promise<void> {
  const classInput = normalizedClassInput(input);
  if (!classInput.name) throw new Error("Enter a class name.");

  const { data, error } = await supabase
    .from("school_classes")
    .insert({
      school_id: schoolId,
      created_by: await authenticatedUserId(),
      status: "active",
      ...classInput,
    })
    .select("id")
    .single();

  if (error) throw classWriteError(error);
  if (!data) throw new Error("The class could not be created.");
}

export async function updateSchoolClass(
  schoolId: string,
  classId: string,
  input: SchoolClassInput,
): Promise<void> {
  const classInput = normalizedClassInput(input);
  if (!classInput.name) throw new Error("Enter a class name.");

  const { data, error } = await supabase
    .from("school_classes")
    .update(classInput)
    .eq("school_id", schoolId)
    .eq("id", classId)
    .select("id")
    .maybeSingle();

  if (error) throw classWriteError(error);
  if (!data) throw new Error("The class was not found or you do not have permission to update it.");
}

async function setSchoolClassStatus(
  schoolId: string,
  classId: string,
  status: "active" | "archived",
): Promise<void> {
  const { data, error } = await supabase
    .from("school_classes")
    .update({ status })
    .eq("school_id", schoolId)
    .eq("id", classId)
    .select("id")
    .maybeSingle();

  if (error) throw classWriteError(error);
  if (!data) throw new Error("The class was not found or you do not have permission to update it.");
}

export async function archiveSchoolClass(schoolId: string, classId: string): Promise<void> {
  await setSchoolClassStatus(schoolId, classId, "archived");
}

export async function restoreSchoolClass(schoolId: string, classId: string): Promise<void> {
  await setSchoolClassStatus(schoolId, classId, "active");
}
