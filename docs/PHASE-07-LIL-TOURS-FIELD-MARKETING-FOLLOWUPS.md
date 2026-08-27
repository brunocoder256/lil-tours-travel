# LIL TOURS & TRAVEL — PHASE 7
# Field Marketing, Lead Capture, Follow-Ups & Offline-Ready Foundation

## Project Context

Completed:

- Phase 1 — Project foundation
- Phase 2 — Public Lil Tours website
- Phase 2 Earth Add-on — Interactive Earth animation
- Phase 3 — Service discovery, enquiry form and WhatsApp conversion
- Phase 4 — Supabase/PostgreSQL registry foundation
- Phase 5 — Supabase Auth, staff roles, permissions and protected registry shell
- Phase 6 — Client registry operations and enquiry management

Lil Tours & Travel operates across services including:

- Tourism
- Work Abroad
- Hire Car Services
- Passport Assistance
- Visa Assistance
- Air Tickets
- Hotel Reservations
- Airbnb
- Delivery Services
- Consultancy

The next requirement is to support clients and potential clients discovered **outside the public website**, especially through field marketing.

Examples:

```text
Field marketer meets person
        ↓
Collects basic information
        ↓
Records service interest
        ↓
Adds notes
        ↓
Creates lead
        ↓
Lead appears in registry
        ↓
Supervisor reviews
        ↓
Follow-up
        ↓
Lead becomes client/enquiry
```

This phase establishes the field-marketing and follow-up workflow while preparing the system for the future offline-first PWA.

---

# IMPORTANT SCOPE

Implement **Phase 7 only**.

Do NOT rebuild the public website.

Do NOT redesign the Earth animation.

Do NOT rebuild Phase 5 authentication.

Do NOT rebuild Phase 6 Clients/Enquiries.

Do NOT implement advanced analytics.

Do NOT implement payroll/accounting.

Do NOT implement a full enterprise CRM.

Do NOT start Phase 8.

Offline functionality must be prepared carefully, but the full synchronization engine is a future phase unless the existing architecture makes a small offline foundation necessary.

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

Read the Phase 4–6 implementation.

Reuse:

- Supabase client
- Authentication
- Staff profiles
- Roles
- Permissions
- RLS
- Registry layout
- Client model
- Enquiry model
- Existing service definitions
- Existing API patterns

Do not duplicate infrastructure.

---

# 2. New Concept: Field Lead

Introduce a **field lead** record.

A field lead represents a potential customer discovered through marketing or outreach.

Example:

```text
FIELD LEAD
──────────────
John Doe
+256 772 XXX XXX
Gulu
Interested in:
Work Abroad

Collected by:
Bruno

Date:
27 Aug 2026

Notes:
Interested in opportunities in Europe.
Requested a follow-up next week.
```

The field lead is not automatically a confirmed client.

---

# 3. Field Lead Lifecycle

Use a controlled lifecycle:

```text
new
contacted
interested
follow_up
converted
not_interested
lost
```

Recommended flow:

```text
NEW
 ↓
CONTACTED
 ↓
INTERESTED
 ↓
FOLLOW-UP
 ↓
CONVERTED
```

Alternative:

```text
NEW → NOT INTERESTED
NEW → LOST
FOLLOW-UP → LOST
```

Do not allow arbitrary status strings.

---

# 4. Field Lead Database Model

Create a table/model suitable for the existing Supabase architecture.

Suggested fields:

```text
id
full_name
phone
email
district
date_of_birth
service_interest
notes
status
source
created_by
assigned_to
created_at
updated_at
last_contacted_at
next_follow_up_at
converted_client_id
```

Not every field must be mandatory.

Important:

```text
created_by
```

must identify the staff member who captured the lead.

```text
assigned_to
```

may identify the supervisor/staff member responsible for follow-up.

```text
converted_client_id
```

should be nullable.

Do not duplicate client records unnecessarily.

---

# 5. Privacy / Data Minimization

Only collect information necessary for business follow-up.

Recommended:

```text
Full name
Phone
Email
District
Date of birth (only when genuinely needed)
Service interest
Notes
```

Do NOT collect unnecessary:

```text
Passwords
Bank details
Credit card details
Unnecessary identity documents
Sensitive personal information
```

