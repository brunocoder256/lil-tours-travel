# Lil Tours & Travel

Travel, Tourism, Transportation & Consultancy Platform.

## About

Lil Tours & Travel is a travel, transportation, tourism, documentation, and consultancy business offering:

- Tourism & Travel
- Work Abroad Assistance
- Car Hire
- Passport Assistance
- Visa Services
- Air Ticketing
- Hotel Reservations
- Airbnb Reservations
- Delivery Services
- Travel & General Consultancy

## Platform

The platform consists of two connected experiences:

1. **Public Marketing Website** (`website/`) — branding, services, tourism, destinations, car hire, contact information, and WhatsApp conversion.
2. **Internal Client Registry** (`registry/`) — client records, service requests, field leads, staff management, follow-ups, notes, and reporting.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Public Website | HTML, CSS, JavaScript |
| Registry | Next.js 16, TypeScript, Tailwind CSS v4, App Router |
| Database | Supabase (PostgreSQL) |
| Offline Support | PWA / IndexedDB (planned) |
| Version Control | Git / GitHub |

## Project Structure

```
lil-tours/
├── website/          Public marketing website (HTML/CSS/JS)
├── registry/         Internal Next.js registry application
├── database/         Database documentation and schema
├── docs/             Project documentation
├── assets/           Shared project assets
├── .env.example      Environment variable template
├── .gitignore        Git ignore rules
└── README.md         This file
```

## Development Setup

### Public Website

Open `website/index.html` in a browser, or use a local server:

```bash
cd website
npx serve .
```

### Registry

```bash
cd registry
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Configuration

Copy `.env.example` to `.env.local` in the `registry/` directory and fill in Supabase credentials:

```bash
cp .env.example registry/.env.local
```

Never commit `.env.local` or actual credentials.

## Project Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation & Architecture Preparation | **In Progress** |
| Phase 2 | Brand Identity + Public Website Design System + Homepage | Planned |
| Phase 3 | Authentication & Database Schema | Planned |
| Phase 4 | Client Registry CRUD | Planned |
| Phase 5 | Field Marketing & Offline PWA | Planned |
| Phase 6 | Reporting & Analytics | Planned |

**Current Phase:** Phase 1 — Foundation and Architecture Preparation

## Documentation

- `docs/PHASE-01-LIL-TOURS-FOUNDATION.md` — Phase 1 implementation guide
- `docs/PHASE-01-AUDIT.md` — Repository audit findings
- `docs/DATABASE-PLAN.md` — Proposed database architecture
- `docs/OFFLINE-PLAN.md` — Offline-first architecture plan
