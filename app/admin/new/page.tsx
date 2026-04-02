import { Editor } from "@/components/Editor";
import { requireAdminUser } from "@/lib/auth";

export default async function NewPostPage() {
  await requireAdminUser();
  return <Editor />;
}
