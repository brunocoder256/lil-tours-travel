import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import StaffList from "@/components/StaffList";

export default async function StaffPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "staff.view")) {
    redirect("/registry");
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Staff Management</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage staff accounts, roles, and access
        </p>
      </div>
      <StaffList />
    </div>
  );
}
