# KVR Motors ERP - Team Collaboration & Frontend Setup Guide

Welcome to the **KVR Motors ERP** development repository. This document outlines the environment configurations, setup guidelines, git workflow, and frontend UI strategies for all team members.

---

## 1. Project Directory Overview

The repository is structured as a monorepo containing all sub-systems:

```txt
kvr-motors-erp/
│
├── backend/          # Django REST Framework (Python API Backend)
├── dashboards/       # Next.js (TypeScript + Tailwind Dashboard)
├── mobile-app/       # Expo / React Native Mobile Application
└── docs/             # Documentation & API Specifications
```

---

## 2. Frontend Team Onboarding Steps

To start working on the frontend dashboards, every team member must execute the following steps exactly.

### Step 2.1: Clone the Repository
Clone the repository and enter the project folder:
```bash
git clone https://github.com/Aswinsaipalakonda/kvr-motors-erp.git
cd kvr-motors-erp
```

### Step 2.2: Create Your Feature Branch
Never write code directly on `main` or `develop`. Always create a branch dedicated to your module:
```bash
# Template: git checkout -b feature/<your-assigned-module-name>

# Examples:
git checkout -b feature/inventory-dashboard
git checkout -b feature/sales-dashboard
git checkout -b feature/leads-module
git checkout -b feature/ledger-module
git checkout -b feature/owner-dashboard
```

### Step 2.3: Install Dependencies
Navigate into the `dashboards` directory and install the configured packages:
```bash
cd dashboards
npm install
```

### Step 2.4: Run the Development Server
Launch the Next.js dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 3. Recommended Team Assignments

| Team Member | Responsibility / Module | Target Output |
| :--- | :--- | :--- |
| **Lead Developer** | Backend APIs + Database + Mobile App | Django REST APIs, PostgreSQL, Expo structure |
| **Member 1** | Inventory Dashboard UI | Vehicle Stock, Battery Stock, Godown transfers UI |
| **Member 2** | Sales Dashboard UI | Customer details, sales booking, invoices UI |
| **Member 3** | Leads & Enquiry Dashboard UI | Pipelines, follow-up scheduler, metrics UI |
| **Member 4** | Ledger & Financial Reports UI | Income/Expense listings, custom report tables |
| **Member 5** | Owner & Analytics Dashboard UI | High-level charts, branch comparisons, metrics |

---

## 4. Frontend UI Rules & Best Practices

### A. Use Mock Data First
Do **NOT** wait for the backend APIs to be ready. Build all screens, tables, forms, and graphs using clean, realistic local mock data arrays:
```typescript
// Place this inside a local mock file or directly in the page state
export const MOCK_VEHICLES = [
  {
    id: "V-1001",
    modelName: "Kinetic Green Zoom",
    color: "Forest Green",
    location: "Pendurthi Godown",
    status: "Available",
    batteryStatus: "Unassigned"
  },
  {
    id: "V-1002",
    modelName: "Watts Engineering Volt",
    color: "Sleek Silver",
    location: "Pineapple Colony",
    status: "Booked",
    batteryStatus: "Assigned"
  }
];
```

### B. Leverage Shared Components
Do not reinvent the wheel or build duplicate elements. Always write/use shared components in `dashboards/components/`:
* `Sidebar.tsx` (Consistent multi-level branch navigation)
* `Navbar.tsx` (User profile details & active branch switchers)
* `Table.tsx` (Reusable tabular data structure with sorting/pagination)
* `Modal.tsx` (Popups for additions and updates)
* `DashboardCard.tsx` (Standard metric summaries with dynamic indicators)
* `Loader.tsx` & `EmptyState.tsx` (Feedback layouts)

### C. Aesthetic Consistency (Tailwind CSS)
Ensure your layouts match the modern, premium aesthetic specified in the PRD:
* **Palette**: Sleek dark modes, HSL tailored accents (emerald greens for kinetic, electric blues for watts), clean slate/zinc grays.
* **Typography**: Professional typography hierarchy utilizing the Tailwind configuration.
* **Animations**: Subtle transitions on hover (`transition-all duration-200 hover:scale-[1.02]`).

---

## 5. Git Workflow & Merging Changes

When you complete your module feature:

1. **Commit and Push to Remote Branch**:
   ```bash
   git add .
   git commit -m "feat: completed inventory dashboard table and metrics UI"
   git push origin feature/inventory-dashboard
   ```
2. **Open a Pull Request**:
   Go to the GitHub repository page, create a Pull Request from `feature/inventory-dashboard` into `main`, and request a review from the Lead Developer.
3. **Merge**:
   Once approved, your lead will merge the PR.
4. **Update Locally**:
   To fetch updates made by others, switch to your main branch, pull, and merge:
   ```bash
   git checkout main
   git pull origin main
   ```
