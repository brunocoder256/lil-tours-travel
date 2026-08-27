"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  created_at: string;
}

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/registry/clients")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setClients(data.clients || []))
      .catch(() => setError("Could not load clients. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">Loading clients...</p>
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

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-500">No clients found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">District</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Created</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/registry/clients/${c.id}`}
            className="block bg-white rounded-lg border border-zinc-200 p-4 hover:border-green-300 transition-colors"
          >
            <p className="font-medium text-green-700">{c.full_name}</p>
            <p className="text-sm text-zinc-600 mt-1">{c.phone}</p>
            {c.district && <p className="text-xs text-zinc-500 mt-1">{c.district}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
