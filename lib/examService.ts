import { supabase } from "./supabase";
import type { ExamForm, Question } from "@/app/dashboard/create/types";

// ── Types that mirror Supabase rows ───────────────────────────────────────────
export interface DbExam {
  id: string;
  title: string;
  subject: string;
  class_level: string;
  type: string;
  duration: number | null;
  difficulty: string;
  question_type: string;
  status: "Draft" | "Published" | "Live";
  question_count: number;
  show_results: boolean;
  created_at: string;
}

export interface DbQuestion {
  id: string;
  exam_id: string;
  text: string;
  type: string;
  topic: string | null;
  command_word: string | null;
  difficulty: string | null;
  options: { label: string; text: string }[] | null;
  correct_answer: number | null; // 0-based index of correct option
  order_index: number;
}

export interface DbExamWithQuestions extends DbExam {
  questions: DbQuestion[];
}

export interface DbSubmission {
  id: string;
  exam_id: string;
  student_name: string;
  answers: Record<string, number>; // questionIndex → chosen option index
  score: number;
  total: number;
  percentage: number;
  submitted_at: string;
  // Theory grading fields
  theory_answers: Record<string, string>; // questionIndex → student text
  theory_status: "none" | "pending_review" | "graded";
  theory_marks: Record<string, number>; // questionIndex → marks awarded
  mcq_score: number;
  final_score: number;
  final_percentage: number;
}

// ── READ: fetch all exams (teacher dashboard — scoped to their school) ────────────
export async function getExams(schoolCode?: string): Promise<DbExam[]> {
  let query = supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });

  if (schoolCode) query = query.eq("school_code", schoolCode);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── READ: fetch published/live exams for student portal (scoped by school code) ───
