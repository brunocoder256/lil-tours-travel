"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface Props {
  enquiryId: string;
  currentStatus: string;
}

export default function EnquiryStatusUpdater({ enquiryId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpdate() {
    if (status === currentStatus) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/registry/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update status");
        setStatus(currentStatus);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    } catch {
      setError("Failed to update status");
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSuccess(false); setError(""); }}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="bg-green-800 hover:bg-green-900 disabled:bg-zinc-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap"
      >
        {loading ? "Saving..." : "Update"}
      </button>
      {success && <span className="text-sm text-green-700">Updated!</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
