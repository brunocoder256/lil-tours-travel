# LIL TOURS & TRAVEL — PHASE 8
# Offline-First Field PWA, Local Storage, Sync Queue & Reliable Synchronization

## Project Context

Completed:

- Phase 1 — Project foundation
- Phase 2 — Public Lil Tours website
- Phase 2 Earth Add-on — Interactive Earth animation
- Phase 3 — Service discovery, enquiry form and WhatsApp conversion
- Phase 4 — Supabase/PostgreSQL registry foundation
- Phase 5 — Authentication, staff roles, permissions and protected registry
- Phase 6 — Client registry and enquiry management
- Phase 7 — Field marketing, field leads, follow-ups and lead conversion

Phase 8 introduces the **offline-first field experience**.

The purpose is practical:

Field marketers may work in locations where:

- Internet is weak.
- Mobile data is expensive.
- Connectivity disappears temporarily.
- The phone changes between networks.
- The user needs to continue capturing leads without waiting for the server.

The application must therefore allow authorized field staff to capture operational information locally and synchronize it safely when connectivity returns.

---

# IMPORTANT SCOPE

Implement **Phase 8 only**.

Do NOT rebuild:

- Public website
- Earth animation
- Authentication
- Clients module
- Enquiries module
- Field Leads module
- Follow-Ups module

Reuse all existing functionality.

This phase focuses on:

```text
PWA
Offline detection
Local persistence
Offline lead capture
Sync queue
Automatic synchronization
Retry handling
Conflict handling
Sync status
Reliable data integrity
```

Do NOT turn the application into a giant offline CRM.

The first offline workflow should prioritize:

```text
Field Lead Capture
Follow-Up Updates
```

Additional modules can become offline-capable in later phases.

---

# 1. Inspect Existing Architecture

Before coding, inspect the complete project.

Read:

```text
docs/PHASE-04*
docs/PHASE-05*
docs/PHASE-06*
docs/PHASE-07*
```

Inspect:

```text
app/
src/
website/
supabase/
package.json
```

Understand:

- Authentication
- Supabase client
- API routes
- Field lead schema
- Follow-up schema
- Client schema
- Enquiry schema
- Permissions
- RLS
- Existing PWA configuration, if any

Do not create duplicate infrastructure.

---

# 2. PWA Requirements

The registry/field application should behave as a Progressive Web App.

Requirements:

- Web App Manifest
- Service Worker
- Installable on supported mobile browsers
- App shell caching
- Offline-aware UI
- Responsive mobile interface
- Safe update mechanism

Do not cache private database responses indiscriminately.

---

# 3. PWA Manifest

Create or verify:

```text
manifest.webmanifest
```

Include:

```text
name: Lil Tours & Travel
short_name: Lil Tours
description: Lil Tours field and registry application
display: standalone
start_url
scope
icons
theme_color
background_color
```

Use the actual project branding.

Do not invent a new logo.

---

# 4. Service Worker

Implement a service worker appropriate to the existing framework.

It should provide:

```text
App shell caching
Static asset caching
Offline page/fallback
Controlled cache versioning
```

Do NOT blindly cache authenticated API responses.

Private registry data must remain protected.

---

# 5. Offline Data Storage

Use a proper browser-side storage layer.

Preferred:

```text
IndexedDB
```

Do not use:

```text
localStorage
```

as the primary database for field records.

A library such as Dexie may be used if appropriate to the existing project.

If adding a dependency, justify it.

---

# 6. Local Database Structure

Create an offline database containing only the data necessary for offline workflows.

Conceptually:

```text
offline_leads
offline_followups
sync_queue
sync_metadata
```

Example lead record:

```text
id
server_id
full_name
phone
email
district
date_of_birth
service_interest
source
notes
status
created_by
created_at
updated_at
sync_status
```

Use UUIDs.

---

# 7. Stable UUID Requirement

Offline records must receive IDs locally.

Example:

```text
client-generated UUID
        ↓
stored offline
        ↓
syncs later
        ↓
same UUID on server
```

Do not create temporary numeric IDs that must later be remapped unless unavoidable.

---