export async function getPublishedExams(
  schoolCode?: string,
): Promise<DbExam[]> {
  let query = supabase
    .from("exams")
    .select("*")
    .in("status", ["Published", "Live"])
    .order("created_at", { ascending: false });

  if (schoolCode) query = query.eq("school_code", schoolCode);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── READ: fetch a single exam with its questions ──────────────────────────────
export async function getExamById(
  id: string,
): Promise<DbExamWithQuestions | null> {
  const { data: exam, error: examErr } = await supabase
    .from("exams")
    .select("*")
    .eq("id", id)
    .single();

  if (examErr) return null;

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", id)
    .order("order_index", { ascending: true });

  if (qErr) throw qErr;

  return { ...exam, questions: questions ?? [] };
}

// ── READ: fetch all submissions for an exam (teacher results) ─────────────────
export async function getExamResults(examId: string): Promise<DbSubmission[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("exam_id", examId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── CREATE: insert exam + questions ───────────────────────────────────────────
export async function createExam(
  form: ExamForm,
  questions: Question[],
  status: "Draft" | "Published",
  schoolCode?: string,
): Promise<string> {
  const { data: examRow, error: examErr } = await supabase
    .from("exams")
    .insert({
      title: form.title,
      subject: form.subject,
      class_level: form.classLevel,
      type: form.type,
      duration: form.duration ? Number(form.duration) : null,
      difficulty: form.difficulty,
      question_type: form.questionType,
      status,
      question_count: questions.length,
      school_code: schoolCode ?? null,
    })
    .select("id")
    .single();

  if (examErr) throw examErr;

  const examId = examRow.id as string;

  // Try to set show_results (column may not exist yet if migration not run)
  try {
    await supabase
      .from("exams")
      .update({ show_results: form.showResults ?? true })
      .eq("id", examId);
  } catch {
    /* ignore — column doesn't exist yet */
  }

  const approved = questions.filter((q) => q.approved);
  if (approved.length > 0) {
    const rows = approved.map((q, idx) => ({
      exam_id: examId,
      text: q.text,
      type: q.type,
      topic: q.topic,
      command_word: q.commandWord,
      difficulty: q.userDifficulty,
      options: q.options ?? null,
      correct_answer: q.correctAnswer ?? null,
      order_index: idx,
    }));
    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw qErr;
  }

  return examId;
}

// ── UPDATE: edit exam metadata + replace questions ────────────────────────────
export async function updateExam(
  id: string,
  form: ExamForm,
  questions: Question[],
  status: "Draft" | "Published",
): Promise<void> {
  const { error: examErr } = await supabase
    .from("exams")
    .update({
      title: form.title,
      subject: form.subject,
      class_level: form.classLevel,
      type: form.type,
      duration: form.duration ? Number(form.duration) : null,
      difficulty: form.difficulty,
      question_type: form.questionType,
      status,
      question_count: questions.length,
    })
    .eq("id", id);

  if (examErr) throw examErr;

  // Try to set show_results (column may not exist yet if migration not run)
  try {
    await supabase
      .from("exams")
      .update({ show_results: form.showResults ?? true })
      .eq("id", id);
  } catch {
    /* ignore */
  }

  const { error: delErr } = await supabase
    .from("questions")
    .delete()
    .eq("exam_id", id);
  if (delErr) throw delErr;

  if (questions.length > 0) {
    const rows = questions.map((q, idx) => ({
      exam_id: id,
      text: q.text,
      type: q.type,
      topic: q.topic,
      command_word: q.commandWord,
      difficulty: q.userDifficulty,
      options: q.options ?? null,
      correct_answer: q.correctAnswer ?? null,
      order_index: idx,
    }));
    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw qErr;
  }
}

// ── SUBMIT: score a student attempt and persist it ────────────────────────────
export async function submitExamResult(
  examId: string,
  answers: Record<number, number>, // questionIndex → chosen option index (MCQ)
  questions: DbQuestion[],
  theoryAnswers: Record<number, string>, // questionIndex → typed text (theory)
  studentName = "Student",
): Promise<{
  score: number;
  total: number;
  percentage: number;
  hasTheory: boolean;
}> {
  const total = questions.length;

  // Separate MCQ questions (have correct_answer) from theory questions
  let mcqScore = 0;
  let mcqTotal = 0;
  let hasTheory = false;

  questions.forEach((q, idx) => {
    const isTheory =
      q.correct_answer === null || q.correct_answer === undefined;
    if (isTheory) {
      hasTheory = true;
    } else {
      mcqTotal++;
      if (answers[idx] === q.correct_answer) {
        mcqScore++;
      }
    }
  });

  // Initial score shows MCQ only; final will be updated after teacher grades theory
  const initialPercentage =
    total > 0 ? Math.round((mcqScore / total) * 100) : 0;
  const theoryStatus = hasTheory ? "pending_review" : "none";

  // Persist submission (fire-and-forget — don't block student on DB error)
  try {
    const answersJson: Record<string, number> = {};
    Object.entries(answers).forEach(([k, v]) => {
      answersJson[k] = v;
    });

    const theoryAnswersJson: Record<string, string> = {};
    Object.entries(theoryAnswers).forEach(([k, v]) => {
      theoryAnswersJson[k] = v;
    });

    await supabase.from("submissions").insert({
      exam_id: examId,
      student_name: studentName,
      answers: answersJson,
      score: mcqScore,
      total,
      percentage: initialPercentage,
      theory_answers: theoryAnswersJson,
      theory_status: theoryStatus,
      theory_marks: {},
      mcq_score: mcqScore,
      final_score: mcqScore,
      final_percentage: initialPercentage,
    });
  } catch {
    // Non-fatal — score still returned to client
  }

  return { score: mcqScore, total, percentage: initialPercentage, hasTheory };
}

// ── UPDATE: teacher grades theory answers and recalculates final score ─────────
export async function updateTheoryMarks(
  submissionId: string,
  theoryMarks: Record<string, number>, // questionIndex string → marks awarded
  mcqScore: number,
  totalQuestions: number,
): Promise<{ finalScore: number; finalPercentage: number }> {
  const theoryTotal = Object.values(theoryMarks).reduce((a, b) => a + b, 0);
  const finalScore = mcqScore + theoryTotal;
  const finalPercentage =
    totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0;

  const { error } = await supabase
    .from("submissions")
    .update({
      theory_marks: theoryMarks,
      theory_status: "graded",
      final_score: finalScore,
      final_percentage: finalPercentage,
      // Also update the top-level score/percentage for backwards compat with summary cards
      score: finalScore,
      percentage: finalPercentage,
    })
    .eq("id", submissionId);

  if (error) throw error;
  return { finalScore, finalPercentage };
}

// ── UPDATE: change exam status ────────────────────────────────────────────────
export async function updateExamStatus(
  id: string,
  status: "Draft" | "Published" | "Live",
): Promise<void> {
  const { error } = await supabase
    .from("exams")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

// ── UPDATE: toggle student result visibility ──────────────────────────────────
export async function updateShowResults(
  id: string,
  showResults: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("exams")
    .update({ show_results: showResults })
    .eq("id", id);
  if (error) throw error;
}

// ── DELETE: remove exam (cascades to questions) ───────────────────────────────

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw error;
}
