"use client";

import { useConnection } from "@/components/ConnectionProvider";

export default function OfflineBanner() {
  const { isOnline, syncStats } = useConnection();

  if (isOnline && syncStats.pending === 0) return null;

  return (
    <div className={`px-4 py-2 text-sm flex items-center gap-2 ${isOnline ? "bg-amber-50 text-amber-800 border-b border-amber-200" : "bg-red-50 text-red-800 border-b border-red-200"}`}>
      <span className="flex-shrink-0" aria-hidden="true">
        {isOnline ? "⏳" : "⚡"}
      </span>
      <span>
        {isOnline
          ? `${syncStats.pending} record${syncStats.pending !== 1 ? "s" : ""} waiting to sync`
          : "You&apos;re offline. New field leads will be saved on this device and synchronized when connection returns."
        }
      </span>
    </div>
  );
}
