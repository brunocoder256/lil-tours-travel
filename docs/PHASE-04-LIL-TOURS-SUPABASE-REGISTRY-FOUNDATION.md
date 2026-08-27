# LIL TOURS & TRAVEL — PHASE 4
# Supabase + PostgreSQL Foundation & Real Client Registry Intake

## Project Context

Lil Tours & Travel is a travel and transportation company offering:

- Tourism and travel
- Work-abroad consultancy
- Visa assistance
- Passport assistance
- Air tickets
- Hotel reservations
- Airbnb assistance
- Car hire
- Delivery services
- Consultancy services

Completed so far:

- Phase 1 — Project foundation
- Phase 2 — Public website
- Phase 2 Earth Add-on — Interactive Earth animation
- Phase 3 — Service selection + client enquiry + WhatsApp conversion

The public website is now ready to begin connecting to a real company registry.

This phase introduces:

```text
Supabase
PostgreSQL
Real enquiry storage
Basic registry foundation
```

---

# IMPORTANT SCOPE

This phase is the beginning of the **Lil Tours Registry System**.

Do NOT rebuild the public website.

Do NOT redesign Phase 2.

Do NOT redesign the Phase 3 enquiry UX unless required for integration.

Do NOT implement the entire admin dashboard yet.

Do NOT implement advanced analytics yet.

Do NOT implement field-worker offline synchronization yet.

Do NOT implement complex permissions yet.

Do NOT implement payroll, accounting, inventory, CRM automation, or unrelated business systems.

The objective is to establish a secure, clean foundation for storing website enquiries in Supabase/PostgreSQL and prepare the registry architecture for future phases.

---

# 1. Architecture Decision

The project should use:

```text
Frontend
HTML + CSS + JavaScript

Application / Backend
Next.js

Database / Backend Services
Supabase

Database
PostgreSQL
```

The existing public website may remain mostly static HTML/CSS/JS.

Do not unnecessarily convert the entire existing frontend to React/Next.js if the current project does not require it.

Use the simplest architecture that correctly supports:

```text
Public Website
      ↓
Secure server/API layer
      ↓
Supabase
      ↓
PostgreSQL
      ↓
Registry
```

---

# 2. SECURITY RULE — VERY IMPORTANT

The browser must NEVER receive a Supabase `service_role` key.

Never put:

```text
SUPABASE_SERVICE_ROLE_KEY
```

inside:

```text
index.html
main.js
earth.js
public/
assets/
```

Never expose it through client-side JavaScript.

Public browser code may only use the Supabase anonymous/public key if the chosen architecture requires it.

Prefer sending public enquiry data through the secure Next.js server/API layer.

---

# 3. Environment Variables

Create/update environment configuration appropriately.

Conceptually:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key must remain server-only.

Do not commit real secrets to GitHub.

Update:

```text
.gitignore
```

if necessary.

Create or update:

```text
.env.example
```

with placeholders only.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
```

---

# 4. Supabase Project

If the project is not already connected to Supabase:

Prepare the application for a Supabase project.

The implementation should document:

```text
Supabase project
↓
PostgreSQL database
↓
Tables
↓
RLS policies
↓
Server/API access
```

Do not create unnecessary Supabase products.

Do not enable authentication for clients yet.

The future registry will use staff/admin authentication, but that belongs to a later phase.

---

# 5. Database Design

Create the initial registry structure.

The central concept is:

```text
Client
```

A client may make multiple enquiries over time.

Therefore do NOT put every enquiry directly into one giant client table.

Use a relationship:

```text
clients
   │
   ├── enquiries
   │
   └── future field interactions
```

---

# 6. Clients Table

Create a PostgreSQL table conceptually:

```text
clients
```

Suggested fields:

```text
id
full_name
phone
email
district
date_of_birth
created_at
updated_at
```

Use an appropriate UUID primary key.

Important:

Do not require date of birth during ordinary public website enquiries unless there is a genuine business reason.

It will mainly be used later when staff/field marketers register a client.

---

# 7. Enquiries Table

Create:

```text
enquiries
```

Suggested fields:

```text
id
client_id
service
destination
preferred_date
notes
source
status
created_at
updated_at
```

Potential source values:

```text
website
whatsapp
field_marketing
referral
social_media
walk_in
other
```

For the current website:

```text
source = website
```

Potential enquiry statuses:

```text
new
contacted
in_progress
completed
cancelled
```

Do not overcomplicate status management yet.

---

# 8. Service Values

Avoid arbitrary spelling differences between services.

Create a consistent service vocabulary.

Suggested values:

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

Display friendly names to users:

```text
Visa Assistance
Work Abroad
Air Tickets
Car Hire
```

but store stable internal values.

---

# 9. Service-Specific Enquiry Data

Some services need additional information.

Instead of creating dozens of nullable database columns immediately, use an appropriate structured field if supported.

For example:

```text
details JSONB
```

Example:

```json
{
  "pickupLocation": "Gulu",
  "dropoffLocation": "Kampala",
  "hireDate": "2026-09-01",
  "returnDate": "2026-09-05"
}
```

Another example:

```json
{
  "departure": "Entebbe",
  "destination": "Dubai",
  "travelDate": "2026-10-15",
  "tripType": "return",
  "travellers": 2
}
```

Do not put highly sensitive documents or secrets into this JSONB field.

---

# 10. Client Deduplication

Website enquiries may come from the same person multiple times.

Do not blindly create a completely new client for every enquiry.

Implement sensible matching.

A basic first approach may use:

```text
normalized phone number
```

as the primary matching signal.

If a matching client exists:

```text
existing client
      ↓