Passport/visa information may become necessary in future service-specific workflows, but do not create broad document collection in this phase.

---

# 6. Field Lead Sources

Create controlled source values:

```text
field_marketing
office_visit
referral
event
social_media
phone
whatsapp
other
```

Display friendly labels:

```text
Field Marketing
Office Visit
Referral
Event
Social Media
Phone
WhatsApp
Other
```

---

# 7. Field Marketing Module

Create a protected route:

```text
/registry/field-leads
```

It should be accessible only to authorized staff.

Initial views:

```text
All Leads
My Leads
Follow-Ups
```

If role permissions do not yet support these distinctions, extend them carefully.

---

# 8. Field Lead List

Display:

```text
Lead
Phone
District
Service
Status
Created By
Next Follow-Up
Created
Actions
```

Use mobile cards on small screens.

Example:

```text
┌──────────────────────────────┐
│ John Doe                     │
│ +256 772 XXX XXX             │
│ Gulu                         │
│ Work Abroad                  │
│ FOLLOW-UP                    │
│                              │
│ Next: 02 Sep 2026            │
│                              │
│ [View] [Follow Up]           │
└──────────────────────────────┘
```

---

# 9. Lead Search

Search by:

```text
Name
Phone
Email
District
```

Use debouncing and server-side search where appropriate.

Do not query the entire database on every keystroke.

---

# 10. Lead Filters

Useful filters:

```text
Status
Service
District
Source
Created By
Assigned To
Follow-Up Date
```

Do not make filters unnecessarily complicated.

---

# 11. Lead Pagination

Use server-side pagination.

Never load all field leads into the browser.

---

# 12. Create Field Lead

Create:

```text
/registry/field-leads/new
```

or an appropriate drawer/modal.

Fields:

```text
Full Name *
Phone *
Email
District
Date of Birth
Service Interest *
Source *
Notes
Next Follow-Up
```

The system should automatically set:

```text
created_by = authenticated staff member
status = new
created_at = current time
```

Do not allow users to submit another user's identity as `created_by`.

---

# 13. Duplicate Lead Detection

Before creating a lead:

1. Normalize the phone number.
2. Search existing clients.
3. Search existing active leads.
4. Warn the staff member if a likely match exists.

Example:

```text
Possible existing person found.

John Doe
+256 772 XXX XXX
Existing client

[Open Client] [Cancel]
```

Do not rely on name alone.

Avoid automatically merging records without staff confirmation.

---

# 14. Existing Client Detection

If a field marketer meets someone who is already a client:

```text
Field lead capture
        ↓
Existing client found
        ↓
Create a new enquiry/follow-up
```

Do not create a duplicate client.

Provide a clear path to the existing client.

---

# 15. Lead Detail

Create:

```text
/registry/field-leads/[id]
```

Display:

```text
Lead Profile
─────────────
Name
Phone
Email
District
Service Interest
Source
Status
Created By
Assigned To
Created
Updated

Notes
─────────────

Follow-Up
─────────────
Next Follow-Up
Last Contacted

Conversion
─────────────
Client / Not Converted
```

---

# 16. Lead Notes

Allow authorized staff to update operational notes.

Keep the first version simple.

If the current schema uses a single notes field, use it.

Do not create a complex CRM notes system unless necessary.

A future phase may introduce:

```text
lead_interactions
```

with:

```text
author
type
note
timestamp
```

---

# 17. Follow-Up System

This phase should introduce practical follow-ups.

A follow-up should contain:

```text
Lead
Assigned staff
Due date
Status
Note
```

If appropriate, represent the first follow-up using:

```text
next_follow_up_at
```

on the lead.

Avoid building an oversized task-management system.

---

# 18. Follow-Up Status

Use:

```text
pending
completed
missed
cancelled
```

Display friendly names:

```text
Pending
Completed
Missed
Cancelled
```

---

# 19. Follow-Up Dashboard

Create a useful page or dashboard section:

```text
Today's Follow-Ups
Upcoming Follow-Ups
Overdue Follow-Ups
```

Example:

```text
TODAY
────────────
John Doe
Work Abroad
10:30 AM
[Open]

Mary Example
Visa Assistance
2:00 PM
[Open]
```

---

# 20. Follow-Up Actions

Authorized staff should be able to:

