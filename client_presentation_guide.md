# 🎯 KVR Motors ERP — Client Presentation Guide

> **Purpose**: This document is your complete script for explaining the KVR Motors ERP system to the client. Read through each section before the meeting. Every role, module, data flow, and connection is covered.

---

## 📌 Opening Pitch (Start Here)

> *"KVR Motors ERP is a centralized, multi-branch Electric Vehicle dealership management platform that digitizes your entire operation — from the moment a customer walks in, to vehicle delivery, to financial accounting — all in one system. Every branch, every showroom, every team member works on the same real-time data. No more spreadsheets, no more phone calls to check stock, no more manual ledger entries."*

### Key Value Propositions (Tell the Client)

| # | Value | What It Means |
|---|-------|---------------|
| 1 | **One System, All Branches** | Visakhapatnam, Srikakulam, Kakinada — all connected in real-time |
| 2 | **Role-Based Dashboards** | Every team member sees exactly what they need — nothing more, nothing less |
| 3 | **Real-Time Inventory** | Know which vehicle is in which godown, which battery is available, instant VIN lookup |
| 4 | **Automated Financial Tracking** | Every sale, purchase, expense, and booking automatically updates the General Ledger |
| 5 | **Battery FIFO Enforcement** | System ensures oldest batteries are sold first — compliance built in |
| 6 | **Web + Mobile** | Managers use the web dashboard; field sales team uses the mobile app |
| 7 | **Complete Audit Trail** | Every action (create, update, delete, login) is logged with user, timestamp, and IP address |

---

## 🏗️ System Architecture (Show This Diagram)

```
                          ┌─────────────────────┐
                          │     📱 Mobile App    │
                          │  (Expo/React Native) │
                          │  Sales · Supervisor  │
                          │  Staff · Owner       │
                          └──────────┬───────────┘
                                     │ HTTPS / JWT Auth
                                     ▼
┌────────────────────┐      ┌─────────────────────┐      ┌──────────────────────┐
│  🖥️ Web Dashboard  │─────▶│   🔧 Django REST    │◀─────│  🛠️ Django Admin     │
│    (Next.js 16)    │      │   API Backend       │      │  (Super Admin)       │
│  Owner/Supervisor  │      │   /api/v1/          │      └──────────────────────┘
│  Sales/Telecaller  │      └──────────┬───────────┘
│  Staff             │                 │
└────────────────────┘    ┌────────────▼─────────────┐
                          │   🗄️ PostgreSQL Database  │
                          │   (Docker Hosted)         │
                          └───────────────────────────┘
```

> **Tell the client**: *"There are 3 ways to access the system: Web Dashboard for managers and office staff, Mobile App for field teams, and Django Admin for the super administrator. All three connect to the same backend API and same database — so data is always consistent and real-time."*

---

## 🏢 Business Structure (Explain This First)

> *"The system is designed around YOUR exact business structure:"*

### Branches
| Branch | Showrooms |
|--------|-----------|
| **Visakhapatnam** | KVR Showroom, Future Ride Showroom |
| **Srikakulam** | KVR Showroom |
| **Kakinada** | KVR Showroom |

### Showroom Categories (Brands)
| Showroom | Vehicle Brands |
|----------|---------------|
| **KVR** | Kinetic Green, Frankly, Dynamo, Others |
| **Future Ride** | Kinetiq, Watts Engineering |

### Inventory Locations (Godowns + Showrooms)
1. Pendurthi Godown
2. Pineapple Colony Godown
3. Isukapalem Showroom
4. Akkayyapalem
5. Srikakulam
6. Kakinada

> *"Every vehicle and battery is tracked at the location level. When stock moves from Pendurthi Godown to Isukapalem Showroom, the system creates a transfer record with approval workflow."*

---

## 👥 Roles & Access Levels

> *"We've built 6 distinct roles, each with their own dashboard and permissions. Let me walk you through each one:"*

```
👑 Owner (Full Enterprise Access)
  └── 🛡️ Supervisor (Branch-Level Management)
        ├── 💼 Sales Executive (Customer-Facing Sales)
        ├── 📞 Telecaller (Lead Generation & Calls)
        └── 📦 Staff (Warehouse & Inventory Operations)
```

> *"The hierarchy is strict — a Supervisor can only see their own branch data. A Sales Executive can only see their own leads and bookings. The Owner sees everything across all branches."*

---

# ROLE 1: 👑 OWNER

