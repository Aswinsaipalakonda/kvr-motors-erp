# Owner Role Screens - Testing Checklist

This checklist tracks the testing and verification of all screens, components, and backend integrations for the **Owner** role. Tick off each checkbox once you verify that a screen is perfectly working, fully dynamic, and has no TypeScript or UI/UX errors.

---

## 1. Next.js Web App - Owner Portal (`dashboards/`)

### [x] Tab 1: Overview Dashboard (`/owner`)
- **Description**: High-level snapshot showing MTD net cashflow, bento stats grid, sales charts, top-selling models, and live activity feed.
- **Dynamic Behaviors**:
  - Automatically loads counts from `/ledger-entries/`, `/vehicle-units/`, `/bookings/`, `/leads/`, and `/sales-invoices/`.
  - Filters all cards and charts instantly when selecting a branch from the Navbar dropdown.
  - Interactive Sales Time Filter switches chart data between Week (day-wise), Month (week-wise), and 6 Months (month-wise).
  - Quick action buttons trigger corresponding popup modals (Create PO, Add Lead, Record Booking, Add Branch).
- **Test Cases**:
  - [x] **TC-WEB-DB-01**: Verify page loads without console errors and display real counts instead of mock fallbacks (if database is populated).
  - [x] **TC-WEB-DB-02**: Change the active branch in Navbar and verify stats card values and net cashflow auto-update.
  - [x] **TC-WEB-DB-03**: Verify time filter button clicks update the chart dataset and re-render without errors.


---

### [ ] Tab 2: Branch & Showrooms (`/owner/branches`)
- **Description**: Interface to view, edit, add, and delete outlet branches and associate them with physical showrooms.
- **Dynamic Behaviors**:
  - Lists branches dynamically by querying `/branches/`.
  - "Add Branch" button opens a modal form. Submit action calls `POST /branches/` and reloads the grid.
  - Toggle switch changes the active status of branches via `PATCH /branches/<id>/`.
  - "Delete" button prompts confirmation, calls `DELETE /branches/<id>/`, and handles constraint errors gracefully if showrooms are attached.
- **Test Cases**:
  - [ ] **TC-WEB-BR-01**: Add a new branch and verify it instantly appears in the table.
  - [ ] **TC-WEB-BR-02**: Toggle the active status switch and verify that the database record updates.
  - [ ] **TC-WEB-BR-03**: Try to delete a branch and verify the confirmation prompt behaves correctly.

---

### [ ] Tab 3: Vehicle Management (`/owner/vehicles`)
- **Description**: View and manage the vehicle model catalog, price mappings, and brand lines.
- **Dynamic Behaviors**:
  - Lists vehicle models from `/vehicle-models/` and brands from `/vehicle-brands/`.
  - Add/Edit Model modals manage brand ID, name, base price, compatible batteries, colors (comma-separated), and active state.
  - Form validation prevents empty model names or non-numeric prices.
- **Test Cases**:
  - [ ] **TC-WEB-VH-01**: Verify vehicle brands list correctly in the model creation dropdown.
  - [ ] **TC-WEB-VH-02**: Add a vehicle model with custom colors (e.g. "Red, Green, Blue") and verify list updates.
  - [ ] **TC-WEB-VH-03**: Edit an existing model's base price and verify change persists in database.

---

### [ ] Tab 4: Stock Management (`/owner/stock`)
- **Description**: Registry for vehicle units (VIN, motor, chassis number) and showroom inventory allocations.
- **Dynamic Behaviors**:
  - Lists vehicle units from `/vehicle-units/` with color, branch, showroom, status, and assigned battery.
  - Real-time lookup auto-completes fields: typing a partial VIN, motor number, or chassis number searches `/vehicle-units/lookup/` and auto-fills.
  - Add/Edit unit modal maps dropdown selection of branch to branch-specific showrooms and inventory locations.
