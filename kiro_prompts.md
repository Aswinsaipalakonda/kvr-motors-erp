# Kiro.dev Screen Scaffolding Prompts

Use the highly detailed, structured prompts below to scaffold the React Native screens for the other roles in your KVR Motors ERP application using **Kiro.dev**. Once generated, Antigravity will connect them to the active Django API endpoints and database state.

---

## 👥 Role 1: Supervisor App Screens (`mobile-app/src/app/supervisor/`)

### Screen 1: Supervisor Command Dashboard (`dashboard.tsx`)
```text
Build a premium, state-of-the-art Supervisor Command Dashboard (dashboard.tsx) using React Native, styled to match the KVR premium light-theme slate canvas (#f8fafc) and obsidian dark hero header (#0a0e1a) design language.

Layout Requirements:
- Viewport: Comfortable light grey slate backdrop (#f8fafc) with bottom padding (paddingBottom: 110) to support sticky actions.
- Top Hero Canvas: Deep obsidian slate (#0a0e1a) header with:
  - Margins framing a translucent "OPERATIONS COMMAND CENTER" green badge on the top right.
  - Large title layout: "Showroom Yards &" in thin white text (fontSize: 24, fontStyle: 'light') and "Active Operations." in bold brand green (#04a700, fontSize: 32, fontWeight: '800') with clean line heights.
  - Inline Telemetry Widgets: A horizontal row of three capsules with border radius of 9999 showing: "Pending PDIs: 4", "Active Shifts: 3", and "Pending Transfers: 2".
- Live Operations Bento Grid:
  - Cards: Clean white backgrounds, rounded corners (borderRadius: 18), fine borders (#f1f5f9), and soft shadow offsets.
  - "FIFO Override Requests" Alert Widget: A vibrant orange bordered card alerting that 2 Sales Executives have requested a FIFO battery bypass. Includes a "REVIEW" pill button (borderRadius: 9999).
  - "Pre-Delivery Inspection (PDI)" Queue Card: Standard checkoff card prompting to sign off on 4 EV units ready for immediate client delivery.
  - "Active Shift Leaderboard" Widget: Displays checking metrics for Sales Executives today (e.g. Suresh Babu, Anil Kumar) with miniature green progress indicator rings of daily target pace.
  - "Inter-Godown Stock Transfers" Card: Shows vehicles currently "In Transit" or "Pending approval" between Pendurthi Godown and Visakhapatnam Showroom.
- Interactive Floating CTA:
  - "+ NEW STOCK TRANSFER" button styled as a premium fully rounded pill (borderRadius: 9999, height: 52) using brand green background (#04a700) with a subtle shadow, which opens a details modal.
  - Clear, hardware-accelerated micro-animations on all pressable cards.
```

### Screen 2: FIFO Battery Override Queue (`fifo-overrides.tsx`)
```text
Build an interactive FIFO Battery Override Approval screen (fifo-overrides.tsx) for the Supervisor role to review exceptions.

Layout Requirements:
- Viewport: Comfortable light grey slate backdrop (#f8fafc) with deep obsidian header (#0a0e1a).
- Top Hero Deck: Large title "FIFO Battery Exception Queue" in thin white, and subtitle "Override Reviews." in brand green (#04a700) with explicit line heights.
- Override Request Cards:
  - Render a vertical list of pending override request cards.
  - Each card must display:
    - Left side: Large blue Battery Icon and Serial number ("BATT-00890") in mono font, capacity ("2.0 kWh"), and purchase date ("12 May 2026").
    - Right side: Sales executive name ("Anil Kumar") and Invoice reference ("INV-2026-4491").
    - Warning Banner inside Card: "FIFO Violation: A newer battery pack is being selected while older stock 'BATT-00874' is still available." in a light amber container.
  - Quick Interactive Action Buttons:
    - Two side-by-side pill buttons with border radius 9999.
    - Button 1: "APPROVE BYPASS" in solid green (#04a700) text on translucent green background.
    - Button 2: "REJECT" in solid red (#ef4444) text on white background with red borders.
- Micro-interactions: Show a spinner overlay while an action is processing, with a smooth sliding transition on card dismissal.
- Navigation: Header includes a rounded ArrowLeft button linking back to '/supervisor/dashboard'.
```

