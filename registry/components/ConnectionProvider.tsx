"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  getPendingSyncItems,
  updateSyncItem,
  getSyncStats,
  updateOfflineLeadSyncStatus,
  updateOfflineFollowUpSyncStatus,
} from "@/lib/offline/db";

interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
}

interface ConnectionState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncStats: SyncStats;
  triggerSync: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionState>({
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  syncStats: { pending: 0, synced: 0, failed: 0 },
  triggerSync: async () => {},
});

export function useConnection() {
  return useContext(ConnectionContext);
}

export function ConnectionProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats>({ pending: 0, synced: 0, failed: 0 });
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getSyncStats();
      setSyncStats(stats);
    } catch {
      // silent
    }
  }, []);

  const processSyncItem = useCallback(async (item: { id: string; operation: string; entity: string; entity_id: string; payload: Record<string, unknown> }) => {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationId: item.id,
        operation: item.operation,
        entity: item.entity,
        entityId: item.entity_id,
        payload: item.payload,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return res.json();
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const pending = await getPendingSyncItems();
      let syncedCount = 0;
      let failedCount = 0;

      for (const item of pending) {
        await updateSyncItem(item.id, { status: "syncing", last_attempt_at: new Date().toISOString(), attempts: item.attempts + 1 });

        try {
          const result = await processSyncItem(item);

          if (result.conflict) {
            await updateSyncItem(item.id, { status: "failed", error: "Conflict detected" });
            if (item.entity === "field_lead") {
              await updateOfflineLeadSyncStatus(item.entity_id, "failed");
            }
            failedCount++;
          } else {
            await updateSyncItem(item.id, { status: "synced" });

            if (item.entity === "field_lead" && item.operation === "create") {
              await updateOfflineLeadSyncStatus(item.entity_id, "synced", result.serverId);
            } else if (item.entity === "follow_up") {
              await updateOfflineFollowUpSyncStatus(item.entity_id, "synced");
            }
            syncedCount++;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          const isPermanent = message.includes("403") || message.includes("404") || message.includes("Invalid") || message.includes("Permission");
          await updateSyncItem(item.id, {
            status: isPermanent ? "failed" : "pending",
            error: message,
          });
          if (item.entity === "field_lead") {
            await updateOfflineLeadSyncStatus(item.entity_id, isPermanent ? "failed" : "pending");
          }
          failedCount++;
        }
      }

      if (syncedCount > 0) {
        setLastSyncAt(new Date().toISOString());
      }

      await refreshStats();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, processSyncItem, refreshStats]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(triggerSync, 1000);
    };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  // Periodic sync attempt (every 30s when online)
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) triggerSync();
    }, 30000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [triggerSync]);

  // Refresh stats on mount and after sync
  useEffect(() => { refreshStats(); }, [refreshStats]);

  // Sync on visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        triggerSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [triggerSync]);

  return (
    <ConnectionContext.Provider value={{ isOnline, isSyncing, lastSyncAt, syncStats, triggerSync }}>
      {children}
    </ConnectionContext.Provider>
  );
}