> *"The Owner is the business leader. They have unrestricted access to the entire enterprise. This is where you, the business owner, will spend most of your time."*

## Owner Dashboard — What They See

When the Owner logs in, they land on an **Executive Dashboard** with:

| Metric Card | What It Shows |
|-------------|---------------|
| **Units Sold** | Total vehicles sold across all branches |
| **Vehicles in Stock** | Total available inventory across all locations |
| **Total Leads** | Active leads in the sales pipeline |
| **Receivables** | Outstanding payment amounts |
| **Net Cashflow** | Income minus expenses (real-time) |

Plus interactive charts:
- 📊 **Sales Trend Chart** — Monthly/weekly sales comparison
- 🔄 **Leads Funnel** — Visual pipeline from Enquiry → Won
- 📦 **Inventory Telemetry** — Stock levels across locations
- 🏢 **Branch Performance Comparison** — Side-by-side branch metrics

### Key Feature: Branch Selector
> *"At the top of every page, there's a Branch Selector. The Owner can filter everything by 'All Branches', or drill down to 'KVR Motors - Visakhapatnam', 'KVR Motors - Srikakulam', or 'KVR Motors - Kakinada'. Every metric, chart, and table updates dynamically."*

### Key Feature: Showroom Category Pills
> *"Below the branch selector, there are brand filter pills — Kinetic, Future, Dynamo, Watts. Click one and the entire dashboard filters to that brand only."*

## Owner Modules (23 Total)

### 1. 🏢 Branch Management
> *"Create, edit, activate/deactivate branch outlets and showrooms. Assign managers, set monthly targets, track performance."*

- Create new branches with address, phone, manager name
- Each branch has showrooms and inventory locations
- Toggle active/inactive status from modal (not inline) — cleaner UI
- Track: Total Stock, Sales Volume, Monthly Target, Achievement %

**Data Flow**: Branch → Showrooms → Inventory Locations → Vehicle Units all cascade. Add a branch, then add showrooms under it, then locations under those.

---

### 2. 🏍️ Vehicle Catalog (Vehicle Models)
> *"This is your master catalog — every EV model you sell, with pricing, colors, and specs."*

- **Vehicle Brands**: Kinetic Green, Frankly, Dynamo, Kinetiq, Watts Engineering
- **Vehicle Models**: Each brand has multiple models with:
  - Model Name, Base Price
  - Color Variants (stored as a list — e.g., ["Red", "Blue", "White"])
  - Battery Compatibility info
  - Active/Inactive status

**How it connects**: When a Sales Executive creates a lead or booking, they pick from this catalog. When stock units arrive, they're linked to a model from this catalog.

---

### 3. 📦 Stock Management (VIN Registry)
> *"This is where individual physical vehicles are tracked — every single unit with its unique VIN, motor number, and chassis number."*

**Stock Unit Fields**:
- VIN Number, Motor Number, Chassis Number (at least one required)
- Linked to: Vehicle Model, Branch, Showroom, Inventory Location
- Color, Purchase Date, Purchase Invoice Number
- Stock Status: `Available` → `Reserved` → `Booked` → `Sold`
- Payment Status: Pending / Success / Failed
- Assigned Battery (serial number)

**Unique Feature — Auto-Fill**:
> *"If someone types a VIN number, motor number, or chassis number, the system automatically fetches the full vehicle details — model, color, status, location, battery. No manual searching needed."*

**Stock Operations**:
- **Stock In**: New vehicles arrive → registered with VIN
- **Stock Out**: Vehicles sold or dispatched
- **Inter-Branch Transfers**: Move vehicle from one location to another with approval workflow
- **Filter Alert Banner**: When filters are active, a dynamic alert shows exactly how many units match

**Data Flow**: Vehicle Model (catalog) → Vehicle Unit (physical stock) → Sales Invoice (when sold) → Ledger Entry (financial record)

---

### 4. 💸 Sales Management
> *"Every vehicle sale generates a Sales Invoice with complete tracking."*

**Invoice Fields**:
- Auto-generated Invoice Number
- Customer Name & Contact
- Vehicle Unit (linked by VIN)
- Assigned Battery (linked by serial)
- Sale Price
- Payment Mode (Cash / UPI / Card / Bank Transfer / Bajaj Finance / Split Payment)
- Split Payment Details (if split — breakdown of cash, card, UPI, Bajaj amounts)
- Insurance Partner
- Delivery Status: `Processing` → `Ready for Delivery` → `Delivered`
- Sales Executive (who made the sale)
- Branch

