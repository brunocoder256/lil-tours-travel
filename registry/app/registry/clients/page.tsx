import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import ClientsList from "@/components/ClientsList";

export default async function ClientsPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "clients.view")) {
    redirect("/registry");
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Clients</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage and view client records
        </p>
      </div>
      <ClientsList />
    </div>
  );
}
