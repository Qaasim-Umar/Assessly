import { supabase } from "@/lib/supabase";

export type PupilAssessmentStatus = "not_submitted" | "pending" | "completed";

export type SchoolReportAssessment = {
  id: string;
  title: string;
  subject: string;
};

export type PupilAssessmentPerformance = {
  assessmentId: string;
  title: string;
  subject: string;
  status: PupilAssessmentStatus;
  automaticScore: number | null;
  finalScore: number | null;
  finalPercentage: number | null;
  submittedAt: string | null;
};

export type SchoolPupilPerformance = {
  membershipId: string;
  studentName: string;
  admissionNumber: string | null;
  assignedCount: number;
  submittedCount: number;
  completedCount: number;
  pendingCount: number;
  averagePercentage: number | null;
  highestPercentage: number | null;
  submissionRate: number;
  assessmentResults: PupilAssessmentPerformance[];
};

export type SchoolClassAssessmentPerformance = {
  assessmentId: string;
  title: string;
  subject: string;
  expectedCount: number;
  submittedCount: number;
  completedCount: number;
  pendingCount: number;
  averagePercentage: number | null;
  highestPercentage: number | null;
  lowestPercentage: number | null;
  passedCount: number;
  passRate: number;
  submissionRate: number;
};

export type SchoolClassPerformance = {
  classId: string;
  className: string;
  classStatus: "active" | "archived";
  studentCount: number;
  assessmentCount: number;
  expectedSubmissions: number;
  submittedCount: number;
  completedCount: number;
  pendingCount: number;
  averagePercentage: number | null;
  highestPercentage: number | null;
  lowestPercentage: number | null;
  passedCount: number;
  passRate: number;
  submissionRate: number;
  assessments: SchoolClassAssessmentPerformance[];
  pupils: SchoolPupilPerformance[];
};

export type SchoolPerformanceReport = {
  generatedAt: string;
  classes: SchoolClassPerformance[];
  assessments: SchoolReportAssessment[];
};

type ClassRow = {
  id: string;
  name: string;
  status: "active" | "archived";
  display_order: number;
};

type MembershipRow = {
  id: string;
  display_name: string | null;
  admission_number: string | null;
  status: "invited" | "active" | "suspended" | "left";
};

type EnrollmentRow = {
  class_id: string;
  school_membership_id: string;
  status: "active" | "transferred" | "completed" | "withdrawn";
  enrolled_at: string;
  ended_at: string | null;
};