### Screen 3: Godown Stock Transfer Logs (`transfers.tsx`)
```text
Build an interactive inter-godown Stock Transfer screen (transfers.tsx) for the Supervisor role.

Layout Requirements:
- Backdrop: Light grey viewport canvas (#f8fafc) with obsidian hero top deck (#0a0e1a).
- Top Hero Canvas: Large white title "Warehouse Mover" and bold brand green subtitle "Transfer Registry." with explicit lineHeight.
- Interactive Transfer Creator Form (Modal):
  - Premium "+ CREATE TRANSFER REQUISITION" pill button (borderRadius: 9999) that slides up a modal sheet.
  - Modal inputs must use a border radius of 14, including dropdown selectors for: "Vehicle Unit (VIN Selection)", "From Location (Pendurthi, Pineapple, Visakhapatnam dropdown)", "To Location (Visakhapatnam, Srikakulam, Kakinada dropdown)", and a priority pill-selector ("Low", "Medium", "High", "Urgent").
- Transfer Timeline Feed:
  - Scrollable cards showing transfer codes ("TR-2026-902"), matching VIN, source, destination, and status indicators ("Pending Approval" in orange pill, "In Transit" in blue pill, "Received" in green pill).
  - Expandable detail panels showing requesting/approving supervisor accounts.
- Navigation: Add a back button (ArrowLeft) linking to '/supervisor/dashboard' and integrate React Native BackHandler.
```

### Screen 4: Lead Allocation Engine (`leads-assignment.tsx`)
```text
Build a high-end Lead Allocation and Executive Assignment Console (leads-assignment.tsx) for Supervisors to distribute unallocated inbound queries.

Layout Requirements:
- Viewport: Comfortable light grey slate backdrop (#f8fafc) with deep obsidian header (#0a0e1a).
- Top Hero Deck: White title "Inbound Enquiries" and brand green subtitle "Lead Allocation Engine." with a clear summary count badge "9 Unassigned Leads" in orange.
- Interactive Lead Directory List:
  - Scrollable list of unassigned lead cards showing:
    - Customer Name ("Ramana Reddy"), Interested Vehicle Model ("Dynamo Pro"), Lead Inflow Source ("Website" or "Walk-in"), and Enquiry Date.
    - Status badge: "Awaiting Callback" in grey pill container.
  - Direct Action Trigger:
    - A prominent pill button on each card: "ALLOCATE TO EXECUTIVE" (borderRadius: 9999) with an icon of a user checkmark.
    - Tapping this button slides up a premium bottom drawer menu containing the roster of checked-in Sales Executives ("Anil Kumar", "Suresh Babu", "Ravi Varma").
    - Selecting an executive dynamically updates the card with a loading spinner and then shifts it out of the unassigned list with a fade-out animation.
- Navigation: ArrowLeft back button to return to '/supervisor/dashboard'.
```

### Screen 5: Booking Lock & Verification Queue (`bookings.tsx`)
```text
Build a high-end Booking Lock & Deposit Verification Queue screen (bookings.tsx) for Supervisors.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with obsidian hero header (#0a0e1a).
- Top Hero Deck: Title "Deposit Verification" and subtitle "Booking Lock Queue." in green.
- Booking Request Cards:
  - Vertical list of booking reservations logged by sales executives.
  - Each card details: Customer Name, Booking ID ("BK-8012"), Token Advance Amount Paid ("₹ 10,000" in bold brand green), vehicle model, color choice, and payment mode (UPI transaction ID, SBI Finance, or cash).
  - Double CTA Pill-Buttons inside card (borderRadius: 9999):
    - "CONFIRM BOOKING LOCK" in solid brand green to lock and allocate the vehicle unit in the database.
    - "REJECT & REFUND" in white with red text for token verification failures.
- Navigation: Left chevron icon in header linking back to '/supervisor/dashboard'.
```

---

## 👥 Role 2: Sales Executive App Screens (`mobile-app/src/app/sales/`)

### Screen 1: Sales Dashboard & Target Tracker (`dashboard.tsx`)
```text
Build a premium Sales Executive Dashboard (dashboard.tsx) designed to maximize sales engagement with clean layouts and pill-shaped controls.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with deep obsidian top header (#0a0e1a).
- Top Hero Canvas:
  - Title: "My Sales Pipeline" in thin white text, and "Daily Performance." in bold brand green (#04a700).
  - Interactive Target Ring Widget: Displays target MTD pace "Won: 4 / Target: 10 EVs" with a clean circular progress indicator using smooth brand green colors and shadow rings.
- Dynamic Sales Bento Grid:
  - Cards: Clean white backgrounds, rounded corners (borderRadius: 18), fine borders, and soft shadows.
  - "Hot Enquiries" Widget: Shows list of active leads with dynamic follow-up times and a green "CALL" pill button (borderRadius: 9999).
  - "Showroom Bookings" Card: Lists token deposits received today, color choices, and status pills.
  - "Branch Performance Leaderboard" Card: Dynamic leaderboard showing executive rankings, target vs. achieved, and branch revenue fetched dynamically.
- Interactive Floating CTA:
  - "+ NEW WALK-IN LEAD" pill button (borderRadius: 9999, height: 52) opening a customer registration modal form (Customer Name, Phone, and Interested Scooter Model dropdown).
```