new enquiry
```

If no match exists:

```text
new client
      ↓
new enquiry
```

Do not merge people based only on name.

Phone number should be normalized consistently.

---

# 11. Public Enquiry API

Create a secure server-side endpoint.

Conceptually:

```text
POST /api/enquiries
```

The endpoint should accept the Phase 3 enquiry structure.

Example:

```json
{
  "fullName": "Example Client",
  "phone": "+256...",
  "email": "example@email.com",
  "district": "Gulu",
  "service": "visa",
  "destination": "United Kingdom",
  "preferredDate": "2026-10-10",
  "notes": "I need consultation.",
  "details": {}
}
```

The server should:

1. Validate the request.
2. Normalize phone.
3. Validate service.
4. Find or create the client.
5. Create the enquiry.
6. Return a safe response.

Do not return internal database details unnecessarily.

---

# 12. Validation

Server-side validation is mandatory.

Never trust only browser validation.

Validate:

- Full name
- Phone
- Email
- Service
- Dates
- Notes length
- JSON details shape

Reject malformed requests.

Protect against:

- Oversized payloads
- Invalid service values
- Invalid dates
- Malformed email
- Empty names
- Excessively long notes

---

# 13. Rate Limiting / Abuse Protection

The public enquiry endpoint will be internet-facing.

Add reasonable abuse protection.

At minimum:

- Request size limits
- Basic rate limiting
- Validation
- Safe error responses

Do not make the system so restrictive that normal customers cannot submit enquiries.

---

# 14. Database Security / RLS

Supabase Row Level Security must be considered from the beginning.

Public visitors should NOT have unrestricted access to:

```text
clients
enquiries
```

Do not create a policy that effectively says:

```sql
USING (true)
```

for unrestricted public reading.

A safe initial architecture is:

```text
Public browser
     ↓
Next.js API
     ↓
Server-side Supabase access
     ↓
PostgreSQL
```

Public users should only receive the response needed to confirm their enquiry.

---

# 15. Supabase Client Architecture

Keep server and browser Supabase clients separate if both are needed.

For example conceptually:

```text
lib/
├── supabase/
│   ├── server.js
│   └── browser.js
```

Do not expose service-role access in browser code.

Use the appropriate Supabase client library/version compatible with the existing Next.js setup.

---

# 16. Phase 3 Integration

Update the existing enquiry submission.

Current:

```text
Form
 ↓
WhatsApp
```

Upgrade it to:

```text
Form
 ↓
Validate
 ↓
POST /api/enquiries
 ↓
Supabase/PostgreSQL
 ↓
Success
 ↓
Offer WhatsApp continuation
```

The WhatsApp option should remain.

The database save must NOT prevent the user from seeing a useful response if WhatsApp is still available.

However, do not falsely say "saved" if the server/database request failed.

---

# 17. Success / Failure States

Successful database submission:

```text
✓ Enquiry received

Thank you.

Your request has been received by Lil Tours & Travel.

[ Continue on WhatsApp ]
```

If database submission fails:

```text
We couldn't complete the online enquiry right now.

You can continue directly through WhatsApp.

[ Continue on WhatsApp ]
```

Do not expose:

- SQL errors
- Supabase errors
- stack traces
- environment variables
- internal IDs

---

# 18. Registry Foundation

Create the basic conceptual registry structure.

Future system:

```text
LIL TOURS REGISTRY
│
├── Clients
├── Enquiries
├── Field Leads
├── Follow-ups
├── Services
├── Staff
└── Reports
```

This phase only implements:

```text
Clients
Enquiries
```

and the infrastructure required to receive website enquiries.

---

# 19. Future Field Marketing Compatibility

The business specifically needs staff/data entrants to record clients they meet during field work and marketing.

Prepare the schema for future records such as:

```text
field_marketing_leads
```

Potential future information:

```text
client
contact
district
date_of_birth
service_interest
notes
field_agent
date_collected
source
status
```

Do NOT implement this table yet unless a minimal relationship is genuinely necessary.

The important requirement is that today's schema must not make future field marketing impossible.

---

# 20. Data Model Relationship

The intended future relationship is approximately:

```text
CLIENT
  │
  ├──────── ENQUIRIES
  │
  ├──────── FIELD INTERACTIONS
  │
  └──────── FOLLOW-UPS
