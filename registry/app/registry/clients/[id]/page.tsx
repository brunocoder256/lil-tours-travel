import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "clients.view")) {
    redirect("/registry");
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/registry/clients" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">{client.full_name}</h1>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Client Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Phone</dt>
            <dd className="mt-1 text-sm text-zinc-900">{client.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</dt>
            <dd className="mt-1 text-sm text-zinc-900">{client.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">District</dt>
            <dd className="mt-1 text-sm text-zinc-900">{client.district || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Enquiries ({enquiries?.length || 0})
        </h2>
        {enquiries && enquiries.length > 0 ? (
          <div className="space-y-3">
            {enquiries.map((eq) => (
              <div key={eq.id} className="border border-zinc-100 rounded-md p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 capitalize">{eq.service.replace(/_/g, " ")}</p>
                    {eq.destination && <p className="text-xs text-zinc-500 mt-1">To: {eq.destination}</p>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    eq.status === "new" ? "bg-blue-50 text-blue-700" :
                    eq.status === "contacted" ? "bg-amber-50 text-amber-700" :
                    eq.status === "in_progress" ? "bg-purple-50 text-purple-700" :
                    eq.status === "completed" ? "bg-green-50 text-green-700" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>
                    {eq.status.replace(/_/g, " ")}
                  </span>
                </div>
                {eq.notes && <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{eq.notes}</p>}
                <p className="text-xs text-zinc-400 mt-2">
                  {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No enquiries found for this client.</p>
        )}
      </div>
    </div>
  );
}
