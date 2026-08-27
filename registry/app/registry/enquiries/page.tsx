import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import EnquiriesList from "@/components/EnquiriesList";

export default async function EnquiriesPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "enquiries.view")) {
    redirect("/registry");
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Enquiries</h1>
        <p className="text-sm text-zinc-500 mt-1">
          View and manage service enquiries
        </p>
      </div>
      <EnquiriesList />
    </div>
  );
}
