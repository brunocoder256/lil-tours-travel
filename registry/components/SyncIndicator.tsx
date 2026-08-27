"use client";

import { useConnection } from "@/components/ConnectionProvider";

export default function SyncIndicator() {
  const { isOnline, isSyncing, syncStats, triggerSync } = useConnection();

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
        <span className="text-zinc-600">{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Sync status */}
      {isSyncing && (
        <div className="flex items-center gap-1.5 text-amber-600">
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Syncing</span>
        </div>
      )}

      {/* Pending count */}
      {!isSyncing && syncStats.pending > 0 && (
        <span className="text-amber-600">{syncStats.pending} pending</span>
      )}

      {/* Failed count */}
      {syncStats.failed > 0 && (
        <span className="text-red-600">{syncStats.failed} failed</span>
      )}

      {/* Manual sync button */}
      {isOnline && !isSyncing && syncStats.pending > 0 && (
        <button
          onClick={triggerSync}
          className="text-green-700 hover:text-green-800 font-medium underline"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
