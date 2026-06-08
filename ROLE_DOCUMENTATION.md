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
| `ravi_varma`   | `owner123`  | Owner       |
| `suresh_babu`  | `super123`  | Supervisor  |
| `anil_kumar`   | `sales123`  | Sales       |
| `lakshmi`      | `tele123`   | Telecaller  |
| `ramesh`       | `staff123`  | Staff       |

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

---

## Telecaller

### What a Telecaller Can Do

Telecallers focus on lead generation, cold calling, and appointment scheduling.

| Module               | Capability                                                         |
|----------------------|--------------------------------------------------------------------|
| Dashboard            | Call metrics, leads generated, conversion rate                     |
| Leads                | Create new leads, update call outcomes, schedule follow-ups        |
| Bookings             | View existing bookings (read-only)                                 |

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

---

## Staff

### What a Staff Member Can Do

Staff members handle warehouse operations, stock management, and physical inventory.

| Module               | Capability                                                         |
|----------------------|--------------------------------------------------------------------|
| Dashboard            | Warehouse metrics, pending transfers, stock levels                 |
| Inventory            | Full stock management, receive goods, process transfers            |
| Battery Registry     | Log new batteries, assign to vehicles, update status               |

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

*Document generated for KVR Motors ERP v1.0 — June 2026*
