import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import ClientForm from "@/components/ClientForm";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "clients.view")) redirect("/registry");

  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "1" && hasPermission(session.profile.role, "clients.update");
  const supabase = createServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("id, service, destination, status, source, preferred_date, notes, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const statusStyles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    in_progress: "bg-purple-50 text-purple-700",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/registry/clients" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Clients
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <h1 className="text-2xl font-bold text-zinc-900">{client.full_name}</h1>
          {hasPermission(session.profile.role, "clients.update") && !isEditing && (
            <Link
              href={`/registry/clients/${id}?edit=1`}
              className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 font-medium border border-zinc-300 rounded-md px-3 py-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </Link>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Edit Client</h2>
          <ClientForm
            mode="edit"
            initialData={{
              id: client.id,
              full_name: client.full_name,
              phone: client.phone,
              email: client.email,
              district: client.district,
              date_of_birth: client.date_of_birth,
            }}
          />
        </div>
      ) : (
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
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Date of Birth</dt>
              <dd className="mt-1 text-sm text-zinc-900">
                {client.date_of_birth
                  ? new Date(client.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</dt>
              <dd className="mt-1 text-sm text-zinc-900">
                {new Date(client.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Updated</dt>
              <dd className="mt-1 text-sm text-zinc-900">
                {new Date(client.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Enquiries */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Enquiries ({enquiries?.length || 0})
          </h2>
          {hasPermission(session.profile.role, "enquiries.create") && (
            <Link
              href={`/registry/enquiries/new?client=${id}`}
              className="text-sm text-green-700 hover:text-green-800 font-medium"
            >
              + New Enquiry
            </Link>
          )}
        </div>
        {enquiries && enquiries.length > 0 ? (
          <div className="space-y-3">
            {enquiries.map((eq) => (
              <Link
                key={eq.id}
                href={`/registry/enquiries/${eq.id}`}
                className="block border border-zinc-100 rounded-md p-4 hover:border-green-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 capitalize">{eq.service.replace(/_/g, " ")}</p>
                    {eq.destination && <p className="text-xs text-zinc-500 mt-1">To: {eq.destination}</p>}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[eq.status] || ""}`}>
                    {eq.status.replace(/_/g, " ")}
                  </span>
                </div>
                {eq.notes && <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{eq.notes}</p>}
                <p className="text-xs text-zinc-400 mt-2">
                  {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No enquiries found for this client.</p>
        )}
      </div>
    </div>
  );
}