### Screen 2: Leads Directory & Interaction Logger (`leads.tsx`)
```text
Build an interactive customer Leads Directory (leads.tsx) for Sales Executives.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with obsidian hero header (#0a0e1a).
- Top Hero Deck: Title "Sales Prospect Directory" and brand green subtitle "Customer Leads."
- Quick Search and Filter Bar:
  - Search input with an search icon, bordered light container with border radius of 9999.
  - Row of touchable category pills (borderRadius: 9999) to filter by status: "All", "New Lead", "Contacted", "Follow-up", "Negotiation", "Won", "Lost".
- Lead Cards Feed:
  - List cards displaying lead details: Name, phone, interested model, created date, and notes.
  - Action Panel on each card:
    - Button 1: "UPDATE STAGE" pill button (borderRadius: 9999) that advances the lead to the next lifecycle stage with a smooth fade-in.
    - Button 2: WhatsApp Icon that opens WhatsApp with a pre-filled greeting message.
- KeyboardAvoidingView container for the entire screen to prevent layout overlap during note logging.
```

### Screen 3: Token Booking Registration Portal (`booking-form.tsx`)
```text
Build a premium Token Booking Registration Portal screen (booking-form.tsx) for Sales Executives to register advance deposits.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with deep obsidian top header (#0a0e1a).
- Booking Form Container:
  - Centered card layout with white background, radius 18, and border #f1f5f9.
  - Inputs must be beautifully spaced with rounded corner forms (borderRadius: 14) and support inline validation.
  - Fields include:
    - "Customer Name" and "Customer Phone" text inputs.
    - "EV Model Preference" and "Color Choice" dropdowns.
    - "Token Advance Amount (INR)" numeric keyboard field (preloaded options: 5000, 10000, 15000 in pill selectors).
    - "Payment Method" selector: "UPI / NetBanking", "SBI Finance", "HDFC Bank Loan", "Self-Finance Cash".
  - CTA Button:
    - Prominent green pill-shaped button "REGISTER ADVANCE DEPOSIT & TRANSMIT" (borderRadius: 9999, height: 52) using brand green background.
- Success Feedback:
  - Submitting registers the deposit and triggers a premium success modal showing an invoice receipt block, indicating the booking has been transmitted to the Supervisor lock queue.
```

### Screen 4: Premium Sales Checkout & Invoice Generator (`checkout.tsx`)
```text
Build a high-end Sales Checkout and Invoice Generator screen (checkout.tsx) for Sales Executives.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with deep obsidian top header (#0a0e1a).
- Section 1: Vehicle Lookup Auto-fill Panel
  - Input field to search by VIN, Motor, or Chassis number.
  - "AUTO-FILL SPECS" pill button (borderRadius: 9999).
  - On search success, animate and auto-populate: Model Name, Color, Base Price, Showroom Branch, and the pre-allocated oldest battery pack.
- Section 2: Battery Assignment with FIFO Alert Guard
  - A dropdown selector showing all available battery serial numbers.
  - Critical Logic Guard: If the sales executive selects a battery serial number that is not the oldest available stock, display a prominent warning panel:
    - "FIFO Violation Triggered: Selected battery is newer than the oldest in stock."
    - Display the oldest pack's serial ("BATT-00874") as the recommended pick.
    - Present a "REQUEST SUPERVISOR OVERRIDE" pill button (borderRadius: 9999) in orange. Clicking it sends a request and changes button status to "Transmit Pending Supervisor Approval...".
- Section 3: Financier & Insurance Options
  - Select fields for Financier partner and Insurance Partner scheme.
- Main CTA Button:
  - "CONFIRM TRANSACTION & DISPATCH" pill button (borderRadius: 9999) disabled if a FIFO warning is active unless supervisor override is approved.
```

### Screen 5: Follow-ups & Direct Dialer (`followups.tsx`)
```text
Build a premium Customer Follow-ups Agenda and Direct Dialer screen (followups.tsx) for Sales Executives.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with obsidian hero header (#0a0e1a).
- Top Hero Deck: White title "Agenda Schedule" and subtitle "Outbound Follow-ups." in brand green.
- Agenda Feed List:
  - List of customers due for callback today, displaying: Customer Name, Phone, interested model, and purpose ("Test Drive Booking", "Finance docs collection", "Color confirmation").
  - Target Indicators: High-priority follow-ups highlighted with a fine rose border.
  - Action Controls:
    - "Call" Pill Button (borderRadius: 9999): Tapping triggers a dialer overlay using standard linking.
    - "WhatsApp" Pill Button: Tapping launches a WhatsApp API pre-filled text composer with a custom greeting template.
```

