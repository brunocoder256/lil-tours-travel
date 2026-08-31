"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Loan {
  id: string;
  full_name: string;
  phone: string;
  loan_amount: number;
  repayment_period: number;
  monthly_payment: number;
  status: string;
}

interface Payment {
  id: string;
  loan_id: string;
  period_label: string;
  period_type: string;
  expected_amount: number;
  paid_amount: number;
  status: string;
  paid_at: string | null;
  notes: string | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(amount);
}

export default function LoanTrackSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLoanId = searchParams.get("loan") || "";

  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState(initialLoanId);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState("");
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [editAmounts, setEditAmounts] = useState<Record<string, string>>({});

  // Fetch approved loans
  const fetchLoans = useCallback(async () => {
    setLoadingLoans(true);
    try {
      const res = await fetch("/api/registry/loans?status=approved&limit=100");
      if (!res.ok) throw new Error("Failed to load loans");
      const data = await res.json();
      setLoans(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoadingLoans(false);
    }
  }, []);

  // Fetch payments for selected loan
  const fetchPayments = useCallback(async () => {
    if (!selectedLoanId) {
      setPayments([]);
      return;
    }
    setLoadingPayments(true);
    setError("");
    try {
      const res = await fetch(`/api/registry/loans/${selectedLoanId}`);
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [selectedLoanId]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Mark payment as paid
  async function handleMarkPaid(paymentId: string) {
    const amount = parseFloat(editAmounts[paymentId] || "0");
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setUpdatingPayment(paymentId);
    try {
      const res = await fetch(`/api/registry/loans/${selectedLoanId}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, paidAmount: amount }),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      setEditAmounts((prev) => ({ ...prev, [paymentId]: "" }));
      fetchPayments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update payment");
    } finally {
      setUpdatingPayment(null);
    }
  }

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);
  const totalPaid = payments.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalExpected = payments.reduce((sum, p) => sum + p.expected_amount, 0);
  const progressPercent = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Loan Selector */}
      <div className="bg-white rounded-lg border border-zinc-200 p-5">
        <label className="block text-sm font-medium text-zinc-700 mb-2">Select Approved Loan</label>
        {loadingLoans ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <select
            value={selectedLoanId}
            onChange={(e) => {
              setSelectedLoanId(e.target.value);
              router.push(`/registry/loans/track?loan=${e.target.value}`, { scroll: false });
            }}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          >
            <option value="">-- Select a loan --</option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.full_name} &mdash; {formatCurrency(loan.loan_amount)} ({loan.repayment_period} mo)
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">
          {error}
        </div>
      )}

      {/* Summary */}
      {selectedLoan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500">Loan Amount</p>
            <p className="text-lg font-bold text-zinc-900">{formatCurrency(selectedLoan.loan_amount)}</p>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500">Monthly Payment</p>
            <p className="text-lg font-bold text-zinc-900">{formatCurrency(selectedLoan.monthly_payment)}</p>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500">Total Paid</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 p-4">
            <p className="text-xs text-zinc-500">Remaining</p>
            <p className="text-lg font-bold text-zinc-900">{formatCurrency(totalExpected - totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {selectedLoan && (
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-600">Payment Progress</span>
            <span className="font-medium text-zinc-900">{progressPercent}%</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {payments.filter((p) => p.status === "paid").length} of {payments.length} payments completed
          </p>
        </div>
      )}

      {/* Payment Grid */}
      {loadingPayments && selectedLoanId && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loadingPayments && selectedLoanId && payments.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <h3 className="text-sm font-medium text-zinc-700">Payment Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left px-4 py-2.5 font-medium text-zinc-600">Period</th>
                  <th className="text-right px-4 py-2.5 font-medium text-zinc-600">Expected</th>
                  <th className="text-right px-4 py-2.5 font-medium text-zinc-600">Paid</th>
                  <th className="text-center px-4 py-2.5 font-medium text-zinc-600">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-2.5 text-zinc-900 font-medium">{payment.period_label}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-600">{formatCurrency(payment.expected_amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {payment.paid_amount > 0 ? (
                        <span className="font-medium text-green-700">{formatCurrency(payment.paid_amount)}</span>
                      ) : (
                        <span className="text-zinc-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {payment.status === "paid" ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700" title="Paid">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : payment.status === "partial" ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700" title="Partial">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500" title="Not paid">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {payment.status !== "paid" && (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editAmounts[payment.id] || ""}
                            onChange={(e) => setEditAmounts((prev) => ({ ...prev, [payment.id]: e.target.value }))}
                            placeholder={String(payment.expected_amount)}
                            className="w-24 px-2 py-1 border border-zinc-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-600"
                          />
                          <button
                            onClick={() => handleMarkPaid(payment.id)}
                            disabled={updatingPayment === payment.id}
                            className="px-2 py-1 bg-green-700 hover:bg-green-800 disabled:bg-green-500 text-white text-xs font-medium rounded transition-colors"
                          >
                            {updatingPayment === payment.id ? "..." : "Pay"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loadingPayments && selectedLoanId && payments.length === 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <p className="text-zinc-500 text-sm">No payment records found for this loan.</p>
        </div>
      )}

      {!selectedLoanId && !loadingLoans && (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <p className="text-zinc-500 text-sm">Select an approved loan above to view the payment track sheet.</p>
        </div>
      )}
    </div>
  );
}
