import { RecoveryForm } from "@/components/auth/recovery-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <RecoveryForm token={typeof token === "string" ? token : ""} />;
}
