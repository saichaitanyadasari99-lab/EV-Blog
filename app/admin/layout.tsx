"use client";

import { AdminSidebar } from "@/components/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin") {
    return <main className="shell py-8">{children}</main>;
  }

  return (
    <main className="shell py-8">
      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <AdminSidebar />
        <section>{children}</section>
      </div>
    </main>
  );
}
