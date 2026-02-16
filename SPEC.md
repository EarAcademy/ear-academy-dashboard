# The Ear Academy - Sales Intelligence Dashboard

## Project Overview

A web-based sales intelligence dashboard that provides snapshot views of market penetration, outreach activity, and pipeline metrics for The Ear Academy. Designed for investors, board members, and the internal sales team.

**Key Principle:** The system is market/region-agnostic — it supports South Africa (9 provinces), UK, and future expansion into other countries.

---

## Data Model

### Markets & Regions

- **Market**: A country (e.g., South Africa, United Kingdom)
- **Region**: A subdivision within a market (e.g., Gauteng, Western Cape, Greater London)
- Each region has a `total_schools` count (the estimated TAM) that can be updated as more data becomes available
- Schools can be added incrementally — the system tracks both the known universe and the estimated total

### Schools

Each known school record contains:

- Name
- Region (linked to a Market)
- Type (e.g., private, independent, public, international)
- Contact information (email, phone, contact person)
- ActiveCampaign contact ID (for syncing)
- **Status** (lifecycle):
  - `uncontacted` — in the database but not yet reached out to
  - `contacted` — outreach email/call has been made
  - `replied` — school has responded
  - `yes` — interested / moving forward
  - `no` — declined

### ActiveCampaign Pipeline Mapping

The dashboard mirrors the 4 pipelines already configured in ActiveCampaign:

**Pipeline 1: Sales Qualification (AC group 4)**

| Stage | AC ID |
|---|---|
| New Lead | 36 |
| Marketing Qualified Lead | 38 |
| Sales Qualified Lead | 39 |
| Cold Lead | 40 |
| Disqualified | 41 |

**Pipeline 2: Sales Conversion (AC group 5)**

| Stage | AC ID |
|---|---|
| Trial Booked | 42 |
| Trial in Progress | 43 |
| Trial Completed - Review | 44 |
| Proposal | 45 |
| Negotiation | 46 |
| Agreed | 47 |
| Won | 48 |
| Lost | 49 |

**Pipeline 3: Customer Account Management (AC group 6)**

| Stage | AC ID |
|---|---|
| Onboarding | 50 |
| Activated | 51 |
| Upcoming Renewal | 52 |
| Low Activity | 53 |
| Churning | 54 |
| Lost | 55 |

**Pipeline 4: Cold/Disqualified Leads (AC group 7)**

| Stage | AC ID |
|---|---|
| Not Interested | 56 |
| Unable to Contact | 57 |
| Long Term Interest | 58 |
| Disqualified | 59 |

### Dashboard Pipeline Views

**Summary View** (for investors/board): Rolls up into simplified categories:
- Qualifying → Converting → Customer → Lost/Cold
- Shows counts and conversion rates between macro stages

**Detailed View** (for sales team): Shows all individual stages within each pipeline with:
- Count at each stage
- Time-in-stage tracking
- Stale lead alerts
- Drill-down to individual school records

### Daily Outreach Tracking

- Date
- Emails sent (actual) — pulled from ActiveCampaign
- Emails target (goal for the day) — set manually
- Other outreach activities as needed

### Response Tracking

- Replies received per day — pulled from ActiveCampaign
- Linked to specific school records where possible
- Yes/No outcome tracking

---

## Dashboard Views

### 1. TAM Overview (Macro View)

The primary dashboard showing market penetration at a glance.

Per region:

| Metric               | Example                |
| --------------------- | ---------------------- |
| Total Schools (TAM)   | 1,200                  |
| Known Schools         | 800 (67% identified)   |
| Contacted             | 400 (50% of known)     |
| Replied               | 120 (30% response rate)|
| Yes                   | 45 (37.5% conversion)  |
| No                    | 75                     |
| Uncontacted           | 400                    |

Features:

- Filter by market (country) and region
- Adjustable TAM totals per region
- Visual indicators (progress bars, percentages)
- Summary totals across all regions

### 2. Daily Outreach Tracker

Activity monitoring view:

