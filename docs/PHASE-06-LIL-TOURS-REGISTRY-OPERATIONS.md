# LIL TOURS & TRAVEL — PHASE 6
# Client Registry Operations, Enquiry Management & Daily Workflow

## Project Context

Completed:

- Phase 1 — Project foundation
- Phase 2 — Public Lil Tours website
- Phase 2 Earth Add-on — Interactive Earth animation
- Phase 3 — Service discovery, enquiry form and WhatsApp conversion
- Phase 4 — Supabase/PostgreSQL registry foundation
- Phase 5 — Supabase Auth, staff roles, permissions and protected registry shell

The internal registry now needs to become useful for daily company operations.

This phase focuses on:

```text
Clients
Enquiries
Search
Filtering
Client registration
Client editing
Enquiry management
Status workflow
Notes
Staff workflow
```

---

# IMPORTANT SCOPE

Implement **Phase 6 only**.

Do NOT rebuild the public website.

Do NOT redesign the Earth animation.

Do NOT implement field marketing yet.

Do NOT implement offline synchronization yet.

Do NOT implement advanced analytics yet.

Do NOT implement payroll/accounting.

Do NOT implement a full enterprise CRM.

Do NOT start Phase 7.

Build a practical registry that staff can actually use every day.

---

# 1. Inspect Existing System

Before coding, inspect:

```text
website/
app/
src/
supabase/
docs/
package.json
```

Use the actual project structure.

Read the Phase 4 and Phase 5 implementation and reuse:

- Supabase connection
- Auth/session handling
- Staff profile model
- Roles
- Permissions
- RLS
- Existing registry layout

Do not duplicate existing infrastructure.

---

# 2. Registry Navigation

The internal navigation should now prioritize operational modules.

Core navigation:

```text
Dashboard
Clients
Enquiries
```

Future placeholders may include:

```text
Field Leads
Follow-ups
Reports
Staff
Settings
```

Only show modules that the current user's permissions allow.

---

# 3. Clients Module

Turn:

```text
/registry/clients
```

into a functional client registry.

The page should support:

- List clients
- Search
- Filtering
- View client
- Add client
- Edit client

---

# 4. Client List

Display useful columns:

```text
Client
Phone
Email
District
Enquiries
Created
Status
Actions
```

Avoid unnecessary personal information.

For mobile, transform rows into cards where appropriate.

Example:

```text
┌──────────────────────────────┐
│ John Doe                     │
│ +256 7XX XXX XXX             │
│ Gulu                         │
│ 3 enquiries                  │
│                              │
│ [ View ] [ Edit ]            │
└──────────────────────────────┘
```

---

# 5. Client Search

Implement fast search.

Search should support:

- Full name
- Phone
- Email
- District

Search should debounce where appropriate.

Do not make a database request on every individual keystroke if it can be avoided.

---

# 6. Client Filters

Provide useful filters such as:

```text
District
Created date
Service interest
```

Service-interest filtering may use related enquiries.

Avoid excessive filters.

---

# 7. Client Pagination

Do not load thousands of clients at once.

Implement server-side pagination or a scalable equivalent.

Example:

```text
Showing 1–25 of 328 clients

[ Previous ] [ 1 ] [ 2 ] [ 3 ] [ Next ]
```

Use an appropriate database query strategy.

---

# 8. Add Client

Create:

```text
/registry/clients/new
```

or an appropriate modal/drawer.

Fields:

### Required

```text
Full Name
Phone
```

### Optional

```text
Email
District
Date of Birth
```

Date of birth should not be required for ordinary client creation unless there is a clear operational reason.

Do not request national ID, passport number, passwords, bank details or unnecessary sensitive information.

---

# 9. Client Creation Logic

When a staff member creates a client:

1. Validate input.
2. Normalize phone.
3. Check for an existing client.
4. If a matching client exists, prevent accidental duplicate creation.
5. Clearly inform the staff member.
6. Otherwise create the client.

Do not match people using name alone.

---

# 10. Edit Client

Allow authorized staff to update permitted client information.

