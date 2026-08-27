"use client";

import { useEffect, useState } from "react";

interface Enquiry {
  id: string;
  client_id: string;
  client_name: string;
  service: string;
  destination: string | null;
  status: string;
  source: string;
  created_at: string;
}

export default function EnquiriesList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/registry/enquiries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setEnquiries(data.enquiries || []))
      .catch(() => setError("Could not load enquiries. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">Loading enquiries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (enquiries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">No enquiries found.</p>
      </div>
    );
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      new: "bg-blue-50 text-blue-700",
      contacted: "bg-amber-50 text-amber-700",
      in_progress: "bg-purple-50 text-purple-700",
      completed: "bg-green-50 text-green-700",
      cancelled: "bg-zinc-100 text-zinc-600",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.new}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  }

  return (
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
            </tr>
          </thead>
          <tbody>
            {enquiries.map((eq) => (
              <tr key={eq.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{eq.client_name}</td>
                <td className="px-4 py-3 text-zinc-600 capitalize">{eq.service.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-zinc-600">{eq.destination || "—"}</td>
                <td className="px-4 py-3">{statusBadge(eq.status)}</td>
                <td className="px-4 py-3 text-zinc-500 capitalize">{eq.source.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {enquiries.map((eq) => (
          <div key={eq.id} className="bg-white rounded-lg border border-zinc-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-zinc-900 text-sm">{eq.client_name}</p>
              {statusBadge(eq.status)}
            </div>
            <p className="text-xs text-zinc-600 mt-1 capitalize">{eq.service.replace(/_/g, " ")}</p>
            {eq.destination && <p className="text-xs text-zinc-500 mt-1">To: {eq.destination}</p>}
            <p className="text-xs text-zinc-400 mt-2">
              {new Date(eq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
