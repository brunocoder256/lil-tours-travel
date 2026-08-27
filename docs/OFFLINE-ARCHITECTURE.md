# Lil Tours — Offline Architecture

## Overview

Phase 8 introduces offline-first field marketing capabilities. Field marketers can capture leads and update follow-ups even without internet connectivity. Data is stored locally and synchronized when connectivity returns.

## Architecture Diagram

```
              FIELD MARKETER
                    │
                    ▼
                 PWA
                    │
             ┌──────┴──────┐
             │  IndexedDB  │
             └──────┬──────┘
                    │
               Sync Queue
                    │
             ┌──────▼──────┐
             │  Sync API   │
             └──────┬──────┘
                    │
             Auth + Validation
                    │
                    ▼
                Supabase
                    │
                    ▼
              PostgreSQL
```

## Local Database (IndexedDB)

### Stores

| Store | Purpose |
|-------|---------|
| `offline_leads` | Field leads created/updated offline |
| `offline_followups` | Follow-up updates made offline |
| `sync_queue` | Pending sync operations |
| `sync_meta` | Sync state metadata |

### Schema

#### offline_leads
```
id              UUID (client-generated)
server_id       UUID (set after sync)
full_name       TEXT
phone           TEXT
email           TEXT
district        TEXT
date_of_birth   DATE
service_interest TEXT
source          TEXT
notes           TEXT
status          TEXT
created_by      TEXT (staff ID)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
sync_status     pending | syncing | synced | failed
```

#### sync_queue
```
id              UUID (client-generated)
operation       create | update
entity          field_lead | follow_up
entity_id       UUID
payload         JSON
created_at      TIMESTAMPTZ
attempts        INTEGER
last_attempt_at TIMESTAMPTZ
status          pending | syncing | synced | failed | conflict
error           TEXT
```

## Sync Process

### Automatic Triggers
1. Application startup
2. Connection restoration (online event)
3. Browser tab regains focus (visibility change)
4. Periodic interval (every 30 seconds when online)
5. Manual "Sync Now" button

### Sync Flow
1. Fetch pending items from IndexedDB sync_queue
2. For each item:
   a. Mark as `syncing`
   b. POST to `/api/sync` with operation details
   c. On success: mark as `synced`, update entity sync_status
   d. On failure: mark as `failed` or re-queue as `pending`
3. Update UI with results

### Retry Strategy
- Failed operations are re-queued as `pending` (except permanent failures)
- Permanent failures (403, 404, invalid data) are marked as `failed`
- No aggressive retry — relies on next sync trigger

## Server Sync Endpoint

### POST /api/sync

**Request:**
```json
{
  "operationId": "uuid",
  "operation": "create",
  "entity": "field_lead",
  "entityId": "uuid",
  "payload": { ... }
}
```

**Supported Operations:**
- `create` + `field_lead` — Create new lead
- `update` + `field_lead` — Update lead status/notes
- `update` + `follow_up` — Update follow-up status/outcome

**Security:**
- Authentication required (x-user-id header)
- Permission checked per entity type
- Ownership verified for field marketers
- Payload validated against schema
- Idempotency via operation_id

**Idempotency:**
- Server stores processed operation_ids in `sync_operations` table
- Duplicate requests return cached result
- No duplicate records created

**Conflict Detection:**
- Version field on field_leads and follow_ups
- Client sends version from last read
- Server compares with current version
- Stale updates rejected with conflict response

## Authentication Offline

- User must log in while online first
- Supabase session persists in cookies/localStorage
- Session may expire offline — clear message shown
- No passwords stored locally
- No service-role keys exposed to browser

## Permissions Offline

- Field marketers can create leads offline (if they have `field_leads.create` permission)
- Server re-validates all permissions during sync
- Local IndexedDB is not a security boundary

## Conflict Strategy

- Server-authoritative for conflicting updates
- Last-write-wins only when no version conflict
- Conflicts flagged in sync results for user review
- No CRDT or complex merge — keep simple

## Data Retention

- Synced local records: cleaned up after sync confirmation
- Unsynced records: never auto-deleted
- Failed records: preserved for manual review
- Sync history: limited to last 100 operations per device

## Security Limitations

- IndexedDB is not encrypted
- Shared devices may expose local data
- Device logout warns about unsynced data
- No sensitive data stored offline (passwords, keys, tokens)

## Testing Checklist

1. Login while online
2. Open Field Leads
3. Disconnect internet
4. Create a field lead
5. Confirm it appears immediately
6. Confirm it is marked "Pending Sync"
7. Close/reopen the app
8. Confirm the record remains
9. Restore internet
10. Trigger automatic sync
11. Confirm server receives the lead
12. Confirm record becomes "Synced"
13. Confirm no duplicate lead was created
