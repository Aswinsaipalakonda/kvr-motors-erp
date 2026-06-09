# KVR Motors ERP — Role Documentation & User Guide

> Complete step-by-step guide for every role in the KVR Motors Enterprise Resource Planning system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Owner](#owner)
4. [Supervisor](#supervisor)
5. [Sales Executive](#sales-executive)
6. [Telecaller](#telecaller)
7. [Staff](#staff)
8. [Branch & Showroom Structure](#branch--showroom-structure)
9. [Showroom Categories (Brands)](#showroom-categories-brands)
10. [Staff Management & Attendance Verification](#staff-management--attendance-verification)

---

## System Overview

KVR Motors ERP is a multi-branch, multi-showroom EV dealership management platform with:

- **Web Dashboard** (Next.js) — accessed at `http://localhost:3000`
- **Mobile App** (Expo / React Native) — accessed via Expo Go or a development build
- **Backend API** (Django REST Framework) — running on `http://localhost:8000`
- **Database** — PostgreSQL / SQLite with seeded data across 4 branches

### Login Credentials (Seeded)

| Username       | Password    | Role        |
|----------------|-------------|-------------|
| `owner`        | `owner123`  | Owner       |
| `supervisor`   | `super123`  | Supervisor  |
| `sales`        | `sales123`  | Sales       |
| `telecaller`   | `tele123`   | Telecaller  |
| `staff`        | `staff123`  | Staff       |

---

## Role Hierarchy

```
Owner (Full Access)
  └── Supervisor (Branch-level management)
        ├── Sales Executive (Customer-facing sales)
        ├── Telecaller (Lead generation & follow-up)
        └── Staff (Warehouse & inventory)
```

---

## Owner

### What an Owner Can Do

The Owner has **unrestricted access** to the entire enterprise across all branches and showrooms. Key capabilities:

| Module               | Capability                                                                 |
|----------------------|----------------------------------------------------------------------------|
| Dashboard            | View enterprise-wide KPIs, cashflow, sales charts, inventory telemetry     |
| Branch Management    | Create, edit, toggle, delete branch outlets and showrooms                  |
| Vehicle Catalog      | Add/edit vehicle models, manage stock units (VIN registry)                 |
| Sales Invoices       | View all invoices, mark delivery status, filter by branch                  |
| Purchase Orders      | Create POs, approve/reject, track delivery timelines                       |
| Lead Management      | Full Kanban pipeline, create/edit/delete leads, drag-drop stage changes    |
| Bookings             | Record advance deposits, confirm/cancel bookings                          |
| General Ledger       | View inflow/outflow, auto-journaled transaction history                   |
| Battery Registry     | Log batteries, assign to vehicles, track warranty                         |
| User Management      | Create staff accounts, assign roles/branches, activate/deactivate          |
| Activity Logs        | Monitor all system actions (CREATE/UPDATE/DELETE) across users             |
| Reports              | Export CSV, print A4 reports for Sales, Inventory, Leads, Commissions      |
| Staff Attendance     | Verify/reject supervisor and staff check-ins, bulk approve/reject check-ins, view history |
| Settings             | Configure enterprise name, GST parameters                                |

### Step-by-Step: Owner Workflows

#### 1. Monitor Enterprise Health
1. Log in with Owner credentials
2. The **Dashboard** tab loads automatically
3. Use the **Branch Selector** (top header) to filter by "All Branches", "KVR Motors - Visakhapatnam", "KVR Motors - Srikakulam", or "KVR Motors - Kakinada"
4. All metric cards (Units Sold, Vehicles in Stock, Total Leads, Receivables, Net Cashflow) update dynamically
5. Use the **Showroom Category** pills (Kinetic / Future / Dynamo / Watts) to further filter by brand
6. The sales chart, leads funnel, inventory telemetry, and audit vault all respond to these filters

#### 2. Create a New Lead
1. Go to **Dashboard** → Click **"Add Lead"** quick action button
2. Or navigate to the **Leads** tab from the sidebar/drawer
3. Fill in: Customer Name, Contact Number, Interested Vehicle (select from dropdown), Lead Source
4. Click **Submit** — lead appears in the Kanban pipeline under "New Lead"
5. Drag the lead card to "Contacted" → "Follow Up" → "Negotiation" → "Won" as it progresses

#### 3. Create a Purchase Order
1. Click **"Create PO"** from the dashboard quick actions or navigate to **Purchases** tab
2. Fill in: Supplier Name, Vehicle Model, Quantity, Unit Price, Payment Terms
3. Click **Submit** — PO is created with "Pending" status
4. From the PO list, click **"Approve"** to sign off the order
5. Approved POs auto-create a ledger entry under expenses

#### 4. Record a Booking (Advance Deposit)
1. Click **"Record Booking"** or go to **Bookings** tab
2. Enter: Customer Name, Contact, Vehicle Model, Advance Amount, Expiry Date
3. Click **Submit** — booking appears in the registry with "Confirmed" status
4. To cancel, click the **Cancel** action on any booking row

#### 5. Add a Stock Unit (VIN Registration)
1. Go to **Vehicles** tab → scroll to "Physical Inventory Stock Units"
2. Click **"Add Stock Unit"**
3. Select Model, Branch, Showroom, Location from dropdowns
4. Enter VIN Number, Motor Number, or Chassis Number (at least one required)
5. Select color, purchase date, and stock status
6. Click **Submit** — unit appears in the VIN registry

#### 6. Create a User Account
1. Go to **Team / Users** tab
2. Click **"Add User"**
3. Fill: Username, Full Name, Email, Phone, Password, Role (Owner/Supervisor/Sales/Telecaller/Staff)
4. Assign Branch and Showroom
5. Click **Submit** — user can now log in with assigned credentials

#### 7. Generate & Export Reports
1. Go to **Reports** tab from the sidebar
2. Select report type: Sales Ledger Summary, Inventory Movements, Lead Pipeline, Battery Allocations, or Executive Commissions
3. Click **Download CSV** for spreadsheet export or **Print** for A4-formatted printable report

#### 8. Verify Staff Attendance
1. Log in as Owner (via Mobile App or Web Dashboard)
2. On **Web**: Navigate to **Attendance** from the sidebar to view check-ins awaiting review.
3. On **Mobile**: Open the navigation drawer and tap **"Verify Attendance"**.
4. To verify individual check-ins: write remarks (optional) and click **"Approve"** (or **"Verify"** on mobile) or **"Reject"**.
5. To bulk-verify multiple check-ins:
   - Check the boxes next to the employees' check-in records.
   - Click the bulk **"Approve"** or **"Reject"** buttons in the floating action bar.
6. Toggle between the **"Pending"** and **"History"** tabs to review verified logs.

---

## Supervisor

### What a Supervisor Can Do

Supervisors manage a specific branch or set of showrooms. They have elevated access but cannot create/delete other supervisors or owners.

| Module               | Capability                                                               |
|----------------------|--------------------------------------------------------------------------|
| Dashboard            | Branch-level KPIs, sales metrics, inventory overview                     |
| Inventory            | View stock levels, monitor vehicle units in their branch                 |
| Sales                | View branch sales invoices, mark deliveries, track executive performance |
| Leads                | Full lead management with Kanban view for their branch                   |
| Bookings             | View, confirm, cancel advance bookings for their branch                  |
| Team                 | View team members assigned to their branch                               |
| Attendance           | Verify check-ins of branch staff, sales, telecallers; bulk approve/reject check-ins |

### Step-by-Step: Supervisor Workflows

#### 1. Review Branch Performance
1. Log in as Supervisor
2. Dashboard loads with branch-scoped data automatically
3. Review metric cards: Units Sold, Active Bookings, Stock Count, Open Leads
4. Check the sales trend chart for daily/weekly/monthly patterns

#### 2. Manage Leads Pipeline
1. Go to the **Leads** tab
2. View leads in Kanban board (Cold → Warm → Hot → Won)
3. Click any lead card to view details or edit
4. Drag lead cards between stages to update status
5. Use filters to find specific leads by status or customer name

#### 3. Monitor Inventory
1. Go to **Inventory** tab
2. View all vehicle units assigned to the branch
3. Check stock status: Available, Booked, Reserved, Sold
4. Flag any discrepancies to the Owner

#### 4. Track Sales & Deliveries
1. Go to **Sales** tab
2. View all invoices for the branch
3. Update delivery status (Ready → Dispatched → Delivered)
4. Monitor executive-wise sales performance

#### 5. Verify Branch Employee Attendance
1. Log in as Supervisor
2. Go to the **Attendance** tab/screen
3. Review branch-level check-ins awaiting review (staff, sales, telecallers)
4. Verify or reject records individually, or check multiple records to bulk-approve/reject them
5. View verified check-in history in the **History** tab

---

## Sales Executive

### What a Sales Executive Can Do

Sales Executives handle direct customer interactions, test drives, quotations, and invoice generation.

| Module               | Capability                                                         |
|----------------------|--------------------------------------------------------------------|
| Dashboard            | Personal sales KPIs, monthly targets, recent activities            |
| Inventory            | View available stock to show customers                             |
| Sales                | Create sales invoices, process payments, manage deliveries         |
| Leads                | Manage assigned leads, update follow-up notes, convert to sales    |
| Bookings             | Record advance bookings for customers                              |
| Attendance           | Check-in daily using device camera and auto-captured GPS location   |

### Step-by-Step: Sales Executive Workflows

#### 1. Walk-in Customer Handling
1. Log in as Sales Executive
2. When a customer walks in, go to **Leads** tab → Click **"Add Lead"**
3. Enter customer details: Name, Contact, Interested Vehicle, Source = "Walk-in"
4. Show the customer available models from the **Inventory** tab
5. If the customer wants to book, go to **Bookings** → **"Record Booking"**
6. Enter advance amount and expiry date → Submit

#### 2. Converting a Lead to a Sale
1. Go to **Leads** tab → Find the lead in "Negotiation" stage
2. Click the lead card → Update status to **"Won"**
3. Navigate to **Sales** tab → **"Create Invoice"**
4. Select the vehicle unit (by VIN), customer details auto-populate from the lead
5. Enter sale price, payment mode, insurance partner
6. Submit the invoice — a ledger entry is auto-created

#### 3. Processing a Delivery
1. Go to **Sales** tab → Find the invoice
2. Click **"Mark Ready"** when the vehicle is PDI-checked and ready
3. When the customer picks up, click **"Mark Delivered"**
4. The vehicle unit status changes to "Sold" automatically

#### 4. Daily Sales Routine
1. Start the day by checking the **Dashboard** for pending follow-ups
2. Call/contact leads from yesterday's follow-up list
3. Update lead statuses after each call (Contacted → Follow Up → Negotiation)
4. Log any new walk-in customers as fresh leads
5. Check inventory before promising specific models/colors to customers

#### 5. Daily Attendance Check-In
1. Log in as Sales Executive on the Mobile App
2. Open the **Attendance** screen
3. Grant camera and location permissions if prompted
4. Take a selfie in the workplace — the app automatically captures your GPS coordinates and location name
5. Tap **Submit Check-in** to log attendance for the day (awaiting supervisor verification)

---

## Telecaller

### What a Telecaller Can Do

Telecallers focus on lead generation, cold calling, and appointment scheduling.

| Module               | Capability                                                         |
|----------------------|--------------------------------------------------------------------|
| Dashboard            | Call metrics, leads generated, conversion rate                     |
| Leads                | Create new leads, update call outcomes, schedule follow-ups        |
| Bookings             | View existing bookings (read-only)                                 |
| Attendance           | Check-in daily using device camera and auto-captured GPS location   |

### Step-by-Step: Telecaller Workflows

#### 1. Cold Calling Campaign
1. Log in as Telecaller
2. Go to **Leads** tab → Click **"Add Lead"**
3. Enter: Customer Name, Contact Number, Interested Vehicle, Source = "Phone Call"
4. Set status to "New Lead" and add notes about the call
5. If interested, set a follow-up date
6. Submit the lead

#### 2. Follow-Up Process
1. Go to **Dashboard** → Review today's follow-up list
2. Open each lead that has a follow-up date of today
3. Call the customer → Update the lead:
   - If interested → Move to "Contacted" or "Follow Up"
   - If ready to visit → Move to "Negotiation" and add notes
   - If not interested → Move to "Lost" with a reason
4. Schedule the next follow-up if needed

#### 3. Lead Qualification
1. For each new lead, verify:
   - Customer budget range
   - Preferred vehicle model
   - Expected purchase timeline
   - Location/branch preference
2. Add these details in the lead notes
3. If the lead is qualified, move to "Follow Up" stage
4. Assign to a specific Sales Executive if the customer wants to visit

#### 4. Daily Telecaller Routine
1. Check Dashboard for the day's targets
2. Review assigned leads that need follow-up
3. Make calls in priority order: Hot leads first, then Warm, then Cold
4. Log every call outcome in the lead notes
5. Create new leads from any inbound enquiry calls

#### 5. Daily Attendance Check-In
1. Log in as Telecaller on the Mobile App
2. Follow the same check-in procedure as a Sales Executive using camera selfie and GPS verification

---

## Staff

### What a Staff Member Can Do

Staff members handle warehouse operations, stock management, and physical inventory.

| Module               | Capability                                                         |
|----------------------|--------------------------------------------------------------------|
| Dashboard            | Warehouse metrics, pending transfers, stock levels                 |
| Inventory            | Full stock management, receive goods, process transfers            |
| Battery Registry     | Log new batteries, assign to vehicles, update status               |
| Attendance           | Check-in daily using device camera and auto-captured GPS location   |

### Step-by-Step: Staff Workflows

#### 1. Receiving a New Shipment
1. Log in as Staff
2. Go to **Inventory** tab
3. When a delivery arrives, verify against the Purchase Order
4. Click **"Add Stock Unit"** for each vehicle received
5. Enter: VIN, Motor Number, Chassis Number, Model, Color
6. Set status to "Available"
7. Assign to the correct Branch, Showroom, and Location (Godown)

#### 2. Battery Logging
1. Go to **Batteries** section
2. Click **"Log Battery"**
3. Enter: Serial Number, Battery Code, Capacity, Purchase Date
4. Select the inventory location
5. Set supplier and warranty period
6. Submit — battery is now available for assignment

#### 3. Stock Transfer
1. When a vehicle needs to move between godowns or showrooms:
2. Locate the unit in the **Inventory** tab
3. Click **Edit** on the stock unit
4. Change the Location and/or Showroom to the destination
5. Save — the transfer is logged in the activity trail

#### 4. Daily Staff Routine
1. Check Dashboard for pending stock actions
2. Verify physical stock count matches system records
3. Process any incoming deliveries (GRN — Goods Receipt Notes)
4. Prepare vehicles for delivery (PDI check, cleaning)
5. Update stock status for any reserved or sold units

#### 5. Daily Attendance Check-In
1. Log in as Staff on the Mobile App
2. Follow the check-in procedure using camera selfie and GPS location logging to register daily attendance

---

## Branch & Showroom Structure

The KVR Motors enterprise operates across the following regional structure:

| Branch                        | Showrooms                                         | Godowns/Locations        |
|-------------------------------|----------------------------------------------------|--------------------------|
| KVR Motors - Visakhapatnam    | KVR Showroom - Visakhapatnam, Future Ride - Visakhapatnam | Pendurthi Godown, Pineapple Colony Godown |
| KVR Motors - Srikakulam       | KVR Showroom - Srikakulam                          | Srikakulam Godown        |
| KVR Motors - Kakinada         | KVR Showroom - Kakinada                            | Kakinada Godown          |
| KVR Motors - Vizag            | KVR Showroom - Vizag, Future Ride - Vizag           | Vizag Center Godown      |

### How Branch Filtering Works

- **Owner**: Can filter by any branch or "All Branches" to see enterprise-wide data
- **Supervisor**: Sees data scoped to their assigned branch
- **Sales/Telecaller/Staff**: Sees data scoped to their assigned branch and showroom

When the Owner selects a specific branch in the header selector:
- All metric cards recalculate for that branch only
- Sales charts, leads funnel, inventory telemetry, and audit vault all filter accordingly
- Vehicle collection and stock units show only that branch's inventory

---

## Showroom Categories (Brands)

The four brand categories correspond to the EV manufacturers sold across showrooms:

| Category       | Brand Name      | Vehicle Models                | Available At                         |
|----------------|-----------------|-------------------------------|--------------------------------------|
| Kinetic        | Kinetic Green   | Kinetic Green E-Luna          | KVR Showrooms (all branches)         |
| Future         | Future Ride     | Kinetiq models, Watts models  | Future Ride Showrooms (Vizag, Visakhapatnam) |
| Dynamo         | Dynamo          | Dynamo Pro                    | KVR Showrooms (all branches)         |
| Watts          | Watts Eng.      | Watts 100                     | KVR Showrooms, Future Ride Showrooms |

### How Brand Category Filtering Works

When a user taps a brand category pill (Kinetic / Future / Dynamo / Watts):
- **Dashboard metrics** filter to show only data related to that brand
- **Ledger entries** filter by detail text matching the brand keywords
- **Sales invoices** filter by model brand name
- **Vehicle units** filter by the unit's brand association
- **Leads** filter by the interested vehicle's brand
- **Bookings** filter through the linked vehicle unit's brand

Tapping the same category again (or pressing "Reset") clears the filter and shows all data.

---

## Seeded Test Data Summary

The following test data has been seeded across branches for testing:

### Visakhapatnam (Main HQ)
- 3 vehicle units (E-Luna Green, Dynamo Pro Blue, Watts 100 Red)
- 3 batteries
- Multiple sales invoices and ledger entries
- Active leads across all pipeline stages

### Srikakulam
- 2 vehicle units (E-Luna, Watts 100)
- 1 battery (BATT-00801)
- 1 sales invoice (INV-2026-0801 — T. Apparao, E-Luna)
- 1 lead (new_lead status, walk-in source)
- Ledger entries: ₹74,999 income + ₹12,000 operational expense

### Kakinada
- 2 vehicle units (Dynamo Pro, E-Luna)
- 1 battery (BATT-00802)
- 1 sales invoice (INV-2026-0802 — G. Vasu, Dynamo Pro)
- 1 lead (negotiation status, reference source)
- Ledger entries: ₹98,500 income + ₹8,500 operational expense

### Vizag
- 2 vehicle units (Watts 100, Dynamo Pro)
- 1 battery (BATT-00803)
- 1 sales invoice (INV-2026-0803 — Y. Prakash, Watts 100)
- 1 lead (won status, social_media source)
- Ledger entries: ₹145,000 income + ₹15,000 operational expense + ₹22,000 Future Ride rent

---

## Staff Management & Attendance Verification

### Features & Architecture
The Staff Attendance tracking and verification system operates across three tiers:
1. **Marking Attendance (Staff, Sales, Telecallers, Supervisors)**:
   - Performed exclusively on the **Mobile App**.
   - Requires granting **Camera** and **Location** permissions.
   - Users take a real-time camera snapshot at their workplace.
   - The app auto-captures the current GPS Coordinates (Latitude & Longitude) and looks up the location name.
   - Check-ins are submitted in `PENDING` status.
2. **Branch Verification (Supervisors)**:
   - Supervisors verify check-ins of all employees assigned to their branch (excluding other supervisors and owners).
   - Can verify/reject records individually or use **multi-select** to bulk-update check-in statuses at once.
3. **Enterprise Verification (Owner)**:
   - Owner verifies all supervisor check-ins as well as any branch employee check-ins.
   - Available on **Next.js Web Dashboard** (`/owner/attendance`) and **Mobile App** (`/owner/verify-attendance`).
   - Supports **multi-select checkboxes** and **Select All** features to bulk approve/reject pending records with a single click.

### Camera & GPS Permissions in Mobile App
- **Camera Access**: Used to verify presence at the showroom/godown via a real-time selfie. Camera scanning permissions have also been fixed across all modules (including sales scanner utility).
- **Location Access**: Resolves device GPS coordinates to ensure verification of physical presence in the designated showroom area.

---

## Dynamic Form Controls & Data Persistence Pipeline

To prevent transaction failures and ensure data validation is transparent and bulletproof, all input creation forms in the Mobile App have been refactored with native dropdown pickers and strict error gating:

1. **Bookings Form**: Replaced vehicle model string text inputs with dynamic models list dropdown pickers mapping `vehicle_model_id`. Unique booking reference numbers are automatically generated backend-side.
2. **Leads Form**: Replaced scooter model text input with vehicle models list dropdown picker (`interested_vehicle`), and assigned sales representative with dynamic user dropdown picker (`assigned_executive`).
3. **Ledger Form**: Replaced branch text inputs with dynamic branch selector dropdown mapping selection to required branch foreign keys. Removed deprecated fields to prevent serializer failures.
4. **Purchases Form (PO)**: Replaced model input with vehicle models list dropdown mapping to `vehicle_model_id`. Unique purchase order references are generated backend-side.
5. **Sales Invoices Form**: Replaced model string text inputs with an available stock units dropdown picker. Automatically resolves matching branch mapping, includes customer contact input, and maps payment modes dynamically.

### Explicit Error Handling
All form submit operations gate success indicators on response status codes (2xx). Any network or database serialization validation error is explicitly shown to the user in a pop-up alert dialog to prevent silent failures.

---

*Document generated for KVR Motors ERP v1.0 — June 2026*

