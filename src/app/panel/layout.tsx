import type { Metadata } from "next";
import { Suspense } from "react";
import { BackstageShell } from "@/components/backstage/shell";
import { LoadingBlock } from "@/components/ui/feedback";

export const metadata: Metadata = { robots: { index: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackstageShell>
      <Suspense fallback={<LoadingBlock />}>{children}</Suspense>
    </BackstageShell>
  );
}
