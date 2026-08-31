"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Loan {
  id: string;
  client_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  national_id: string | null;
  district: string | null;
  loan_amount: number;
  loan_purpose: string;
  repayment_period: number;
  monthly_payment: number;
  employment_status: string;
  monthly_income: number | null;
  income_source: string | null;
  collateral_description: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  status: string;
  notes: string | null;
  source: string;
  approved_by: string | null;
  approved_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  clients?: { full_name: string; phone: string; email: string | null; district: string | null } | null;
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

export default function LoanDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/registry/loans/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load loan");
      }
      const data = await res.json();
      setLoan(data.loan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  async function handleApprove() {
    if (!confirm("Approve this loan request? Payment schedule will be created.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registry/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve loan");
      router.refresh();
      fetchLoan();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve loan");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/registry/loans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancelReason: cancelReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to cancel loan");
      setShowCancelForm(false);
      setCancelReason("");
      router.refresh();
      fetchLoan();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel loan");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">
        {error || "Loan not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/registry/loans" className="text-zinc-500 hover:text-zinc-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">{loan.full_name}</h2>
          <p className="text-sm text-zinc-500">Loan application details</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[loan.status] || ""}`}>
          {loan.status}
        </span>
      </div>

      {/* Actions */}
      {loan.status === "pending" && (
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <h3 className="text-sm font-medium text-zinc-700 mb-3">Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              {actionLoading ? "Processing..." : "Approve Loan"}
            </button>
            <button
              onClick={() => setShowCancelForm(!showCancelForm)}
              disabled={actionLoading}
              className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium rounded-md transition-colors"
            >
              Cancel Request
            </button>
          </div>
          {showCancelForm && (
            <div className="mt-3 space-y-2">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={2}
                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button onClick={handleCancel} disabled={actionLoading} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md">
                  Confirm Cancel
                </button>
                <button onClick={() => { setShowCancelForm(false); setCancelReason(""); }} className="px-3 py-1.5 text-zinc-500 hover:text-zinc-700 text-xs">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loan.status === "approved" && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Loan Approved</p>
              <p className="text-xs text-green-600 mt-1">
                Approved on {loan.approved_at ? new Date(loan.approved_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <Link
              href={`/registry/loans/track?loan=${loan.id}`}
              className="px-4 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-medium rounded-md transition-colors"
            >
              Track Payments
            </Link>
          </div>
        </div>
      )}

      {loan.status === "cancelled" && loan.cancel_reason && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">Cancellation Reason</p>
          <p className="text-sm text-red-600 mt-1">{loan.cancel_reason}</p>
        </div>
      )}

      {/* Loan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-medium text-zinc-700 mb-4">Loan Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Amount</dt>
              <dd className="text-sm font-medium text-zinc-900">{formatCurrency(loan.loan_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Monthly Payment</dt>
              <dd className="text-sm font-medium text-zinc-900">{formatCurrency(loan.monthly_payment)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Repayment Period</dt>
              <dd className="text-sm font-medium text-zinc-900">{loan.repayment_period} months</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Purpose</dt>
              <dd className="text-sm text-zinc-900 text-right max-w-xs">{loan.loan_purpose}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Source</dt>
              <dd className="text-sm text-zinc-900 capitalize">{loan.source}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Applied</dt>
              <dd className="text-sm text-zinc-900">{new Date(loan.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-medium text-zinc-700 mb-4">Personal Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Full Name</dt>
              <dd className="text-sm font-medium text-zinc-900">{loan.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Phone</dt>
              <dd className="text-sm text-zinc-900">{loan.phone}</dd>
            </div>
            {loan.email && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Email</dt>
                <dd className="text-sm text-zinc-900">{loan.email}</dd>
              </div>
            )}
            {loan.national_id && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">National ID</dt>
                <dd className="text-sm text-zinc-900">{loan.national_id}</dd>
              </div>
            )}
            {loan.district && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">District</dt>
                <dd className="text-sm text-zinc-900">{loan.district}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-500">Employment</dt>
              <dd className="text-sm text-zinc-900">{EMPLOYMENT_LABELS[loan.employment_status] || loan.employment_status}</dd>
            </div>
            {loan.monthly_income && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Monthly Income</dt>
                <dd className="text-sm text-zinc-900">{formatCurrency(loan.monthly_income)}</dd>
              </div>
            )}
            {loan.income_source && (
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Income Source</dt>
                <dd className="text-sm text-zinc-900">{loan.income_source}</dd>
              </div>
            )}
          </dl>
        </div>

        {(loan.collateral_description || loan.guarantor_name) && (
          <div className="bg-white rounded-lg border border-zinc-200 p-5">
            <h3 className="text-sm font-medium text-zinc-700 mb-4">Security & Guarantor</h3>
            <dl className="space-y-3">
              {loan.collateral_description && (
                <div>
                  <dt className="text-sm text-zinc-500 mb-1">Collateral</dt>
                  <dd className="text-sm text-zinc-900">{loan.collateral_description}</dd>
                </div>
              )}
              {loan.guarantor_name && (
                <div className="flex justify-between">
                  <dt className="text-sm text-zinc-500">Guarantor</dt>
                  <dd className="text-sm text-zinc-900">{loan.guarantor_name}</dd>
                </div>
              )}
              {loan.guarantor_phone && (
                <div className="flex justify-between">
                  <dt className="text-sm text-zinc-500">Guarantor Phone</dt>
                  <dd className="text-sm text-zinc-900">{loan.guarantor_phone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
