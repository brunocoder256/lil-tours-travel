const DB_NAME = "lil-tours-offline";
const DB_VERSION = 1;

export interface OfflineLead {
  id: string;
  server_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  date_of_birth: string | null;
  service_interest: string;
  source: string;
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sync_status: "pending" | "syncing" | "synced" | "failed";
}

export interface OfflineFollowUp {
  id: string;
  server_id: string | null;
  field_lead_id: string;
  assigned_to: string;
  due_at: string;
  status: string;
  notes: string | null;
  outcome: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  sync_status: "pending" | "syncing" | "synced" | "failed";
}

export interface SyncQueueItem {
  id: string;
  operation: "create" | "update";
  entity: "field_lead" | "follow_up";
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_attempt_at: string | null;
  status: "pending" | "syncing" | "synced" | "failed";
  error: string | null;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("offline_leads")) {
        const leadStore = db.createObjectStore("offline_leads", { keyPath: "id" });
        leadStore.createIndex("sync_status", "sync_status");
        leadStore.createIndex("created_by", "created_by");
        leadStore.createIndex("phone", "phone");
      }

      if (!db.objectStoreNames.contains("offline_followups")) {
        const fuStore = db.createObjectStore("offline_followups", { keyPath: "id" });
        fuStore.createIndex("sync_status", "sync_status");
        fuStore.createIndex("field_lead_id", "field_lead_id");
        fuStore.createIndex("assigned_to", "assigned_to");
      }

      if (!db.objectStoreNames.contains("sync_queue")) {
        const qStore = db.createObjectStore("sync_queue", { keyPath: "id" });
        qStore.createIndex("status", "status");
        qStore.createIndex("entity", "entity");
        qStore.createIndex("created_at", "created_at");
      }

      if (!db.objectStoreNames.contains("sync_meta")) {
        db.createObjectStore("sync_meta", { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);
  });
}

function tx(storeName: string, mode: IDBTransactionMode) {
  return openDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// Offline Leads
// ============================================

export async function saveOfflineLead(lead: OfflineLead): Promise<void> {
  const store = await tx("offline_leads", "readwrite");
  await requestToPromise(store.put(lead));
}

export async function getOfflineLead(id: string): Promise<OfflineLead | undefined> {
  const store = await tx("offline_leads", "readonly");
  return requestToPromise(store.get(id));
}

export async function getOfflineLeadsByUser(staffId: string): Promise<OfflineLead[]> {
  const store = await tx("offline_leads", "readonly");
  const index = store.index("created_by");
  return requestToPromise(index.getAll(staffId));
}

export async function getAllOfflineLeads(): Promise<OfflineLead[]> {
  const store = await tx("offline_leads", "readonly");
  return requestToPromise(store.getAll());
}

export async function updateOfflineLeadSyncStatus(id: string, syncStatus: OfflineLead["sync_status"], serverId?: string): Promise<void> {
  const store = await tx("offline_leads", "readwrite");
  const lead = await requestToPromise(store.get(id));
  if (lead) {
    lead.sync_status = syncStatus;
    if (serverId) lead.server_id = serverId;
    await requestToPromise(store.put(lead));
  }
}

export async function deleteOfflineLead(id: string): Promise<void> {
  const store = await tx("offline_leads", "readwrite");
  await requestToPromise(store.delete(id));
}

export async function deleteSyncedOfflineLeads(): Promise<void> {
  const store = await tx("offline_leads", "readwrite");
  const index = store.index("sync_status");
  const synced = await requestToPromise(index.getAll("synced"));
  for (const lead of synced) {
    await requestToPromise(store.delete(lead.id));
  }
}

// ============================================
// Offline Follow-Ups
// ============================================

export async function saveOfflineFollowUp(fu: OfflineFollowUp): Promise<void> {
  const store = await tx("offline_followups", "readwrite");
  await requestToPromise(store.put(fu));
}

export async function getOfflineFollowUp(id: string): Promise<OfflineFollowUp | undefined> {
  const store = await tx("offline_followups", "readonly");
  return requestToPromise(store.get(id));
}

export async function getAllOfflineFollowUps(): Promise<OfflineFollowUp[]> {
  const store = await tx("offline_followups", "readonly");
  return requestToPromise(store.getAll());
}

export async function updateOfflineFollowUpSyncStatus(id: string, syncStatus: OfflineFollowUp["sync_status"]): Promise<void> {
  const store = await tx("offline_followups", "readwrite");
  const fu = await requestToPromise(store.get(id));
  if (fu) {
    fu.sync_status = syncStatus;
    await requestToPromise(store.put(fu));
  }
}

// ============================================
// Sync Queue
// ============================================

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const store = await tx("sync_queue", "readwrite");
  await requestToPromise(store.put(item));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const store = await tx("sync_queue", "readonly");
  return requestToPromise(store.getAll());
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const store = await tx("sync_queue", "readonly");
  const index = store.index("status");
  return requestToPromise(index.getAll("pending"));
}

export async function updateSyncItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
  const store = await tx("sync_queue", "readwrite");
  const item = await requestToPromise(store.get(id));
  if (item) {
    Object.assign(item, updates);
    await requestToPromise(store.put(item));
  }
}

export async function deleteSyncItem(id: string): Promise<void> {
  const store = await tx("sync_queue", "readwrite");
  await requestToPromise(store.delete(id));
}

export async function getSyncStats(): Promise<{ pending: number; synced: number; failed: number }> {
  const items = await getSyncQueue();
  return {
    pending: items.filter((i) => i.status === "pending" || i.status === "syncing").length,
    synced: items.filter((i) => i.status === "synced").length,
    failed: items.filter((i) => i.status === "failed").length,
  };
}

// ============================================
// Sync Metadata
// ============================================

export async function getSyncMeta(key: string): Promise<string | null> {
  const store = await tx("sync_meta", "readonly");
  const result = await requestToPromise(store.get(key));
  return result?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const store = await tx("sync_meta", "readwrite");
  await requestToPromise(store.put({ key, value }));
}