# 8. Sync Queue

Create a durable queue.

Example:

```text
sync_queue
────────────────────────
id
operation
entity
entity_id
payload
created_at
attempts
last_attempt_at
status
error
```

Operations may include:

```text
create
update
```

Future phases may add:

```text
delete
```

but do not implement destructive offline deletes now.

---

# 9. Queue States

Use controlled states:

```text
pending
syncing
synced
failed
conflict
```

Example:

```text
Lead saved locally
        ↓
PENDING
        ↓
SYNCING
        ↓
SYNCED
```

If synchronization repeatedly fails:

```text
PENDING
 ↓
SYNCING
 ↓
FAILED
```

---

# 10. Offline Lead Creation

This is the most important feature.

When a field marketer creates a lead while offline:

```text
Fill form
   ↓
Save
   ↓
Validate locally
   ↓
Generate UUID
   ↓
Store in IndexedDB
   ↓
Add sync queue item
   ↓
Show success
```

The user must NOT be blocked by:

```text
Network unavailable
```

---

# 11. Offline Success Message

When saved offline:

```text
✓ Lead saved on this device

It will sync automatically when internet
connection returns.
```

Clearly distinguish:

```text
Saved locally
```

from:

```text
Synced to company registry
```

Never tell the user a record is synced when it is only local.

---

# 12. Online Lead Creation

When online:

```text
Form
 ↓
Server
 ↓
Supabase
 ↓
Success
```

The system may still use the local-first pattern if designed carefully.

Preferred architecture:

```text
UI
 ↓
Local write
 ↓
Queue
 ↓
Sync engine
 ↓
Server
```

This gives a consistent workflow.

---

# 13. Connectivity Detection

Detect:

```text
navigator.onLine
```

but do not rely on it as proof that the internet actually works.

There are two concepts:

```text
Browser thinks online
```

and:

```text
Server is reachable
```

The application should distinguish them when practical.

---

# 14. Connection Status UI

Display a small unobtrusive indicator:

```text
● Online
```

or:

```text
● Offline
```

During synchronization:

```text
↻ Syncing...
```

After success:

```text
✓ Synced
```

When there are pending records:

```text
3 pending
```

Do not use color alone.

---

# 15. Offline Banner

When offline:

```text
You're offline.
New field leads will be saved on this device
and synchronized when connection returns.
```

Keep it compact.

Do not block the application.

---

# 16. Sync Indicator

The field marketer should be able to understand what happened.

Example:

```text
Sync
────────────────
✓ 8 records synced
⏳ 2 waiting
⚠ 1 needs attention
```

A simple sync panel is sufficient.

Do not build an advanced monitoring dashboard.

---

# 17. Automatic Sync

Trigger synchronization when:

```text
Application starts
Connection returns
User logs in
Browser regains focus
Periodic safe interval
```

Avoid aggressive polling.

Use a reasonable retry/backoff strategy.

---

# 18. Manual Sync

Provide:

```text
[ Sync Now ]
```

for authorized field users.

If offline:

```text
Cannot sync while offline.
Your records remain safely stored on this device.
```

---

# 19. Retry Strategy

Failed sync operations should retry.

Use exponential backoff or another controlled strategy.

Example:

```text
Attempt 1
↓
wait
Attempt 2
↓
wait longer
Attempt 3
```

Do not retry continuously every second.

---

# 20. Sync Idempotency

This is critical.

The same operation must not create duplicate leads if a request is retried.

Use a stable:

```text
operation ID
```

or:

```text
entity UUID + operation semantics
```

Server-side processing must recognize already-applied operations where practical.

Example:

```text
POST create lead
request times out
client retries
```

The result must not become:

```text
Lead A
Lead B
```

Instead:

```text
One lead
```

---

# 21. Server Sync Endpoint

Create an appropriate sync endpoint, for example:

```text
POST /api/sync
```

or a project-consistent equivalent.

It should accept controlled operations such as:

```text
create field lead
update field lead
update follow-up
```

Do not expose a generic arbitrary database mutation API.

---

# 22. Sync Payload

Use a predictable structure.

Conceptually:

