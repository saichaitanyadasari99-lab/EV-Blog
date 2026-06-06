"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";

type Props = {
  onUploaded: (url: string, type: "image" | "video" | "pdf" | "doc") => void;
};

export function MediaUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<string>("");

  const getFileType = (name: string): "image" | "video" | "pdf" | "doc" => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "pdf";
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    return "doc";
  };

  const { startUpload, isUploading } = useUploadThing("media", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const url = res[0].url;
        const name = res[0].name;
        const type = getFileType(name);
        onUploaded(url, type);
        setStatus("Uploaded");
      }
    },
    onUploadError: (error) => {
      setStatus(`Error: ${error.message}`);
    },
  });

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setStatus("Uploading...");
      await startUpload([file]);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    disabled: isUploading 
  });

  return (
    <div
      {...getRootProps()}
      className="cursor-pointer rounded-xl border border-dashed border-[var(--border)] bg-white/80 px-4 py-6 text-center"
    >
      <input {...getInputProps()} />
      <p className="text-sm text-[var(--ink-soft)]">
        {isDragActive
          ? "Drop to upload into UploadThing"
          : isUploading
          ? "Uploading..."
          : "Drag image/PDF/video/doc or click to upload"}
      </p>
      {status ? <p className="mt-2 text-xs text-[var(--accent)]">{status}</p> : null}
    </div>
  );
}