```

This is the beginning of the Lil Tours CRM/registry concept.

Do not create an overcomplicated enterprise CRM.

Keep the foundation understandable.

---

# 21. Database Indexes

Add sensible indexes.

At minimum consider indexes for:

```text
clients.phone
enquiries.client_id
enquiries.service
enquiries.status
enquiries.created_at
```

Do not add indexes blindly.

---

# 22. Timestamps

Use database-managed timestamps where appropriate:

```text
created_at
updated_at
```

Avoid depending exclusively on the visitor's device clock.

---

# 23. Error Handling

The API must return clean HTTP responses.

Conceptually:

```text
201 Created
400 Bad Request
429 Too Many Requests
500 Internal Server Error
```

Do not expose database internals.

---

# 24. Logging

Add useful server-side logs for:

- Validation failure
- Enquiry creation
- Database failure

Do not log:

- Passwords
- Supabase service-role key
- Sensitive authentication secrets
- Full sensitive client data unnecessarily

---

# 25. GitHub Safety

Before completion:

Check:

```text
git status
```

Ensure secrets are NOT committed.

Search the project for:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Confirm it only exists in server-side environment/configuration references and never as a real hard-coded secret.

Check `.gitignore`.

---

# 26. Supabase Migration / SQL

Create a reproducible database migration or SQL file.

Prefer a structure such as:

```text
supabase/
└── migrations/
    └── 001_initial_registry.sql
```

The migration should create:

- clients
- enquiries
- enums/check constraints as appropriate
- indexes
- RLS configuration

Do not rely on manually clicking around the Supabase dashboard without recording the schema.

---

# 27. Seed / Test Data

Do not put fake production clients into the live database.

If testing locally, use clearly marked test data.

For example:

```text
TEST CLIENT — DO NOT USE IN PRODUCTION
```

Clean test records when appropriate.

---

# 28. Offline Consideration

The complete offline engine is NOT implemented in Phase 4.

However, keep the architecture compatible with future offline support.

The future workflow may become:

```text
Field Agent
      ↓
Offline PWA
      ↓
Local Queue
      ↓
Internet Available
      ↓
Sync API
      ↓
Supabase
```

Do not implement this yet.

Do not introduce IndexedDB/offline sync complexity unless required for the current integration.

---

# 29. Public Privacy

Because the registry will contain client information, design with privacy in mind.

Do not display client data publicly.

Do not put client records into URLs.

Do not expose database IDs unnecessarily.

Do not collect information that is not needed.

---

# 30. Testing

Implement tests for:

### API validation

- Valid enquiry
- Missing name
- Missing phone
- Invalid email
- Invalid service
- Invalid date
- Excessively long notes

### Database behavior

- New client created
- Existing client matched
- New enquiry linked to existing client
- Multiple enquiries for one client

### Security

- Service role key not exposed
- Public users cannot directly read registry tables
- Malformed payload rejected

### Frontend

- Existing Phase 3 form still works.
- Successful enquiry reaches the API.
- Failure produces a graceful fallback.
- WhatsApp continuation still works.

---

# 31. Responsive Preservation

Do not break the existing website responsiveness.

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
1440px
1920px
```

The new integration should not change the visual quality of:

- Hero
- What We Offer
- Earth
- Featured Services
- Enquiry form
- Footer

---

# 32. Final Acceptance Criteria

Phase 4 is complete only when:

- Supabase connection is configured.
- PostgreSQL schema is reproducible.
- `clients` exists.
- `enquiries` exists.
- Website enquiries can be stored.
- Existing clients can be matched sensibly.
- Multiple enquiries can belong to one client.
- Service values are consistent.
- Server-side validation works.
- Public API is protected against basic abuse.
- RLS/security has been configured appropriately.
- Service-role key is never exposed to the browser.
- Phase 3 WhatsApp flow still works.
- Existing public website remains functional.
- No secrets are committed to GitHub.
- Tests/validation pass.

---

# 33. Completion Report

When finished, report:

1. Supabase setup performed.
2. PostgreSQL schema created.
3. Tables created.
4. Relationships created.
5. RLS/security implementation.
6. API endpoint created.
7. Validation implemented.
8. Client deduplication approach.
9. Phase 3 integration.
10. WhatsApp behavior.
11. Rate limiting/abuse protection.
12. Migration files created.
13. Environment variables required.
14. GitHub secret-safety check.
15. Tests performed and results.
16. Any remaining limitations.

---

# FINAL INSTRUCTION

Implement **Phase 4 only**.

This phase establishes the **real Supabase/PostgreSQL registry foundation and connects public website enquiries to it**.

Do not build the full registry dashboard yet.

Do not build staff authentication yet.

Do not build field marketing/offline synchronization yet.

Do not rebuild the public website.

The result should be a clean foundation that future phases can extend into:

```text
Admin Registry
        ↓
Staff/Data Entrants
        ↓
Supervisors
        ↓
Field Marketing
        ↓
Offline PWA
        ↓
Analytics & Reports
```

Build this foundation carefully because future registry phases will depend on it.
