"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  fieldLeadId: string;
}

export default function FollowUpForm({ fieldLeadId }: Props) {
  const router = useRouter();
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/registry/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldLeadId,
          dueAt: dueAt + "T09:00:00Z",
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.details) {
          setError(data.details.join(", "));
        } else {
          setError(data.error || "Failed to create follow-up");
        }
      } else {
        setSuccess(true);
        setDueAt("");
        setNotes("");
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    } catch {
      setError("Failed to create follow-up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-md px-3 py-2 border border-red-200">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm rounded-md px-3 py-2 border border-green-200">Follow-up created!</div>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Due Date *</label>
        <input
          type="date"
          required
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          placeholder="Follow-up notes..."
        />
      </div>
      <button
        type="submit"
        disabled={loading || !dueAt}
        className="bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-300 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
      >
        {loading ? "Creating..." : "Schedule Follow-Up"}
      </button>
    </form>
  );
}
