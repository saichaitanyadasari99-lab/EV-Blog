"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  onUploaded: (url: string, type: "image" | "video" | "pdf" | "doc") => void;
};

export function MediaUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<string>("");
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);

  const getFileType = (file: File): "image" | "video" | "pdf" | "doc" => {
    if (file.type.includes("pdf")) return "pdf";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("image/")) return "image";
    return "doc";
  };

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext || "bin"}`;
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

      const type = getFileType(file);
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
          : "Drag image/PDF/video/doc or click to upload"}
      </p>
      {status ? <p className="mt-2 text-xs text-[var(--accent)]">{status}</p> : null}
    </div>
  );
}
