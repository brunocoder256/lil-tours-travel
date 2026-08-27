# Database Architecture Plan

## Overview

Lil Tours & Travel will use **Supabase** (hosted PostgreSQL) as the backend database. This document outlines the proposed entity model for the client registry and management system.

This is a conceptual plan. Final column definitions will be defined during the dedicated database-design phase.

---

## Proposed Entities

### users / staff

System users with different role levels.

**Roles:**
- Admin — full system access
- Supervisor — manage staff, view reports, oversee operations
- Data Entrant — create and edit client records
- Field Marketing Staff — capture leads, manage field assignments

**Purpose:** Authentication, authorization, audit trails, assignment ownership.

---

### clients

People or organizations receiving services from Lil Tours & Travel.

**Purpose:** Central record for all customer interactions.

**Notes:**
- A client may originate from a field lead, website enquiry, walk-in, or referral
- A client can have multiple service requests over time
- Client records must be searchable and filterable

---

### services

Catalogue of services offered by Lil Tours & Travel.

**Services include:**
- Tourism & Travel
- Work Abroad Assistance
- Car Hire
- Passport Assistance
- Visa Services
- Air Ticketing
- Hotel Reservations
- Airbnb Reservations
- Delivery Services
- Consultancy

**Purpose:** Reference table for service types, linked to service requests.

---

### service_requests

Individual requests from clients for specific services.

**Purpose:** Track what service a client requested, its status, progress, and outcome.

**Notes:**
- Each request links to one client and one service
- Status transitions: Pending → In Progress → Completed / Cancelled
- Assigned to a staff member for handling

---

### field_leads

Potential clients captured by field marketing staff.

**Purpose:** Track leads from field work, events, campaigns, or referrals before they become clients.

**Notes:**
- A lead may convert to a client
- Leads can originate from marketing campaigns
- Field staff capture leads offline and sync later
- Each lead has contact info, source, and initial notes

---

### client_notes

Freeform notes attached to client records.

**Purpose:** Allow staff to record observations, follow-up details, special requirements, or internal comments.

**Notes:**
- Each note is linked to a client
- Each note is authored by a staff member
- Notes are timestamped for audit

---

### follow_ups

Scheduled or completed follow-up actions for clients.

**Purpose:** Ensure no client is forgotten; track promised callbacks, document submissions, status checks.

**Notes:**
- Each follow-up links to a client and optionally a service request
- Has a due date, status (pending / done / overdue), and assigned staff
- Supports field staff workflow: "Call client on Tuesday about visa progress"

---

### activity_logs

Audit trail of significant actions within the system.

**Purpose:** Track who did what and when for accountability and debugging.

**Examples:**
- Client created
- Service request updated
- Lead converted to client
- Note added
- Follow-up completed

---

### marketing_campaigns

Record of marketing efforts and campaigns.

**Purpose:** Track which campaigns generate leads and measure effectiveness.

**Notes:**
- Each campaign can generate multiple field leads
- Campaigns have a name, type, date range, and status

---

### client_documents

Documents attached to client records.

**Purpose:** Store references to passports, visas, tickets, receipts, or other uploaded files.

**Notes:**
- Each document links to a client and optionally a service request
- Supabase Storage will handle file uploads
- Document metadata: type, filename, upload date, uploaded by

---

## Entity Relationships

```
Staff
  └── creates/manages → Clients
  └── handles → Service Requests
  └── authors → Client Notes
  └── assigned → Follow-ups
  └── captures → Field Leads

Client
  ├── has → Service Requests
  ├── has → Client Notes
  ├── has → Follow-ups
  ├── has → Client Documents
  └── may originate from → Field Lead

Service
  └── is requested through → Service Request

Field Lead
  ├── may convert to → Client
  └── may originate from → Marketing Campaign

Marketing Campaign
  └── generates → Field Leads

Service Request
  ├── links to → Client
  ├── links to → Service
  └── may have → Follow-ups
```

---

## Design Principles

1. **UUID primary keys** — for safe distributed ID generation (offline + online)
2. **Timestamps on all records** — created_at, updated_at
3. **Soft deletes** — prefer `deleted_at` over hard deletes for audit
4. **Row-level security** — Supabase RLS policies per role
5. **Normalization** — services as reference table, not embedded strings
6. **Extensibility** — additional fields can be added without schema redesign

---

## Not Finalized Yet

- Exact column names and data types
- Index strategy
- Partition strategy
- Supabase RLS policies
- Storage bucket configuration
- Edge function requirements
