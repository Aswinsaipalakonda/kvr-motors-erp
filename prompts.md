# KVR Motors ERP - Antigravity Screen Redesign Prompts

This document contains highly optimized, precise **Antigravity AI Prompts** to build and refine the remaining screens (`inventory.tsx`, `sales.tsx`, `users.tsx`, `profile.tsx`) for the **Owner Role**.

All screens are designed to match the **Home Screen Architecture**:
1. **Layout**: Clean Light Background Viewport (`#f8fafc`) for comfortable, high-contrast reading.
2. **Top Header**: Deep Obsidian Dark Hero Canvas (`#0a0e1a`) with a branded title wrapper and top vertical spacing (`marginTop: 26`) for a premium SaaS visual impact.
3. **Typography**: Large, modern hierarchies (white and brand green `#04a700` headings on dark backgrounds; deep slate text on light backgrounds).
4. **Interaction**: Hardware-accelerated transitions, interactive state feedback, no click delay (via persistent layout mounting), and safe-area compatibility.
5. **Back Navigation**: Translucent slate `ArrowLeft` back buttons wired with robust back-stack fallback logic and native React Native `BackHandler` hooks to prevent hardware exits.

---

## 📦 Screen 1: Inventory & Stock Audit (`inventory.tsx`)

Copy and run the prompt below to redesign the Inventory screen:

```text
Redesign the Owner Inventory Screen (inventory.tsx) to match the light viewport and dark obsidian hero header theme of the Home Dashboard. The interface must be visually stunning, premium, and fully functional.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc) for long-form reading.
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a) stretching from status bar down. Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent back button (ArrowLeft) and right green-outlined "REAL-TIME STOCK METRICS" badge.
  - Large titles: "Inventory & Stock" in thin white text, and "Audit Logs." in bold brand green (#04a700).
  - Quick totals row: "Total EVs: 3" and "Total Batteries: 3" with fine borders and green accents.
- Responsive Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and fine shadows.
  - Critical Low-Stock Alert: A highlighted alert card featuring a subtle red left border, displaying "Dynamo EV stock in Visakhapatnam Showroom is down to 3 units. Reallocation from Pendurthi Godown recommended."
  - Active Fleet Color Mix: A beautiful, modern horizontal color percentage distribution bar (Green 45% [#04a700], Red 30% [#d71d22], Blue 15% [#2563eb], Orange 10% [#ea580c]) with small round indicator legends.
  - Location-wise Stock: Clean cards showing Visakhapatnam, Srikakulam, and Kakinada showroom stock levels with status tags ("Critical", "Sufficient").
- Scrollable Stock Feed: Detailed list showing EV units and batteries featuring filter resets, search criteria, and custom visual listings.

### Code & UX Architecture:
- No Complete Dark Mode: Viewport background must be light (#f8fafc).
- Safe area compatibility: Padding bottom set to 110px.
- Hardware Back Button: Integrate a React Native 'BackHandler' listener. Tapping the back button or hardware back key should navigate to '/owner' (or router.back() if canGoBack is true) instead of terminating the application context.
- Zero Lint Errors: Do not use generic elements as primary interactive primitives. Clean TSX code with no broken imports or unclosed tags.
```

---

## 📈 Screen 2: Sales Invoices & Revenue Pipeline (`sales.tsx`)

Copy and run the prompt below to redesign the Sales Invoices screen:

```text
Redesign the Owner Sales Screen (sales.tsx) to follow the obsidian top-header and light background viewport architecture. It must look premium, modern, and completely professional.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and right green-outlined "REVENUE LOGS" badge.
  - Large titles: "Sales Registry &" in thin white text, and "Customer Invoicing." in bold brand green (#04a700).
  - Quick metrics: Monthly Sales ("₹ 11.20L"), Active Invoices ("₹ 4.80L"), and Net Revenue ("₹ 6.45L") with fine dividers and green indicators.
- Responsive Bento Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and soft shadows.
  - Sales Funnel Card: High-contrast stage analytics mapping cold, warm, hot, and won pipeline percentages.
  - Active Invoice Feed: Scrollable cards displaying invoice code ("INV-2026-0410"), customer name, vehicle model, amount, and status pill ("Settled" in green, "Pending Deposit" in orange).
  - "+ CREATE INVOICE" Action: Branded floating or top-aligned button triggering a sleek, fully functional form modal sheet.

### Code & UX Architecture:
- Interactive Modals: Fully manage form validation states for new invoices (client name, model, price) with clear inline warning states.
- Hardware Back Button: Integrate a React Native 'BackHandler' listener. Tapping the back button or hardware back key should navigate to '/owner' (or router.back() if canGoBack is true) instead of terminating the application context.
- Zero Lint/Syntax Errors: Clean React Native TSX code with correct types, semantic Lucide icons, and zero broken links.
```

