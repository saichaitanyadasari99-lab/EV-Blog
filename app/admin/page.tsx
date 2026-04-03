import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/AdminLogin";
import { getSessionUser, isAdminEmail } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return <AdminLogin />;
  }

  redirect("/admin/dashboard");
}
