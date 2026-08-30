"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getRoleLabel } from "@/lib/permissions";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = ["admin", "supervisor", "data_entrant", "field_marketer"];

function StaffListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    params.set("page", String(page));

    fetch(`/api/registry/staff?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setStaff(data.staff || []);
        setTotal(data.total || 0);
      })
      .catch(() => setError("Unable to load staff. Please try again."))
      .finally(() => setLoading(false));
  }, [search, role, page]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 300);
  }

  async function handleDeactivate(staffId: string, currentActive: boolean) {
    if (!confirm(currentActive ? "Deactivate this staff member?" : "Reactivate this staff member?")) return;
    setDeleting(staffId);
    try {
      const res = await fetch(`/api/registry/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update staff member");
        return;
      }
      fetchStaff();
    } catch {
      alert("Failed to update staff member");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDelete(staffId: string) {
    if (!confirm("Permanently delete this staff member? This cannot be undone.")) return;
    setDeleting(staffId);
    try {
      const res = await fetch(`/api/registry/staff/${staffId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete staff member");
        return;
      }
      fetchStaff();
    } catch {
      alert("Failed to delete staff member");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
        </select>
        <Link
          href="/registry/staff/new"
          className="inline-flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Staff
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-zinc-500">Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500">No staff members found.</p>
          <Link href="/registry/staff/new" className="text-sm text-green-700 hover:text-green-800 mt-2 inline-block">
            Add the first staff member
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/registry/staff/${s.id}`} className="font-medium text-zinc-900 hover:text-green-700">
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{s.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.role === "admin" ? "bg-purple-100 text-purple-800" :
                        s.role === "supervisor" ? "bg-blue-100 text-blue-800" :
                        s.role === "field_marketer" ? "bg-orange-100 text-orange-800" :
                        "bg-zinc-100 text-zinc-800"
                      }`}>
                        {getRoleLabel(s.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/registry/staff/${s.id}`}
                          className="text-green-700 hover:text-green-800 text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeactivate(s.id, s.is_active)}
                          disabled={deleting === s.id}
                          className="text-zinc-500 hover:text-zinc-700 text-xs font-medium disabled:opacity-50"
                        >
                          {s.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deleting === s.id}
                          className="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-zinc-200 text-xs text-zinc-500">
            {total} staff member{total !== 1 ? "s" : ""} total
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffList() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-zinc-500">Loading...</div>}>
      <StaffListInner />
    </Suspense>
  );
}
