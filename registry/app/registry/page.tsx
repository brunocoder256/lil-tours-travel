import { requireAuth } from "@/lib/auth";
import { getRoleLabel } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");

  const { profile } = session;
  const supabase = createServerClient();

  // Fetch real stats
  const [clientsResult, enquiriesResult, newTodayResult, openResult, completedResult, recentResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("enquiries").select("id", { count: "exact", head: true }),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).gte("created_at", new Date().toISOString().split("T")[0]),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "in_progress"]),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("enquiries").select("id, service, status, source, created_at, clients(full_name)").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = {
    totalClients: clientsResult.count || 0,
    totalEnquiries: enquiriesResult.count || 0,
    newToday: newTodayResult.count || 0,
    openEnquiries: openResult.count || 0,
    completedEnquiries: completedResult.count || 0,
  };

  const recent = (recentResult.data || []).map((eq: Record<string, unknown>) => {
    const client = eq.clients as { full_name: string } | null;
    return {
      id: eq.id as string,
      service: eq.service as string,
      status: eq.status as string,
      source: eq.source as string,
      client_name: client?.full_name || "Unknown",
      created_at: eq.created_at as string,
    };
  });

  const statusStyles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    in_progress: "bg-purple-50 text-purple-700",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome back, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Role: {getRoleLabel(profile.role)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Total Clients</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalClients}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Total Enquiries</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalEnquiries}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">New Today</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.newToday}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Open</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.openEnquiries}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedEnquiries}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/registry/clients/new" className="inline-flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-md text-sm font-medium hover:bg-green-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </Link>
        <Link href="/registry/enquiries/new" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Enquiry
        </Link>
        <Link href="/registry/clients" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
          View Clients
        </Link>
        <Link href="/registry/enquiries" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
          View Enquiries
        </Link>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Enquiries</h2>
          <Link href="/registry/enquiries" className="text-sm text-green-700 hover:text-green-800 font-medium">View all</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">No enquiries yet.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((eq) => (
              <Link
                key={eq.id}
                href={`/registry/enquiries/${eq.id}`}
                className="flex items-center justify-between gap-4 p-3 rounded-md hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 capitalize">{eq.service.replace(/_/g, " ")}</p>
                  <p className="text-xs text-zinc-500">{eq.client_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[eq.status] || ""}`}>
                    {eq.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