**What happens automatically when a sale is created**:
1. Vehicle Unit status changes from `Available` to `Sold`
2. Battery status changes from `Available` to `Sold`
3. A Ledger Entry is auto-created as `Sales Income`
4. Dashboard metrics update in real-time

---

### 5. 🛒 Purchase Orders
> *"Track all vehicle purchases from suppliers."*

- Auto-generated PO Number (format: `PO-2026-XXXX`)
- Supplier Name, Vehicle Model, Quantity, Unit Price
- Total Price auto-calculated (Quantity × Unit Price)
- Payment Terms, Estimated Delivery, Actual Delivery
- Status: `Pending` → `Approved` → `Received` → `Cancelled`

**What happens automatically**:
- When a PO is approved, a Ledger Entry is auto-created as `Purchase Expense`
- The **PURCHASE COST** card on the dashboard updates
- **NET CASHFLOW** subtracts the expense in real-time

---

### 6. 🧲 Lead Management (Kanban Pipeline)
> *"This is your sales pipeline — from first enquiry to closed deal."*

**Lead Stages** (visual Kanban board):
```
Enquiry → New Lead → Contacted → Follow-up → Negotiation → Won / Lost
```

**Lead Fields**:
- Customer Name, Contact Number
- Interested Vehicle (select from catalog)
- Lead Source: Walk-in, Website, Reference, Phone, Social Media
- Assigned Executive (who's responsible)
- Follow-up Date, Notes
- Branch

**Key Feature — Drag & Drop**:
> *"Leads can be dragged between stages on the Kanban board. When a lead is marked 'Won', it can be converted to a Booking or direct Sale."*

**Data Flow**: Lead → Assigned to Sales Executive → Follow-ups scheduled → Won → Advance Booking or Sales Invoice

---

### 7. 📋 Advance Bookings
> *"Customers can reserve a vehicle with an advance deposit."*

**Booking Fields**:
- Auto-generated Booking ID (format: `BK-2026-XXXX`)
- Customer Name, Contact Number
- Vehicle Model, Color
- Advance Amount
- Payment Mode + Split Payment Details
- Expiry Date (booking valid until)
- Status: `Pending` → `Confirmed` → `Converted to Sale` → `Cancelled` → `Expired`
- Assigned Executive
- PDI Verified: Yes / Pending / No

**What happens automatically**:
- A Ledger Entry is auto-created as `Booking Amount` (income)
- If booking is cancelled, the ledger entry is auto-deleted (cascade)
- If booking details change, the ledger entry auto-syncs

**Connection to Sales**: When a booking is "Converted to Sale", it flows into the Sales Invoice module.

---

### 8. 🔋 Battery Registry
> *"Every battery is individually tracked with serial numbers."*

**Battery Fields**:
- Serial Number (unique), Battery Code
- Capacity (e.g., "1.2 kWh", "2.0 kWh")
- Purchase Date, Supplier, Warranty Years
- Status: `Available` → `Assigned` → `Sold` → `Damaged` → `Returned`
- Location (which godown/showroom)

**🔴 FIFO Enforcement (Critical Feature)**:
> *"The system enforces First-In-First-Out for battery sales. The oldest battery MUST be sold first."*

- Batteries are sorted by purchase date automatically
- When a sale is made, the system checks if the selected battery is the oldest available
- If a newer battery is selected:
  - ⚠️ Warning message appears
  - A **FIFO Override Request** is created
  - Supervisor must approve or reject the override
- Override record includes: Battery, Sales Executive, Invoice Reference, Reviewed By

**Data Flow**: Battery purchased → Registered with serial → Assigned to Vehicle Unit → Sold with Sales Invoice → Status updated automatically

---

### 9. 📒 General Ledger (Financial Accounting)
> *"The financial heart of the system. Every rupee in and out is tracked here."*

**Ledger Entry Types**:
| Type | Direction | Auto-Created From |
|------|-----------|-------------------|
| Sales Income | 💚 Inflow | Sales Invoice creation |
| Purchase Expense | 🔴 Outflow | Purchase Order approval |
| Salary Expense | 🔴 Outflow | Manual entry |
| Operational Expense | 🔴 Outflow | Branch Expense (Petty Cash) |
| Booking Amount | 💚 Inflow | Advance Booking creation |
| Refund | 🔴 Outflow | Manual entry |
| Transfer Expense | 🔴 Outflow | Manual entry |

**Dashboard Metric Cards** (dynamically calculated):
- **LEDGER INCOME**: Sum of all inflows
- **PURCHASE COST**: Sum of all purchase expenses
- **OPERATING EXPENSE**: Sum of petty cash + operational
- **NET CASHFLOW**: Income - All Expenses

**Key Feature — Multi-Criteria Filter Suite**:
- Search by keyword across Transaction IDs, details, branches
- Filter by Branch, Category, Payment Mode, Date Range
- All metric cards recalculate based on active filters
- One-click "Reset All Filters" button

**Key Feature — Pagination**:
- 10 entries per page with Previous/Next controls
- "Showing 1-10 of 48 entries" indicator

**Key Feature — Auto-Journaling**:
> *"You NEVER have to manually enter a ledger record for sales, purchases, bookings, expenses, or deposits. The system does it automatically. If you delete a booking, its ledger entry is auto-deleted too."*

---

### 10. 💰 Branch Expenses (Petty Cash)
> *"Track daily branch-level expenses."*

**Expense Categories**:
- Electricity / Power Bill
- Vehicle Transport & Delivery
- Showroom Repair & Maintenance
- Staff Refreshments & Water
- Other Daily Expenses

**Fields**: Expense ID (auto), Branch, Submitted By, Category, Amount, Description, Receipt Number, Date

**Data Flow**: Expense created → Auto-journals to General Ledger as "Petty Cash Expense" → OPERATING EXPENSE card updates → NET CASHFLOW updates

---

### 11. 💵 Cash Deposits
> *"Track cash handovers between team members."*

**Fields**: Deposit ID (auto), Branch, Deposited By, Supervisor (recipient), Amount, Notes, Date

**Data Flow**: Deposit created → Auto-journals to General Ledger as "Cash Deposit / Handover" → LEDGER INCOME card updates

---

### 12. 👥 User Management
> *"Create and manage all staff accounts."*

- Create users with: Username, Full Name, Email, Phone, Password
- Assign Role: Owner / Supervisor / Sales Executive / Telecaller / Staff
- Assign Branch and Showroom
- Activate/Deactivate accounts
- Supervisors can only manage users within their own branch
- Supervisors cannot assign Owner or Admin roles (security restriction)

---

### 13. 📊 Reports & CSV Export
> *"Comprehensive business reports with export capability."*

Available Reports:
- Sales Reports (by date range, branch, executive)
- Inventory Reports (stock levels, movement history)
- Lead Conversion Reports (pipeline analytics)
- Commission Reports
- Financial Reports

**CSV Export**: All reports can be exported to CSV with UTF-8 BOM encoding (fixes character corruption in Excel)

---

### 14. 📋 Activity Logs (Audit Trail)
> *"Every single action in the system is logged."*

**What's Tracked**:
- **LOGIN**: Who logged in, when, from which IP address
- **CREATE**: Who created what record (customer, vehicle, booking, etc.)
- **UPDATE**: Who changed what, with before/after values
- **DELETE**: Who deleted what record

> *"This is your compliance and security layer. If there's ever a dispute about who did what, you check the Activity Log."*

---

### 15. ✅ Staff Attendance
> *"GPS-verified, photo-verified staff attendance."*

**How it works**:
1. Staff opens mobile app → clicks "Check In"
2. Device captures: GPS coordinates (high-accuracy), selfie photo, timestamp
3. Record appears as "Pending" in supervisor/owner dashboard
4. Owner/Supervisor can: Verify ✅ or Reject ❌
5. Bulk approve/reject with "Select All" checkbox

**Fields**: User, Date, Check-in Time, Check-out Time, GPS (lat/long), Location Name, Photo, Status (Pending/Verified/Rejected), Verified By

---

### 16. 🎪 Mela Campaign Management
> *"Special event sales management — like exhibition melas."*

**What's included**:
- **Mela Settings**: Campaign name, start/end date, location, active toggle
- **Mela Inventory**: Separate vehicle + battery stock allocation for the event
- **Mela Vehicle-Battery Compatibility**: Map which batteries work with which vehicles
- **Mela Checkout**: Quick point-of-sale for on-the-spot sales
- **Mela Bookings**: Event-specific booking tracking with executive serial numbers
- **Mela Reports**: Sales leaderboard and analytics per executive

> *"This is a complete sub-system for running promotional events. You allocate inventory to the mela, your sales team sells at the event, and everything is tracked separately from regular showroom operations."*

---

### 17. 🚨 Issue Tracker
> *"Report and track operational problems."*

**Issue Categories**:
- Vehicle Transit Damage
- Battery Cell / Charger Defect
- Showroom Equipment Failure
- Logistics / Stock Delay
- Other

**Priority Levels**: Low, Medium, High, Urgent
**Status Flow**: `Reported` → `In Progress` → `Resolved`

---

# ROLE 2: 🛡️ SUPERVISOR

> *"The Supervisor manages a specific branch. They see only their branch's data and approve operational requests from their team."*

## Supervisor Dashboard

| Metric | What It Shows |
|--------|---------------|
| Daily Vehicle Movements | Stock in/out for today |
| Pending Stock Requests | Transfers awaiting approval |
| Branch Sales | Today's and monthly sales figures |
| Active Leads | Leads in the pipeline for this branch |

## Supervisor Modules (12 Total)

| # | Module | What They Do |
|---|--------|-------------|
| 1 | **Dashboard** | Branch operations overview with daily telemetry |
| 2 | **Stock** | Monitor branch stock in/out, approve inter-branch transfers |
| 3 | **Vehicles** | View branch vehicle inventory and model stock |
| 4 | **Sales** | View branch sales invoices, update delivery status |
| 5 | **Leads** | Manage branch lead pipeline, assign leads to sales executives |
| 6 | **Bookings** | Manage branch advance bookings, confirm/cancel |
| 7 | **Batteries** | Monitor branch battery inventory, approve FIFO overrides |
| 8 | **Expenses** | Submit and manage branch petty cash expenses + cash deposits |
| 9 | **Issues** | Report and track branch operational issues |
| 10 | **Reports** | Branch-level performance reports |
| 11 | **Attendance** | Verify/reject staff check-ins for their branch |
| 12 | **Profile** | Personal profile management |

### Key Supervisor Responsibilities
> *"The Supervisor is the operational gatekeeper. They:"*
- ✅ Approve or reject **stock transfers** between locations
- ✅ Approve or reject **FIFO override requests** from sales team
- ✅ Confirm or cancel **advance bookings**
- ✅ Assign **leads** to sales executives
- ✅ Verify **staff attendance** check-ins
- ✅ Submit **petty cash expenses** for their branch

### How Supervisor Connects to Other Roles

```
Owner creates branches → Supervisor manages ONE branch
          ↕
Sales Executive creates leads/bookings → Supervisor approves
          ↕
Staff checks in attendance → Supervisor verifies
          ↕
FIFO Override requested → Supervisor approves/rejects
          ↕
Stock Transfer requested → Supervisor approves
```

---

# ROLE 3: 💼 SALES EXECUTIVE

> *"The Sales Executive is the customer-facing team member. They handle leads, create bookings, make sales, and manage follow-ups."*

## Sales Dashboard

| Metric | What It Shows |
|--------|---------------|
| Monthly Sales Target | Personal target and achievement |
| Active Pipeline | Number of active leads |
| Upcoming Follow-ups | Calls/visits scheduled for today |
| Total Sales | Personal sales count for the month |

## Sales Executive Modules (12 Total)

| # | Module | What They Do |
|---|--------|-------------|
| 1 | **Dashboard** | Personal KPIs, quick actions, pipeline overview |
| 2 | **Leads** | View assigned leads, create new leads, update lead stages |
| 3 | **Customers** | Customer directory with purchase history |
| 4 | **Bookings** | Create advance bookings, track booking status |
| 5 | **Sales Checkout** | Point-of-sale — create invoices, VIN lookup, battery selection |
| 6 | **Follow-ups** | Today/Overdue/Upcoming follow-up schedule, log call outcomes |
| 7 | **Mela Booking Form** | Create bookings during mela events |
| 8 | **Mela My Bookings** | View personal mela bookings |
| 9 | **Mela Reports** | Personal mela sales performance |
| 10 | **Reports** | Personal sales performance reports |
| 11 | **Attendance** | Daily check-in with GPS + photo |
| 12 | **Profile** | Personal profile management |

### The Complete Sales Workflow (Tell the Client)

> *"Let me walk you through a typical sale from start to finish:"*

```
Step 1: Customer walks in or calls
    ↓
Step 2: Sales Executive creates a LEAD
        (Customer name, contact, interested vehicle, source)
    ↓
Step 3: Lead moves through pipeline stages:
        Enquiry → New Lead → Contacted → Follow-up → Negotiation
    ↓
Step 4: Schedule FOLLOW-UPS (Call, Visit, WhatsApp)
        System reminds executive of today's follow-ups
    ↓
Step 5: Customer decides to buy — two paths:

    Path A: ADVANCE BOOKING                Path B: DIRECT SALE
    - Collect advance deposit              - Go to Sales Checkout
    - Create booking with amount           - Search VIN or auto-fill
    - Customer gets booking ID             - Select battery (FIFO check!)
    - Booking appears in Supervisor        - Choose payment mode
      queue for confirmation               - Generate invoice
    - Later converts to Sale               - Vehicle status → Sold
                                           - Battery status → Sold
                                           - Ledger auto-updated
    ↓
Step 6: Vehicle DELIVERY
        Staff does PDI checklist → Customer handover
    ↓
Step 7: Invoice status → "Delivered"
        Sale complete! 🎉
```

### Key Sales Feature: VIN Auto-Fill
> *"During checkout, the sales executive can type any VIN number, motor number, or chassis number. The system instantly fills in the vehicle model, color, location, and battery details. No manual searching through inventory."*

### Key Sales Feature: FIFO Battery Guard
> *"When selecting a battery during checkout, if the selected battery is NOT the oldest available one, the system blocks the sale and shows a warning. The executive can request a supervisor override, and the system polls for approval in real-time."*

---

# ROLE 4: 📞 TELECALLER

> *"The Telecaller is the lead generation engine. They make outbound calls, qualify leads, and hand them off to sales executives."*

## Telecaller Dashboard

| Metric | What It Shows |
|--------|---------------|
| Total Assigned Leads | All leads assigned to this telecaller |
| Pending Primary Calls | Leads not yet contacted |
| Contacted Pipeline | Leads that have been reached |
| Converted Sales Wins | Leads that became sales |

## Telecaller Modules (4 Total)

| # | Module | What They Do |
|---|--------|-------------|
| 1 | **Dashboard** | Telecaller desk overview with lead metrics |
| 2 | **Leads** | Lead calling workspace — make calls, log outcomes, update stages, add notes |
| 3 | **Attendance** | Daily check-in |
| 4 | **Profile** | Personal profile |

### How Telecaller Connects to Sales Executive

```
Telecaller creates/qualifies leads
    ↓
Lead status updated to "Contacted" or "Follow-up"
    ↓
Owner/Supervisor assigns lead to a Sales Executive
    ↓
Sales Executive takes over and closes the deal
```

> *"The Telecaller is focused purely on lead qualification. They don't handle bookings, sales, or inventory. Their job is to fill the pipeline."*

---

# ROLE 5: 📦 OPERATIONS STAFF

> *"Staff handles the physical side — warehouse operations, vehicle inspections, and customer handovers."*

## Staff Dashboard

| Metric | What It Shows |
|--------|---------------|
| Pending PDI Inspections | Vehicles awaiting Pre-Delivery Inspection |
| Stock Movements | Recent stock in/out activity |
| Battery Status | Battery inventory overview |
| Active Tasks | Pending operational tasks |

## Staff Modules (6 Total)

| # | Module | What They Do |
|---|--------|-------------|
| 1 | **Dashboard** | Operations terminal with live task telemetry |
| 2 | **Inventory** | Stock inward/outward logging, shipment tracking |
| 3 | **Batteries** | Battery registry, serial number allocation |
| 4 | **PDI Checklist** | Pre-Delivery Inspection — 5-step vehicle checklist with progress bar |
| 5 | **Attendance** | Daily check-in with GPS + photo |
| 6 | **Profile** | Personal profile |

### PDI Checklist (Pre-Delivery Inspection)
> *"Before any vehicle is delivered to a customer, operations staff performs a 5-point inspection:"*

1. Exterior condition check
2. Electrical systems test
3. Battery connection verification
4. Accessories verification
5. Documentation completeness

Each step is toggled ✅, progress bar fills up, and upon completion, the booking's `pdi_verified` flag is set to `Yes`.

### Customer Handover
> *"After PDI, the staff handles the physical key handover:"*
- Delivery target card shows customer and vehicle details
- Item checklist ensures everything is handed over
- Signature capture (digital)
- On completion → Sales Invoice status updates to `Delivered`

---

# 📱 MOBILE APP (Parallel System)

> *"Everything I just showed you on the web dashboard — there's also a mobile app for field teams."*

### Who Uses the Mobile App

| Role | Mobile Features |
|------|----------------|
| **Owner** | Dashboard, inventory, leads, bookings, sales, branches, ledger, purchases, users, profile |
| **Supervisor** | Approvals (FIFO, transfers, booking locks), inventory, leads assignment, profile |
| **Sales Executive** | Dashboard, leads, follow-ups, token booking, checkout & invoice, customers, profile |
| **Operations Staff** | Dashboard, VIN/QR scanner, PDI checklist, customer handover, profile |

### Mobile Design
> *"The mobile app has a premium design — dark hero headers, brand green accents, smooth animations, and hardware-accelerated transitions. It looks and feels like a high-end consumer app, not a clunky enterprise tool."*

### Mobile Security
- JWT tokens stored in encrypted storage (Expo Secure Store)
- Auto-refresh on token expiry
- Role-based routing — can't access screens outside your role

---

# 🔄 HOW DATA FLOWS ACROSS ROLES

> *"This is the most important part — how everything connects:"*

## 1. Lead-to-Sale Flow

```
Telecaller creates Lead
    ↓
Owner/Supervisor assigns to Sales Executive
    ↓
Sales Executive follows up (call/visit/WhatsApp)
    ↓
Lead status: Enquiry → Contacted → Follow-up → Negotiation → Won
    ↓
Sales Executive creates Advance Booking OR Direct Sale
    ↓
    ┌─────────────────────┐    ┌─────────────────────┐
    │   ADVANCE BOOKING    │    │    DIRECT SALE       │
    │ → Supervisor confirms│    │ → VIN Auto-fill      │
    │ → Ledger entry (IN)  │    │ → FIFO battery check │
    │ → Convert to sale    │    │ → Invoice generated   │
    └─────────┬───────────┘    └─────────┬───────────┘
              └──────────┬───────────────┘
                         ↓
              Vehicle Unit → Status: SOLD
              Battery → Status: SOLD
              Ledger → Sales Income Entry
              Dashboard → Metrics Update
                         ↓
              Staff does PDI Checklist
                         ↓
              Staff does Customer Handover
                         ↓
              Invoice → Status: DELIVERED ✅
```

## 2. Inventory Flow

```
Purchase Order created (Owner)
    ↓
PO Approved → Ledger Entry (Purchase Expense)
    ↓
Vehicles arrive → Staff registers Vehicle Units (VIN)
    ↓
Batteries arrive → Staff registers in Battery Registry
    ↓
Stock sits at a Location (Godown/Showroom)
    ↓
Transfer needed? → Staff creates Stock Transfer request
    ↓
Supervisor approves → Vehicle moves to new location
    ↓
Sale happens → Vehicle Unit marked SOLD
    ↓
Dashboard inventory counts update in real-time
```

## 3. Financial Flow

```
INCOME SOURCES (Auto-Journaled):
├── Sales Invoices → "Sales Income"
├── Advance Bookings → "Booking Amount"
└── Cash Deposits → "Cash Deposit / Handover"

EXPENSE SOURCES (Auto-Journaled):
├── Purchase Orders → "Purchase Expense"
├── Branch Expenses → "Petty Cash Expense"
└── Manual entries → "Salary", "Operational", etc.

All entries → General Ledger table
    ↓
Metric Cards auto-calculate:
  LEDGER INCOME - PURCHASE COST - OPERATING EXPENSE = NET CASHFLOW
```

## 4. Attendance Flow

```
Staff/Sales/Telecaller opens mobile app
    ↓
Clicks "Check In" → Camera captures selfie
    ↓
GPS captures location (high-accuracy, permission prompted)
    ↓
Record created as "Pending"
    ↓
Supervisor sees it → Verify ✅ or Reject ❌
    ↓
Owner can also verify/reject from their dashboard
    ↓
Attendance history maintained with date/time split
```

---

# 🔐 SECURITY & COMPLIANCE

> *"The system is built with enterprise-grade security:"*

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT tokens (1-day access, 7-day refresh, rotating) |
| **Role-Based Access** | Each API endpoint checks user role before allowing access |
| **Branch Isolation** | Supervisors and staff can only access their own branch data |
| **Audit Logging** | Every CREATE, UPDATE, DELETE, and LOGIN is logged with user, IP, and timestamp |
| **Input Validation** | All numeric fields are strict positive-only (no negatives, no decimals, no letters) |
| **Date Constraints** | Future dates blocked for historical entries, past dates blocked for future events |
| **FIFO Compliance** | Battery FIFO enforced with override-request workflow |
| **Encrypted Storage** | Mobile app stores JWT in Expo Secure Store (encrypted) |
| **CORS & CSRF** | Configured for production security |

---

# 🛠️ TECHNICAL INFRASTRUCTURE

> *"If the client asks about technology:"*

| Layer | Technology |
|-------|-----------|
| **Backend API** | Django 6.0 + Django REST Framework |
| **Database** | PostgreSQL 16 (Docker hosted) |
| **Caching** | Redis (with LocMem fallback) |
| **Web Dashboard** | Next.js 16 + React 19 + Tailwind CSS 4 |
| **Mobile App** | Expo 54 + React Native 0.81 |
| **Authentication** | SimpleJWT with custom claims |
| **API Documentation** | Auto-generated Swagger UI + ReDoc |
| **Deployment** | Docker Compose with Nginx reverse proxy |
| **Production URL** | `https://kvr.thehps.in/` |

---

# 📈 FUTURE ROADMAP (Upsell Opportunities)

> *"The system is designed for growth. Here's what's planned next:"*

### Phase 2 (Near-term)
- 📞 WhatsApp/SMS integration for follow-ups
- 🧾 GST invoice generation
- 📷 Real camera VIN/QR barcode scanning
- 🎯 Sales target rings and leaderboards
- 🔔 Push notifications (follow-up reminders, booking expiry, low stock)

### Phase 3 (Medium-term)
- 🔧 Vehicle service management module
- 🔩 Spare parts inventory
- 💳 Payment gateway integration
- 📱 Customer-facing mobile app

### Phase 4 (Long-term)
- 🤖 AI-powered lead scoring
- 📊 Predictive analytics for sales forecasting
- 📧 Automated marketing campaigns
- 🏪 Vendor portal for suppliers

---

# 🎤 CLOSING PITCH

> *"To summarize: KVR Motors ERP is not just software — it's a complete digital transformation for your dealership. Every branch, every showroom, every team member, every vehicle, every battery, every rupee — all tracked in one system. Your team uses it on the web and on their phones. You see the big picture on your dashboard. And everything is audited, secure, and scalable.*
>
> *The system is already live and deployed at `kvr.thehps.in`. You can log in right now and see it working with real seeded data across all 4 branches.*
>
> *What questions do you have?"*

---

# 📝 DEMO CREDENTIALS (For Live Demo)

| Username | Password | Role | What They See |
|----------|----------|------|---------------|
| `owner` | `owner123` | Owner | Full enterprise dashboard |
| `supervisor` | `super123` | Supervisor | Branch-level operations |
| `sales` | `sales123` | Sales | Personal sales workspace |
| `telecaller` | `tele123` | Telecaller | Lead calling desk |
| `staff` | `staff123` | Staff | Warehouse operations |

> **Pro Tip**: During the demo, log in as Owner first, show the full dashboard, then open a second browser tab and log in as Sales Executive to show how the same data appears differently based on role.

---

# ❓ ANTICIPATED CLIENT QUESTIONS & ANSWERS

| Question | Answer |
|----------|--------|
| *"Can we add more branches?"* | Yes, unlimited branches. Just click "Add Branch" in the Owner dashboard. |
| *"What if we add a new vehicle brand?"* | The Owner can add new Vehicle Brands and Models from the catalog at any time. |
| *"Can I access it on my phone?"* | Yes, there's a dedicated mobile app for Supervisor, Sales, and Staff roles. |
| *"What happens if the internet goes down?"* | The mobile app has graceful fallback handling. Critical data is cached locally. |
| *"How do I know if my staff is actually working?"* | GPS-verified, photo-verified attendance + complete activity logs showing every action. |
| *"Can someone tamper with financial records?"* | Every change is logged in the audit trail with user, timestamp, and IP. The system maintains a complete history. |
| *"What about battery compliance?"* | FIFO is automatically enforced. No one can sell a newer battery unless a supervisor approves the override. |
| *"Can I export reports?"* | Yes, all reports can be exported as CSV files that open correctly in Excel. |
| *"Is it secure?"* | JWT authentication, role-based access, branch isolation, encrypted mobile storage, audit logging, input validation. |
| *"How long does deployment take?"* | Docker deployment takes ~1.5-2 minutes. Zero-downtime updates. |
