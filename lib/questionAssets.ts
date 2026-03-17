import { supabase } from "./supabase";

const BUCKET = "question-assets";

function safeExtFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,6}$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  return "png";
}

export async function uploadGeneralQuestionImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file (PNG/JPG/WebP).");
  }

  const ext = safeExtFromFile(file);
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
  const path = `general/${id}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadErr) {
    // Most common cause in new projects: bucket doesn't exist or isn't public.
    throw new Error(uploadErr.message);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned.");
  }
  return data.publicUrl;
}