```text
{
  operationId,
  entity,
  entityId,
  operation,
  clientTimestamp,
  payload
}
```

Server must validate every field.

Never accept arbitrary SQL or arbitrary table names.

---

# 23. Authentication During Sync

Every sync request must be authenticated.

The server must derive:

```text
staff identity
role
permissions
```

from the authenticated session.

Do not trust:

```text
created_by
assigned_to
role
```

submitted by the client.

---

# 24. Offline Identity

Offline field capture creates a special challenge.

If the application requires authentication before field work:

```text
User logs in while online
 ↓
Session established
 ↓
Device may continue field work offline
```

Implement only if compatible with the current authentication system.

Do NOT store passwords locally.

Do NOT store service-role keys.

Do NOT invent insecure authentication bypasses.

---

# 25. Offline Session Handling

If the existing authentication provider/session cannot safely continue offline, show a clear message.

Example:

```text
Your offline session has expired.

Reconnect to the internet and sign in again
before continuing.
```

Never bypass authentication simply to enable offline mode.

---

# 26. Permissions Offline

Offline actions must respect the user's permissions.

When a field marketer is allowed to create leads:

```text
offline lead creation = allowed
```

When they are not allowed:

```text
offline lead creation = blocked
```

Do not let a user gain permissions by modifying IndexedDB.

The server must re-check authorization during synchronization.

---

# 27. Ownership Offline

Offline lead records should store the authenticated user's stable staff ID.

At sync:

```text
server verifies user
+
permission
+
ownership
```

Do not trust local storage values blindly.

---

# 28. Duplicate Detection Offline

Offline duplicate detection has limits.

The device may know only:

```text
records previously downloaded
+
records captured locally
```

Therefore:

```text
Offline duplicate check
```

should be described as:

```text
Possible duplicate
```

not absolute truth.

When the record reaches the server, perform authoritative duplicate detection.

---

# 29. Conflict Handling

Conflicts may occur.

Example:

```text
Phone A edits lead offline
Phone B edits same lead online
```

Do not silently destroy information.

Initial conflict strategy:

```text
Server authoritative for conflicting updates
+
preserve conflict metadata
```

or implement a clear last-write-wins strategy only where appropriate.

Document the strategy.

Do not invent complicated CRDT synchronization unless genuinely needed.

---

# 30. Create Conflicts

For offline lead creation:

Prefer idempotent creation using the stable UUID.

If the server already has:

```text
entity_id = X
```

do not create another record.

Return the existing record/result.

---

# 31. Update Conflicts

For updates, use:

```text
updated_at
```

or a version field.

Recommended:

```text
version
```

if practical.

Example:

```text
Server version: 4
Offline client version: 3
```

Server can detect stale updates.

---

# 32. Conflict UI

If a conflict requires human attention:

```text
⚠ Sync conflict

John Doe was changed elsewhere.

[Review]
```

Do not simply erase the local version.

---

# 33. Sync History

Keep lightweight metadata:

```text
last_sync_at
last_successful_sync_at
pending_count
failed_count
```

Do not retain unlimited synchronization history on the device.

---

# 34. Local Data Cleanup

After successful synchronization:

```text
synced local record
```

may remain temporarily for usability.

Implement a reasonable cleanup policy.

Do not delete data immediately if doing so could cause duplicate re-submission.

---

# 35. Offline Field Lead List

When offline, Field Leads should display available local records.

Example:

```text
My Field Leads

John Doe
Work Abroad
✓ Synced

Mary Example
Visa
⏳ Pending Sync

Peter Okello
Tourism
⚠ Sync Failed
```

This should make offline work understandable.

---

# 36. Offline Follow-Up Updates

Allow limited offline updates to follow-ups.

Examples:

```text
Complete follow-up
Reschedule follow-up
Add operational note
```

Queue these changes.

Do not expose every registry operation offline in Phase 8.

---

# 37. Sync Ordering

Where operations depend on each other, preserve ordering.

Example:

```text
Create Lead
   ↓
Update Lead
```

must not sync as:

```text
Update
   ↓
Create
```

Queue operations should maintain dependency ordering.

---

