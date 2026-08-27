"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection } from "@/components/ConnectionProvider";
import { getAllOfflineLeads, type OfflineLead } from "@/lib/offline/db";

interface FieldLead {
  id: string;
  full_name: string;
  phone: string;
  district: string | null;
  service_interest: string;
  status: string;
  source: string;
  created_by_name: string;
  assigned_to_name: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  sync_status?: "pending" | "syncing" | "synced" | "failed";
  is_local?: boolean;
}

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
  { value: "lost", label: "Lost" },
];

const SERVICES = [
  { value: "", label: "All Services" },
  { value: "tourism", label: "Tourism" },
  { value: "work_abroad", label: "Work Abroad" },
  { value: "visa", label: "Visa" },
  { value: "passport", label: "Passport" },
  { value: "air_ticket", label: "Air Ticket" },
  { value: "hotel", label: "Hotel" },
  { value: "airbnb", label: "Airbnb" },
  { value: "car_hire", label: "Car Hire" },
  { value: "delivery", label: "Delivery" },
  { value: "consultancy", label: "Consultancy" },
];

function FieldLeadsListInner() {
  const searchParams = useSearchParams();
  const { isOnline } = useConnection();
  const [leads, setLeads] = useState<FieldLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Always fetch server data if online
      let serverLeads: FieldLead[] = [];
      if (isOnline) {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (service) params.set("service", service);
        params.set("page", String(page));
        params.set("limit", "25");

        const res = await fetch(`/api/registry/field-leads?${params}`);
        if (res.ok) {
          const data = await res.json();
          serverLeads = (data.leads || []).map((l: FieldLead) => ({ ...l, is_local: false }));
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      }

      // Merge with offline leads
      const offlineLeads = await getAllOfflineLeads();
      const localLeads: FieldLead[] = offlineLeads
        .filter((l) => l.sync_status !== "synced")
        .map((l) => ({
          id: l.id,
          full_name: l.full_name,
          phone: l.phone,
          district: l.district,
          service_interest: l.service_interest,
          status: l.status,
          source: l.source,
          created_by_name: "You (offline)",
          assigned_to_name: null,
          next_follow_up_at: null,
          created_at: l.created_at,
          sync_status: l.sync_status,
          is_local: true,
        }));

      // Filter local leads by search/status/service
      let filteredLocal = localLeads;
      if (search) {
        const q = search.toLowerCase();
        filteredLocal = filteredLocal.filter((l) =>
          l.full_name.toLowerCase().includes(q) || l.phone.includes(q) || (l.district || "").toLowerCase().includes(q)
        );
      }
      if (status) filteredLocal = filteredLocal.filter((l) => l.status === status);
      if (service) filteredLocal = filteredLocal.filter((l) => l.service_interest === service);

      // Merge: local pending leads first, then server leads (avoid duplicates)
      const serverIds = new Set(serverLeads.map((l) => l.id));
      const uniqueLocal = filteredLocal.filter((l) => !serverIds.has(l.id));

      setLeads([...uniqueLocal, ...serverLeads]);
      if (!isOnline) {
        setTotal(uniqueLocal.length);
        setTotalPages(1);
      }
    } catch {
      setError("Unable to load field leads. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, status, service, page, isOnline]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function statusBadge(s: string) {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700",
      contacted: "bg-amber-50 text-amber-700",
      interested: "bg-purple-50 text-purple-700",
      follow_up: "bg-orange-50 text-orange-700",
      converted: "bg-green-50 text-green-700",
      not_interested: "bg-zinc-100 text-zinc-600",
      lost: "bg-red-50 text-red-700",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[s] || styles.new}`}>
        {s.replace(/_/g, " ")}
      </span>
    );
  }

  function syncBadge(syncStatus?: string) {
    if (!syncStatus || syncStatus === "synced") return null;
    const styles: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700",
      syncing: "bg-blue-50 text-blue-700",
      failed: "bg-red-50 text-red-700",
    };
    const labels: Record<string, string> = {
      pending: "⏳ Pending",
      syncing: "↻ Syncing",
      failed: "⚠ Failed",
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${styles[syncStatus] || ""}`}>
        {labels[syncStatus] || syncStatus}
      </span>
    );
  }

  const hasFilters = search || status || service;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or district..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <Link
          href="/registry/field-leads/new"
          className="inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Lead
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-zinc-300 rounded-md text-sm">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} className="px-3 py-2 border border-zinc-300 rounded-md text-sm">
          {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setStatus(""); setService(""); setPage(1); }} className="text-sm text-zinc-500 hover:text-zinc-700 font-medium">
            Clear filters
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-zinc-500">
          {total > 0 ? `Showing ${leads.length} of ${total} leads` : "No leads found"}
        </p>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">{error}</div>}

      {loading && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading leads...
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">No field leads found.</p>
          <p className="text-xs text-zinc-400 mt-1">Capture your first lead from the field.</p>
        </div>
      )}

      {!loading && leads.length > 0 && (
        <>
          <div className="hidden sm:block bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">District</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Sync</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className={`border-b border-zinc-100 hover:bg-zinc-50 ${lead.is_local ? "bg-amber-50/50" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/registry/field-leads/${lead.id}`} className="font-medium text-green-700 hover:text-green-800">
                        {lead.full_name}
                      </Link>
                      {lead.is_local && <span className="text-xs text-amber-600 ml-1">(local)</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{lead.phone}</td>
                    <td className="px-4 py-3 text-zinc-600">{lead.district || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 capitalize">{lead.service_interest.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{statusBadge(lead.status)}</td>
                    <td className="px-4 py-3">{syncBadge(lead.sync_status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/registry/field-leads/${lead.id}`} className="text-green-700 hover:text-green-800 text-xs font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-3">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/registry/field-leads/${lead.id}`}
                className={`block bg-white rounded-lg border border-zinc-200 p-4 hover:border-green-300 transition-colors ${lead.is_local ? "border-l-4 border-l-amber-400" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">{lead.full_name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{lead.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {statusBadge(lead.status)}
                    {syncBadge(lead.sync_status)}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-1 capitalize">{lead.service_interest.replace(/_/g, " ")}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-sm text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 font-medium">Previous</button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-sm text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 font-medium">Next</button>
        </div>
      )}
    </div>
  );
}

export default function FieldLeadsList() {
  return (
    <Suspense fallback={<div className="bg-white rounded-lg border border-zinc-200 p-8 text-center"><p className="text-sm text-zinc-500">Loading...</p></div>}>
      <FieldLeadsListInner />
    </Suspense>
  );
}
