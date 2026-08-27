import { requireAuth } from "@/lib/auth";
import { getRoleLabel } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await requireAuth();
  if (!session || !session.profile) redirect("/registry/login");

  const { profile } = session;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome back, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Role: {getRoleLabel(profile.role)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Clients</p>
              <p className="text-2xl font-bold text-zinc-900">—</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">Loading from database...</p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Enquiries</p>
              <p className="text-2xl font-bold text-zinc-900">—</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">Loading from database...</p>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">New Today</p>
              <p className="text-2xl font-bold text-zinc-900">—</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">Loading from database...</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/registry/clients" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-800 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
            View Clients
          </a>
          <a href="/registry/enquiries" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-md text-sm font-medium hover:bg-amber-100 transition-colors">
            View Enquiries
          </a>
        </div>
      </div>
    </div>
  );
}