```text
Complete
Reschedule
Cancel
```

When completing a follow-up:

```text
Outcome / Note
```

may be recorded.

Do not create arbitrary statuses.

---

# 21. Overdue Follow-Ups

A follow-up is overdue when:

```text
next_follow_up_at < current time
```

and it is not completed/cancelled.

Clearly identify overdue items.

Do not rely only on red color.

Example:

```text
OVERDUE
John Doe
Follow-up was due yesterday.
```

---

# 22. Lead Assignment

Supervisors/admins may assign leads to staff.

Example:

```text
Assigned to:
[ Staff Member ▼ ]
```

Field marketers should normally see their own captured leads unless their permissions explicitly allow broader access.

Supervisors should be able to see team leads.

Admins should have full access.

---

# 23. Role Permissions

Extend the Phase 5 permission system.

Suggested permissions:

```text
field_leads.view
field_leads.create
field_leads.update
field_leads.assign
field_leads.view_all
followups.view
followups.create
followups.update
```

Suggested mapping:

### Administrator

Full field lead/follow-up access.

### Supervisor

```text
field_leads.view
field_leads.create
field_leads.update
field_leads.assign
field_leads.view_all
followups.view
followups.create
followups.update
```

### Field Marketer

```text
field_leads.view
field_leads.create
field_leads.update
followups.view
followups.create
followups.update
```

But enforce ownership/team visibility:

```text
Field marketer
→ own leads by default
```

### Data Entrant

Do not automatically give field-marketing permissions unless the business workflow requires it.

---

# 24. Ownership Rules

A field marketer should not automatically have access to every company's lead.

Implement sensible visibility:

```text
Admin
→ all leads

Supervisor
→ team/all authorized leads

Field Marketer
→ own leads
```

Adapt this to the existing staff structure.

Do not rely only on frontend filtering.

---

# 25. Server Authorization

Every field lead operation must verify:

```text
authenticated user
+
active staff profile
+
permission
+
ownership/team access where required
```

Never trust:

```text
created_by
assigned_to
role
```

sent by the browser.

Derive sensitive identity information server-side.

---

# 26. RLS

Create secure Supabase RLS policies.

Requirements:

- Anonymous users cannot read leads.
- Anonymous users cannot create leads directly.
- Anonymous users cannot update leads.
- Field marketers cannot read other users' leads unless authorized.
- Supervisors/admins can access appropriate team/all records.
- Mutations are protected.

Avoid broad policies that expose the entire table.

---

# 27. Lead Conversion

One of the most important workflows:

```text
FIELD LEAD
     │
     ▼
Interested
     │
     ▼
Convert
     │
     ├──────────────┐
     ▼              ▼
CLIENT          ENQUIRY
```

When a lead is ready to become a real customer:

```text
[Convert Lead]
```

The system should:

1. Check whether a matching client already exists.
2. Reuse the existing client when appropriate.
3. Otherwise create a client.
4. Optionally create an enquiry for the selected service.
5. Set:

```text
status = converted
converted_client_id = client.id
```

6. Preserve the original lead record.

Do NOT delete the lead after conversion.

---

# 28. Conversion Safety

Conversion must be transactional where supported.

Avoid this failure:

```text
Client created
↓
Enquiry creation fails
↓
Lead partially converted
```

Use an atomic server-side operation where practical.

If atomic transactions are not available through the chosen architecture, implement safe rollback/error handling.

---

# 29. Service Interest

Use the same stable service vocabulary already used by the public website and registry:

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

Do not create duplicate service definitions.

---

# 30. Field Marketing Dashboard

Add practical summary cards:

```text
My Leads
New Leads
Follow-Ups Today
Overdue Follow-Ups
Converted
```

Use real database values.

Do not fabricate statistics.

---

# 31. Supervisor View

Supervisors should have a useful overview:

```text
Team Leads
New Leads
Pending Follow-Ups
Overdue Follow-Ups
Conversions
```

Do not implement advanced analytics yet.

---

# 32. Activity Preparation

Prepare the architecture for future interaction history.

Future:

```text
Field Lead
   │
   ├── Created
   ├── Contacted
   ├── Follow-Up
   ├── Follow-Up
   └── Converted
```