---

## 👥 Screen 3: Staff Registry & Access Directory (`users.tsx`)

Copy and run the prompt below to redesign the Staff Registry screen:

```text
Redesign the Owner Users/Team Screen (users.tsx) using the unified KVR light viewport and dark obsidian top header structure. It must feel extremely premium, secure, and intuitive.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and right green-outlined "ENTERPRISE SECURITY" badge.
  - Large titles: "Staff Directory &" in thin white text, and "Access Registry." in bold brand green (#04a700).
  - Quick count: "Active Personnel: 5 Roles" with fine borders and green accents.
- Filters & Directory List (Light backdrop area):
  - Category Pills: Horizontal list to filter staff by Role ("All", "Owner", "Supervisor", "Sales Executive") or Showroom Branch.
  - Personnel Cards: White cards with radius: 18px, displaying name, role badges ("OWNER" in green background, "SUPERVISOR" in purple background), email, phone, and active showroom branch.
  - "+ ADD PERSONNEL" CTA: Branded call-to-action button opening a premium modal form to register new users with inline validation.

### Code & UX Architecture:
- Safe Target Targets: All interactive buttons must be comfortable for touch (height: >=44px) and provide immediate opacity scale feedback upon tap.
- Hardware Back Button: Integrate a React Native 'BackHandler' listener. Tapping the back button or hardware back key should navigate to '/owner' (or router.back() if canGoBack is true) instead of terminating the application context.
- Fully functional: Complete form states, role-changing action sheets, and clean modular code with zero TS/lint errors.
```

---

## ⚙️ Screen 4: Enterprise Settings & Profile Profile (`profile.tsx`)

Copy and run the prompt below to redesign the Profile Settings screen:

```text
Redesign the Owner Profile Screen (profile.tsx) to align with the light viewport and dark obsidian hero header theme of the Home Dashboard.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and right green-outlined "ENTERPRISE LOCK" badge.
  - Branded Profile Panel: Circular green brand avatar (#04a700), user role title ("ADMIN OWNER" in green pill), full name, and email details in neat high-contrast text.
- Settings Sections (Light backdrop area):
  - Layout: Grouped visual blocks inside white cards (radius: 18px, border: '#f1f5f9') with clean chevron right navigators.
  - Section 1: Profile Customizations (edit name, telephone contact, primary email).
  - Section 2: Security & Credentials (change password, set security system pin).
  - Section 3: Enterprise Config (adjust default tax parameters, showroom branch mappings).
  - Section 4: Session Control (prominent red-accented "Log Out" action button featuring alert confirmation dialogue box).

```

---

## 📅 Screen 5: Showroom Bookings & Deposit Registry (`bookings.tsx`)

Copy and run the prompt below to redesign the Bookings screen:

```text
Redesign the Owner Bookings Screen (bookings.tsx) to match the light viewport and dark obsidian hero header theme of the Home Dashboard. The interface must look extremely premium, clean, and completely professional.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc) for comfortable reading.
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent back button (ArrowLeft) and right green-outlined "RESERVATIONS PIPELINE" badge.
  - Large titles: "Showroom Bookings &" in thin white text, and "Deposit Registry." in bold brand green (#04a700). Explicitly set lineHeight (e.g., 38 for mainTitle, 40 for accentTitle) to avoid descender overlap.
  - Sleek Pipeline Stepper Row: A horizontal dashboard widget displaying three connected steps: Pending deposits, Confirmed models, and Converted invoices, using brand green (#04a700) and blue (#2563eb) accents.
- Responsive Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and fine shadows.
  - Urgent PDI Check Capsule: A warning card (radius: 18px, border: '#d9770630', background: '#ffffff') flagging pending PDI verification tasks prior to key dispatch.
  - Customer Booking Cards: High-fidelity details displaying monospace Booking IDs, customer details, token deposit amounts, timelines, and PDI audit indicators.
  - Audit Receivables Expander: Expanding a card reveals a deep SBI deposit audit stream with base advance allocation, 18% GST estimate, and validated bank channel logs.

### Complete CRUD Functionality:
- [CREATE]: Sleek "+ NEW BOOKING RESERVATION" button opening a premium modal sheet with inputs for Client Name, Contact Number, Vehicle Model, Token Deposit, and Expiry Date.
- [READ]: Dynamic, search-filtered list of bookings with a horizontal filter bar containing pills ("All Bookings", "Pending", "Confirmed", "Converted", "Cancelled") to immediately isolate lists.
- [UPDATE]: Expanding a card reveals a CRUD actions panel to "Edit Info" (opening the modal pre-loaded with parameters), "Confirm/Settle" status (Pending -> Confirmed -> Converted), or tap to toggle Pre-Delivery Inspection (PDI) verification.
- [DELETE]: A dedicated "Delete" trash icon with secure Alert dialogue validation ("Are you sure you want to permanently delete this reservation?") to purge records instantly from ERP state and database endpoints.
- [FALLBACK]: Ensure all CRUD operations have robust local state fallbacks in the React Native controller so that everything operates instantly even if offline.

### Code & UX Architecture:
- Absolute overscroll bounce fix: Add the absolute top-positioned background-extending viewport block (<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />) at the start of the ScrollView.
- Scroll-to-Top sync: Receive an 'isActive' prop and run a React.useEffect hook that scrolls the ScrollView to top when active (ref={scrollRef}).
- Hardware Back Button: Integrate a React Native 'BackHandler' listener that safely overrides the physical back key to return to '/owner' instead of terminating the app context.
- Clean code: Strict typing, lucide icons, and zero linting warnings.
```

