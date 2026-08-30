import { supabase } from "./supabase";
import type { DbExam, DbExamWithQuestions, DbQuestion } from "./examService";

type LiveAssessmentRow = {
  assessment_id: string;
  title: string;
  subject: string | null;
  class_id: string;
  class_name: string;
  assignment_id: string;
  starts_at: string | null;
  ends_at: string | null;
};

type AssessmentDetailsRow = {
  id: string;
  assessment_type: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  question_type: string | null;
  question_count: number;
  show_results: boolean;
  created_at: string;
};

type SubmissionStatusRow = {
  assessment_id: string;
  submitted_at: string;
};

type AssessmentOverviewRow = {
  assessment_id: string;
  title: string;
  subject: string | null;
  class_id: string;
  class_name: string;
  assignment_id: string;
  starts_at: string | null;
  ends_at: string | null;
  assessment_type: string | null;
  duration_minutes: number | null;
  difficulty: string | null;
  question_type: string | null;
  question_count: number;
  show_results: boolean;
  created_at: string;
  can_attempt: boolean;
  submitted_at: string | null;
  theory_status: "not_required" | "pending" | "graded" | null;
  result_available: boolean;
  result_score: number | string | null;
  result_total: number | null;
  result_percentage: number | string | null;
};

type SchoolQuestionRow = {
  id: string;
  assessment_id: string;
  text: string;
  image_url: string | null;
  instruction: string | null;
  passage: string | null;
  type: string;
  topic: string | null;
  difficulty: string | null;
  options: unknown;
  correct_answer: null;
  order_index: number;
};

type SubmitSchoolAssessmentRow = {
  score: number;
  total: number;
  percentage: number;
  has_theory: boolean;
  show_results: boolean;
  correct_answers: Record<string, number | null> | null;
  submitted_at: string;
};

export interface SchoolPupilAssessment extends DbExam {
  assignment_id: string;
  class_id: string;
  class_name: string;
  starts_at: string | null;
  ends_at: string | null;
  submitted_at: string | null;
  can_attempt: boolean;
  theory_status: "not_required" | "pending" | "graded" | null;
  result_available: boolean;
  result_score: number | null;
  result_total: number | null;
  result_percentage: number | null;
}

export interface SchoolPupilAssessmentWithQuestions extends DbExamWithQuestions {
  assignment_id: string;
  class_id: string;
  class_name: string;
  starts_at: string | null;
  ends_at: string | null;
  submitted_at: string | null;
  can_attempt: boolean;
  theory_status: "not_required" | "pending" | "graded" | null;
  result_available: boolean;
  result_score: number | null;
  result_total: number | null;
  result_percentage: number | null;
}

function serviceError(error: { code?: string; message?: string }, fallback: string): Error {
  const message = error.message?.toLowerCase() ?? "";
  if (error.code === "23505" || message.includes("already been submitted")) {
    return new Error("You have already submitted this assessment.");
  }
  if (error.code === "42501" || message.includes("not available")) {
    return new Error("This assessment is no longer available for your class.");
  }
  return new Error(error.message?.trim() || fallback);
}

function normalizeOptions(value: unknown): DbQuestion["options"] {
  if (!Array.isArray(value)) return null;
  const options = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const option = item as { label?: unknown; text?: unknown };
      if (typeof option.text !== "string") return null;
      return {
        label: typeof option.label === "string" ? option.label : String.fromCharCode(65 + index),
        text: option.text,
      };
    })
    .filter((item): item is { label: string; text: string } => item !== null);
  return options.length > 0 ? options : null;
}

