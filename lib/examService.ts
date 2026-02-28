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
  created_at: string;
}

// ── READ: fetch all exams ─────────────────────────────────────────────────────
export async function getExams(): Promise<DbExam[]> {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── CREATE: insert exam + questions ───────────────────────────────────────────
export async function createExam(
  form: ExamForm,
  questions: Question[],
  status: "Draft" | "Published",
): Promise<string> {
  // 1. Insert the exam row
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
    })
    .select("id")
    .single();

  if (examErr) throw examErr;

  const examId = examRow.id as string;

  // 2. Insert all question rows (only approved ones)
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
      order_index: idx,
    }));

    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw qErr;
  }

  return examId;
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

// ── DELETE: remove exam (cascades to questions) ───────────────────────────────
export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) throw error;
}
