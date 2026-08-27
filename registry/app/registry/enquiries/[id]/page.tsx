import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import EnquiryStatusUpdater from "@/components/EnquiryStatusUpdater";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EnquiryDetailPage({ params }: Props) {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "enquiries.view")) redirect("/registry");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("*, clients(id, full_name, phone, email, district)")
    .eq("id", id)
    .single();

  if (!enquiry) notFound();

  const client = enquiry.clients as { id: string; full_name: string; phone: string; email: string | null; district: string | null } | null;
  const canUpdate = hasPermission(session.profile.role, "enquiries.update");

  const statusStyles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    contacted: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-purple-50 text-purple-700 border-purple-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/registry/enquiries" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Enquiries
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">Enquiry Details</h1>
      </div>

      {/* Enquiry Info */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 capitalize">{enquiry.service.replace(/_/g, " ")}</h2>
            {enquiry.destination && <p className="text-sm text-zinc-600 mt-1">Destination: {enquiry.destination}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[enquiry.status] || statusStyles.new}`}>
            {enquiry.status.replace(/_/g, " ")}
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500">Source</dt>
            <dd className="text-zinc-900 capitalize mt-0.5">{enquiry.source.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Preferred Date</dt>
            <dd className="text-zinc-900 mt-0.5">
              {enquiry.preferred_date
                ? new Date(enquiry.preferred_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Created</dt>
            <dd className="text-zinc-900 mt-0.5">
              {new Date(enquiry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </dd>
          </div>
          {enquiry.updated_at !== enquiry.created_at && (
            <div>
              <dt className="text-zinc-500">Last Updated</dt>
              <dd className="text-zinc-900 mt-0.5">
                {new Date(enquiry.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </dd>
            </div>
          )}
        </dl>

        {enquiry.notes && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <dt className="text-sm text-zinc-500 mb-1">Notes</dt>
            <dd className="text-sm text-zinc-700 whitespace-pre-wrap">{enquiry.notes}</dd>
          </div>
        )}
      </div>

      {/* Status Update */}
      {canUpdate && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Update Status</h3>
          <EnquiryStatusUpdater enquiryId={enquiry.id} currentStatus={enquiry.status} />
        </div>
      )}

      {/* Client Info */}
      {client && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Client</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="mt-0.5">
                <Link href={`/registry/clients/${client.id}`} className="text-green-700 hover:text-green-800 font-medium">
                  {client.full_name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Phone</dt>
              <dd className="text-zinc-900 mt-0.5">{client.phone}</dd>
            </div>
            {client.email && (
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-zinc-900 mt-0.5">{client.email}</dd>
              </div>
            )}
            {client.district && (
              <div>
                <dt className="text-zinc-500">District</dt>
                <dd className="text-zinc-900 mt-0.5">{client.district}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
