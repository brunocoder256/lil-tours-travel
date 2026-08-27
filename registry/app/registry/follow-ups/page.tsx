import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function FollowUpsPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "followups.view")) redirect("/registry");

  const supabase = createServerClient();
  const { profile } = session;

  const now = new Date();
  const todayStart = now.toISOString().split("T")[0] + "T00:00:00Z";
  const todayEnd = now.toISOString().split("T")[0] + "T23:59:59Z";

  // Fetch today's, upcoming, and overdue follow-ups for this user
  const [todayResult, upcomingResult, overdueResult] = await Promise.all([
    supabase
      .from("follow_ups")
      .select("id, due_at, status, notes, field_lead_id, lead:field_leads(full_name, phone, service_interest)")
      .eq("assigned_to", profile.id)
      .eq("status", "pending")
      .gte("due_at", todayStart)
      .lte("due_at", todayEnd)
      .order("due_at", { ascending: true }),
    supabase
      .from("follow_ups")
      .select("id, due_at, status, notes, field_lead_id, lead:field_leads(full_name, phone, service_interest)")
      .eq("assigned_to", profile.id)
      .eq("status", "pending")
      .gt("due_at", todayEnd)
      .order("due_at", { ascending: true })
      .limit(10),
    supabase
      .from("follow_ups")
      .select("id, due_at, status, notes, field_lead_id, lead:field_leads(full_name, phone, service_interest)")
      .eq("assigned_to", profile.id)
      .eq("status", "pending")
      .lt("due_at", now.toISOString())
      .order("due_at", { ascending: true }),
  ]);

  const todayFollowUps = todayResult.data || [];
  const upcomingFollowUps = upcomingResult.data || [];
  const overdueFollowUps = overdueResult.data || [];

  function renderFollowUp(fu: Record<string, unknown>) {
    const lead = fu.lead as { full_name: string; phone: string; service_interest: string } | null;
    const dueAt = new Date(fu.due_at as string);
    const isOverdue = dueAt < now;

    return (
      <div key={fu.id as string} className={`flex items-center justify-between gap-4 p-3 rounded-md border ${isOverdue ? "border-red-200 bg-red-50" : "border-zinc-100"}`}>
        <div>
          <p className="text-sm font-medium text-zinc-900">{lead?.full_name || "Unknown"}</p>
          <p className="text-xs text-zinc-500 capitalize">{(lead?.service_interest || "").replace(/_/g, " ")}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {dueAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Link
          href={`/registry/field-leads/${fu.field_lead_id}`}
          className="text-xs text-green-700 hover:text-green-800 font-medium whitespace-nowrap"
        >
          Open
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Follow-Ups</h1>
        <p className="text-sm text-zinc-500 mt-1">Your scheduled follow-ups and tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Today</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{todayFollowUps.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{upcomingFollowUps.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium text-red-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{overdueFollowUps.length}</p>
        </div>
      </div>

      {/* Overdue */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Overdue Follow-Ups
        </h2>
        {overdueFollowUps.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-green-700">No overdue follow-ups. You&apos;re all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overdueFollowUps.map(renderFollowUp)}
          </div>
        )}
      </div>

      {/* Today */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Today&apos;s Follow-Ups</h2>
        {todayFollowUps.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-500">No follow-ups scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayFollowUps.map(renderFollowUp)}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Upcoming Follow-Ups</h2>
        {upcomingFollowUps.length === 0 ? (
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-500">No upcoming follow-ups.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingFollowUps.map(renderFollowUp)}
          </div>
        )}
      </div>
    </div>
  );
}
