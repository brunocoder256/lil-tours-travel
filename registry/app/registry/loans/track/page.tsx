import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import LoanTrackSheet from "@/components/LoanTrackSheet";

export default async function LoanTrackPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "loans.track")) redirect("/registry/loans");

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Payment Track Sheet</h1>
        <p className="text-sm text-zinc-500 mt-1">Track and record loan payments</p>
      </div>
      <LoanTrackSheet />
    </div>
  );
}
