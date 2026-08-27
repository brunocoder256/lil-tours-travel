import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/ClientForm";

export default async function NewClientPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "clients.create")) redirect("/registry/clients");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/registry/clients" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">New Client</h1>
        <p className="text-sm text-zinc-500 mt-1">Register a new client in the system</p>
      </div>
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <ClientForm mode="create" />
      </div>
    </div>
  );
}
