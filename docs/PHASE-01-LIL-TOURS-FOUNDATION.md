# Lil Tours & Travel — Phase 1 Implementation Prompt

## Project Context

You are working on the **Lil Tours & Travel** platform.

Lil Tours & Travel is a travel, transportation, tourism, documentation, and consultancy business offering:

- Tourism and travel services
- Work-abroad assistance/consultancy
- Car hire
- Passport assistance
- Visa assistance
- Air ticketing
- Hotel reservations
- Airbnb reservations
- Delivery services
- Travel and general consultancy

The project will eventually consist of two connected experiences:

1. A **public marketing website** for customers.
2. An **internal client registry/management system** for administrators, supervisors, data entrants, and field marketers.

The platform will eventually use:

- GitHub for source control
- Supabase
- PostgreSQL
- Next.js for the registry/application layer
- HTML/CSS/JavaScript for the public website
- PWA/offline functionality for field work

## IMPORTANT — Phase 1 Scope

This phase is **FOUNDATION / PROJECT AUDIT AND ARCHITECTURE PREPARATION ONLY**.

Do NOT jump ahead and build the full registry, authentication, database schema, dashboards, service forms, or public website.

Do NOT invent business data.

Do NOT replace the existing project structure unnecessarily.

Your responsibility in this phase is to inspect the repository, establish a clean foundation, document the architecture, and prepare the project for subsequent phases.

---

# 1. Inspect the Entire Repository First

Before changing anything:

- Inspect the complete repository structure.
- Identify whether the repository is empty, partially initialized, or already contains application code.
- Inspect existing `package.json` files.
- Inspect existing Next.js configuration.
- Inspect existing HTML/CSS/JS.
- Inspect existing images/assets.
- Inspect existing documentation.
- Inspect existing Git configuration.
- Inspect environment files and `.gitignore`.
- Do not expose or commit secrets.

If there are existing files, preserve useful work.

Create:

`docs/PHASE-01-AUDIT.md`

Include:

- Current project structure
- Existing technologies
- Existing application entry points
- Existing assets
- Existing dependencies
- Existing problems/inconsistencies
- What can be reused
- What needs to be created later
- Recommended next phase

---

# 2. Establish the Intended Project Architecture

Prepare the repository around this conceptual structure:

```text
lil-tours/
│
├── website/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
│
├── registry/
│   ├── src/
│   ├── public/
│   └── ...
│
├── database/
│
├── docs/
├── assets/
├── .gitignore
└── README.md
```

Do **not** blindly create duplicate folders if equivalent structures already exist. Adapt the structure after auditing the repository.

Clearly separate:

### Public Website

Responsible for:

- Branding
- Marketing
- Services
- Tourism
- Destinations
- Car hire advertising
- Contact information
- WhatsApp conversion
- Customer service enquiry entry points

### Registry/Application

Responsible for:

- Client records
- Service requests
- Field leads
- Staff
- Follow-ups
- Notes
- Reporting
- Authentication
- Authorization
- Offline synchronization

---

# 3. Prepare the Public Website Foundation

If the public website does not already exist, create a minimal valid foundation using:

- HTML
- CSS
- JavaScript

Create only the structural foundation.

Do **not** build the complete visual website yet.

The structure should later support:

- Header/navigation
- Hero
- Services
- Tourism/destinations
- Car hire
- Why choose us
- Call-to-action
- Contact
- Footer

Use simple placeholders where real business information has not been supplied.

Do not invent:

- Phone numbers
- Email addresses
- Physical addresses
- Company registration numbers
- Prices
- Staff names
- Accreditations
- Partnerships
- Client statistics

---

# 4. Prepare the Next.js Registry Foundation

If the registry application does not already exist, initialize a modern Next.js application inside:

`registry/`

Use:

- Next.js
- TypeScript
- App Router
- ESLint
- Tailwind CSS if compatible with the existing project
- Responsive architecture

The registry is for:

- Admin
- Supervisor
- Data Entrant
- Field Marketing Staff

Do **not** implement authentication or database functionality in this phase.

Create only the application foundation and a simple placeholder registry landing page if necessary.

---

# 5. Supabase Preparation

We will use Supabase for backend infrastructure and PostgreSQL.

For this phase:

- Do not hard-code Supabase credentials.
- Do not commit secrets.
- Do not create the full database schema.
- Do not create fake users or clients.

Prepare the project for later Supabase integration.

If environment configuration is needed, create/update:

`.env.example`

Use:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not put actual credentials into `.env.example`.

If server-side credentials will be required later, document the variable name without providing a secret.

---

# 6. PostgreSQL Architecture Preparation

Do not create the final schema yet.

Create:

`docs/DATABASE-PLAN.md`

