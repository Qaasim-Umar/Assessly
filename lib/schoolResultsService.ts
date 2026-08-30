import { supabase } from "./supabase";

export type SchoolTheoryStatus = "not_required" | "pending" | "graded";

export type SchoolResultQuestion = {
  id: string;
  text: string;
  type: string;
  orderIndex: number;
};

export type SchoolResultSubmission = {
  id: string;
  studentName: string;
  admissionNumber: string | null;
  className: string;
  submittedAt: string;
  automaticScore: number;
  automaticPercentage: number;
  theoryStatus: SchoolTheoryStatus;
  theoryAnswers: Record<string, string>;
  theoryMarks: Record<string, number>;
  finalScore: number | null;
  finalPercentage: number | null;
};

export type SchoolAssessmentResultDetail = {
  id: string;
  title: string;
  subject: string;
  showResults: boolean;
  questionCount: number;
  questions: SchoolResultQuestion[];
  submissions: SchoolResultSubmission[];
};

type AssessmentRow = {
  id: string;
  title: string;
  subject: string | null;
  show_results: boolean;
  question_count: number;
};

type QuestionRow = {
  id: string;
  text: string;
  type: string;
  order_index: number;
};

type SubmissionRow = {
  id: string;
  student_name_snapshot: string | null;
  admission_number_snapshot: string | null;
  class_name_snapshot: string | null;
  score: number | string | null;
  percentage: number | string | null;
  theory_status: SchoolTheoryStatus;
  theory_answers: unknown;
  theory_marks: unknown;
  final_score: number | string | null;
  final_percentage: number | string | null;
  submitted_at: string;
};

type GradeResultRow = {
  final_score: number | string;
  final_percentage: number | string;
  theory_score: number | string;
  theory_status: "graded";
};

function numberOf(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function numberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, numberOf(typeof item === "number" || typeof item === "string" ? item : null)]),
  );
}

function resultsError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === "42501") {
    return new Error("You do not have permission to view or grade these School results.");
  }
  if (error.code === "P0002") return new Error("That submission could not be found.");
  if (error.code === "22023") return new Error(error.message?.trim() || "Check the theory marks and try again.");
  return new Error(error.message?.trim() || fallback);
}

export async function getSchoolAssessmentResults(
  schoolId: string,
  assessmentId: string,
): Promise<SchoolAssessmentResultDetail> {
  const [assessmentResult, questionsResult, submissionsResult] = await Promise.all([
    supabase
      .from("school_assessments")
      .select("id, title, subject, show_results, question_count")
      .eq("school_id", schoolId)
      .eq("id", assessmentId)
      .maybeSingle(),
    supabase
      .from("school_assessment_questions")
      .select("id, text, type, order_index")
      .eq("school_id", schoolId)
      .eq("assessment_id", assessmentId)
      .eq("is_active", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("school_submissions")
      .select("id, student_name_snapshot, admission_number_snapshot, class_name_snapshot, score, percentage, theory_status, theory_answers, theory_marks, final_score, final_percentage, submitted_at")
      .eq("school_id", schoolId)
      .eq("assessment_id", assessmentId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (assessmentResult.error) throw resultsError(assessmentResult.error, "Could not load this assessment.");
  if (!assessmentResult.data) throw new Error("This assessment was not found or is outside your School workspace.");
  if (questionsResult.error) throw resultsError(questionsResult.error, "Could not load the assessment questions.");
  if (submissionsResult.error) throw resultsError(submissionsResult.error, "Could not load the pupil submissions.");

  const assessment = assessmentResult.data as AssessmentRow;
  const questions = (questionsResult.data ?? []) as QuestionRow[];
  const submissions = (submissionsResult.data ?? []) as SubmissionRow[];

  return {
    id: assessment.id,
    title: assessment.title,
    subject: assessment.subject?.trim() || "No subject",
    showResults: assessment.show_results,
    questionCount: assessment.question_count,
    questions: questions.map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type,
      orderIndex: question.order_index,
    })),
    submissions: submissions.map((submission) => ({
      id: submission.id,
      studentName: submission.student_name_snapshot?.trim() || submission.admission_number_snapshot?.trim() || "Unnamed pupil",
      admissionNumber: submission.admission_number_snapshot?.trim() || null,
      className: submission.class_name_snapshot?.trim() || "Unassigned class",
      submittedAt: submission.submitted_at,
      automaticScore: numberOf(submission.score),
      automaticPercentage: numberOf(submission.percentage),
      theoryStatus: submission.theory_status,
      theoryAnswers: stringRecord(submission.theory_answers),
      theoryMarks: numberRecord(submission.theory_marks),
      finalScore: submission.theory_status === "pending" ? null : numberOf(submission.final_score ?? submission.score),
      finalPercentage: submission.theory_status === "pending" ? null : numberOf(submission.final_percentage ?? submission.percentage),
    })),
  };
}

export async function gradeSchoolTheorySubmission(
  submissionId: string,
  theoryMarks: Record<string, number>,
): Promise<{ finalScore: number; finalPercentage: number; theoryScore: number }> {
  const { data, error } = await supabase.rpc("grade_school_theory_submission", {
    p_submission_id: submissionId,
    p_theory_marks: theoryMarks,
  });
  if (error) throw resultsError(error, "Could not save the theory marks.");

  const row = (Array.isArray(data) ? data[0] : data) as GradeResultRow | null;
  if (!row) throw new Error("The theory marks were not saved. Try again.");
  return {
    finalScore: numberOf(row.final_score),
    finalPercentage: numberOf(row.final_percentage),
    theoryScore: numberOf(row.theory_score),
  };
}

export async function updateSchoolResultVisibility(
  schoolId: string,
  assessmentId: string,
  showResults: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from("school_assessments")
    .update({ show_results: showResults })
    .eq("school_id", schoolId)
    .eq("id", assessmentId)
    .select("id")
    .maybeSingle();

  if (error) throw resultsError(error, "Could not update pupil result visibility.");
  if (!data) throw new Error("The assessment was not found or you do not have permission to update it.");
}