type AssessmentRow = {
  id: string;
  title: string;
  subject: string | null;
  status: "Draft" | "Published" | "Live" | "Closed" | "Archived";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type AssignmentRow = {
  assessment_id: string;
  class_id: string;
  status: "scheduled" | "live" | "closed" | "cancelled";
  starts_at: string | null;
  ends_at: string | null;
};

type SubmissionRow = {
  assessment_id: string;
  class_id: string;
  school_membership_id: string;
  student_name_snapshot: string | null;
  admission_number_snapshot: string | null;
  score: number | string | null;
  percentage: number | string | null;
  theory_status: "not_required" | "pending" | "graded";
  final_score: number | string | null;
  final_percentage: number | string | null;
  submitted_at: string;
};

type AssessmentContext = {
  assessment: AssessmentRow;
  assignment: AssignmentRow;
  submissions: SubmissionRow[];
  expectedPupilIds: Set<string>;
};

function numberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundedAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function completedPercentage(submission: SubmissionRow): number | null {
  if (submission.theory_status === "pending") return null;
  return numberOrNull(submission.final_percentage) ?? numberOrNull(submission.percentage);
}

function effectiveStart(assessment: AssessmentRow, assignment: AssignmentRow): Date {
  return new Date(assignment.starts_at ?? assessment.starts_at ?? assessment.created_at);
}

function effectiveEnd(assessment: AssessmentRow, assignment: AssignmentRow, now: Date): Date {
  return new Date(assignment.ends_at ?? assessment.ends_at ?? now.toISOString());
}

function enrollmentOverlapsAssessment(
  enrollment: EnrollmentRow,
  assessment: AssessmentRow,
  assignment: AssignmentRow,
  now: Date,
): boolean {
  const enrolledAt = new Date(enrollment.enrolled_at);
  const endedAt = enrollment.ended_at ? new Date(enrollment.ended_at) : null;
  const startsAt = effectiveStart(assessment, assignment);
  const endsAt = effectiveEnd(assessment, assignment, now);
  return enrolledAt <= endsAt && (!endedAt || endedAt >= startsAt);
}

function shouldReportAssignment(
  assessment: AssessmentRow,
  assignment: AssignmentRow,
  submissions: SubmissionRow[],
  now: Date,
): boolean {
  if (submissions.length > 0) return true;
  if (assessment.status === "Draft" || assessment.status === "Archived" || assignment.status === "cancelled") return false;
  if (assignment.status === "live" || assignment.status === "closed" || assessment.status === "Closed") return true;
  const startsAt = assignment.starts_at ?? assessment.starts_at;
  return Boolean(startsAt && new Date(startsAt) <= now);
}

function reportError(error: { code?: string; message: string }): Error {
  if (error.code === "42501") {
    return new Error("You do not have permission to view performance reports for this school.");
  }
  return new Error(error.message || "Could not load the School performance report.");
}

function performanceStats(submissions: SubmissionRow[]) {
  const percentages = submissions
    .map(completedPercentage)
    .filter((value): value is number => value !== null);
  return {
    completedCount: percentages.length,
    pendingCount: submissions.filter((submission) => submission.theory_status === "pending").length,
    averagePercentage: roundedAverage(percentages),
    highestPercentage: percentages.length > 0 ? Math.max(...percentages) : null,
    lowestPercentage: percentages.length > 0 ? Math.min(...percentages) : null,
    passedCount: percentages.filter((value) => value >= 50).length,
    passRate: rate(percentages.filter((value) => value >= 50).length, percentages.length),
  };
}

export async function getSchoolPerformanceReport(schoolId: string): Promise<SchoolPerformanceReport> {
  const [classesResult, membershipsResult, enrollmentsResult, assessmentsResult, assignmentsResult, submissionsResult] = await Promise.all([
    supabase
      .from("school_classes")
      .select("id, name, status, display_order")
      .eq("school_id", schoolId)
      .order("status", { ascending: true })
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("school_memberships")
      .select("id, display_name, admission_number, status")
      .eq("school_id", schoolId)
      .eq("role", "student"),
    supabase
      .from("school_class_enrollments")
      .select("class_id, school_membership_id, status, enrolled_at, ended_at")
      .eq("school_id", schoolId),
    supabase
      .from("school_assessments")
      .select("id, title, subject, status, starts_at, ends_at, created_at")
      .eq("school_id", schoolId),
    supabase
      .from("school_assessment_assignments")
      .select("assessment_id, class_id, status, starts_at, ends_at")
      .eq("school_id", schoolId),
    supabase
      .from("school_submissions")
      .select("assessment_id, class_id, school_membership_id, student_name_snapshot, admission_number_snapshot, score, percentage, theory_status, final_score, final_percentage, submitted_at")
      .eq("school_id", schoolId)
      .order("submitted_at", { ascending: false }),
  ]);

  const failedResult = [classesResult, membershipsResult, enrollmentsResult, assessmentsResult, assignmentsResult, submissionsResult]
    .find((result) => result.error);
  if (failedResult?.error) throw reportError(failedResult.error);

  const classes = (classesResult.data ?? []) as ClassRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[];
  const assessments = (assessmentsResult.data ?? []) as AssessmentRow[];
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];
  const now = new Date();

  const membershipById = new Map(memberships.map((membership) => [membership.id, membership]));
  const assessmentById = new Map(assessments.map((assessment) => [assessment.id, assessment]));
  const enrollmentsByClass = new Map<string, EnrollmentRow[]>();
  const submissionsByClassAssessment = new Map<string, SubmissionRow[]>();

  for (const enrollment of enrollments) {
    const classEnrollments = enrollmentsByClass.get(enrollment.class_id) ?? [];
    classEnrollments.push(enrollment);
    enrollmentsByClass.set(enrollment.class_id, classEnrollments);
  }

  for (const submission of submissions) {
    const key = `${submission.class_id}:${submission.assessment_id}`;
    const groupedSubmissions = submissionsByClassAssessment.get(key) ?? [];
    groupedSubmissions.push(submission);
    submissionsByClassAssessment.set(key, groupedSubmissions);
  }

  const assignmentsByClass = new Map<string, AssessmentContext[]>();
  for (const assignment of assignments) {
    const assessment = assessmentById.get(assignment.assessment_id);
    if (!assessment) continue;
    const groupedSubmissions = submissionsByClassAssessment.get(`${assignment.class_id}:${assignment.assessment_id}`) ?? [];
    if (!shouldReportAssignment(assessment, assignment, groupedSubmissions, now)) continue;

    const expectedPupilIds = new Set(
      (enrollmentsByClass.get(assignment.class_id) ?? [])
        .filter((enrollment) => enrollmentOverlapsAssessment(enrollment, assessment, assignment, now))
        .map((enrollment) => enrollment.school_membership_id),
    );
    for (const submission of groupedSubmissions) expectedPupilIds.add(submission.school_membership_id);

    const contexts = assignmentsByClass.get(assignment.class_id) ?? [];
    contexts.push({ assessment, assignment, submissions: groupedSubmissions, expectedPupilIds });
    assignmentsByClass.set(assignment.class_id, contexts);
  }

  const reportClasses = classes.map<SchoolClassPerformance>((schoolClass) => {
    const contexts = (assignmentsByClass.get(schoolClass.id) ?? []).sort((left, right) =>
      left.assessment.title.localeCompare(right.assessment.title),
    );
    const classEnrollments = enrollmentsByClass.get(schoolClass.id) ?? [];
    const activePupilIds = new Set(
      classEnrollments
        .filter((enrollment) => enrollment.status === "active" && membershipById.get(enrollment.school_membership_id)?.status === "active")
        .map((enrollment) => enrollment.school_membership_id),
    );

    const assessmentPerformance = contexts.map<SchoolClassAssessmentPerformance>((context) => {
      const stats = performanceStats(context.submissions);
      return {
        assessmentId: context.assessment.id,
        title: context.assessment.title,
        subject: context.assessment.subject?.trim() || "No subject",
        expectedCount: context.expectedPupilIds.size,
        submittedCount: context.submissions.length,
        completedCount: stats.completedCount,
        pendingCount: stats.pendingCount,
        averagePercentage: stats.averagePercentage,
        highestPercentage: stats.highestPercentage,
        lowestPercentage: stats.lowestPercentage,
        passedCount: stats.passedCount,
        passRate: stats.passRate,
        submissionRate: rate(context.submissions.length, context.expectedPupilIds.size),
      };
    });

    const pupilIds = new Set(activePupilIds);
    for (const context of contexts) {
      for (const membershipId of context.expectedPupilIds) pupilIds.add(membershipId);
    }

    const pupilPerformance = [...pupilIds].map<SchoolPupilPerformance>((membershipId) => {
      const membership = membershipById.get(membershipId);
      const pupilSubmission = contexts
        .flatMap((context) => context.submissions)
        .find((submission) => submission.school_membership_id === membershipId);
      const assessmentResults = contexts
        .filter((context) => context.expectedPupilIds.has(membershipId))
        .map<PupilAssessmentPerformance>((context) => {
          const submission = context.submissions.find((item) => item.school_membership_id === membershipId);
          const status: PupilAssessmentStatus = !submission
            ? "not_submitted"
            : submission.theory_status === "pending"
              ? "pending"
              : "completed";
          return {
            assessmentId: context.assessment.id,
            title: context.assessment.title,
            subject: context.assessment.subject?.trim() || "No subject",
            status,
            automaticScore: submission ? numberOrNull(submission.score) : null,
            finalScore: status === "completed" && submission
              ? numberOrNull(submission.final_score) ?? numberOrNull(submission.score)
              : null,
            finalPercentage: status === "completed" && submission ? completedPercentage(submission) : null,
            submittedAt: submission?.submitted_at ?? null,
          };
        });
      const completedPercentages = assessmentResults
        .map((result) => result.finalPercentage)
        .filter((value): value is number => value !== null);
      const submittedCount = assessmentResults.filter((result) => result.status !== "not_submitted").length;

      return {
        membershipId,
        studentName: membership?.display_name?.trim()
          || pupilSubmission?.student_name_snapshot?.trim()
          || membership?.admission_number?.trim()
          || "Unnamed pupil",
        admissionNumber: membership?.admission_number?.trim()
          || pupilSubmission?.admission_number_snapshot?.trim()
          || null,
        assignedCount: assessmentResults.length,
        submittedCount,
        completedCount: completedPercentages.length,
        pendingCount: assessmentResults.filter((result) => result.status === "pending").length,
        averagePercentage: roundedAverage(completedPercentages),
        highestPercentage: completedPercentages.length > 0 ? Math.max(...completedPercentages) : null,
        submissionRate: rate(submittedCount, assessmentResults.length),
        assessmentResults,
      };
    }).sort((left, right) => left.studentName.localeCompare(right.studentName));

    const allSubmissions = contexts.flatMap((context) => context.submissions);
    const stats = performanceStats(allSubmissions);
    const expectedSubmissions = assessmentPerformance.reduce((sum, assessment) => sum + assessment.expectedCount, 0);

    return {
      classId: schoolClass.id,
      className: schoolClass.name,
      classStatus: schoolClass.status,
      studentCount: activePupilIds.size,
      assessmentCount: contexts.length,
      expectedSubmissions,
      submittedCount: allSubmissions.length,
      completedCount: stats.completedCount,
      pendingCount: stats.pendingCount,
      averagePercentage: stats.averagePercentage,
      highestPercentage: stats.highestPercentage,
      lowestPercentage: stats.lowestPercentage,
      passedCount: stats.passedCount,
      passRate: stats.passRate,
      submissionRate: rate(allSubmissions.length, expectedSubmissions),
      assessments: assessmentPerformance,
      pupils: pupilPerformance,
    };
  });

  reportClasses.sort((left, right) => {
    if (left.classStatus !== right.classStatus) return left.classStatus === "active" ? -1 : 1;
    return left.className.localeCompare(right.className);
  });

  const reportAssessmentMap = new Map<string, SchoolReportAssessment>();
  for (const schoolClass of reportClasses) {
    for (const assessment of schoolClass.assessments) {
      reportAssessmentMap.set(assessment.assessmentId, {
        id: assessment.assessmentId,
        title: assessment.title,
        subject: assessment.subject,
      });
    }
  }

  return {
    generatedAt: now.toISOString(),
    classes: reportClasses,
    assessments: [...reportAssessmentMap.values()].sort((left, right) => left.title.localeCompare(right.title)),
  };
}
