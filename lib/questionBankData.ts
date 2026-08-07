import "server-only";

import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  QUESTION_BANK_PACKS,
  type QuestionBankExam,
  type QuestionBankPack,
} from "@/lib/questionBankCatalog";

type DatabasePack = {
  id: string;
  slug: string;
  exam: string;
  exam_label: string;
  section: string;
  title: string;
  subject: string;
  years: string;
  short_description: string;
  pack_type: "single" | "pack";
  object_key: string | null;
  pack_files: Array<{
    name?: string;
    object_key?: string;
  }> | null;
};

const PACK_COLUMNS = [
  "id",
  "slug",
  "exam",
  "exam_label",
  "section",
  "title",
  "subject",
  "years",
  "short_description",
  "pack_type",
  "object_key",
  "pack_files",
].join(",");

function mapDatabasePack(pack: DatabasePack): QuestionBankPack {
  return {
    id: pack.id,
    slug: pack.slug,
    exam: pack.exam as QuestionBankExam,
    examLabel: pack.exam_label,
    section: pack.section,
    title: pack.title,
    subject: pack.subject,
    years: pack.years,
    shortDescription: pack.short_description,
    packType: pack.pack_type,
    objectKey: pack.object_key ?? "",
    packFiles: (pack.pack_files ?? []).map((file, index) => ({
      name: file.name?.trim() || `File ${index + 1}`,
      objectKey: file.object_key ?? "",
      format: "PDF",
    })),
  };
}

export async function listPublishedQuestionBankPacks() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("question_bank_packs")
      .select(PACK_COLUMNS)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data?.length) return (data as unknown as DatabasePack[]).map(mapDatabasePack);
  } catch {
    // The checked-in catalog keeps local previews and builds available without Supabase.
  }

  return QUESTION_BANK_PACKS;
}

export async function getPublishedQuestionBankPack(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("question_bank_packs")
      .select(PACK_COLUMNS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapDatabasePack(data as unknown as DatabasePack);
  } catch {
    // Fall through to the local preview catalog.
  }

  return QUESTION_BANK_PACKS.find((pack) => pack.slug === slug);
}

export async function getPublishedQuestionBankPackById(id: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("question_bank_packs")
      .select(PACK_COLUMNS)
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapDatabasePack(data as unknown as DatabasePack);
  } catch {
    // Fall through to the local preview catalog.
  }

  return QUESTION_BANK_PACKS.find((pack) => pack.id === id);
}