# 38. Failed Sync UI

For a failed item:

```text
⚠ Could not sync
Reason: Server unavailable

[Retry]
```

Do not expose raw technical errors.

---

# 39. Permanent Failure

If an operation fails because the data itself is invalid:

```text
Invalid service
Invalid permission
Record no longer exists
```

do not retry forever.

Move it to:

```text
failed
```

and tell the user what action is required.

---

# 40. Background Sync

If browser support allows it, consider:

```text
Background Sync API
```

But it is optional.

Do not make the application dependent on Background Sync because browser support varies.

The application must also sync through:

```text
app startup
connection restoration
manual sync
```

---

# 41. Service Worker Safety

Never allow the service worker to cache:

```text
Supabase service-role keys
Auth secrets
Private tokens
Sensitive API responses
```

Cache only safe application assets and explicitly designed offline data.

---

# 42. Cache Versioning

Implement cache versions:

```text
lil-tours-static-v1
```

or an equivalent strategy.

When assets change:

```text
new cache
 ↓
activate
 ↓
remove obsolete cache
```

Avoid stale application bundles.

---

# 43. PWA Update UX

If a new version is available:

```text
New version available.

[Update]
```

Do not force-refresh while a field marketer is entering a lead.

Protect unsaved form data.

---

# 44. Form Draft Protection

If the user accidentally:

- closes the page
- switches tabs
- loses connection
- reloads

do not unnecessarily lose a partially completed field lead.

A temporary local draft may be stored.

Example:

```text
Draft saved locally
```

Allow:

```text
Resume draft
Discard draft
```

Do not retain drafts forever.

---

# 45. Mobile Performance

Optimize for low-end Android devices.

Avoid:

- Huge JavaScript bundles
- Heavy animations in the registry
- Excessive IndexedDB writes
- Constant network polling
- Large cached assets

The public Earth animation should not be loaded unnecessarily inside field workflows.

---

# 46. Data Usage

Field marketers may have limited mobile data.

Optimize synchronization:

- Send only pending records.
- Do not repeatedly download unchanged data.
- Use timestamps/versioning.
- Paginate server data.
- Avoid large responses.

---

# 47. Sync Batching

Where practical, synchronize multiple operations in controlled batches.

Example:

```text
10 pending records
       ↓
sync batch
       ↓
server
       ↓
individual results
```

The server must return per-operation results so one failed item does not hide successful operations.

---

# 48. Sync Result

Conceptual response:

```text
{
  synced: [],
  failed: [],
  conflicts: []
}
```

Every operation should have a recognizable ID.

---

# 49. Server Validation

Never trust offline payloads.

The server must validate:

```text
schema
permissions
ownership
service
status
timestamps
IDs
```

The database remains authoritative.

---

# 50. Supabase Integration

Use the existing Supabase architecture.

Do not expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

If server-side privileged operations are required, keep them server-side.

Respect RLS and application authorization.

---

# 51. RLS

Review RLS after introducing sync.

Ensure:

```text
Anonymous → no registry access
Authenticated unauthorized → blocked
Field marketer → own authorized records
Supervisor → appropriate team records
Admin → authorized full access
```

The sync endpoint must not become a way around RLS/security.

---

# 52. Offline Security

IndexedDB is not a secure vault.

Do not store unnecessary sensitive information offline.

Prefer storing only what the field workflow requires.

Do not store:

```text
passwords
service-role keys
long-lived privileged tokens
```

If a device is shared or lost, local data may be exposed.

Document this limitation.

---

# 53. Device Logout

When the user logs out:

Consider clearing:

```text
authentication-specific offline data
```

especially if another person may use the device.

Do not blindly delete unsynchronized work.

Instead:

```text
Unsynced records detected.

Please sync before logout if possible.
```

If logout must proceed, clearly explain what remains on-device and protect it from other users where feasible.

---

# 54. Multiple Users on One Device

Prevent user A from seeing user B's private offline records.

Offline storage must be scoped by:

```text
authenticated staff ID
```

Example:

```text
offline record
staff_id = X
```

When another user signs in:

```text
only their offline workspace is shown
```

---

