"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  onUploaded: (url: string, type: "image" | "video" | "pdf") => void;
};

export function MediaUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<string>("");
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setStatus("Uploading...");

      const { error } = await supabase.storage.from("media").upload(path, file, {
        upsert: false,
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);

      const type = file.type.includes("pdf")
        ? "pdf"
        : file.type.startsWith("video/")
          ? "video"
          : "image";

      onUploaded(publicUrl, type);
      setStatus("Uploaded");
    },
    [onUploaded, supabase],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="cursor-pointer rounded-xl border border-dashed border-[var(--border)] bg-white/80 px-4 py-6 text-center"
    >
      <input {...getInputProps()} />
      <p className="text-sm text-[var(--ink-soft)]">
        {isDragActive
          ? "Drop to upload into Supabase Storage/media"
          : "Drag image/PDF/video or click to upload"}
      </p>
      {status ? <p className="mt-2 text-xs text-[var(--accent)]">{status}</p> : null}
    </div>
  );
}
