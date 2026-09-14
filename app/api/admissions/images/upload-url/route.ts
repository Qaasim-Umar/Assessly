import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdmissionImageUploadUrl } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function unauthorized(message = "You must be signed in as a general admin.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return unauthorized();

  const accessToken = authorization.slice("Bearer ".length).trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return unauthorized();

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("is_general_admin")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile?.is_general_admin) return unauthorized();

  let body: { contentType?: unknown; fileSize?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;
  const extension = IMAGE_EXTENSIONS[contentType];
  if (!extension) {
    return NextResponse.json(
      { error: "Choose a JPG, PNG or WebP image." },
      { status: 400 },
    );
  }
  if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "The image must be 5 MB or smaller." },
      { status: 400 },
    );
  }

  const year = new Date().getUTCFullYear();
  const objectKey = `featured-gists/${year}/${randomUUID()}.${extension}`;

  try {
    const { uploadUrl, publicUrl } = await createAdmissionImageUploadUrl(
      objectKey,
      contentType,
    );
    return NextResponse.json({ uploadUrl, publicUrl, objectKey });
  } catch (error) {
    console.error("Unable to create admission image upload URL", error);
    return NextResponse.json(
      { error: "Image uploads are not available right now." },
      { status: 500 },
    );
  }
}