---

## 👥 Role 3: Operations & Yard Staff Screens (`mobile-app/src/app/staff/`)

### Screen 1: Operations Dashboard & Runners Queue (`dashboard.tsx`)
```text
Build a highly functional, high-contrast Operations & Yard Staff Dashboard (dashboard.tsx) to manage physical tasks, styled with slate grey backdrop (#f8fafc) and obsidian header (#0a0e1a).

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with obsidian header (#0a0e1a).
- Top Hero Canvas: Title "Godown Yards &" and subtitle "Operations Queue." in brand green (#04a700).
- Live Status Capsules: A row of three pill capsules showing: "My Active Tasks: 3", "Completed: 5", and "Yards Load: 82%".
- Operations Task Feed:
  - Vertical list of active physical tasks assigned to the yard runner (e.g. "Move Kinetic E-Luna VIN-KG-44821 to Pendurthi Godown", "Initiate PDI for Watts 100", "Vehicle Washing & Charger check").
  - Card style: Bold typography, light borders, white backgrounds, and a circular checkbox on the right.
  - Interaction: Tapping the checkbox triggers a premium micro-animation (completes with check icon and green background) to instantly mark the task as complete in the database.
```

### Screen 2: Godown VIN/QR Code Scanner (`godown-scanner.tsx`)
```text
Build a high-performance Godown VIN/QR Code Scanner screen (godown-scanner.tsx) for physical stock tracking.

Layout Requirements:
- Viewport: Slate grey canvas (#f8fafc) with deep obsidian header (#0a0e1a).
- Interactive Camera Scanner Frame:
  - Center viewport displays a dark translucent overlay framing a bright green-bordered scanning target box.
  - Subtitle below scanner: "Align the vehicle's VIN plate barcode or QR code inside the frame to scan."
- Manual Entry Toggle Panel:
  - In case scanning fails, provide a premium "MANUALLY ENTER VIN" toggle button (borderRadius: 9999).
  - Standard text input field for VIN/Motor code and a "REGISTER MOVEMENT" pill button.
- Scanner Action Log:
  - Bottom sliding list detailing scanned units: VIN, scanned time, and registered status ("GRN Received", "Stock Shipped", or "Showroom Dispatch").
```

### Screen 3: Pre-Delivery Inspection Checksheet (`pdi-checklist.tsx`)
```text
Build a comprehensive, multi-step Pre-Delivery Inspection Checklist screen (pdi-checklist.tsx) for mechanics and yard runners.

Layout Requirements:
- Viewport: Comfortable slate grey backdrop (#f8fafc) with deep obsidian top header (#0a0e1a).
- Vehicle Info Card: Displays the VIN number, motor code, model name, and allocated customer name of the vehicle undergoing inspection.
- Multi-step Checklist Feed:
  - Standard toggle switches (borderRadius: 9999) for each checklist step:
    - Step 1: "Battery State-of-Charge (SoC) verified above 95%?"
    - Step 2: "Li-ion Battery Charger boxed and loaded in scooter?"
    - Step 3: "Panel fitment and paint scratch-free inspection passed?"
    - Step 4: "Double keys and vehicle manual loaded?"
    - Step 5: "Mechanic test-ride safety verification complete?"
- Inspection Sign-off CTA:
  - A prominent pill button: "SUBMIT COMPLETED PDI RECORD" (borderRadius: 9999, height: 52) which is only active once all checkboxes are checked. Tapping it marks the unit's PDI status as "Passed" and unlocks the key delivery process.
```

### Screen 4: Digital Customer Handover Sheet (`handover.tsx`)
```text
Build a premium digital Customer Handover and Key Delivery Portal screen (handover.tsx).

Layout Requirements:
- Viewport: Comfortable light grey slate canvas (#f8fafc) with deep obsidian top header (#0a0e1a).
- Top Hero deck: Title "Key Handover" and brand green subtitle "Customer Delivery."
- Handover Item checklist details:
  - Clean list of items verified with the client: "Double keys delivered", "Li-ion battery charger boxed", "Owner's manual handed over", "Warranty card activated".
- Digital Signature Canvas Pad:
  - A clean, rectangular signature box placeholder with white background, radius 18, and border #e2e8f0.
  - Text inside canvas: "Please sign here to authorize vehicle hand-off."
  - Under signature: Two side-by-side pill buttons: "CLEAR CANVAS" in white and "SAVE SIGNATURE" in translucent green.
- Main Action Button:
  - "COMPLETE KEY DELIVERY & DISPATCH" pill button (borderRadius: 9999, height: 52) using brand green background, which marks the invoice as settled and triggers a stunning success dialogue overlay.
```
