import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import LoanDetail from "@/components/LoanDetail";

export default async function LoanDetailPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "loans.view")) redirect("/registry");

  return (
    <div className="max-w-4xl">
      <LoanDetail />
    </div>
  );
}