---

## 📊 Screen 6: Branch Performance Comparison (`branches.tsx`)

Copy and run the prompt below to redesign the Branches screen:

```text
Redesign the Owner Branches Screen (branches.tsx) to follow the unified light viewport and dark obsidian hero header theme of the Home Dashboard.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and green-outlined "REGIONAL SALES COMPARISON" badge.
  - Large titles: "Branch Performance" in thin white text, and "Comparison." in bold brand green (#04a700). Set explicit lineHeight (e.g., 34 for mainTitle, 36 for accentTitle) to avoid descender overlap.
  - Quick metrics: Total MTD Sales, EV Units Sold, and Target Pace with fine dividers.
- Responsive Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and fine shadows.
  - Showroom Performance Podium: A 3-step modern chart widget mapping 1st, 2nd, and 3rd rank podium places with brand green and gold highlight rings.
  - Showroom Branch Cards: Details on revenue, target EV counts, custom progress completion meters, manager avatar initials, and quick dial buttons.

### Complete CRUD Functionality:
- [CREATE]: SLA "+ ADD OUTLET BRANCH" trigger opening a modal sheet to create new showroom listings (Name, Location, Target Pace, Branch Manager name).
- [READ]: List branches sorted dynamically by performance podium ranks, complete with pull-to-refresh.
- [UPDATE]: Edit showroom parameters (e.g., target units sold, monthly revenue totals, manager assignments) directly within an edit form modal.
- [DELETE]: A secure delete trigger with alert double-checks to decommission an outlet branch and reallocate target balances.
- [FALLBACK]: Local state management guarding the CRUD hooks for consistent offline dealership operations.

### Code & UX Architecture:
- Absolute overscroll bounce fix: Add the absolute top-positioned background-extending viewport block (<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />) at the start of the ScrollView.
- Scroll-to-Top sync: Receive an 'isActive' prop and run a React.useEffect hook that scrolls the ScrollView to top when active (ref={scrollRef}).
- Hardware Back Button: Integrate a React Native 'BackHandler' listener that safely overrides the physical back key to return to '/owner' instead of terminating the app context.
- Zero defects: Clean TSX structure with semantic lucide icons.
```

---

## 👥 Screen 7: Enquiry Funnel & Leads Pipeline (`leads.tsx`)

Copy and run the prompt below to redesign the Leads screen:

```text
Redesign the Owner Leads Screen (leads.tsx) to align with the light viewport and dark obsidian hero header theme.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and green-outlined "ENQUIRY FUNNEL ANALYTICS" badge.
  - Large titles: "Enquiry Pipeline" in thin white text, and "Lead Funnel." in bold brand green (#04a700). Set explicit lineHeight (e.g., 34 for mainTitle, 36 for accentTitle) to avoid descender overlap.
  - Quick metrics: Total Leads, Won Orders, and Conversion Rate with fine dividers.
- Responsive Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and fine shadows.
  - Funnel Stage Volume: Vertical or horizontal progress tracks illustrating Cold, Warm, Hot, and Won conversion volumes.
  - Lead Urgency Heat-Meter: A beautiful bento block classifying lead heat zones (Cold, Warm, Hot, Won) with custom border color indicators.
  - Executive Leaderboard: High-fidelity list showing conversion ratings and physical sales output of individual showroom managers.

### Complete CRUD Functionality:
- [CREATE]:sleek "+ NEW CUSTOMER ENQUIRY" button opening a details modal mapping Name, Phone number, Allocated Sales Rep, and Chosen Electric Scooter model.
- [READ]: Multi-tier funnel mapping and search input logs.
- [UPDATE]: Interactive options to change a lead's qualification state (Cold -> Warm -> Hot -> Won), update follow-up timestamps, or assign/reallocate to a different executive.
- [DELETE]: Wipe old cold or duplicate leads using a dedicated delete button with interactive confirmation alerts.

### Code & UX Architecture:
- Absolute overscroll bounce fix: Add the absolute top-positioned background-extending viewport block (<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />) at the start of the ScrollView.
- Scroll-to-Top sync: Receive an 'isActive' prop and run a React.useEffect hook that scrolls the ScrollView to top when active (ref={scrollRef}).
- Hardware Back Button: Integrate a React Native 'BackHandler' listener that safely overrides the physical back key to return to '/owner' instead of terminating the app context.
```