Do not implement a full event timeline unless it can be done cleanly without unnecessary complexity.

---

# 33. Offline-First Preparation

This phase should make the data model friendly to future offline work.

Important principles:

- Every lead has a stable UUID.
- Avoid relying on database-generated sequential numbers.
- Timestamps should be explicit.
- Mutations should be idempotency-friendly where practical.
- Server responses should be predictable.
- Avoid workflows that require multiple uncontrolled client-side writes.
- Keep API contracts clean.

Do NOT implement full offline synchronization yet.

---

# 34. Future Offline Architecture

Document the intended future design:

```text
                FIELD MARKETER
                       │
                       ▼
                  PWA / PHONE
                       │
                 ┌─────┴─────┐
                 │ IndexedDB │
                 └─────┬─────┘
                       │
                 Offline Queue
                       │
                  Connection
                       │
                       ▼
                   Sync API
                       │
                 Conflict Check
                       │
                       ▼
                   Supabase
```

Future offline phase should support:

```text
Create lead offline
Edit lead offline
Create follow-up offline
Queue changes
Sync automatically
Retry failed operations
Resolve conflicts
```

Do not implement these features in Phase 7 unless required for a minimal proof of architecture.

---

# 35. Mobile Field-Marketing UX

This is extremely important.

Field staff will often use phones outdoors.

Optimize for:

```text
320px
360px
375px
390px
414px
```

The lead capture form should be:

- Fast
- Large touch targets
- Minimal scrolling
- Easy to read outdoors
- Simple dropdowns
- Clear save button
- Clear success feedback

Example:

```text
NEW FIELD LEAD

Full Name
[________________]

Phone
[________________]

Service
[ Work Abroad ▼ ]

District
[ Gulu ▼ ]

Notes
[________________]
[________________]

Next Follow-Up
[ 02 Sep 2026 ]

        [ SAVE LEAD ]
```

---

# 36. Fast Capture

Field marketing is not the same as office data entry.

Minimize required fields:

```text
Name
Phone
Service
```

Everything else should be optional unless necessary.

A marketer should be able to create a lead in under a minute.

---

# 37. Save Feedback

After successful capture:

```text
✓ Lead saved successfully
```

Show:

```text
Lead ID / Name
Service
Next follow-up
```

Provide:

```text
[Add Another Lead]
[View Lead]
```

This makes repeated field capture efficient.

---

# 38. Connection Awareness

Prepare the UI to eventually show:

```text
Online
Offline
Syncing
Pending Sync
```

Do not pretend a record is synchronized when it is not.

If full offline functionality is not implemented, don't display fake offline status.

---

# 39. Data Privacy on Mobile

Be careful with client information on shared devices.

Avoid displaying excessive personal information in notifications or browser titles.

Do not cache sensitive data broadly before the offline architecture is ready.

---

# 40. API Design

Adapt to the existing architecture.

Conceptual operations:

```text
GET    /api/registry/field-leads
POST   /api/registry/field-leads
GET    /api/registry/field-leads/:id
PATCH  /api/registry/field-leads/:id

POST   /api/registry/field-leads/:id/convert

GET    /api/registry/follow-ups
POST   /api/registry/follow-ups
PATCH  /api/registry/follow-ups/:id
```

Do not duplicate existing endpoints.

---

# 41. Validation

Validate:

```text
Full name
Phone
Email
District
Service
Source
Status
Follow-up date
Notes
```

Validate on:

```text
Frontend
+
Server
+
Database constraints where appropriate
```

---

# 42. Phone Normalization

Reuse the Phase 6 phone normalization utility.

Do not create a second phone normalization implementation.

Support:

```text
0772XXXXXX
+256772XXXXXX
256772XXXXXX
```

without corrupting valid international numbers.

---

# 43. Empty States

Examples:

```text
No field leads yet.

Capture your first lead from the field.
```

For follow-ups:

```text
No follow-ups today.
You're all caught up.
```

For overdue:

```text
No overdue follow-ups.
```

---

# 44. Error Handling

Use friendly messages:

```text
Unable to save this lead.
Please try again.
```

Do not expose:

- SQL errors
- Supabase internals
- stack traces
- secrets

---

# 45. No Hard Delete

Do not provide normal hard-delete functionality.

Use lifecycle states:

```text
lost
not_interested
converted
```

Preserve records for future reporting and auditing.

---

# 46. Audit Preparation

Make sure the system can determine:

```text
Who captured the lead?
Who updated it?
Who assigned it?
When?
```

A full audit log can come later.

---

# 47. Testing

Test:

### Lead creation

- Valid lead
- Missing required fields
- Duplicate phone
- Existing client
- Invalid service
- Invalid source

### Lead management

- Search
- Filter
- Pagination
- View
- Edit
- Status update

### Follow-ups

- Create
- Complete
- Reschedule
- Cancel
- Overdue detection

### Assignment

- Admin assignment
- Supervisor assignment
- Field marketer ownership
- Unauthorized access

### Conversion

- Lead → existing client
- Lead → new client
- Lead → client + enquiry
- Failed conversion handling
- Original lead preserved

### Security

- Anonymous access blocked
- Unauthorized staff blocked
- Ownership rules enforced
- RLS tested

### Mobile

Test:

```text
320px
360px
375px
390px
414px
768px
1024px
1280px
```

---

# 48. End-to-End Workflow Test

Perform this complete test:

```text
Field marketer logs in
        ↓
Opens Field Leads
        ↓
Creates lead
        ↓
Lead saved
        ↓
Supervisor sees lead
        ↓
Supervisor assigns/follows up
        ↓
Staff contacts lead
        ↓
Status becomes interested
        ↓
Follow-up scheduled
        ↓
Follow-up completed
        ↓
Lead converted
        ↓
Client created/reused
        ↓
Enquiry created
        ↓
Client appears in Clients
        ↓
Enquiry appears in Enquiries
```

This workflow is the most important acceptance test.

---

# 49. Final Acceptance Criteria

Phase 7 is complete when:

- Field Leads table exists.
- Field lead creation works.
- Field lead editing works.
- Field lead detail works.
- Lead search works.
- Lead filtering works.
- Lead pagination works.
- Lead status workflow works.
- Lead ownership works.
- Lead assignment works.
- Follow-ups work.
- Overdue follow-ups work.
- Lead conversion works.
- Existing clients are not unnecessarily duplicated.
- Converted leads remain preserved.
- Service vocabulary is shared with existing modules.
- Permissions are enforced.
- RLS is secure.
- Field marketer ownership is enforced.
- Supervisor access works.
- Admin access works.
- Mobile capture experience works.
- Public website remains functional.
- Phase 5 authentication remains functional.
- Phase 6 clients/enquiries remain functional.
- No secrets are exposed.
- Tests pass.

---

# 50. Completion Report

Report:

1. Field lead schema.
2. Database migration.
3. Field lead creation.
4. Lead search/filter/pagination.
5. Lead status workflow.
6. Lead ownership.
7. Lead assignment.
8. Follow-up implementation.
9. Overdue follow-ups.
10. Lead conversion.
11. Duplicate handling.
12. Client integration.
13. Enquiry integration.
14. Permissions.
15. RLS.
16. API endpoints.
17. Mobile field workflow.
18. Offline-readiness decisions.
19. Tests and results.
20. Files changed.
21. Remaining limitations.
22. Recommended Phase 8.

---

# FINAL INSTRUCTION

Implement **Phase 7 only**.

Do not rebuild the public website.

Do not rebuild authentication.

Do not rebuild Clients/Enquiries.

Do not implement advanced analytics.

Do not implement payroll/accounting.

Do not implement the complete offline synchronization engine yet.

Do not start Phase 8.

The goal is to establish the complete field acquisition workflow:

```text
              FIELD MARKETING
                     │
                     ▼
                 FIELD LEAD
                     │
            ┌────────┼────────┐
            ▼        ▼        ▼
          NOTES   FOLLOW-UP  ASSIGN
                     │
                     ▼
                 INTERESTED
                     │
                     ▼
                  CONVERT
                     │
              ┌──────┴──────┐
              ▼             ▼
           CLIENT         ENQUIRY
              │             │
              └──────┬──────┘
                     ▼
                REGISTRY
```

Build the data and API contracts carefully because the next major stage will turn the field workflow into a genuinely **offline-first PWA**, allowing field marketers to capture leads even when internet connectivity is poor and synchronize them safely when connectivity returns.
