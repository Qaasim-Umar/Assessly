import { NextResponse } from "next/server";
import { getPublishedQuestionBankPackById } from "@/lib/questionBankData";
import { createPrivateR2DownloadUrl } from "@/lib/r2";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packId = searchParams.get("packId");
  const rawFileIndex = searchParams.get("file") ?? "0";

  if (!packId || !/^\d+$/.test(rawFileIndex)) {
    return errorResponse("Invalid download request.", 400);
  }

  const pack = await getPublishedQuestionBankPackById(packId);
  if (!pack) {
    return errorResponse("Question pack not found.", 404);
  }

  const files =
    pack.packType === "single"
      ? [
          {
            name: `${pack.slug}.pdf`,
            objectKey: pack.objectKey,
          },
        ]
      : pack.packFiles;
  const file = files[Number(rawFileIndex)];

  if (!file?.objectKey) {
    return errorResponse("Question bank file not found.", 404);
  }

  try {
    const storedFilename = file.objectKey.split("/").pop() || `${file.name}.pdf`;
    const signedUrl = await createPrivateR2DownloadUrl(
      file.objectKey,
      storedFilename,
    );
    return NextResponse.redirect(signedUrl, {
      status: 307,
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch (error) {
    console.error("Unable to create private question-bank download URL", error);
    return errorResponse("This download is temporarily unavailable.", 503);
  }
}