Fields:

```text
Full Name
Phone
Email
District
Date of Birth
```

Every update must be authorized server-side.

Do not allow a user to bypass permissions by manually calling the endpoint.

---

# 11. Client Detail

Create a useful client detail view:

```text
Client Profile
────────────────────────────
Name
Phone
Email
District
Date of Birth
Created
Updated

Enquiries
────────────────────────────
Service
Destination
Status
Date
```

The client page should become the central place where staff can understand the customer's relationship with Lil Tours.

---

# 12. Enquiry History

A client may have many enquiries.

Example:

```text
CLIENT
John Doe
     │
     ├── Visa enquiry
     ├── Air ticket enquiry
     └── Hotel enquiry
```

Show these chronologically.

Newest first is preferred.

---

# 13. Enquiries Module

Turn:

```text
/registry/enquiries
```

into a functional operational queue.

Display:

```text
Client
Service
Destination
Status
Source
Created
Assigned staff
Actions
```

If assignment is not yet supported by the existing schema, prepare the UI but do not fabricate assignment data.

---

# 14. Enquiry Status Workflow

Use:

```text
new
contacted
in_progress
completed
cancelled
```

Suggested workflow:

```text
NEW
 ↓
CONTACTED
 ↓
IN PROGRESS
 ↓
COMPLETED
```

Alternative:

```text
NEW → CANCELLED
```

should also be possible when appropriate.

Do not allow random status values.

---

# 15. Status Updates

Authorized staff should be able to update enquiry status.

Use a clear UI:

```text
Status:
[ New ▼ ]
```

or a suitable action menu.

Show confirmation where an action is consequential.

---

# 16. Enquiry Search

Search by:

```text
Client name
Phone
Service
Destination
```

Use server-side searching where appropriate.

---

# 17. Enquiry Filters

Useful filters:

```text
Status
Service
Source
Date range
```

Do not create unnecessary filters.

---

# 18. Enquiry Pagination

Use scalable pagination.

Do not load the complete enquiry history into the browser if the company eventually has thousands of records.

---

# 19. Enquiry Detail

Create:

```text
/registry/enquiries/[id]
```

or equivalent.

Display:

```text
Client
Service
Destination
Preferred date
Status
Source
Notes
Created
Updated
```

Also display service-specific details from the existing structured `details` field where appropriate.

---

# 20. Notes

Staff should be able to add operational notes to an enquiry if the current schema supports it.

If the existing `notes` field is a single text field, do NOT invent a complex notes history unless required.

A future phase can introduce:

```text
enquiry_notes
```

with:

```text
author
timestamp
note
```

For this phase, keep the existing schema intact unless a small, justified migration is required.

---

# 21. Website Enquiries

Website enquiries should appear naturally in the registry.

Example:

```text
Website visitor
     ↓
Phase 3 enquiry
     ↓
API
     ↓
Supabase
     ↓
Registry
     ↓
Staff sees NEW
```

Source should show:

```text
Website
```

Do not manually recreate website enquiries.

---

# 22. Manual Enquiry Creation

Allow authorized staff to create an enquiry manually.

Useful when:

- A client calls
- A client visits the office
- A WhatsApp conversation occurs
- A staff member receives a referral

Example:

```text
New Enquiry

Client: [Select existing client]
Service: [Visa Assistance]
Destination: [United Kingdom]
Preferred date: [...]
Notes: [...]
Source: [Phone / WhatsApp / Walk-in / Referral]
```

If the client doesn't exist:

```text
[ + Create Client ]
```

then continue creating the enquiry.

---

# 23. Service Dropdown

Use the stable internal service values already established:

```text
tourism
work_abroad
visa
passport
air_ticket
hotel
airbnb
car_hire
delivery
consultancy
```

Display human-friendly names.

Do not create spelling variants.

---

# 24. Source Dropdown

Use:

```text
website
whatsapp
field_marketing
referral
social_media
walk_in
other
```

Display:

```text
Website
WhatsApp
Field Marketing
Referral
Social Media
Walk-in
Other
```

