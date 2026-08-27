"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  followUpId: string;
  currentStatus: string;
}

export default function FollowUpActions({ followUpId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [showOutcome, setShowOutcome] = useState(false);

  async function handleAction(status: string, outcomeNote?: string) {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { status };
      if (outcomeNote) body.outcome = outcomeNote;

      const res = await fetch(`/api/registry/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setShowOutcome(false);
      setOutcome("");
    }
  }

  if (currentStatus !== "pending") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {showOutcome ? (
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Outcome note (optional)"
            className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            onClick={() => handleAction("completed", outcome)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-md disabled:bg-zinc-300"
          >
            Confirm
          </button>
          <button
            onClick={() => { setShowOutcome(false); setOutcome(""); }}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowOutcome(true)}
            disabled={loading}
            className="text-xs font-medium text-green-700 hover:text-green-800 border border-green-200 rounded px-2.5 py-1 hover:bg-green-50 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            onClick={() => handleAction("missed")}
            disabled={loading}
            className="text-xs font-medium text-amber-700 hover:text-amber-800 border border-amber-200 rounded px-2.5 py-1 hover:bg-amber-50 disabled:opacity-50"
          >
            Missed
          </button>
          <button
            onClick={() => handleAction("cancelled")}
            disabled={loading}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded px-2.5 py-1 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
