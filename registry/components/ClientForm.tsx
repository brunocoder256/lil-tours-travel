"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData?: {
    id?: string;
    full_name: string;
    phone: string;
    email: string | null;
    district: string | null;
    date_of_birth: string | null;
  };
  mode: "create" | "edit";
}

export default function ClientForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [district, setDistrict] = useState(initialData?.district || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.date_of_birth || "");
  const [error, setError] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; full_name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDuplicateInfo(null);
    setLoading(true);

    try {
      const url = mode === "edit" && initialData?.id
        ? `/api/registry/clients/${initialData.id}`
        : "/api/registry/clients";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          district,
          date_of_birth: dateOfBirth,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.existingClient) {
        setDuplicateInfo(data.existingClient);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(data.client ? `/registry/clients/${data.client.id}` : "/registry/clients");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200" role="alert">
          {error}
        </div>
      )}

      {duplicateInfo && (
        <div className="bg-amber-50 text-amber-800 text-sm rounded-md px-4 py-3 border border-amber-200">
          <p className="font-medium">Client already exists</p>
          <p className="mt-1">A client with this phone number ({duplicateInfo.full_name}) is already registered.</p>
          <button
            type="button"
            onClick={() => router.push(`/registry/clients/${duplicateInfo.id}`)}
            className="mt-2 text-amber-900 underline text-sm font-medium"
          >
            View existing client
          </button>
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+256 7XX XXX XXX"
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="district" className="block text-sm font-medium text-zinc-700 mb-1">
          District
        </label>
        <input
          id="district"
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="date_of_birth" className="block text-sm font-medium text-zinc-700 mb-1">
          Date of Birth
        </label>
        <input
          id="date_of_birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white font-medium py-2 px-5 rounded-md text-sm transition-colors"
        >
          {loading ? "Saving..." : mode === "edit" ? "Update Client" : "Create Client"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium py-2 px-5 rounded-md text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
