"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  created_at: string;
}

function ClientsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (district) params.set("district", district);
    params.set("page", String(page));
    params.set("limit", "25");

    fetch(`/api/registry/clients?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setClients(data.clients || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setError("Unable to load clients. Please try again."))
      .finally(() => setLoading(false));
  }, [search, district, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 300);
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by district..."
          value={district}
          onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
          className="w-full sm:w-48 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
        <Link
          href="/registry/clients/new"
          className="inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </Link>
      </div>

      {/* Results info */}
      {!loading && (
        <p className="text-xs text-zinc-500">
          {total > 0 ? `Showing ${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total} clients` : "No clients found"}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading clients...
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && clients.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">No clients found.</p>
          <p className="text-xs text-zinc-400 mt-1">Clients added through the website or registry will appear here.</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && clients.length > 0 && (
        <>
          <div className="hidden sm:block bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">District</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/registry/clients/${c.id}`} className="font-medium text-green-700 hover:text-green-800">
                        {c.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{c.phone}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.district || "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/registry/clients/${c.id}`} className="text-green-700 hover:text-green-800 text-xs font-medium mr-3">View</Link>
                      <Link href={`/registry/clients/${c.id}?edit=1`} className="text-zinc-500 hover:text-zinc-700 text-xs font-medium">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {clients.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border border-zinc-200 p-4">
                <Link href={`/registry/clients/${c.id}`} className="font-medium text-green-700">{c.full_name}</Link>
                <p className="text-sm text-zinc-600 mt-1">{c.phone}</p>
                {c.district && <p className="text-xs text-zinc-500 mt-1">{c.district}</p>}
                <div className="flex gap-3 mt-3">
                  <Link href={`/registry/clients/${c.id}`} className="text-xs text-green-700 font-medium">View</Link>
                  <Link href={`/registry/clients/${c.id}?edit=1`} className="text-xs text-zinc-500 font-medium">Edit</Link>
                </div>
              </div>
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

export default function ClientsList() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    }>
      <ClientsListInner />
    </Suspense>
  );
}
