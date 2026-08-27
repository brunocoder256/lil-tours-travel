import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import FieldLeadsList from "@/components/FieldLeadsList";

export default async function FieldLeadsPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "field_leads.view")) redirect("/registry");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Field Leads</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage leads captured from field marketing and outreach</p>
      </div>
      <FieldLeadsList />
    </div>
  );
}