---

## 🏦 Screen 8: Capital Audit Vault & Auto-Journal Ledger (`ledger.tsx`)

Copy and run the prompt below to redesign the Ledger screen:

```text
Redesign the Owner Ledger Screen (ledger.tsx) to follow the obsidian top-header and light background viewport architecture. It must look premium, modern, and completely professional.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and green-outlined "CAPITAL AUDIT VAULT" badge.
  - Large titles: "General Ledger &" in thin white text, and "Auto-Journal Vault." in bold brand green (#04a700). Set explicit lineHeight (e.g., 38 for mainTitle, 40 for accentTitle) to avoid descender overlap.
  - Quick metrics: Total Inflow, Total Outflow, and Est. Capital Net.
- Responsive Bento Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and soft shadows.
  - Ledger Journal Feed: Sleek visual items display transaction logs, billing reference, client details, payment pathways, values, and status pills (Credit, Debit).
  - GST Liability Calculator: Interactive calculator display estimating input tax credits and overall tax liability.

### Complete CRUD Functionality:
- [CREATE]: "+ REGISTER TRANSACTION" CTA opening a double-entry ledger form modal (Transaction Ref, Inflow/Outflow type, description value, SBI bank account, and GST tax bracket selection).
- [READ]: Chronological transaction register with search queries, credit/debit indicators, and date range switches.
- [UPDATE]: sleeks drawer to adjust/correct journal entries (GST tax code adjustments, payment gateway classifications).
- [DELETE]: A "Void/Revert" action validating double-entry bookkeeping rules by posting a matching reversal journal record.

### Code & UX Architecture:
- Absolute overscroll bounce fix: Add the absolute top-positioned background-extending viewport block (<View style={{ position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#0a0e1a' }} />) at the start of the ScrollView.
- Scroll-to-Top sync: Receive an 'isActive' prop and run a React.useEffect hook that scrolls the ScrollView to top when active (ref={scrollRef}).
- Hardware Back Button: Integrate a React Native 'BackHandler' listener that safely overrides the physical back key to return to '/owner' instead of terminating the app context.
```

---

## 📦 Screen 9: Purchase Orders & Supply Chain Approvals (`purchases.tsx`)

Copy and run the prompt below to redesign the Purchases screen:

```text
Redesign the Owner Purchases Screen (purchases.tsx) to follow the unified light viewport and dark obsidian hero header theme.

### Key Visual & Layout Rules:
- Viewport Backdrop: Clean light grey/slate canvas (#f8fafc).
- Top Hero Canvas: Deep obsidian dark navy (#0a0e1a). Includes:
  - Top margins (marginTop: 26) with horizontal row containing translucent ArrowLeft back button and green-outlined "SUPPLY CHAIN SIGN-OFFS" badge.
  - Large titles: "Purchase Orders &" in thin white text, and "Factory Deliveries." in bold brand green (#04a700). Set explicit lineHeight (e.g., 38 for mainTitle, 40 for accentTitle) to avoid descender overlap.
- Responsive Cards (Light backdrop area):
  - Card styles: Clean white backgrounds, radius: 18px, thin border (color: '#f1f5f9'), and fine shadows.
  - Interactive PO Forms: Input controls, validation warnings, and fully operational modal sheets to place new factory PO orders.
  - PO Approval List: Scrollable list of pending purchases showing invoice codes, showroom locations, costs, specs, and a prominent "+ Sign-Off" action button.

### Complete CRUD Functionality:
- [CREATE]: "+ PLACE FACTORY PO" button opening a sheet mapping the EV scooter color options, quantities, unit base price, and target godown destination.
- [READ]: Transit-phased orders timeline feed (Placed, In Transit, Arrived, Allocated).
- [UPDATE]: Interactive sign-off button changing statuses from "Pending" to "Approved/Signed", triggering capital balance debit allocations.
- [DELETE]: A void button allowing users to cancel/purge pending PO requisitions before factory dispatch.
```

