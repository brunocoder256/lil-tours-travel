import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import FieldLeadStatusUpdater from "@/components/FieldLeadStatusUpdater";
import FollowUpForm from "@/components/FollowUpForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FieldLeadDetailPage({ params }: Props) {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "field_leads.view")) redirect("/registry");

  const { id } = await params;
  const supabase = createServerClient();

  const { data: lead } = await supabase
    .from("field_leads")
    .select(`
      *,
      creator:staff_profiles!field_leads_created_by_fkey(full_name, phone),
      assignee:staff_profiles!field_leads_assigned_to_fkey(full_name, phone),
      converted_client:clients(full_name, phone, id)
    `)
    .eq("id", id)
    .single();

  if (!lead) notFound();

  // Ownership check for field marketers
  if (session.profile.role === "field_marketer" && !hasPermission(session.profile.role, "field_leads.view_all")) {
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .single();
    if (profile && lead.created_by !== profile.id) redirect("/registry/field-leads");
  }

  // Fetch follow-ups
  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, due_at, status, notes, outcome, created_at, assignee:staff_profiles!follow_ups_assigned_to_fkey(full_name)")
    .eq("field_lead_id", id)
    .order("due_at", { ascending: false });

  const creator = lead.creator as { full_name: string; phone: string } | null;
  const assignee = lead.assignee as { full_name: string; phone: string } | null;
  const convertedClient = lead.converted_client as { full_name: string; phone: string; id: string } | null;

  const statusStyles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    interested: "bg-purple-50 text-purple-700",
    follow_up: "bg-orange-50 text-orange-700",
    converted: "bg-green-50 text-green-700",
    not_interested: "bg-zinc-100 text-zinc-600",
    lost: "bg-red-50 text-red-700",
  };

  const followUpStatusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    completed: "bg-green-50 text-green-700",
    missed: "bg-red-50 text-red-700",
    cancelled: "bg-zinc-100 text-zinc-600",
  };

  const now = new Date();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/registry/field-leads" className="text-sm text-green-700 hover:text-green-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Field Leads
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{lead.full_name}</h1>
            <p className="text-sm text-zinc-500">{lead.phone}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${statusStyles[lead.status] || ""}`}>
            {lead.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Lead Info */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Lead Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Service Interest</dt>
            <dd className="mt-1 text-sm text-zinc-900 capitalize">{lead.service_interest.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Source</dt>
            <dd className="mt-1 text-sm text-zinc-900 capitalize">{lead.source.replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">District</dt>
            <dd className="mt-1 text-sm text-zinc-900">{lead.district || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</dt>
            <dd className="mt-1 text-sm text-zinc-900">{lead.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Created By</dt>
            <dd className="mt-1 text-sm text-zinc-900">{creator?.full_name || "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Assigned To</dt>
            <dd className="mt-1 text-sm text-zinc-900">{assignee?.full_name || "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-1 text-sm text-zinc-900">
              {new Date(lead.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </dd>
          </div>
        </dl>

        {lead.notes && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notes</dt>
            <dd className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">{lead.notes}</dd>
          </div>
        )}
      </div>

      {/* Status Update */}
      {hasPermission(session.profile.role, "field_leads.update") && lead.status !== "converted" && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Update Status</h2>
          <FieldLeadStatusUpdater leadId={lead.id} currentStatus={lead.status} />
        </div>
      )}

      {/* Follow-Up Schedule */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Follow-Ups</h2>
          {lead.status !== "converted" && hasPermission(session.profile.role, "followups.create") && (
            <span className="text-sm text-zinc-500">Schedule a follow-up below</span>
          )}
        </div>

        {lead.status !== "converted" && hasPermission(session.profile.role, "followups.create") && (
          <div className="mb-4 pb-4 border-b border-zinc-100">
            <FollowUpForm fieldLeadId={lead.id} />
          </div>
        )}

        {followUps && followUps.length > 0 ? (
          <div className="space-y-3">
            {followUps.map((fu: { id: string; due_at: string; status: string; notes: string | null; outcome: string | null; created_at: string; assignee: { full_name: string } | null }) => {
              const dueAt = new Date(fu.due_at);
              const isOverdue = fu.status === "pending" && dueAt < now;
              return (
                <div key={fu.id} className={`border rounded-md p-3 ${isOverdue ? "border-red-200 bg-red-50" : "border-zinc-100"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${followUpStatusStyles[fu.status] || ""}`}>
                          {fu.status.replace(/_/g, " ")}
                        </span>
                        {isOverdue && (
                          <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-700 mt-1">
                        Due: {dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {fu.notes && <p className="text-xs text-zinc-500 mt-1">{fu.notes}</p>}
                      {fu.outcome && <p className="text-xs text-green-600 mt-1">Outcome: {fu.outcome}</p>}
                    </div>
                    <span className="text-xs text-zinc-400">{fu.assignee?.full_name || "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No follow-ups scheduled yet.</p>
        )}
      </div>

      {/* Conversion */}
      {convertedClient && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Converted</h2>
          <p className="text-sm text-green-700">
            This lead has been converted to a client.
          </p>
          <Link href={`/registry/clients/${convertedClient.id}`} className="text-sm text-green-800 font-medium underline mt-2 inline-block">
            View Client: {convertedClient.full_name}
          </Link>
        </div>
      )}
    </div>
  );
}
