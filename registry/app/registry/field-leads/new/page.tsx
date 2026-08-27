import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import FieldLeadForm from "@/components/FieldLeadForm";

export default async function NewFieldLeadPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "field_leads.create")) redirect("/registry/field-leads");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">New Field Lead</h1>
        <p className="text-sm text-zinc-500 mt-1">Capture a new lead from the field</p>
      </div>
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <FieldLeadForm mode="create" />
      </div>
    </div>
  );
}
