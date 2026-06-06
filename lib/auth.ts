import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function isAdminEmail(email?: string | null) {
  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL;
  return Boolean(adminEmail && email && email.toLowerCase() === adminEmail);
}

export async function requireAdminUser() {
  const user = await getSessionUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect("/admin");
  }

  return user;
}