# 55. Offline Data Expiration

Implement a reasonable retention policy.

Example:

```text
Synced records:
cleanup after configured period

Unsynced records:
never automatically delete
```

Do not silently delete work that has not synchronized.

---

# 56. Offline Storage Limits

Handle storage errors gracefully.

If IndexedDB cannot save:

```text
Unable to save offline data on this device.
Please reconnect and try again.
```

Do not pretend the lead was saved.

---

# 57. Network Recovery

When connection returns:

```text
OFFLINE
   ↓
ONLINE DETECTED
   ↓
CHECK SERVER
   ↓
SYNC
   ↓
UPDATE UI
```

If server is still unreachable:

```text
remain pending
retry later
```

---

# 58. Offline Testing

Test with browser DevTools:

```text
Offline
Slow 3G
Fast 3G
Online
```

Test on actual mobile devices where possible.

---

# 59. Required End-to-End Offline Test

Perform:

```text
1. Login while online.
2. Open Field Leads.
3. Disconnect internet.
4. Create a field lead.
5. Confirm it appears immediately.
6. Confirm it is marked Pending Sync.
7. Close/reopen the app if practical.
8. Confirm the record remains.
9. Restore internet.
10. Trigger automatic sync.
11. Confirm server receives the lead.
12. Confirm record becomes Synced.
13. Confirm no duplicate lead was created.
```

---

# 60. Offline Update Test

Perform:

```text
1. Existing lead is available.
2. Disconnect internet.
3. Update lead/follow-up.
4. Confirm local update.
5. Confirm Pending Sync.
6. Restore connection.
7. Synchronize.
8. Confirm server update.
```

---

# 61. Failure Test

Simulate:

```text
Server unavailable
Invalid payload
Expired session
Permission denied
Duplicate operation
Conflict
```

Confirm the app:

- Does not lose data.
- Does not create duplicates.
- Gives understandable feedback.
- Stops retrying permanent failures.
- Allows recovery where possible.

---

# 62. Mobile Testing

Test:

```text
320px
360px
375px
390px
414px
768px
```

Ensure:

- Offline banner fits.
- Sync controls fit.
- Forms remain usable.
- No horizontal overflow.
- Touch targets are large enough.
- Status indicators are readable.

---

# 63. Accessibility

Maintain:

- Keyboard support
- Screen-reader labels
- Focus states
- Accessible status messages
- Non-color status indicators
- Accessible dialogs

For example:

```text
✓ Synced
⏳ Pending
⚠ Failed
```

---

# 64. Performance Testing

Measure or inspect:

- Initial load
- PWA installation
- Offline startup
- IndexedDB operations
- Sync duration
- Large pending queues

Test with at least:

```text
1 record
10 records
50 records
100 records
```

Do not optimize for thousands of offline records unless necessary.

---

# 65. Observability

Add safe development logging for:

```text
sync started
sync completed
sync failed
conflict detected
```

Do not log:

```text
passwords
tokens
private secrets
unnecessary personal information
```

Production logging should be controlled.

---

# 66. Database Changes

Only add migrations that are genuinely required.

Potential server additions:

```text
sync_operation_id
version
updated_at
```

or equivalent.

Do not duplicate existing fields.

---

# 67. Idempotency Storage

If a server-side idempotency table is appropriate, it may contain:

```text
operation_id
user_id
operation_type
entity_id
processed_at
result
```

Use it only where necessary.

Keep the design simple.

---

# 68. Sync API Security

The sync endpoint must:

- Require authentication.
- Validate operation types.
- Validate entity types.
- Validate payload schemas.
- Check permissions.
- Check ownership.
- Reject unsupported operations.
- Rate-limit abusive requests where practical.

Never expose:

```text
arbitrary table mutation
```

---

# 69. No Arbitrary Sync API

This is prohibited:

```text
POST /api/sync

{
  table: "whatever",
  action: "delete",
  data: "anything"
}
```

Instead use explicit supported operations:

```text
CREATE_FIELD_LEAD
UPDATE_FIELD_LEAD
UPDATE_FOLLOWUP
```

---

# 70. Future Extensibility