---

# 25. Permissions

Respect Phase 5 permissions.

Examples:

### Administrator

Can:

- View clients
- Create clients
- Edit clients
- View enquiries
- Create enquiries
- Update enquiries

### Supervisor

Can:

- View clients
- Create/edit clients
- View enquiries
- Create/update enquiries

### Data Entrant

Can:

- View clients
- Create clients
- Edit clients
- View enquiries
- Create enquiries

### Field Marketer

Do not expose Clients/Enquiries functionality unless the user's Phase 5 permissions explicitly allow it.

Field-marketing operations belong to a later phase.

---

# 26. Server Authorization

Every mutation must verify authorization server-side.

Required for:

```text
Create client
Update client
Create enquiry
Update enquiry
```

Never trust:

```javascript
role === "admin"
```

from browser-submitted data.

Derive the authenticated staff identity from the secure session.

---

# 27. RLS

Review existing Supabase RLS policies.

Ensure:

- Anonymous users cannot read registry records.
- Anonymous users cannot modify registry records.
- Authenticated staff access is permission-aware.
- Users cannot bypass application authorization by querying Supabase directly.

If Phase 5 policies need correction, fix them as part of this phase.

---

# 28. API Design

Use clear server/API operations.

Conceptually:

```text
GET    /api/registry/clients
POST   /api/registry/clients
GET    /api/registry/clients/:id
PATCH  /api/registry/clients/:id

GET    /api/registry/enquiries
POST   /api/registry/enquiries
GET    /api/registry/enquiries/:id
PATCH  /api/registry/enquiries/:id
```

Adapt these to the actual Next.js architecture.

Do not create duplicate endpoints if equivalent ones already exist.

---

# 29. Validation

Validate on both:

```text
Frontend
+
Server
```

Client:

- Name
- Phone
- Email
- District
- Service
- Status
- Dates
- Notes

Server must remain authoritative.

---

# 30. Phone Normalization

Normalize phone numbers consistently.

The company operates in Uganda, so support normal Ugandan formats.

Examples that may represent the same number:

```text
0772XXXXXX
+256772XXXXXX
256772XXXXXX
```

Normalize into one internal format.

Do not accidentally corrupt international numbers.

Design the normalization utility so other countries can be supported later.

---

# 31. Empty States

Do not show broken blank pages.

Examples:

```text
No clients yet.

Clients added through the website or registry
will appear here.
```

For enquiries:

```text
No enquiries found.

Try changing your filters or create a new enquiry.
```

---

# 32. Loading States

Use proper loading indicators/skeletons.

Avoid:

```text
Loading...
```

as the only experience for every component.

---

# 33. Error States

Examples:

```text
Unable to load clients.
Please try again.
```

Do not expose SQL/Supabase errors.

For mutations:

```text
Client could not be updated.
Please try again.
```

---

# 34. Confirmation Dialogs

For destructive or potentially consequential actions:

```text
Cancel enquiry?
```

Require confirmation.

Do NOT add hard-delete functionality unless explicitly required.

Prefer status-based lifecycle management.

---

# 35. No Hard Delete by Default

Do not add:

```text
DELETE client
DELETE enquiry
```

as normal user functionality.

Client data may be important to the business.

Future phases can implement controlled archival/deletion policies if required.

---

# 36. Dashboard Improvements

Use real database information where easy and secure.

Useful initial cards:

```text
Total Clients
New Enquiries
Open Enquiries
Completed Enquiries
```

These must be calculated from actual database records.

Optional:

```text
New enquiries today
```

Do not build advanced charts yet.

---

# 37. Recent Activity

The dashboard may display:

```text
Recent enquiries
```

Example:

```text
Visa Assistance
John Doe
Today, 10:42

Car Hire
Mary Example
Today, 09:15
```

Use actual records.

---

# 38. Mobile Registry

The registry must be excellent on phones.

At:

```text
320px
360px
375px
390px
414px
```

ensure:

- No page overflow
- Forms fit
- Buttons are tappable
- Search is usable
- Filters don't destroy layout
- Client cards are readable
- Enquiry cards are readable