- **Test Cases**:
  - [ ] **TC-WEB-ST-01**: Test typing a VIN number in the stock form and verify it triggers lookup and auto-fills the remaining fields.
  - [ ] **TC-WEB-ST-02**: Verify changing the selected branch filters showroom list dropdown to only display showrooms in that city.
  - [ ] **TC-WEB-ST-03**: Log a new stock unit with status "available" and verify it increases the stock counts on the Dashboard.

---

### [ ] Tab 5: Purchase Management (`/owner/purchases`)
- **Description**: Log Purchase Orders (POs) from suppliers and sign off/approve pending orders.
- **Dynamic Behaviors**:
  - Lists POs from `/purchase-orders/`.
  - Allows filtering by status (Pending, Approved, Received).
  - "Approve" button triggers `PATCH /purchase-orders/<id>/` with status `approved`, which automatically generates ledger expense entries and updates stock levels on receipt.
- **Test Cases**:
  - [ ] **TC-WEB-PO-01**: Verify "Create PO" button opens the creation form modal.
  - [ ] **TC-WEB-PO-02**: Click "Approve" on a pending PO and verify status changes to "Approved" and the action button hides.
  - [ ] **TC-WEB-PO-03**: Check Ledger Tab to confirm that approving a PO created a corresponding transaction record.

---

### [ ] Tab 6: Sales Management (`/owner/sales`)
- **Description**: List sales invoices and track vehicle delivery processes.
- **Dynamic Behaviors**:
  - Renders invoices list from `/sales-invoices/`.
  - Dropdown allows updating delivery status (Pending, Dispatched, Delivered).
  - Displays linked customer data, purchase price, executive name, and date.
- **Test Cases**:
  - [ ] **TC-WEB-SA-01**: Search sales invoices by customer name or invoice number using search query.
  - [ ] **TC-WEB-SA-02**: Change delivery status of an invoice and verify state remains saved on refresh.

---

### [x] Tab 7: Lead Management (`/owner/leads`)
- **Description**: Interactive Kanban board mapping the sales pipeline stages.
- **Dynamic Behaviors**:
  - Groups leads by stage: New Lead, Contacted, Negotiation, Won, Lost.
  - Supports HTML5 drag-and-drop: dragging a lead card to a different column performs optimistic UI updates and hits `PATCH /leads/<id>/`.
  - "Add Lead" modal logs customer details, source, interested vehicle, notes, and executive assignments.
- **Test Cases**:
  - [x] **TC-WEB-LD-01**: Drag a lead from "New Lead" to "Contacted" and verify position persists and showing confirmation toast.
  - [x] **TC-WEB-LD-02**: Add a new lead and assign a sales executive. Verify executive name is rendered correctly on the card.


---

### [ ] Tab 8: Advance Bookings (`/owner/bookings`)
- **Description**: Track advance bookings, deposit registrations, and expiry timelines.
- **Dynamic Behaviors**:
  - Queries `/bookings/` to render active, confirmed, and cancelled deposits.
  - "Cancel Booking" triggers confirmation prompt and updates state to `cancelled` via API.
- **Test Cases**:
  - [ ] **TC-WEB-BK-01**: Verify new bookings show up as "Confirmed" status with advance deposit amounts.
  - [ ] **TC-WEB-BK-02**: Cancel a booking and confirm that the status updates in the list.

---

### [ ] Tab 9: Batteries Management (`/owner/batteries`)
- **Description**: Track battery serial registry, supplier data, warranties, and allocations to VINs.
- **Dynamic Behaviors**:
  - Lists batteries from `/batteries/`.
  - Form validation prevents saving duplicate battery serials.
  - Details list showing battery status (Available, Sold, Assigned, Damaged, Returned).
- **Test Cases**:
  - [ ] **TC-WEB-BT-01**: Log a new battery serial number and map it to a showroom location.
  - [ ] **TC-WEB-BT-02**: Assign an available battery to a vehicle unit VIN and verify status updates to "Assigned".

