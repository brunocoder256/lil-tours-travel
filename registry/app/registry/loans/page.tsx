import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import LoansList from "@/components/LoansList";

export default async function LoansPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "loans.view")) redirect("/registry");

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Loan Requests</h1>
        <p className="text-sm text-zinc-500 mt-1">Review and manage money lending applications</p>
      </div>
      <LoansList />
    </div>
  );
}