On desktop:

```text
1024px+
```

use tables/layouts where beneficial.

---

# 39. Accessibility

Maintain:

- Labels
- Keyboard support
- Focus states
- Accessible dialogs
- Screen-reader-friendly controls
- Color-independent status indicators

Do not communicate status using color alone.

For example:

```text
● NEW
● IN PROGRESS
✓ COMPLETED
```

---

# 40. Performance

Use:

- Server-side pagination
- Indexed search fields where appropriate
- Debounced search
- Limited result sets
- Efficient Supabase queries

Do not fetch unnecessary columns.

---

# 41. Security / Privacy

Do not expose:

- Auth tokens
- Service-role key
- Internal database secrets
- Unnecessary client information

Avoid putting client information in URLs beyond the necessary record ID.

Do not expose client lists publicly.

---

# 42. Audit Preparation

For future audit functionality, structure mutations so the authenticated staff identity is available.

Future system should support:

```text
Who created this?
Who changed this?
When?
```

Do not implement a full audit system unless already simple.

---

# 43. Testing

Test Clients:

- Create
- Duplicate detection
- Search
- Filter
- Pagination
- View
- Edit
- Unauthorized access

Test Enquiries:

- Create
- Search
- Filter
- Pagination
- View
- Status update
- Manual creation
- Unauthorized mutation

Test Website:

```text
Website enquiry
 ↓
API
 ↓
Supabase
 ↓
Registry
```

Confirm the real enquiry appears in the registry.

Test mobile and desktop.

Test browser console for errors.

---

# 44. Data Integrity Tests

Confirm:

```text
One client
   ↓
Multiple enquiries
```

works correctly.

Confirm:

```text
Existing client
   ↓
New enquiry
```

does not duplicate the client.

Confirm invalid foreign keys are rejected.

---

# 45. Final Acceptance Criteria

Phase 6 is complete when:

- Clients page is functional.
- Client creation works.
- Client editing works.
- Duplicate client protection works.
- Client search works.
- Client filtering works.
- Client pagination works.
- Client detail works.
- Enquiries page is functional.
- Enquiry creation works.
- Manual enquiry creation works.
- Enquiry search works.
- Enquiry filtering works.
- Enquiry pagination works.
- Enquiry detail works.
- Enquiry status updates work.
- Website enquiries appear in the registry.
- Role/permission enforcement works.
- RLS remains secure.
- No hard delete is exposed by default.
- Dashboard uses real data where implemented.
- Mobile registry works.
- Public website still works.
- No secrets are exposed.
- Tests pass.

---

# 46. Completion Report

Report:

1. Client module implementation.
2. Client creation/editing.
3. Duplicate detection.
4. Client search/filter/pagination.
5. Client detail.
6. Enquiry module.
7. Manual enquiry creation.
8. Enquiry search/filter/pagination.
9. Enquiry detail.
10. Status workflow.
11. Website-to-registry flow.
12. Permissions.
13. RLS/security.
14. Dashboard real-data additions.
15. Mobile responsiveness.
16. Tests performed and results.
17. Files changed.
18. Database migrations, if any.
19. Remaining limitations.
20. Recommended Phase 7.

---

# FINAL INSTRUCTION

Implement **Phase 6 only**.

Do not rebuild the public Lil Tours website.

Do not implement field marketing yet.

Do not implement offline synchronization yet.

Do not implement advanced analytics.

Do not implement a full enterprise CRM.

Do not start Phase 7.

The goal is to make the registry genuinely useful for the company's daily work:

```text
                LIL TOURS REGISTRY
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          CLIENTS            ENQUIRIES
             │                   │
       Search / Filter      Search / Filter
       Create / Edit        Create / Update
             │                   │
             └─────────┬─────────┘
                       ▼
                 CLIENT HISTORY
                       │
                       ▼
                 STAFF WORKFLOW
```

Build it cleanly because the next major stage will introduce **field marketing, lead capture, follow-ups and the offline-first engine**.
