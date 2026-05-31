# ⚡ KVR Motors ERP

> A multi-branch Electric Vehicle dealership ERP & inventory management platform for **KVR Motors** and **Future Ride** showrooms — built with a Django REST backend, a Next.js web dashboard, and an Expo (React Native) mobile app.

<p align="left">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Django%20REST-092E20?logo=django&logoColor=white" />
  <img alt="Web" src="https://img.shields.io/badge/Web-Next.js%2016-000000?logo=nextdotjs&logoColor=white" />
  <img alt="Mobile" src="https://img.shields.io/badge/Mobile-Expo%20%2F%20RN-000020?logo=expo&logoColor=white" />
  <img alt="DB" src="https://img.shields.io/badge/DB-PostgreSQL%2016-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Auth" src="https://img.shields.io/badge/Auth-JWT-FB015B?logo=jsonwebtokens&logoColor=white" />
</p>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Repository Structure](#-repository-structure)
5. [Business Structure](#-business-structure)
6. [Roles & Permissions](#-roles--permissions)
7. [Backend — Modules & API](#-backend--modules--api)
8. [Data Models](#-data-models)
9. [Mobile App — Features by Role](#-mobile-app--features-by-role)
10. [Web Dashboard — Features by Role](#-web-dashboard--features-by-role)
11. [Design System](#-design-system)
12. [Icon Reference](#-icon-reference)
13. [Getting Started](#-getting-started)
14. [Environment & Configuration](#-environment--configuration)
15. [API Quick Reference](#-api-quick-reference)
16. [Roadmap / Pending Work](#-roadmap--pending-work)

---

## 🚀 Overview

KVR Motors ERP digitizes and centralizes all dealership operations across multiple branches and showrooms:

- 🏍️ **Vehicle inventory** — models + uniquely tracked physical units (VIN / motor / chassis)
- 🔋 **Battery stock** with **FIFO enforcement** and supervisor override workflow
- 💸 **Sales** — checkout, invoice generation, vehicle + battery allocation
- 📝 **Advance bookings** — token deposits, supervisor lock & verification
- 🧲 **Leads & enquiries** — pipeline stages, allocation, follow-ups
- 🚚 **Inter-godown stock transfers** with approvals
- 📒 **Ledger** — income/expense financial entries
- 🛒 **Purchases** — purchase orders & stock intake
- 🏢 **Multi-branch / multi-showroom** management
- 👥 **Role-based dashboards** on web and mobile

The platform ships **three clients** against **one Django API**:

| Client | Tech | Audience |
| --- | --- | --- |
| 📱 Mobile app | Expo / React Native | Supervisor, Sales Executive, Operations Staff |
| 🖥️ Web dashboard | Next.js | Owner, Supervisor, Sales |
| 🛠️ Admin | Django Admin (Jazzmin) | Admin / superuser |

---

## 🧭 System Architecture

```text
                          ┌─────────────────────┐
                          │     Mobile App       │
                          │  Expo / React Native │
                          │ (Supervisor / Sales / │
                          │   Operations Staff)   │
                          └──────────┬───────────┘
                                     │ HTTPS / JWT
                                     ▼
┌────────────────────┐      ┌─────────────────────┐      ┌──────────────────────┐
│   Web Dashboard    │─────▶│     Django REST      │◀─────│   Django Admin        │
│     Next.js 16     │      │  API (DRF + JWT)     │      │   (Jazzmin theme)     │
│ (Owner/Supervisor/ │      │  /api/v1, /api/auth  │      └──────────────────────┘
│      Sales)        │      └──────────┬───────────┘
└────────────────────┘                 │
                          ┌────────────▼─────────────┐
                          │     Business Modules       │
                          │  users · branches ·        │
                          │  vehicles · inventory ·    │
                          │  battery · sales ·         │
                          │  purchases · leads ·       │
                          │  ledger · booking ·        │
                          │  dashboard                 │
                          └────────────┬─────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │     PostgreSQL 16         │
                          │     (Docker hosted)       │
                          └───────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend (`/backend`)

| Package | Purpose |
| --- | --- |
| `Django >= 5.0` | Core web framework |
| `djangorestframework` | REST API layer |
| `djangorestframework-simplejwt` | JWT auth (access 1 day / refresh 7 days, rotating) |
| `django-cors-headers` | CORS (all origins allowed in dev) |
| `drf-spectacular` | OpenAPI 3 schema + Swagger UI + ReDoc |
| `django-jazzmin` | Themed Django admin |
| `psycopg2-binary` | PostgreSQL driver |
| `python-dotenv` | Env var loading |

### Web Dashboard (`/dashboards`)

| Package | Purpose |
| --- | --- |
| `next@16` + `react@19` | App Router web framework |
| `tailwindcss@4` | Styling |
| `recharts` | Analytics charts |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Forms & validation |
| `@reduxjs/toolkit` + `react-redux` | State management |
| `axios` | HTTP client |
| `lucide-react` + `react-icons` | Icons |
| `lenis` | Smooth scrolling |

### Mobile App (`/mobile-app`)

| Package | Purpose |
| --- | --- |
| `expo ~54` + `expo-router ~6` | App framework + file-based routing |
| `react-native 0.81` + `react@19` | Core |
| `react-native-reanimated` + `react-native-gesture-handler` | Animations & gestures |
| `react-native-safe-area-context` + `react-native-screens` | Navigation primitives |
| `nativewind` + `tailwindcss` | Styling |
| `lucide-react-native` + `react-native-svg` | Icons |
| `axios` | HTTP client |
| `expo-secure-store` | Encrypted JWT storage |
| `expo-image`, `expo-glass-effect`, `expo-symbols` | Native UI polish |

### Infrastructure

- **PostgreSQL 16** in Docker (`docker-compose.yml`)
- **Dockerized** backend + web frontend services
- Timezone `Asia/Kolkata`, currency `₹ (INR)`

---

## 📂 Repository Structure

```text
kvr-motors-erp/
├── backend/                  # Django REST API
│   ├── config/               # settings, urls, wsgi/asgi
│   ├── users/                # custom User model + JWT auth
│   ├── branches/             # Branch, Showroom, InventoryLocation
│   ├── vehicles/             # VehicleBrand, VehicleModel, VehicleUnit (+ lookup)
│   ├── battery/              # Battery + FifoOverride (+ check-fifo)
│   ├── inventory/            # StockTransfer
│   ├── sales/                # SalesInvoice
│   ├── booking/              # AdvanceBooking
│   ├── leads/                # Lead
│   ├── purchases/            # PurchaseOrder
│   ├── ledger/               # LedgerEntry
│   ├── dashboard/            # analytics placeholder
│   └── requirements.txt
│
├── dashboards/               # Next.js web dashboard
│   └── app/
│       ├── login/
│       ├── owner/            # batteries, bookings, branches, leads, ledger,
│       │                     # purchases, reports, sales, settings, stock, users, vehicles
│       ├── supervisor/       # batteries, bookings, leads, reports, sales, stock, vehicles
│       ├── sales/            # customers, followups, leads, reports, sales_bookings
│       ├── components/       # Navbar, Sidebar, Table, Modal, DashboardCard, ...
│       ├── context/          # AuthContext
│       └── services/         # axios API clients per module
│
├── mobile-app/               # Expo React Native app
│   └── src/
│       ├── app/
│       │   ├── index.tsx           # splash + role router
│       │   ├── _layout.tsx         # root auth gate / stack
│       │   ├── login/
│       │   ├── owner/              # dashboard, inventory, leads, bookings, sales,
│       │   │                       # branches, ledger, purchases, users, profile
│       │   ├── supervisor/         # dashboard, fifo-overrides, transfers,
│       │   │                       # leads-assignment, bookings, inventory, leads, profile
│       │   ├── sales/              # dashboard, leads, followups, booking-form,
│       │   │                       # checkout, customers, profile
│       │   └── staff/              # dashboard, godown-scanner, pdi-checklist,
│       │                           # handover, profile
│       ├── components/             # ThemedText/View, FadeScaleTransition, RoleProfile, ...
│       ├── context/                # AuthContext, DrawerContext
│       ├── services/               # api.ts (axios + JWT refresh interceptor)
│       ├── constants/              # theme.ts (Colors, Spacing, Fonts)
│       └── hooks/
│
├── docker-compose.yml        # postgres + backend + frontend
├── PRD.md                    # Product Requirements Document
├── kiro_prompts.md           # Screen scaffolding prompts
└── roadmap.md
```

---

## 🏢 Business Structure

**Branches**

- **Visakhapatnam** — KVR Showroom, Future Ride Showroom
- **Srikakulam** — KVR Showroom
- **Kakinada** — KVR Showroom

**Showroom Categories**

- **KVR** → Kinetic Green, Frankly, Dynamo, Others
- **Future Ride** → Kinetiq, Watts Engineering

**Inventory Locations** — Pendurthi Godown, Pineapple Colony Godown, Isukapalem Showroom, Akkayyapalem, Srikakulam, Kakinada.

---

## 👥 Roles & Permissions

Defined on the custom `users.User` model (`role` field):

| Role | Key | Clients | Capabilities |
| --- | --- | --- | --- |
| 👑 Admin | `admin` | Django Admin | Full system configuration |
| 🧑‍💼 Owner | `owner` | Web + Mobile | Analytics, reports, inventory, branch & staff performance |
| 🛡️ Supervisor | `supervisor` | Web + Mobile | Branch inventory, approvals, lead assignment, booking locks, FIFO overrides |
| 🤝 Sales Executive | `sales_executive` | Mobile | Leads, customers, sales, bookings, vehicle allocation |
| 💼 Sales | `sales` | Web + Mobile | Assigned leads, customers, booking updates, basic inventory |
| 🔧 Operations Staff | `staff` | Mobile | Yard tasks, VIN scanning, PDI checklist, customer handover |

**Auth & redirect logic**

- JWT login at `POST /api/auth/login/` returns `{ access, refresh, user }`.
- Mobile stores tokens in `expo-secure-store`; an axios interceptor auto-refreshes on 401.
- After login each role is routed to its dashboard:
  - `owner → /owner/dashboard`
  - `sales` / `sales_executive → /sales/dashboard`
  - `supervisor → /supervisor/dashboard`
  - `staff` / `operations → /staff/dashboard`

---

## 🔧 Backend — Modules & API

All business endpoints are served under `/api/v1/` via a DRF `DefaultRouter`. Auth lives under `/api/auth/`.

| Module | Endpoint(s) | Highlights |
| --- | --- | --- |
| **Auth** (`users`) | `auth/login/`, `auth/refresh/`, `auth/me/` | JWT with custom claims (role, branch, showroom) |
| **Users** | `users/` | Owner/Admin-gated user management |
| **Branches** | `branches/`, `showrooms/`, `inventory-locations/` | Multi-branch structure |
| **Vehicles** | `vehicle-brands/`, `vehicle-models/`, `vehicle-units/` | `vehicle-units/lookup/?q=` auto-fill by VIN/motor/chassis |
| **Battery** | `batteries/`, `fifo-overrides/` | `batteries/check-fifo/?serial=` validates oldest-stock rule |
| **Inventory** | `stock-transfers/` | Inter-godown transfers with status workflow |
| **Sales** | `sales-invoices/` | Invoice + vehicle/battery allocation |
| **Booking** | `bookings/` | Advance token bookings, PDI flag, supervisor lock |
| **Leads** | `leads/` | Pipeline stages + executive assignment |
| **Purchases** | `purchase-orders/` | Supplier POs, auto total price |
| **Ledger** | `ledger-entries/` | Income/expense financial records |

**API docs (auto-generated):**

- Swagger UI → `/api/schema/swagger-ui/`
- ReDoc → `/api/schema/redoc/`
- Raw schema → `/api/schema/`

---

## 🗃 Data Models

| Model | Important Fields | Status / Choice Values |
| --- | --- | --- |
| **User** | `username`, `full_name`, `role`, `branch`, `showroom`, `phone_number` | roles: admin, owner, supervisor, sales_executive, sales, staff |
| **Branch / Showroom / InventoryLocation** | `name`, `branch`, `is_active` | — |
| **VehicleBrand** | `name`, `is_active` | — |
| **VehicleModel** | `brand`, `model_name`, `base_price`, `color_variants`, `battery_compatibility` | active / inactive |
| **VehicleUnit** | `vin_number`, `motor_number`, `chassis_number`, `color`, `assigned_battery`, `purchase_date` | available, reserved, booked, sold, in_transit, service, damaged |
| **Battery** | `serial_number`, `capacity`, `purchase_date`, `supplier`, `warranty_years` | available, assigned, sold, damaged, returned — ordered by `purchase_date` (FIFO) |
| **FifoOverride** | `battery`, `sales_executive`, `invoice_reference`, `reviewed_by` | pending, approved, rejected |
| **StockTransfer** | `transfer_id`, `vehicle_unit`, `from_location`, `to_location`, `requested_by`, `approved_by` | pending, approved, in_transit, received, rejected |
| **SalesInvoice** | `invoice_number`, `customer_name`, `customer_contact`, `vehicle_unit`, `assigned_battery`, `sale_price`, `payment_mode`, `insurance_partner`, `branch` | processing, ready, delivered |
| **AdvanceBooking** | `booking_id`, `customer_name`, `contact_number`, `vehicle_model`, `color`, `payment_mode`, `payment_reference`, `advance_amount`, `expiry_date`, `pdi_verified` | pending, confirmed, converted, cancelled, expired |
| **Lead** | `customer_name`, `contact_number`, `interested_vehicle`, `lead_source`, `assigned_executive`, `follow_up_date`, `notes` | enquiry, new_lead, contacted, follow_up, negotiation, won, lost |
| **PurchaseOrder** | `po_number`, `supplier_name`, `vehicle_model`, `quantity`, `unit_price`, `total_price` (auto) | pending, approved, received, cancelled |
| **LedgerEntry** | `transaction_id`, `ledger_type`, `branch`, `income`, `expense`, `payment_mode`, `approved_by` | sales_income, purchase_expense, salary_expense, operational_expense, booking_amount, refund, transfer_expense |

> **FIFO rule:** Batteries are ordered by `purchase_date`. `check-fifo` compares a selected serial against the oldest available pack of the same capacity/location and flags a violation, which a sales executive can escalate via a `FifoOverride` request for supervisor approval.

---

## 📱 Mobile App — Features by Role

The mobile app uses a **premium light-theme design language**: a slate canvas (`#f8fafc`), an obsidian hero header (`#0a0e1a` / `#090d16`), brand green accents (`#04a700`), fully-rounded pill controls, and hardware-accelerated micro-animations (reanimated). Every list screen loads live API data with graceful demo fallbacks and pull-to-refresh.

### 🛡️ Supervisor App (`src/app/supervisor/`)

Bottom tabs: **Approvals** · **Inventory** · **Leads Control**

| Screen | Icon | Functionality |
| --- | --- | --- |
| **Command Dashboard** (`dashboard.tsx`) | `ClipboardCheck` | Telemetry metrics, ops command grid, live FIFO + booking queues with approve/reject |
| **FIFO Override Queue** (`fifo-overrides.tsx`) | `ShieldAlert`, `BatteryCharging` | Battery exception cards, violation banner, approve-bypass / reject pills, processing overlay |
| **Stock Transfers** (`transfers.tsx`) | `Truck`, `Warehouse`, `Boxes` | Create-transfer modal (VIN, from/to, priority), timeline feed, expandable detail, advance status |
| **Lead Allocation** (`leads-assignment.tsx`) | `UserCheck`, `Globe`, `MapPin` | Unassigned lead cards, bottom-drawer executive roster, fade-out on assign |
| **Booking Lock Queue** (`bookings.tsx`) | `Lock`, `ShieldCheck`, `CreditCard` | Deposit verification, color/payment details, confirm-lock / reject-refund |
| **Inventory** (`inventory.tsx`) | `Boxes`, `Zap` | Vehicles + batteries segmented view, FIFO rank-1 highlight |
| **Leads** (`leads.tsx`) | `Users`, `Compass` | Lead roster with All/Unassigned/Assigned filters, route/de-route |
| **Profile** (`profile.tsx`) | `User` | Role profile (shared `RoleProfile`) |

### 🤝 Sales Executive App (`src/app/sales/`)

Bottom tabs: **Home** · **Leads** · **Followups**

| Screen | Icon | Functionality |
| --- | --- | --- |
| **Sales Dashboard** (`dashboard.tsx`) | `TrendingUp`, `MapPin` | Total sales / active leads / conversion metrics, quick ops, walk-in booking CTA, pipeline feed |
| **Leads Directory** (`leads.tsx`) | `Users`, `Plus`, `Edit` | Status filter pills, register-lead modal (model + source dropdowns), update-stage flow |
| **Follow-ups** (`followups.tsx`) | `CalendarDays`, `PhoneCall` | Today/Overdue vs Upcoming agenda, log-call-outcome modal with reschedule |
| **Token Booking** (`booking-form.tsx`) | `FileText`, `IndianRupee`, `CreditCard` | Color + advance + payment pill selectors, inline validation, success receipt modal → supervisor lock queue |
| **Checkout & Invoice** (`checkout.tsx`) | `ShoppingBag`, `Search`, `AlertTriangle`, `Shield` | VIN auto-fill lookup, FIFO battery guard, request-supervisor-override with live polling, invoice dispatch |
| **Customers** (`customers.tsx`) | `Users`, `CreditCard` | Invoiced clients directory, search, delivery status badges |
| **Profile** (`profile.tsx`) | `User` | Role profile |

### 🔧 Operations & Yard Staff App (`src/app/staff/`)

Bottom tabs: **Queue** · **Scanner** · **PDI**

| Screen | Icon | Functionality |
| --- | --- | --- |
| **Operations Dashboard** (`dashboard.tsx`) | `Boxes`, `Check` | Live status capsules, real pending-PDI + transfer telemetry, task checkboxes with micro-animation |
| **Godown VIN/QR Scanner** (`godown-scanner.tsx`) | `ScanLine`, `Keyboard`, `PackageCheck`, `Truck` | Scanner frame, movement-type selector, manual entry, action log with "SYNCED" verification badge |
| **PDI Checklist** (`pdi-checklist.tsx`) | `ClipboardCheck`, `Car`, `Check` | Vehicle info card, 5-step toggle checklist, progress bar, submit → persists `pdi_verified` to booking |
| **Customer Handover** (`handover.tsx`) | `KeyRound`, `PenLine`, `Trash2` | Delivery target card, item checklist, signature pad, complete → settles sales invoice as delivered |
| **Profile** (`profile.tsx`) | `User` | Role profile |

### 👑 Owner App (`src/app/owner/`)

Dashboard plus inventory, leads, bookings, sales, branches, ledger, purchases, users, and profile screens for enterprise oversight on mobile.

---

## 🖥️ Web Dashboard — Features by Role

Next.js App Router app under `/dashboards/app`, with axios service clients per module and Recharts analytics.

| Role | Routes |
| --- | --- |
| 👑 **Owner** | `vehicles`, `stock`, `batteries`, `bookings`, `branches`, `leads`, `ledger`, `purchases`, `sales`, `reports`, `users`, `settings` |
| 🛡️ **Supervisor** | `vehicles`, `stock`, `batteries`, `bookings`, `leads`, `sales`, `reports` |
| 💼 **Sales** | `leads`, `customers`, `followups`, `sales_bookings`, `reports` |

Shared UI components: `Navbar`, `Sidebar`, `DashboardSidebar`, `BottomNav`, `Table`, `Modal`, `DashboardCard`, `EmptyState`, `Loader`, `SmoothScrollProvider`.

---

## 🎨 Design System

| Token | Value | Usage |
| --- | --- | --- |
| Slate canvas | `#f8fafc` | App background |
| Obsidian header | `#0a0e1a` / `#090d16` | Hero decks, nav bars |
| Brand green | `#04a700` | Primary actions, accents, active states |
| Card surface | `#ffffff` | Cards, sheets |
| Hairline border | `#f1f5f9` / `#e2e8f0` | Card borders, dividers |
| Text primary | `#0f172a` | Headlines |
| Text secondary | `#64748b` / `#94a3b8` | Captions, labels |
| Danger | `#d71d22` / `#ef4444` | Reject / errors |
| Info blue | `#2563eb` | In-transit, secondary status |
| Warning orange | `#ea580c` / `#fb923c` | FIFO / pending alerts |

Conventions: `borderRadius: 18` cards · `borderRadius: 9999` pills · `52px` primary CTAs · soft shadows · `FadeScaleTransition` screen entrance · spacing scale in `constants/theme.ts`.

---

## 🔣 Icon Reference

Mobile uses **`lucide-react-native`**; web uses **`lucide-react`** + **`react-icons`**; Django admin uses **Font Awesome** (via Jazzmin).

| Icon | Where it's used |
| --- | --- |
| `ClipboardCheck` | Supervisor approvals, PDI |
| `ShieldAlert` / `Shield` / `ShieldCheck` | FIFO overrides, security/verification |
| `BatteryCharging` / `Zap` | Battery serials & power |
| `Truck` / `Warehouse` / `Boxes` / `PackageCheck` | Transfers, godown, stock movements |
| `UserCheck` / `Users` / `User` | Lead allocation, rosters, profiles |
| `Lock` / `KeyRound` | Booking locks, key handover |
| `CreditCard` / `IndianRupee` / `Landmark` | Payments, finance |
| `ScanLine` / `Keyboard` | VIN/QR scanning, manual entry |
| `Car` | Vehicle info |
| `TrendingUp` / `BarChart` | Metrics & analytics |
| `CalendarDays` / `Clock` | Follow-ups, scheduling |
| `PhoneCall` / `Globe` / `MapPin` / `Compass` | Contact, lead source, location |
| `ShoppingBag` / `FileText` / `Search` | Checkout, invoices, lookup |
| `Check` / `CheckCircle` / `X` / `AlertTriangle` | Confirm, success, reject, warnings |
| `PenLine` / `Trash2` / `Edit` / `Plus` | Signature, clear, edit, add |
| `Home` / `ArrowLeft` / `ArrowRight` / `ChevronDown` / `ArrowUpRight` | Navigation |

Django admin model icons (Jazzmin): `fa-user-tie` (users), `fa-building` (branch), `fa-store` (showroom), `fa-map-marker-alt` (location), `fa-copyright` (brand), `fa-car` (model), `fa-barcode` (unit).

---

## 🏁 Getting Started

### Prerequisites

- Python 3.11+ · Node.js 18+ · PostgreSQL 16 (or Docker) · Expo CLI / Expo Go

### 1) Database (Docker)

```bash
docker compose up -d db
# Postgres exposed on host port 5433 (container 5432)
```

### 2) Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver       # http://127.0.0.1:8000
```

API docs at `http://127.0.0.1:8000/api/schema/swagger-ui/`.

### 3) Web Dashboard (Next.js)

```bash
cd dashboards
npm install
npm run dev                      # http://localhost:3000
```

### 4) Mobile App (Expo)

```bash
cd mobile-app
npm install
npx expo start                   # scan QR with Expo Go
```

> The mobile app auto-detects the dev host IP from Expo and targets `http://<host>:8000`; on Android emulator it falls back to `http://10.0.2.2:8000`.

### Full stack via Docker

```bash
docker compose up --build
# db :5433 · backend :8004 · frontend :3004
```

---

## ⚙️ Environment & Configuration

Backend reads these env vars (defaults shown):

| Variable | Default | Purpose |
| --- | --- | --- |
| `POSTGRES_DB` | `kvr_motors` | Database name |
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_PASSWORD` | `postgres` | DB password |
| `POSTGRES_HOST` | `localhost` | DB host (`db` in Docker) |
| `POSTGRES_PORT` | `5432` | DB port |
| `DEBUG` | `True` | Debug mode |
| `SECRET_KEY` | dev key | Django secret |

JWT lifetimes: access **1 day**, refresh **7 days** (rotating). CORS allows all origins in development.

> ⚠️ **Production note:** `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS = ['*']`, and `CORS_ALLOW_ALL_ORIGINS` must be hardened before deployment. The default `DEFAULT_PERMISSION_CLASSES` is `AllowAny` — tighten per-view permissions for production.

---

## 📡 API Quick Reference

```http
POST   /api/auth/login/                       # → { access, refresh, user }
POST   /api/auth/refresh/                      # → { access }
GET    /api/auth/me/                           # current user

GET    /api/v1/vehicle-units/lookup/?q=VIN-…   # auto-fill vehicle by VIN/motor/chassis
GET    /api/v1/batteries/check-fifo/?serial=…  # FIFO validation for a battery serial

GET    /api/v1/leads/?assigned_executive=<id>  # filter leads
PATCH  /api/v1/leads/<id>/                     # update stage / assignment
POST   /api/v1/bookings/                       # create advance booking
PATCH  /api/v1/bookings/<id>/                  # confirm/cancel, set pdi_verified
POST   /api/v1/fifo-overrides/                 # request supervisor override
PATCH  /api/v1/fifo-overrides/<id>/            # approve / reject
POST   /api/v1/stock-transfers/                # create transfer
POST   /api/v1/sales-invoices/                 # generate invoice
PATCH  /api/v1/sales-invoices/<id>/            # update delivery status
```

Filterable list endpoints: `bookings` (`status`, `assigned_executive`, `pdi_verified`), `sales-invoices` (`delivery_status`, `sales_executive`, `branch`), `stock-transfers` (`status`, `requested_by`), `ledger-entries` (`ledger_type`, `branch`).

---

## 🗺 Roadmap / Pending Work

Items defined in the PRD / scaffolding spec that are **not yet implemented**:

- 📞 **Call dialer & WhatsApp launchers** on sales follow-ups/leads (`Linking` / `wa.me`)
- 🎯 Sales dashboard **target ring** + **branch leaderboard** widgets
- 🛡️ Supervisor **active shift leaderboard** with progress rings
- 📷 Real **camera** VIN/QR scanning (currently simulated) and a drawable **signature canvas** (currently tap-to-confirm)
- 🔁 **Backend automation:** stock deduction on sale, auto ledger entries from sales/purchases, booking-to-sale conversion & vehicle locking, battery status change on override approval
- 🔔 **Notifications** (follow-up reminders, booking expiry, low stock, FIFO warnings)
- 📊 **Reports module** & 🧾 **Audit/activity logs**
- 🔮 Future: WhatsApp/SMS integration, GST invoicing, payment gateway, vendor portal, AI analytics

See [`roadmap.md`](./roadmap.md) and [`PRD.md`](./PRD.md) for the full backlog.

---

<p align="center"><i>KVR Motors ERP — centralizing multi-branch EV dealership operations across web and mobile.</i></p>
