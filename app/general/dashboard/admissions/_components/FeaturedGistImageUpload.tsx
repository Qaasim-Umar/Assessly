"use client";

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, UploadCloud } from "lucide-react";
import { getGeneralAdminSession } from "@/lib/generalAdminAuth";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadResult = {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  error?: string;
};

function putImage(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Cloudflare rejected the upload."));
    });
    request.addEventListener("error", () => reject(new Error("The upload was interrupted.")));
    request.send(file);
  });
}

export default function FeaturedGistImageUpload({
  imageUrl,
  onUploaded,
}: {
  imageUrl?: string | null;
  onUploaded: (value: { url: string; key: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(imageUrl ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }

    setPendingFile(file);
    setError("");
    setProgress(0);
    setUploading(true);

    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = URL.createObjectURL(file);
    setPreviewUrl(localPreviewRef.current);

    try {
      const session = await getGeneralAdminSession();
      if (!session) throw new Error("Your admin session has expired. Sign in again.");

      const response = await fetch("/api/admissions/images/upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
      });
      const result = (await response.json()) as UploadResult;
      if (!response.ok) throw new Error(result.error || "Could not start the upload.");

      await putImage(result.uploadUrl, file, setProgress);
      setProgress(100);
      setPreviewUrl(result.publicUrl);
      onUploaded({ url: result.publicUrl, key: result.objectKey });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
          <ImagePlus size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-gray-800">Featured image</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Upload from your phone or computer. JPG, PNG or WebP, up to 5 MB.
          </p>
        </div>
      </div>

      {previewUrl && (
        <div className="mt-4 aspect-[16/9] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Featured gist preview" className="h-full w-full object-cover" />
        </div>
      )}

      {uploading && (
        <div className="mt-4" aria-live="polite">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Uploading to Cloudflare…</span>
            <span>{progress}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Image upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-gray-100"
          >
            <div className="h-full rounded-full bg-green-600 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs font-medium text-red-600" role="alert">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-bold text-white transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud size={17} aria-hidden="true" />
          {imageUrl ? "Replace image" : "Choose image"}
        </button>
        {error && pendingFile && (
          <button
            type="button"
            onClick={() => void upload(pendingFile)}
            disabled={uploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <RefreshCw size={16} aria-hidden="true" /> Retry
          </button>
        )}
      </div>
      {imageUrl && !uploading && !error && (
        <p className="mt-3 text-xs font-semibold text-green-700" aria-live="polite">Image uploaded and ready to save.</p>
      )}
    </div>
  );
}
