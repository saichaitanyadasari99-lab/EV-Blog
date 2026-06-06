import { requireAdminUser } from "@/lib/auth";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { AdminNewsletterClient } from "./AdminNewsletterClient";

type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  source: string | null;
  created_at: string;
  opted_in: boolean;
};

type Inquiry = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  created_at: string;
};

export default async function AdminNewsletterPage() {
  await requireAdminUser();
  const supabase = await getServerSupabaseClient();

  const [{ data: subscribersData }, { data: inquiriesData }] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("opted_in", true)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("contact_submissions")
      .select("id,full_name,email,subject,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const subscribers = (subscribersData ?? []) as Subscriber[];
  const inquiries = (inquiriesData ?? []) as Inquiry[];

  return <AdminNewsletterClient subscribers={subscribers} inquiries={inquiries} />;
}