"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleLabel, type StaffRole } from "@/lib/permissions";

interface Props {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    full_name: string;
    phone: string | null;
    role: string;
    is_active: boolean;
  };
}

const ROLES: StaffRole[] = ["admin", "supervisor", "data_entrant", "field_marketer"];

export default function StaffForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>((initialData?.role as StaffRole) || "data_entrant");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "create") {
        if (!email) { setError("Email is required"); setLoading(false); return; }
        if (!password || password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/registry/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone: phone || null,
            role,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to create staff member");
          return;
        }
        router.push("/registry/staff");
        router.refresh();
      } else {
        const res = await fetch(`/api/registry/staff/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            phone: phone || null,
            role,
            is_active: isActive,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to update staff member");
          return;
        }
        router.push("/registry/staff");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 mb-1">
          Full Name *
        </label>
        <input
          id="full_name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="John Doe"
        />
      </div>

      {mode === "create" && (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="staff@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              placeholder="Min. 6 characters"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="+256 700 000000"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-zinc-700 mb-1">
          Role *
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          {role === "admin" && "Full access to all features including staff management."}
          {role === "supervisor" && "Can manage clients, enquiries, field leads, and view reports."}
          {role === "data_entrant" && "Can create and view clients and enquiries."}
          {role === "field_marketer" && "Can manage field leads and follow-ups."}
        </p>
      </div>

      {mode === "edit" && (
        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-green-600 border-zinc-300 rounded focus:ring-green-600"
          />
          <label htmlFor="is_active" className="text-sm text-zinc-700">
            Active (can log in)
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white font-medium py-2.5 px-5 rounded-md text-sm transition-colors"
        >
          {loading
            ? mode === "create" ? "Creating..." : "Saving..."
            : mode === "create" ? "Create Staff Member" : "Save Changes"
          }
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium py-2.5 px-5 rounded-md text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