Document the proposed future entities and their purpose.

Initial conceptual entities:

```text
users / staff
clients
services
service_requests
field_leads
client_notes
follow_ups
activity_logs
marketing_campaigns
client_documents
```

Document relationships conceptually.

For example:

```text
Staff
  └── creates/manages → Clients

Client
  ├── has → Service Requests
  ├── has → Notes
  ├── has → Follow-ups
  └── may originate from → Field Lead

Service
  └── is requested through → Service Request

Marketing Campaign
  └── can generate → Field Leads
```

Do not finalize columns until the dedicated database-design phase.

---

# 7. Offline-First Requirement

The final registry must support field marketing where internet connectivity is unreliable.

Create:

`docs/OFFLINE-PLAN.md`

Document this intended model:

```text
ONLINE
   ↓
Save directly to backend
   ↓
Supabase/PostgreSQL

OFFLINE
   ↓
Save locally
   ↓
Mark as pending sync
   ↓
Internet returns
   ↓
Synchronize
   ↓
Resolve conflicts safely
```

The eventual implementation should be mobile-first and PWA-compatible.

Do **not** implement the complete synchronization engine in Phase 1.

---

# 8. Responsive Design Requirement

Document that every future interface must support:

- Small Android phones
- Larger phones
- Tablets
- Laptops
- Desktop monitors
- Large screens

The registry must be especially optimized for field staff using phones.

Avoid desktop-only tables that become unusable on mobile.

Future UI should use:

- Responsive cards
- Responsive tables where appropriate
- Touch-friendly controls
- Proper spacing
- No horizontal overflow
- Accessible forms
- Appropriate typography scaling

---

# 9. Animation / Motion Direction

The public website will eventually include moving graphics for advertising.

Document the intended direction:

- Cinematic hero transitions
- Smooth image movement
- Service-card reveal animations
- Scroll-triggered sections
- Animated statistics
- Destination transitions
- Subtle hover interactions
- Floating travel elements where appropriate

Do not add excessive animations during Phase 1.

Future design should prioritize:

1. Performance
2. Accessibility
3. Mobile performance
4. Smoothness
5. Professional appearance

Avoid distracting or cheap-looking motion.

---

# 10. README

Create/update the root `README.md`.

Explain:

- What Lil Tours & Travel is
- Project purpose
- Main services
- Public website vs registry
- Technology stack
- Project structure
- Development setup
- Environment configuration
- Future architecture
- Current implementation phase

Clearly state:

`Phase 1 — Foundation and Architecture Preparation`

---

# 11. Git Safety

Before finishing:

- Check `git status`.
- Make sure `.env` and secret files are ignored.
- Do not commit API keys.
- Do not commit Supabase secrets.
- Do not delete unrelated user files.
- Do not overwrite useful existing work without reason.

If Git history already exists, preserve it.

---

# 12. Validation

Run appropriate checks based on what actually exists.

For the Next.js application, if initialized:

```bash
npm run lint
npm run build
```

If another package manager is already in use, respect it.

For the public website:

- Validate HTML structure.
- Check CSS loading.
- Check JavaScript loading.
- Confirm asset paths work.

Do not leave broken imports or broken paths.

---

# 13. Final Phase 1 Deliverables

At the end of this phase, the repository should contain:

```text
docs/
├── PHASE-01-AUDIT.md
├── DATABASE-PLAN.md
└── OFFLINE-PLAN.md
```

plus the cleaned/organized project foundation.

The public website should have its basic structural foundation.

The Next.js registry should have its basic application foundation.

Supabase integration should be prepared but not fully implemented.

The database should be planned but not fully implemented.

---

# 14. Important Engineering Rules

### Do not over-engineer.

Build only what Phase 1 requires.

### Do not invent business information.

Use placeholders only where necessary.

### Do not create unnecessary dependencies.

Keep the project lightweight.

### Do not destroy existing work.

Audit first.

### Do not expose secrets.

Use environment variables.

### Do not build future phases prematurely.

Leave clear extension points.

### Do not sacrifice mobile usability.

Mobile/field usage is a core requirement.

### Do not sacrifice offline readiness.

The architecture must allow offline field lead capture later.

---

# 15. Completion Report

When implementation is complete, provide a concise report containing:

1. What was found during the audit.
2. What was created.
3. What was modified.
4. What was intentionally not implemented yet.
5. Validation results.
6. Any issues requiring attention.
7. Recommended Phase 2.

Do not claim something is complete if it was not actually implemented.

## Recommended Phase 2

The next phase should be:

**Brand Identity + Public Website Design System + Homepage Foundation**

That phase will focus on the actual Lil Tours visual identity, responsive design system, navigation, hero section, service presentation, imagery, motion direction, and conversion-focused homepage.
