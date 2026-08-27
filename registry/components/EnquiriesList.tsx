"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Enquiry {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  service: string;
  destination: string | null;
  status: string;
  source: string;
  created_at: string;
}

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

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SOURCES = [
  { value: "", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "phone", label: "Phone" },
  { value: "field_marketing", label: "Field Marketing" },
  { value: "social_media", label: "Social Media" },
  { value: "other", label: "Other" },
];

function EnquiriesListInner() {
  const searchParams = useSearchParams();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [service, setService] = useState(searchParams.get("service") || "");
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEnquiries = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (service) params.set("service", service);
    if (source) params.set("source", source);
    params.set("page", String(page));
    params.set("limit", "25");

    fetch(`/api/registry/enquiries?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setEnquiries(data.enquiries || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setError("Unable to load enquiries. Please try again."))
      .finally(() => setLoading(false));
  }, [search, status, service, source, page]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function statusBadge(s: string) {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700",
      contacted: "bg-amber-50 text-amber-700",
      in_progress: "bg-purple-50 text-purple-700",
      completed: "bg-green-50 text-green-700",
      cancelled: "bg-zinc-100 text-zinc-600",
    };
    const icons: Record<string, string> = {
      new: "●",
      contacted: "●",
      in_progress: "◐",
      completed: "✓",
      cancelled: "✗",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${styles[s] || styles.new}`}>
        <span>{icons[s] || "●"}</span>
        {s.replace(/_/g, " ")}
      </span>
    );
  }

  const hasFilters = search || status || service || source;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by client, destination, or notes..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <Link
          href="/registry/enquiries/new"
          className="inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Enquiry
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-zinc-300 rounded-md text-sm">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} className="px-3 py-2 border border-zinc-300 rounded-md text-sm">
          {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="px-3 py-2 border border-zinc-300 rounded-md text-sm">
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setStatus(""); setService(""); setSource(""); setPage(1); }}
            className="text-sm text-zinc-500 hover:text-zinc-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results info */}
      {!loading && (
        <p className="text-xs text-zinc-500">
          {total > 0 ? `Showing ${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total} enquiries` : "No enquiries found"}
        </p>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">{error}</div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading enquiries...
          </div>
        </div>
      )}

      {!loading && enquiries.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">No enquiries found.</p>
          <p className="text-xs text-zinc-400 mt-1">
            {hasFilters ? "Try changing your filters or create a new enquiry." : "Enquiries from the website and staff will appear here."}
          </p>
        </div>
      )}

      {!loading && enquiries.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Destination</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((eq) => (
                  <tr key={eq.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/registry/clients/${eq.client_id}`} className="font-medium text-zinc-900 hover:text-green-700">
                        {eq.client_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 capitalize">{eq.service.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-zinc-600">{eq.destination || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(eq.status)}</td>
                    <td className="px-4 py-3 text-zinc-500 capitalize">{eq.source.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/registry/enquiries/${eq.id}`} className="text-green-700 hover:text-green-800 text-xs font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {enquiries.map((eq) => (
              <Link
                key={eq.id}
                href={`/registry/enquiries/${eq.id}`}
                className="block bg-white rounded-lg border border-zinc-200 p-4 hover:border-green-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900 text-sm">{eq.client_name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 capitalize">{eq.service.replace(/_/g, " ")}</p>
                  </div>
                  {statusBadge(eq.status)}
                </div>
                {eq.destination && <p className="text-xs text-zinc-500 mt-2">To: {eq.destination}</p>}
                <p className="text-xs text-zinc-400 mt-2">
                  {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 font-medium"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-sm text-zinc-600 hover:text-zinc-900 disabled:text-zinc-300 font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function EnquiriesList() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    }>
      <EnquiriesListInner />
    </Suspense>
  );
}
