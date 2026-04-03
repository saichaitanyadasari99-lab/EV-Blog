import { redirect } from "next/navigation";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function AdminPostsEditAliasPage({ params }: Params) {
  const { id } = await params;
  redirect(`/admin/edit/${id}`);
}
