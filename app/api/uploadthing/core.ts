import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  media: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
    video: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "application/pdf": {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  }).onUploadComplete(({ file }) => {
    console.log("Upload complete:", file.name);
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;