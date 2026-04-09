"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { generateReactHelpers } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/core";

const { useUploadThing } = generateReactHelpers<UploadRouter>();

type Props = {
  onUploaded: (url: string, type: "image" | "video" | "pdf" | "doc") => void;
};

export function MediaUpload({ onUploaded }: Props) {
  const [status, setStatus] = useState<string>("");

  const { startUpload, isUploading } = useUploadThing("media", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const url = res[0].url;
        const fileType = res[0].type;
        
        let type: "image" | "video" | "pdf" | "doc" = "doc";
        if (fileType.startsWith("image/")) type = "image";
        else if (fileType.startsWith("video/")) type = "video";
        else if (fileType.includes("pdf")) type = "pdf";
        
        onUploaded(url, type);
        setStatus("Uploaded!");
      }
    },
    onUploadError: (error) => {
      setStatus(`Error: ${error.message}`);
    },
  });

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

      setStatus("Uploading...");
      await startUpload(files);
    },
    [startUpload],
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
          ? "Drop to upload into UploadThing"
          : "Drag image/PDF/video/doc or click to upload"}
      </p>
      {status ? <p className="mt-2 text-xs text-[var(--accent)]">{status}</p> : null}
    </div>
  );
}