import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#F5EBE8]">
      <AdminSidebar />

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}