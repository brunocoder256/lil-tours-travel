# LIL TOURS & TRAVEL — PHASE 5
# Registry Authentication, Roles, Permissions & Admin Shell

## Scope

Phase 1–4 established the public website, Earth animation, service enquiry flow, and Supabase/PostgreSQL foundation.

This phase begins the **internal Lil Tours Registry**.

Implement only:

- Supabase Auth staff login
- Staff profile model
- Roles
- Permission foundation
- Protected `/registry` routes
- Registry dashboard shell
- Basic protected Clients and Enquiries pages
- Secure session handling
- RLS/security foundations
- Responsive registry UI

Do NOT rebuild the public website. Do NOT implement field marketing, offline sync, advanced analytics, full CRM, payroll, accounting, or Phase 6.

---

## 1. Inspect First

Inspect the existing:

```text
website/
docs/
supabase/
package.json
.gitignore
.env.example
```

Understand the Phase 4 Supabase integration before making changes. Reuse existing clients/configuration instead of duplicating them.

---

## 2. Registry Routes

Create a protected internal area, preferably:

```text
/registry/login
/registry
/registry/clients
/registry/enquiries
/registry/clients/[id]
```

Public `/` and public service/enquiry pages must remain accessible without login.

---

## 3. Supabase Authentication

Use **Supabase Auth** for staff authentication.

Initial login:

```text
Email
Password
```

Do NOT create custom password hashing or store plaintext passwords.

Flow:

```text
/registry/login
      ↓
Supabase Auth
      ↓
staff profile / role check
      ↓
/registry
```

Unauthenticated users attempting protected routes must be redirected to `/registry/login`.

Do not manually expose auth tokens through application localStorage if the Supabase/Next.js architecture provides a secure session mechanism.

---

## 4. Staff Profiles

Create a profile associated with `auth.users`.

Conceptually:

```text
auth.users
    │
    │ 1:1
    ▼
staff_profiles
```

Suggested fields:

```text
id
user_id
full_name
phone
role
is_active
created_at
updated_at
```

Use UUIDs. Do not duplicate passwords or authentication credentials in this table.

---

## 5. Roles

Implement:

```text
admin
supervisor
data_entrant
field_marketer
```

Display:

```text
Administrator
Supervisor
Data Entrant
Field Marketer
```

Keep role values extensible.

---

## 6. Permissions

Create a clean permission foundation rather than scattering hard-coded role checks throughout the application.

Potential permissions:

```text
registry.view
clients.view
clients.create
clients.update
enquiries.view
enquiries.create
enquiries.update
staff.view
staff.manage
reports.view
field_leads.create
field_leads.view
```

Only enforce what this phase needs, but structure it for future expansion.

Suggested initial mapping:

```text
admin:
  registry.view
  clients.view
  clients.create
  clients.update
  enquiries.view
  enquiries.create
  enquiries.update
  staff.view
  staff.manage
  reports.view

supervisor:
  registry.view
  clients.view
  clients.create
  clients.update
  enquiries.view
  enquiries.create
  enquiries.update
  reports.view

data_entrant:
  registry.view
  clients.view
  clients.create
  clients.update
  enquiries.view
  enquiries.create

field_marketer:
  registry.view
```

Do not give field marketers unnecessary permissions yet.

---

## 7. Authorization

Authentication is not authorization.

Do not rely only on hiding buttons.

Enforce authorization at:

```text
UI
+
server/API
+
Supabase/PostgreSQL RLS
```

A user must not gain access by manually entering a protected URL or calling an API directly.

---

## 8. RLS / Database Security

Extend Supabase RLS for `staff_profiles` and internal registry access.

Public visitors must NOT be able to read:

```text
clients
enquiries
staff_profiles
```

Do not create unrestricted public policies such as:

```sql
USING (true)
```

for registry data.

Staff should access records only through authenticated, authorized paths.

---

## 9. Registry Dashboard Shell

Create a professional internal dashboard:

```text
┌──────────────────────────────────────────────────────┐
│ LIL TOURS REGISTRY                    User / Logout   │
├──────────────┬───────────────────────────────────────┤
│ Dashboard    │                                       │
│ Clients      │             MAIN CONTENT              │
│ Enquiries    │                                       │
│ Field Leads  │                                       │
│ Reports      │                                       │
│ Staff        │                                       │
│ Settings     │                                       │
└──────────────┴───────────────────────────────────────┘
```

Future modules can be placeholders, but inaccessible modules must not appear usable.

---

## 10. Dashboard

Show the authenticated user's:

```text
Welcome back, [Name]
Role: [Role]
```

Do not fabricate statistics.

If real counts are implemented, use actual database values. Otherwise use useful empty states.

---

## 11. Clients Module

Create protected:

```text
/registry/clients
```

If practical, load real Phase 4 client data.

Display appropriate fields:

```text
Name
Phone
Email
District
Created
```

Do not expose unnecessary personal information.

If implementing:

```text
/registry/clients/[id]
```

show:

```text
Client information
Enquiries
Future interactions placeholder
```

Do not build full CRM history yet.

---

## 12. Enquiries Module

Create protected:

```text
/registry/enquiries
```

Display real enquiries where available:

```text
Client
Service
Destination
Status
Source
Created
```

Do not expose internal technical/database details.

---

## 13. Role-Based Navigation

Navigation should reflect permissions.

Administrator:

```text
Dashboard
Clients
Enquiries
Field Leads
Reports
Staff
Settings
```

Supervisor:

```text
Dashboard
Clients
Enquiries
Field Leads
Reports
```

Data Entrant:

```text
Dashboard
Clients
Enquiries
```

Field Marketer:

```text
Dashboard
Field Leads
```

Future modules may be placeholders, but don't present them as operational if they are not implemented.

---

## 14. Logout and Sessions

Provide a visible logout action.

Logout must:

- Sign out through Supabase Auth
- Clear the application session
- Redirect to `/registry/login`

After logout, protected routes must require authentication again.

Handle:

- Fresh login
- Page refresh
- Expired session
- Invalid session
- Logout

Use loading states such as:

```text
Checking session...
```

to avoid flashing protected content.

---

## 15. Error Handling

Use friendly messages:

```text
Incorrect email or password.
```

or:

```text
We couldn't sign you in right now. Please try again.
```

Never expose raw Supabase/database errors, stack traces, secrets, or internal IDs unnecessarily.

---

## 16. Responsive Registry

The registry must work on:

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
```

On mobile:

- Sidebar can become a drawer
- Tables can become cards or controlled horizontal-scroll containers
- Buttons remain tappable
- Forms fit the screen
- No horizontal page overflow

Future field staff will use phones and tablets, so mobile quality matters.

---

## 17. Visual Identity

Keep the registry visually connected to Lil Tours while allowing a more operational dashboard style.

Use:

```text
Lil Tours branding
+
clean dashboard UI
+
clear hierarchy
+
professional data presentation
```

Do not use an unrelated generic admin template.

---

## 18. API Protection

Any registry API created in this phase must:

1. Validate authentication.
2. Validate staff profile.
3. Validate active status.
4. Validate role/permission.
5. Query only authorized records.
6. Return safe errors.

Do not create unauthenticated registry endpoints.

---

## 19. Future Offline Compatibility

Do not implement offline synchronization yet.

Keep the architecture compatible with:

```text
Field Marketer
      ↓
PWA
      ↓
IndexedDB
      ↓
Offline Queue
      ↓
Sync API
      ↓
Supabase
```

Do not introduce unnecessary offline complexity now.

---

## 20. Audit Preparation

Future registry actions should eventually support:

```text
who
what
when
```

Do not build a complete audit system yet unless straightforward, but avoid schema decisions that prevent future auditing.

---

## 21. GitHub Secret Safety

Before completion:

- Ensure `.env` and `.env.local` are ignored.
- Keep `.env.example` free of real secrets.
- Search for `SUPABASE_SERVICE_ROLE_KEY`.
- Never hard-code a real service-role key.
- Never expose the service-role key to browser code.
- Check `git status` before completion.

---

## 22. Testing

Test authentication:

- Valid login
- Invalid login
- Logout
- Refresh while logged in
- Expired/invalid session
- Unauthenticated protected route

Test authorization:

- Admin
- Supervisor
- Data entrant
- Field marketer
- Unauthorized module access

Test registry:

- Clients route protected
- Enquiries route protected
- Real data loads safely
- Public website remains public
- Registry data cannot be read anonymously

Test responsiveness and browser console errors.

---

## 23. Acceptance Criteria

Phase 5 is complete when:

- Supabase Auth staff login works.
- Staff profile model exists.
- Roles exist.
- Permission foundation exists.
- Protected registry routes exist.
- Registry dashboard shell exists.
- Clients page exists.
- Enquiries page exists.
- Role-based navigation works.
- Logout works.
- Session persistence/refresh works.
- RLS/security is appropriately configured.
- Registry APIs are protected.
- Registry data is not publicly accessible.
- Mobile registry layout works.
- Public website remains functional.
- No secrets are committed.

---

## 24. Completion Report

Report:

1. Authentication implementation.
2. Staff profile schema.
3. Roles implemented.
4. Permission system.
5. RLS policies.
6. Registry routes.
7. Dashboard shell.
8. Clients module.
9. Enquiries module.
10. Role-based navigation.
11. Logout/session handling.
12. Mobile responsiveness.
13. Security testing.
14. GitHub secret-safety verification.
15. Tests and results.
16. Remaining limitations.
17. Recommended Phase 6.

---

# FINAL INSTRUCTION

Implement **Phase 5 only**.

Do not rebuild the public website.

Do not implement field marketing.

Do not implement offline synchronization.

Do not implement advanced reports.

Do not implement the complete CRM.

Do not start Phase 6.

Build the secure authentication, authorization, staff roles, protected registry shell, and basic Clients/Enquiries access carefully.

Future architecture should support:

```text
                 LIL TOURS REGISTRY
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
      CLIENTS         ENQUIRIES       FIELD LEADS
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    FOLLOW-UPS
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        STAFF / ROLES          SUPERVISION
             │                       │
             └───────────┬───────────┘
                         ▼
                      REPORTS
                         │
                         ▼
                   OFFLINE PWA
```