---

### [ ] Tab 10: Ledger Management (`/owner/ledger`)
- **Description**: Transaction vault showing revenue inflows, expense outflows, and automated summaries.
- **Dynamic Behaviors**:
  - Displays ledger items from `/ledger-entries/` showing transaction type (Debit/Credit), amount, transaction date, and descriptive detail.
  - Computes net capital totals dynamically.
- **Test Cases**:
  - [ ] **TC-WEB-LG-01**: Verify ledger lists transactions with correct color coding (green for credit/income, red for debit/expenses).

---

### [ ] Tab 11: Reports & Analytics (`/owner/reports`)
- **Description**: Generate and export system audits.
- **Dynamic Behaviors**:
  - Dropdown options: Sales Ledger Summary, Inventory In-Out Movements, Lead Conversion Pipeline, Battery Stock Allocations, Executive Sales Commission.
  - "Download CSV" compiles data points into tabular CSV string and triggers a local file download.
  - "Print Report" renders clean A4 portrait layout styles in a new browser window and triggers the native printer dialog.
- **Test Cases**:
  - [ ] **TC-WEB-RP-01**: Export "Lead Conversion Pipeline" to CSV and open the file to verify columns align correctly.
  - [ ] **TC-WEB-RP-02**: Click "Print Report" and verify print window opens with formatted styling.

---

### [ ] Tab 12: Users & Roles (`/owner/users`)
- **Description**: Account creator and permission configuration dashboard.
- **Dynamic Behaviors**:
  - CRUD operations on `/users/` list.
  - Form details: Username, Full Name, Email, Password (only set on create or when editing password fields), Role selection, Branch, Showroom mapping.
- **Test Cases**:
  - [ ] **TC-WEB-US-01**: Create a new user with "Sales" role and assign to a specific branch. Verify login succeeds with the credentials.
  - [ ] **TC-WEB-US-02**: Edit an existing user account to change their email, keeping the password field blank. Verify that password doesn't get overridden.

---

### [ ] Tab 13: Staff Attendance (`/owner/attendance`)
- **Description**: Verify employee check-ins and check-outs.
- **Dynamic Behaviors**:
  - Lists attendance records from `/attendance-logs/`.
  - Bulk select checkboxes allow bulk approving or rejecting records at once using `/attendance-logs/bulk-verify/`.
- **Test Cases**:
  - [ ] **TC-WEB-AT-01**: Verify pending attendance logs display check-in/out times.
  - [ ] **TC-WEB-AT-02**: Select multiple records, click "Bulk Verify", and verify status updates to "Verified".

---

### [ ] Tab 14: Activity Logs (`/owner/activity-logs`)
- **Description**: Complete audit trail showing changes to ERP data.
- **Dynamic Behaviors**:
  - Queries `/activity-logs/` for date, username, actions (CREATE, UPDATE, DELETE), model, and text description.
- **Test Cases**:
  - [ ] **TC-WEB-AL-01**: Perform an update in another tab (e.g. update user email), check logs, and verify that the change is logged.

---

### [ ] Tab 15: Settings & Tab 16: Profile
- **Description**: Manage profile card and local storage ERP metadata settings.
- **Dynamic Behaviors**:
  - Settings fields (Company Name, GST Configuration) persist in `localStorage`.
- **Test Cases**:
  - [ ] **TC-WEB-ST-01**: Change company name in settings, click save, reload browser, and verify name persists.

---
---

## 2. Expo React Native Mobile App - Owner Portal (`mobile-app/`)

### [ ] Screen 1: Dashboard (`/owner/dashboard`)
- **Description**: Main screen featuring scroll view with search, showroom categories, bento stats grid, and recent activities.
- **Dynamic Behaviors**:
  - Integrates global memory cache (`globalDashboardCache`) for instant reload.
  - Swipe-down gestures trigger refresh handler calling API and fetching fresh metrics.