function numberOf(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function missingFunction(code?: string): boolean {
  return ["PGRST202", "PGRST204", "42883"].includes(code ?? "");
}

export async function getMySchoolAssessments(): Promise<SchoolPupilAssessment[]> {
  const overviewResult = await supabase.rpc("get_my_school_assessment_overview");
  if (!overviewResult.error) {
    return ((overviewResult.data ?? []) as AssessmentOverviewRow[])
      .map<SchoolPupilAssessment>((row) => ({
        id: row.assessment_id,
        title: row.title,
        subject: row.subject?.trim() || "No subject",
        class_level: row.class_name,
        type: row.assessment_type?.trim() || "Test",
        duration: row.duration_minutes,
        difficulty: row.difficulty?.trim() || "Mixed",
        question_type: row.question_type?.trim() || "Mixed",
        status: "Live",
        question_count: row.question_count ?? 0,
        show_results: row.show_results,
        is_general: false,
        created_at: row.created_at,
        assignment_id: row.assignment_id,
        class_id: row.class_id,
        class_name: row.class_name,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        submitted_at: row.submitted_at,
        can_attempt: row.can_attempt,
        theory_status: row.theory_status,
        result_available: row.result_available,
        result_score: numberOf(row.result_score),
        result_total: row.result_total,
        result_percentage: numberOf(row.result_percentage),
      }))
      .sort((left, right) => Number(right.can_attempt) - Number(left.can_attempt) || (right.submitted_at ?? right.created_at).localeCompare(left.submitted_at ?? left.created_at));
  }
  if (!missingFunction(overviewResult.error.code)) {
    throw serviceError(overviewResult.error, "Could not load your School assessments.");
  }

  const { data: liveData, error: liveError } = await supabase.rpc("get_my_live_school_assessments");
  if (liveError) throw serviceError(liveError, "Could not load your School assessments.");

  const liveRows = (liveData ?? []) as LiveAssessmentRow[];
  const uniqueRows = [...new Map(liveRows.map((row) => [row.assessment_id, row])).values()];
  if (uniqueRows.length === 0) return [];

  const assessmentIds = uniqueRows.map((row) => row.assessment_id);
  const [detailsResult, submissionsResult] = await Promise.all([
    supabase
      .from("school_assessments")
      .select("id, assessment_type, duration_minutes, difficulty, question_type, question_count, show_results, created_at")
      .in("id", assessmentIds),
    supabase.rpc("get_my_school_submission_status"),
  ]);

  if (detailsResult.error) throw serviceError(detailsResult.error, "Could not load the assessment details.");
  let submissionRows = (submissionsResult.data ?? []) as SubmissionStatusRow[];
  if (submissionsResult.error) {
    const functionMissing = missingFunction(submissionsResult.error.code);
    if (!functionMissing) throw serviceError(submissionsResult.error, "Could not check your submitted assessments.");
    const fallbackResult = await supabase
      .from("school_submissions")
      .select("assessment_id, submitted_at")
      .in("assessment_id", assessmentIds);
    if (fallbackResult.error) throw serviceError(fallbackResult.error, "Could not check your submitted assessments.");
    submissionRows = (fallbackResult.data ?? []) as SubmissionStatusRow[];
  }

  const detailsById = new Map(((detailsResult.data ?? []) as AssessmentDetailsRow[]).map((row) => [row.id, row]));
  const submittedByAssessmentId = new Map(
    submissionRows.map((row) => [row.assessment_id, row.submitted_at]),
  );

  return uniqueRows.flatMap((row) => {
    const details = detailsById.get(row.assessment_id);
    if (!details) return [];
    return [{
      id: row.assessment_id,
      title: row.title,
      subject: row.subject?.trim() || "No subject",
      class_level: row.class_name,
      type: details.assessment_type?.trim() || "Test",
      duration: details.duration_minutes,
      difficulty: details.difficulty?.trim() || "Mixed",
      question_type: details.question_type?.trim() || "Mixed",
      status: "Live" as const,
      question_count: details.question_count ?? 0,
      show_results: details.show_results,
      is_general: false,
      created_at: details.created_at,
      assignment_id: row.assignment_id,
      class_id: row.class_id,
      class_name: row.class_name,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      submitted_at: submittedByAssessmentId.get(row.assessment_id) ?? null,
      can_attempt: !submittedByAssessmentId.has(row.assessment_id),
      theory_status: null,
      result_available: false,
      result_score: null,
      result_total: null,
      result_percentage: null,
    }];
  });
}

export async function getSchoolAssessmentById(
  assessmentId: string,
): Promise<SchoolPupilAssessmentWithQuestions | null> {
  const assessments = await getMySchoolAssessments();
  const assessment = assessments.find((item) => item.id === assessmentId);
  if (!assessment) return null;

  if (!assessment.can_attempt) return { ...assessment, questions: [] };

  const { data, error } = await supabase.rpc("get_school_assessment_questions", {
    p_assessment_id: assessmentId,
  });
  if (error) throw serviceError(error, "Could not load the assessment questions.");

  const questions = ((data ?? []) as SchoolQuestionRow[]).map<DbQuestion>((row) => ({
    id: row.id,
    exam_id: row.assessment_id,
    text: row.text,
    image_url: row.image_url,
    instruction: row.instruction,
    passage: row.passage,
    type: row.type,
    topic: row.topic,
    command_word: null,
    difficulty: row.difficulty,
    options: normalizeOptions(row.options),
    correct_answer: null,
    order_index: row.order_index,
  }));

  return { ...assessment, questions };
}

export async function submitSchoolAssessmentResult(
  assessmentId: string,
  answers: Record<number, number>,
  theoryAnswers: Record<number, string>,
): Promise<{
  score: number;
  total: number;
  percentage: number;
  hasTheory: boolean;
  correctAnswers?: Record<string, number | null>;
}> {
  const { data, error } = await supabase.rpc("submit_my_school_assessment", {
    p_assessment_id: assessmentId,
    p_answers: answers,
    p_theory_answers: theoryAnswers,
  });
  if (error) throw serviceError(error, "Could not submit this assessment.");

  const row = (Array.isArray(data) ? data[0] : data) as SubmitSchoolAssessmentRow | null;
  if (!row) throw new Error("The assessment was not submitted. Try again.");
  return {
    score: row.score,
    total: row.total,
    percentage: row.percentage,
    hasTheory: row.has_theory,
    correctAnswers: row.correct_answers ?? undefined,
  };
}