Design the sync engine so future phases can support:

```text
Clients
Enquiries
Follow-Ups
Documents
Visits
Marketing activities
```

But only implement Phase 8 entities now.

---

# 71. Offline Architecture Documentation

Create:

```text
docs/OFFLINE-ARCHITECTURE.md
```

Document:

- Local database
- Queue
- Sync process
- Authentication
- Permissions
- Conflict strategy
- Retry strategy
- Data retention
- Security limitations

Include a diagram:

```text
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

---

# 72. Developer Documentation

Document:

```text
How offline storage works
How to add a new syncable entity
How to test offline mode
How conflicts are handled
How to clear development data
How to inspect IndexedDB
```

---

# 73. Environment Variables

Review environment configuration.

Never put privileged keys into:

```text
NEXT_PUBLIC_*
```

Do not expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to browser JavaScript.

---

# 74. Build & Deployment

The production deployment must support:

```text
HTTPS
Service Worker
Manifest
IndexedDB
```

Test on the actual deployed domain.

PWA features generally require a secure context.

---

# 75. Existing Website Protection

The public Lil Tours website must remain functional.

Confirm:

```text
Home
Services
Earth animation
Enquiry
WhatsApp
Responsive layout
```

still work.

Do not allow the new service worker to break the public website.

---

# 76. Existing Registry Protection

Confirm Phase 5 and 6 remain functional:

```text
Login
Dashboard
Clients
Enquiries
Field Leads
Follow-Ups
Permissions
```

No regressions.

---

# 77. Final Acceptance Criteria

Phase 8 is complete when:

- Registry is installable as a PWA.
- App shell can load offline.
- IndexedDB is implemented.
- Field leads can be created offline.
- Offline records survive page reload.
- Offline records appear in local lists.
- Sync queue works.
- Automatic synchronization works.
- Manual synchronization works.
- Retry/backoff works.
- Duplicate sync does not create duplicate leads.
- Follow-up updates can synchronize where implemented.
- Authentication remains secure.
- Permissions remain enforced.
- RLS remains secure.
- Server validates offline payloads.
- Conflicts are detected/handled.
- Failed operations are visible.
- Unsynced data is not silently deleted.
- Multiple users on one device are isolated.
- No passwords/secrets are stored locally.
- Public website still works.
- Registry still works online.
- Mobile experience is excellent.
- Offline workflow works on real mobile devices where possible.
- Tests pass.

---

# 78. Completion Report

Provide a detailed report containing:

1. PWA implementation.
2. Manifest.
3. Service worker.
4. IndexedDB implementation.
5. Local schema.
6. Sync queue.
7. Sync API.
8. Offline lead creation.
9. Offline follow-up updates.
10. Automatic synchronization.
11. Manual synchronization.
12. Retry strategy.
13. Idempotency strategy.
14. Conflict strategy.
15. Authentication behavior offline.
16. Permission enforcement.
17. RLS/security.
18. Multi-user device isolation.
19. Data retention.
20. Offline architecture documentation.
21. Testing performed.
22. Mobile testing results.
23. Deployment considerations.
24. Files changed.
25. Database migrations.
26. Dependencies added.
27. Known limitations.
28. Recommended Phase 9.

---

# FINAL INSTRUCTION

Implement **Phase 8 only**.

Preserve all existing work.

The main objective is:

```text
FIELD MARKETER
      │
      ▼
   MOBILE PWA
      │
      ├────────────── ONLINE ──────────────┐
      │                                    │
      ▼                                    ▼
   SUPABASE                            REGISTRY
      │
      │
      └──────────── OFFLINE ──────────────┐
                                          ▼
                                      IndexedDB
                                          │
                                      Sync Queue
                                          │
                                   Internet Returns
                                          │
                                          ▼
                                      Sync API
                                          │
                                          ▼
                                      Supabase
```

The field worker should be able to continue working even when connectivity disappears.

Most importantly:

**Never sacrifice data integrity or security for offline convenience.**

The system must clearly distinguish:

```text
Saved locally
```

from:

```text
Successfully synchronized
```

and must never silently lose a field marketer's captured lead.