- Today's emails sent vs. target (gauge/progress indicator)
- Daily trend chart (last 30/60/90 days)
- Weekly and monthly aggregations
- Response rate over time
- Cumulative outreach numbers

### 3. Pipeline Dashboard

**Summary Mode** (default for investors/board):
- 4 macro buckets: Qualifying | Converting | Customers | Cold/Lost
- Counts and % in each bucket
- Movement between buckets over time

**Detailed Mode** (toggle for sales team):
- All 4 AC pipelines with individual stages
- Stage distribution (bar/funnel chart)
- Count at each stage
- Average time in stage
- Stale lead alerts (e.g., >14 days in same stage)
- Drill-down to individual school records

### 4. Conversion Metrics

Derived analytics:

- Contact → Reply rate
- Reply → Yes rate
- Full funnel: New Lead → Won conversion rate
- Trends over time
- By region comparison

---

## Data Input Methods

### CSV/Spreadsheet Upload

- Upload school lists (name, region, type, contact info)
- Bulk status updates
- TAM count adjustments
- Template provided for consistent formatting

### ActiveCampaign Integration (from day one)

**CRM:** ActiveCampaign (API v3)
**Base URL:** https://the-ear.api-us1.com
**Current data:** 7,760 contacts

Sync capabilities:
- **Contacts**: Pull contact records and match to school database
- **Deal/Pipeline data**: Sync deal stages across all 4 pipelines
- **Emails sent**: Pull outreach email counts per contact/day
- **Emails received**: Track replies automatically
- **Tags**: Leverage existing tags (HOT/WARM/COLD, lead sources, events)
- **Status automation**: Auto-update school status based on email activity
  - Email sent → mark as `contacted`
  - Reply received → mark as `replied`

### Manual Entry

- Add/edit individual school records
- Update pipeline stages
- Set daily outreach targets
- Override automated statuses when needed
- Adjust TAM totals per region

---

## Authentication

- Simple password-based access
- Two roles:
  - **Admin**: Full access (CRUD on all data, settings, uploads, AC sync)
  - **Viewer**: Read-only dashboard access (for investors/board)

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js (App Router)                |
| UI             | Tailwind CSS + shadcn/ui components |
| Charts         | Recharts                            |
| Database       | PostgreSQL                          |
| ORM            | Prisma                              |
| Auth           | Simple middleware-based auth        |
| Deployment     | Vercel                              |
| AC Integration | ActiveCampaign REST API v3          |

---

## Build Phases

### Phase 1 — Foundation + TAM Dashboard + AC Connection

- Project setup (Next.js, Prisma, PostgreSQL)
- Data model implementation (markets, regions, schools, pipelines)
- ActiveCampaign API connection and contact sync
- CSV upload for school data (with region mapping)
- TAM overview dashboard (region-level view with known vs. total)
- Manual school record management (add/edit/status)
- Simple password auth

### Phase 2 — Outreach & Activity Tracking

- Daily outreach logging (AC integration + manual entry)
- Outreach vs. target dashboard
- Response tracking (from AC)
- Trend charts (daily/weekly/monthly)

### Phase 3 — Pipeline Dashboard

- Pipeline summary view (macro buckets for board)
- Pipeline detailed view (all AC stages for sales team)
- Time-in-stage tracking
- Stale lead alerts
- Conversion funnel analytics

### Phase 4 — Polish & Expand

- Investor/board-ready presentation mode
- Multi-market support (UK, other African countries)
- Historical snapshots (point-in-time reporting)
- Export functionality (PDF reports)
- Tag-based analytics (lead source performance, event ROI)

---

## Initial Regions

### South Africa (9 Provinces)

1. Eastern Cape
2. Free State
3. Gauteng
4. KwaZulu-Natal
5. Limpopo
6. Mpumalanga
7. North West
8. Northern Cape
9. Western Cape

### United Kingdom (to be configured)

Regions TBD based on sales territory structure.

### Other African Countries (future)

To be added as expansion progresses.
