import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");
  if (!hasPermission(session.profile.role, "reports.view")) redirect("/registry");

  const supabase = createServerClient();

  const [
    clientsResult,
    enquiriesResult,
    enquiriesByService,
    enquiriesByStatus,
    enquiriesBySource,
    recentEnquiries,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("enquiries").select("id, service, status, source, created_at", { count: "exact" }),
    supabase.from("enquiries").select("service"),
    supabase.from("enquiries").select("status"),
    supabase.from("enquiries").select("source"),
    supabase.from("enquiries").select("id, service, status, source, created_at, clients(full_name)").order("created_at", { ascending: false }).limit(10),
  ]);

  const totalClients = clientsResult.count || 0;
  const totalEnquiries = enquiriesResult.count || 0;
  const enquiries = enquiriesResult.data || [];

  const serviceCounts: Record<string, number> = {};
  (enquiriesByService.data || []).forEach((e) => {
    serviceCounts[e.service] = (serviceCounts[e.service] || 0) + 1;
  });

  const statusCounts: Record<string, number> = {};
  (enquiriesByStatus.data || []).forEach((e) => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });

  const sourceCounts: Record<string, number> = {};
  (enquiriesBySource.data || []).forEach((e) => {
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
  });

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const thisMonthCount = enquiries.filter((e) => new Date(e.created_at) >= thisMonth).length;

  const today = new Date().toISOString().split("T")[0];
  const todayCount = enquiries.filter((e) => e.created_at.startsWith(today)).length;

  const completedCount = statusCounts["completed"] || 0;
  const conversionRate = totalEnquiries > 0 ? Math.round((completedCount / totalEnquiries) * 100) : 0;

  const recent = (recentEnquiries.data || []).map((eq: Record<string, unknown>) => {
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

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of registry performance and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Total Clients</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{totalClients}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Total Enquiries</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{totalEnquiries}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">This Month</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{thisMonthCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500">Today</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{todayCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enquiries by Service */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">By Service</h2>
          {Object.keys(serviceCounts).length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(serviceCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([service, count]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 capitalize">{service.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-zinc-100 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min((count / totalEnquiries) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Enquiries by Status */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">By Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const colors: Record<string, string> = {
                  new: "bg-blue-500",
                  contacted: "bg-amber-500",
                  in_progress: "bg-purple-500",
                  completed: "bg-green-500",
                  cancelled: "bg-zinc-400",
                };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-zinc-400"}`} />
                      <span className="text-sm text-zinc-700 capitalize">{status.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-900">{count}</span>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Conversion Rate</span>
              <span className="text-sm font-bold text-green-700">{conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Enquiries by Source */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">By Source</h2>
          {Object.keys(sourceCounts).length === 0 ? (
            <p className="text-sm text-zinc-500">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(sourceCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 capitalize">{source.replace(/_/g, " ")}</span>
                    <span className="text-sm font-medium text-zinc-900">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/registry/clients" className="block text-sm text-green-700 hover:text-green-800 font-medium">
              View All Clients →
            </Link>
            <Link href="/registry/enquiries" className="block text-sm text-green-700 hover:text-green-800 font-medium">
              View All Enquiries →
            </Link>
            {hasPermission(session.profile.role, "field_leads.view") && (
              <Link href="/registry/field-leads" className="block text-sm text-green-700 hover:text-green-800 font-medium">
                View Field Leads →
              </Link>
            )}
            {hasPermission(session.profile.role, "staff.view") && (
              <Link href="/registry/staff" className="block text-sm text-green-700 hover:text-green-800 font-medium">
                Manage Staff →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Enquiries</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">No enquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left px-3 py-2 font-medium text-zinc-600">Client</th>
                  <th className="text-left px-3 py-2 font-medium text-zinc-600">Service</th>
                  <th className="text-left px-3 py-2 font-medium text-zinc-600">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-zinc-600">Source</th>
                  <th className="text-right px-3 py-2 font-medium text-zinc-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((eq) => (
                  <tr key={eq.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-3 py-2">
                      <Link href={`/registry/enquiries/${eq.id}`} className="text-zinc-900 hover:text-green-700 font-medium">
                        {eq.client_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-600 capitalize">{eq.service.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 capitalize">
                        {eq.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 capitalize">{eq.source.replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 text-zinc-400 text-right whitespace-nowrap">
                      {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
