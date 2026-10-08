import type { ReactNode } from "react";

import { LogisticsSidebar } from "@/components/logistics/logistics-sidebar";
import { LogisticsMockProvider } from "@/lib/logistics/logistics-mock-context";

export default function LogisticsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LogisticsMockProvider>
      <div className="flex min-h-screen bg-[#F5EBE8]">
        <LogisticsSidebar />

        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </LogisticsMockProvider>
  );
}