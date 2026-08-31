"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Loan {
  id: string;
  client_id: string;
  full_name: string;
  phone: string;
  loan_amount: number;
  loan_purpose: string;
  repayment_period: number;
  monthly_payment: number;
  employment_status: string;
  status: string;
  source: string;
  created_at: string;
  approved_at: string | null;
  cancel_reason: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  paid: "bg-blue-50 text-blue-700 border border-blue-200",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: "Employed",
  self_employed: "Self-Employed",
  business_owner: "Business Owner",
  student: "Student",
  unemployed: "Unemployed",
  other: "Other",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(amount);
}

function LoansListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/registry/loans?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load loans");
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    router.push(`/registry/loans?search=${encodeURIComponent(search)}&status=${status}`);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
    router.push("/registry/loans");
  }

  const hasFilters = search || status;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or purpose..."
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
          <button type="submit" className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-md transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
            <option value="paid">Paid</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <p className="text-zinc-500 text-sm">No loan requests found.</p>
        </div>
      )}

      {/* Desktop Table */}
      {!loading && items.length > 0 && (
        <div className="hidden sm:block bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Phone</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600">Monthly</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-600">Period</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((loan) => (
                <tr key={loan.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{loan.full_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{loan.phone}</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatCurrency(loan.loan_amount)}</td>
                  <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(loan.monthly_payment)}</td>
                  <td className="px-4 py-3 text-center text-zinc-600">{loan.repayment_period} mo</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[loan.status] || ""}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(loan.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/registry/loans/${loan.id}`}
                      className="text-green-700 hover:text-green-900 font-medium text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && items.length > 0 && (
        <div className="sm:hidden space-y-3">
          {items.map((loan) => (
            <Link
              key={loan.id}
              href={`/registry/loans/${loan.id}`}
              className="block bg-white rounded-lg border border-zinc-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-zinc-900">{loan.full_name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[loan.status] || ""}`}>
                  {loan.status}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mb-1">{loan.phone} &middot; {EMPLOYMENT_LABELS[loan.employment_status] || loan.employment_status}</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">{formatCurrency(loan.loan_amount)} &middot; {loan.repayment_period} mo</span>
                <span className="text-zinc-500">{new Date(loan.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-zinc-500">Page {page} of {totalPages} ({total} total)</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoansList() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoansListInner />
    </Suspense>
  );
}