- **Test Cases**:
  - [ ] **TC-MOB-DB-01**: Perform pull-to-refresh and verify the loading spinner displays and successfully loads latest metrics.
  - [ ] **TC-MOB-DB-02**: Select a Showroom category (e.g. Kinetic) and verify dashboard lists only items related to that brand.

---

### [ ] Screen 2: Inventory (`/owner/inventory`)
- **Description**: Mobile stock directory.
- **Dynamic Behaviors**:
  - Connects to `/vehicle-units/` to show model details, colors, locations, status.
  - Supports search query for VIN and model name.
- **Test Cases**:
  - [ ] **TC-MOB-IV-01**: Search for a specific stock unit by VIN and verify correct unit displays.

---

### [ ] Screen 3: Sales Overview (`/owner/sales`)
- **Description**: List of all invoiced sales records.
- **Dynamic Behaviors**:
  - Renders invoices from `/sales-invoices/`.
- **Test Cases**:
  - [ ] **TC-MOB-SL-01**: Verify sales list loads and clicking a record opens details showing customer and price.

---

### [ ] Screen 4: Team Management (`/owner/users`)
- **Description**: Directory of all staff roles.
- **Dynamic Behaviors**:
  - View staff names, emails, roles, and branch locations from `/users/`.
- **Test Cases**:
  - [ ] **TC-MOB-US-01**: Verify team listing lists users correctly by role.

---

### [ ] Screen 5: Showroom Bookings (`/owner/bookings`)
- **Description**: View advance booking deposit list.
- **Dynamic Behaviors**:
  - Renders list from `/bookings/`.
- **Test Cases**:
  - [ ] **TC-MOB-BK-01**: Verify bookings load showing advance amount paid.

---

### [ ] Screen 6: Purchase Orders (`/owner/purchases`)
- **Description**: Approve purchase orders on the go.
- **Dynamic Behaviors**:
  - Pulls POs from `/purchase-orders/` and permits one-tap approvals via API.
- **Test Cases**:
  - [ ] **TC-MOB-PO-01**: Open PO list, verify pending orders show up, and click "Approve" to send the request.

---

### [ ] Screen 7: General Ledger (`/owner/ledger`)
- **Description**: Mobile transactions ledger view.
- **Dynamic Behaviors**:
  - Displays credit/debit transaction logs.
- **Test Cases**:
  - [ ] **TC-MOB-LG-01**: Verify ledger inflow/outflow entries match Web App values.

---

### [ ] Screen 8: Branch Mappings (`/owner/branches`)
- **Description**: View branch locations on-the-go.
- **Dynamic Behaviors**:
  - View branch names and active status from `/branches/`.
- **Test Cases**:
  - [ ] **TC-MOB-BR-01**: Verify branch outlet details render correctly.

---

### [ ] Screen 9: Verify Attendance (`/owner/verify-attendance`)
- **Description**: Staff attendance validation console.
- **Dynamic Behaviors**:
  - Verify daily check-ins/check-outs from `/attendance-logs/`.
  - Supports bulk verification.
- **Test Cases**:
  - [ ] **TC-MOB-AT-01**: View attendance checklist, select a record, and approve check-in.

---

### [ ] Screen 10: Activity Logs (`/owner/activity-logs`)
- **Description**: Mobile system activity audit feed.
- **Dynamic Behaviors**:
  - Displays audit logs from `/activity-logs/`.
- **Test Cases**:
  - [ ] **TC-MOB-AL-01**: Verify live feed updates with correct timestamps.

---

### [ ] Screen 11: Leads Pipeline (`/owner/leads`)
- **Description**: Mobile lead tracking screen.
- **Dynamic Behaviors**:
  - View new and in-progress leads from `/leads/`.
- **Test Cases**:
  - [ ] **TC-MOB-LD-01**: Verify leads list renders contact details and assigned executives.
