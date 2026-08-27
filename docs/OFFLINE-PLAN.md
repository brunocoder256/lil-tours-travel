# Offline-First Architecture Plan

## Overview

Lil Tours & Travel field marketing staff operate in areas with unreliable internet connectivity. The registry application must support offline data capture and synchronization when connectivity returns.

This document outlines the intended offline-first architecture. Full implementation will occur in a later phase.

---

## Core Principle

```
ONLINE
   ↓
Save directly to backend
   ↓
Supabase / PostgreSQL

OFFLINE
   ↓
Save locally (IndexedDB)
   ↓
Mark as pending sync
   ↓
Internet returns
   ↓
Synchronize
   ↓
Resolve conflicts safely
```

---

## Online Flow

When connected:
1. User captures a field lead or updates a client record
2. Data is sent directly to Supabase via API
3. Record is created/updated in PostgreSQL
4. Confirmation returned to the device
5. Local cache is updated

---

## Offline Flow

When disconnected:
1. User captures a field lead or updates a client record
2. Data is saved to local IndexedDB storage
3. Record is marked with `sync_status: "pending"`
4. A sync indicator shows the user they are offline
5. When connectivity returns:
   - Pending records are uploaded to Supabase in order
   - Each record's `sync_status` is updated to `"synced"`
   - Conflicts are resolved using last-write-wins or field-level merge

---

## Sync Queue

A local queue tracks all pending operations:

```
sync_queue:
  - id: unique local ID
  - table: target table name
  - operation: create | update | delete
  - payload: JSON data
  - created_at: local timestamp
  - sync_status: pending | syncing | synced | failed
  - retry_count: number of attempts
  - last_error: error message if failed
```

---

## Conflict Resolution Strategy

**Default:** Last-write-wins based on `updated_at` timestamp.

**Field-level merge** for collaborative editing (future enhancement):
- Staff A edits client name while offline
- Staff B edits client phone while offline
- On sync, both changes are merged rather than overwritten

**Priority:** Simple conflict resolution first, field-level merge later.

---

## PWA Requirements

The registry should be installable as a Progressive Web App:

- **Service Worker** — cache static assets for offline use
- **Manifest** — app name, icons, theme color, display: standalone
- **IndexedDB** — local data storage for offline records
- **Background Sync** — queue sync operations when offline

---

## Mobile-First Design

Field staff will primarily use Android phones. The offline experience must be:

- Touch-friendly controls (minimum 44px tap targets)
- Large enough text for outdoor readability
- Fast to load on low-end devices
- Minimal data usage during sync
- Clear offline/online status indicator
- Works in airplane mode

---

## Data Capture Scenarios

### Field Lead Capture (Offline)
1. Staff meets potential client at event/location
2. Opens registry app on phone
3. Fills in lead form (name, phone, service interest, notes)
4. App saves to IndexedDB
5. Staff sees confirmation: "Saved offline — will sync when connected"
6. When internet returns, lead is uploaded automatically

### Client Record Update (Offline)
1. Staff updates client's service status in the field
2. Change saved locally
3. Synced when connectivity returns
4. Conflict resolved if another user edited same record

---

## Not Implemented in Phase 1

- Service worker registration
- IndexedDB schema
- Sync engine
- Conflict resolution logic
- Background sync API
- PWA manifest
- Offline indicator UI

These will be built in the dedicated offline/PWA phase.

---

## Technology Choices (Planned)

| Concern | Planned Technology |
|---------|-------------------|
| Local storage | IndexedDB (via Dexie.js or idb) |
| Service worker | Workbox or manual SW |
| Sync engine | Custom or Supabase realtime |
| PWA manifest | Standard web manifest |
| Offline UI indicators | React context + hooks |
