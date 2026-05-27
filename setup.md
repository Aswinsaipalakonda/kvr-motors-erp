# KVR Motors ERP - Complete Initial Setup Guide

---

# Objective

This document contains the complete step-by-step setup process for initializing the KVR Motors ERP project.

This guide includes:

* Git setup
* Docker PostgreSQL setup
* Django backend setup
* Next.js dashboard setup
* Expo mobile app setup
* Folder structure
* Dependency installation
* Git workflow
* Initial backend structure
* Initial frontend structure
* Team collaboration workflow

This document is intended to be executed exactly step-by-step.

---

# 1. Prerequisites

Install the following software before starting.

## Required Software

### 1. Git

Download:
[https://git-scm.com/downloads](https://git-scm.com/downloads)

Verify:

```bash
git --version
```

---

### 2. Node.js

Download LTS Version:
[https://nodejs.org/](https://nodejs.org/)

Verify:

```bash
node -v
npm -v
```

---

### 3. Python

Download:
[https://www.python.org/downloads/](https://www.python.org/downloads/)

Verify:

```bash
python --version
```

---

### 4. Docker Desktop

Download:
[https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Verify:

```bash
docker --version
```

---

### 5. VS Code

Download:
[https://code.visualstudio.com/](https://code.visualstudio.com/)

Recommended Extensions:

* Python
* Django
* ES7 React Snippets
* Tailwind CSS IntelliSense
* GitLens
* Prettier
* Docker

---

# 2. Current Project Structure

You already created:

```txt
kvr-motors-erp/
│
├── backend/
├── dashboards/
├── docs/
└── mobile-app/
```

Good.

Do NOT change this structure.

---

# 3. Initialize Git Properly

Open terminal in root folder.

## Verify Current Branch

```bash
git branch
```

---

## Create Main Development Branch

```bash
git checkout -b develop
```

---

# 4. Create .gitignore

Create file:

```txt
.gitignore
```

Add:

```txt
# Python
venv/
__pycache__/
*.pyc

# Node
node_modules/
.next/

# Environment
.env
.env.local

# Expo
.expo/

# Logs
*.log

# VS Code
.vscode/

# Mac
.DS_Store
```

---

# 5. Docker PostgreSQL Setup

This will create PostgreSQL inside Docker.

---

## Create docker-compose.yml

At root:

```txt
docker-compose.yml
```

Add:

```yaml
version: '3.9'

services:

  postgres:
    image: postgres:16
    container_name: kvr_postgres

    restart: always

    environment:
      POSTGRES_DB: kvr_motors
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

    ports:
      - "5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Start PostgreSQL

```bash
docker compose up -d
```

---

## Verify Container Running

```bash
docker ps
```

Expected:

```txt
kvr_postgres
```

---

# 6. Setup Django Backend

Go into backend folder.

```bash
cd backend
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

---

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Mac/Linux

```bash
source venv/bin/activate
```

---

## Install Django Dependencies

```bash
pip install django
pip install djangorestframework
pip install psycopg2-binary
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install python-dotenv
pip install drf-spectacular
```

---

## Save Requirements

```bash
pip freeze > requirements.txt
```

---

## Create Django Project

```bash
django-admin startproject config .
```

---

# 7. Create Django Apps

Run:

```bash
python manage.py startapp users
python manage.py startapp branches
python manage.py startapp vehicles
python manage.py startapp inventory
python manage.py startapp battery
python manage.py startapp sales
python manage.py startapp purchases
python manage.py startapp leads
python manage.py startapp ledger
python manage.py startapp booking
python manage.py startapp dashboard
```

---

# 8. Configure Django Settings

Open:

```txt
backend/config/settings.py
```

---

## Add Installed Apps

Add:

```python
'rest_framework',
'corsheaders',
'drf_spectacular',

'users',
'branches',
'vehicles',
'inventory',
'battery',
'sales',
'purchases',
'leads',
'ledger',
'booking',
'dashboard',
```

---

## Add Middleware

Add:

```python
'corsheaders.middleware.CorsMiddleware',
```

near top of middleware.

---

## Configure PostgreSQL Database

Replace DATABASES with:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kvr_motors',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## Configure CORS

Add:

```python
CORS_ALLOW_ALL_ORIGINS = True
```

---

## Configure REST Framework

Add:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

# 9. Create Custom User Model

IMPORTANT:
This must be done BEFORE migrations.

---

## Open

```txt
backend/users/models.py
```

---

## Create Role-Based User Model

Create fields:

* full_name
* role
* branch
* showroom
* phone_number
* is_active

Roles:

* admin
* owner
* supervisor
* sales_executive
* sales

---

## Configure AUTH_USER_MODEL

In settings.py:

```python
AUTH_USER_MODEL = 'users.User'
```

---

# 10. Create Initial Core Models

You should now create the following models.

---

## Branches App

Models:

* Branch
* Showroom
* InventoryLocation

---

## Vehicles App

Models:

* VehicleBrand
* VehicleModel
* VehicleUnit

---

## Battery App

Models:

* BatteryStock
* BatteryTransaction

---

## Leads App

Models:

* Enquiry
* Lead
* LeadFollowup

---

## Sales App

Models:

* Customer
* Sale
* Payment

---

## Purchases App

Models:

* Supplier
* Purchase
* PurchaseItem

---

## Ledger App

Models:

* LedgerEntry
* ExpenseCategory

---

## Booking App

Models:

* Booking

---

# 11. Run Migrations

Run:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

# 12. Create Superuser

Run:

```bash
python manage.py createsuperuser
```

Use:

```txt
username: admin
email: your-email
password: your-password
```

---

# 13. Run Django Server

```bash
python manage.py runserver
```

Open:

```txt
http://127.0.0.1:8000/admin
```

Verify:

* Django admin opens
* PostgreSQL connected
* Models visible

---

# 14. Setup Next.js Dashboard

Go root:

```bash
cd ..
```

Go dashboards:

```bash
cd dashboards
```

---

## Create Next.js App

If not initialized yet:

```bash
npx create-next-app@latest .
```

Choose:

```txt
TypeScript → Yes
ESLint → Yes
Tailwind → Yes
src/ directory → No
App Router → Yes
```

---

## Install Packages

```bash
npm install axios
npm install react-icons
npm install lucide-react
npm install recharts
npm install react-hook-form
npm install zod
npm install @hookform/resolvers
```

---

# 15. Create Dashboard Folder Structure

Inside dashboards:

```txt
app/
│
├── login/
├── admin/
├── owner/
├── supervisor/
├── inventory/
├── sales/
├── leads/
├── ledger/
├── booking/
│
├── components/
├── services/
├── hooks/
├── types/
├── constants/
└── layouts/
```

---

# 16. Create Shared Components

Create:

```txt
components/
```

Shared Components:

* Sidebar
* Navbar
* DashboardCard
* Table
* Modal
* FormInput
* Loader
* EmptyState
* StatusBadge

---

# 17. Setup Tailwind Structure

Create:

```txt
styles/
```

Maintain:

* colors
* spacing
* typography
* reusable classes

---

# 18. Setup Expo Mobile App

Go root:

```bash
cd ..
```

Go mobile app:

```bash
cd mobile-app
```

---

## Create Expo App

```bash
npx create-expo-app@latest .
```

---

## Install Packages

```bash
npm install axios
npm install @react-navigation/native
npm install react-native-screens
npm install react-native-safe-area-context
npm install react-native-gesture-handler
npm install react-native-reanimated
```

---

# 19. Mobile App Structure

```txt
app/
│
├── login/
├── dashboard/
├── leads/
├── inventory/
├── sales/
├── booking/
│
├── components/
├── services/
├── hooks/
├── types/
└── context/
```

---

# 20. Git Workflow Setup

---

## Push Initial Setup

Go root:

```bash
cd ..
```

Run:

```bash
git add .
git commit -m "Initial project setup"
git push origin main
```

---

# 21. Team Collaboration Workflow

Each teammate should:

---

## Clone Repository

```bash
git clone <repo-url>
```

---

## Create Feature Branch

Example:

```bash
git checkout -b feature/inventory-dashboard
```

---

## Work Only Inside Assigned Module

Example:

```txt
inventory/
```

Do NOT modify:

* backend config
* auth
* database structure
* routing structure

without approval.

---

# 22. Recommended Team Assignments

| Member   | Responsibility              |
| -------- | --------------------------- |
| You      | Backend + APIs + Mobile App |
| Member 1 | Inventory Dashboard         |
| Member 2 | Sales Dashboard             |
| Member 3 | Lead Management UI          |
| Member 4 | Ledger & Reports            |
| Member 5 | Owner Dashboard             |

---

# 23. Important Rules

## Rule 1

Freeze API response structure early.

---

## Rule 2

Use mock data initially.

---

## Rule 3

Do not allow teammates to modify migrations.

---

## Rule 4

Use consistent naming.

Example:

```txt
snake_case
```

---

## Rule 5

Keep business logic in backend only.

Especially:

* FIFO battery validation
* stock validation
* role permissions
* inventory movement

---

# 24. What To Do After Initial Setup

Once setup completed:

---

## Phase 1

Start backend development:

* authentication
* users
* branches
* showrooms
* inventory locations
* vehicle master
* vehicle units

---

## Phase 2

Start frontend layout:

* sidebar
* navbar
* routing
* dashboard layout

---

## Phase 3

Start APIs:

* login
* users
* vehicles
* inventory
* branches

---

## Phase 4

Frontend integration with APIs.

---

## Phase 5

Business logic:

* FIFO batteries
* stock transfers
* bookings
* ledger automation

---

# 25. Recommended Development Order

DO NOT randomly build modules.

Correct order:

1. Authentication
2. Users & Roles
3. Branches & Locations
4. Vehicle Management
5. Inventory
6. Purchases
7. Sales
8. Leads
9. Battery FIFO
10. Booking
11. Ledger
12. Reports
13. Mobile App

---

# 26. Recommended Deployment Stack

## Frontend

Vercel

## Backend

Railway / VPS

## Database

Docker PostgreSQL

## Mobile App

Expo EAS

---

# 27. Final Checklist

By end of setup:

* PostgreSQL running
* Django running
* Next.js running
* Expo running
* Git working
* Team branches created
* Django admin working
* Initial models created
* Repo pushed to GitHub

---

# KVR Motors ERP - What To Do After Initial Setup

---

# Current Status

The following setup is already completed:

* Project repository created
* Git repository initialized
* Folder structure created
* Docker PostgreSQL running
* Django backend initialized
* Django apps created
* Virtual environment created
* Next.js dashboard initialized
* Initial dependencies installed

This is a good foundation.

Now the next objective is:

```txt
Stabilize backend architecture and allow frontend team to start UI development.
```

---

# IMPORTANT

YES.

You should now:

* Push the repository to GitHub
* Allow teammates to start frontend pages
* Continue backend/API development independently

This is the correct workflow.

---

# 1. FIRST THING TO DO NOW

# Push Current Project To GitHub

Go to root folder:

```bash
cd kvr-motors-erp
```

---

## Check Current Git Status

```bash
git status
```

---

## Add All Files

```bash
git add .
```

---

## Create Initial Commit

```bash
git commit -m "Initial ERP project structure setup"
```

---

## Push To GitHub

```bash
git push origin main
```

---

# 2. AFTER PUSHING REPOSITORY

Now teammates can clone the project.

---

# 3. TEAMMATES SETUP PROCESS

Each teammate should run:

```bash
git clone <repo-url>
```

---

## Move Into Project

```bash
cd kvr-motors-erp
```

---

## Install Frontend Dependencies

```bash
cd dashboards
npm install
```

---

## Run Dashboard

```bash
npm run dev
```

---

# IMPORTANT

Teammates do NOT need backend setup immediately.

Because:

```txt
They should start building frontend UI using mock data.
```

This saves huge development time.

---

# 4. CREATE TEAM BRANCH STRATEGY

Each teammate MUST create their own branch.

Example:

```bash
git checkout -b feature/inventory-dashboard
```

Other examples:

```bash
git checkout -b feature/sales-dashboard
```

```bash
git checkout -b feature/leads-module
```

```bash
git checkout -b feature/ledger-module
```

---

# IMPORTANT RULE

Nobody should code directly in:

```txt
main
```

---

# 5. ASSIGN MODULES NOW

Recommended assignments:

| Team Member | Module                      |
| ----------- | --------------------------- |
| You         | Backend + APIs + Mobile App |
| Member 1    | Inventory Dashboard         |
| Member 2    | Sales Dashboard             |
| Member 3    | Leads Dashboard             |
| Member 4    | Ledger + Reports            |
| Member 5    | Owner Dashboard             |

---

# 6. WHAT TEAMMATES SHOULD BUILD NOW

IMPORTANT:

They should NOT wait for APIs.

They should build:

* sidebar
* navbar
* layouts
* forms
* tables
* cards
* charts
* pages
* modals
* routing

using:

```txt
mock data
```

---

# 7. CREATE DASHBOARD STRUCTURE NOW

Inside:

```txt
dashboards/app/
```

Create:

```txt
admin/
owner/
supervisor/
inventory/
sales/
leads/
ledger/
booking/
```

---

# 8. CREATE COMMON COMPONENTS

Inside:

```txt
dashboards/components/
```

Create reusable components:

```txt
Sidebar.tsx
Navbar.tsx
DashboardCard.tsx
Table.tsx
Modal.tsx
Loader.tsx
StatusBadge.tsx
EmptyState.tsx
SearchBar.tsx
```

---

# 9. CREATE COMMON LAYOUT FIRST

IMPORTANT:

Before building business modules.

Create:

* sidebar
* navbar
* dashboard layout
* responsive structure
* theme/colors

This ensures all modules look consistent.

---

# 10. YOUR JOB NOW (BACKEND)

You should NOT start frontend pages.

You should focus on:

```txt
backend architecture
```

---

# 11. YOUR NEXT BACKEND TASKS

# STEP 1

Create Custom User Model.

Roles:

```txt
admin
owner
supervisor
sales_executive
sales
```

---

# STEP 2

Create Core Models.

Start ONLY with:

```txt
Branch
Showroom
InventoryLocation
VehicleBrand
VehicleModel
VehicleUnit
```

Do NOT create all business logic now.

---

# STEP 3

Register Models In Django Admin.

Verify:

```txt
/admin
```

works correctly.

---

# STEP 4

Create Authentication APIs.

Build:

```txt
Login API
Refresh Token API
Current User API
```

---

# STEP 5

Create Initial APIs.

Start with:

```txt
Branches API
Showrooms API
Vehicle Models API
Vehicle Units API
```

---

# 12. VERY IMPORTANT

Freeze API response structures early.

Example:

GOOD:

```json
{
  "id": 1,
  "name": "Kinetic Green",
  "price": 120000
}
```

BAD:

Changing field names repeatedly.

Because:

```txt
Frontend work will break.
```

---

# 13. CREATE API DOCUMENTATION

Inside:

```txt
docs/apis.md
```

Document:

* endpoint
* request body
* response body
* permissions

---

# 14. FRONTEND DEVELOPMENT RULES

Teammates should:

---

## Use Mock Data

Example:

```ts
const vehicles = [
  {
    id: 1,
    model: "Kinetic Green X1",
    stock: 10
  }
]
```

---

## Use Shared Components

Do NOT duplicate:

* tables
* cards
* forms
* layouts

---

## Follow Common Theme

Use:

* same spacing
* same typography
* same sidebar
* same colors

---

# 15. WHAT SHOULD NOT HAPPEN NOW

Avoid:

* advanced analytics
* notifications
* mobile app screens
* payment gateway
* GST invoices
* AI features
* barcode scanning
* WhatsApp integration

Those are later-phase features.

---

# 16. DEVELOPMENT PRIORITY ORDER

Correct order:

1. Authentication
2. Roles
3. Branches
4. Showrooms
5. Inventory Locations
6. Vehicle Management
7. Inventory
8. Purchases
9. Sales
10. Leads
11. Battery FIFO
12. Ledger
13. Booking
14. Reports
15. Mobile App

---

# 17. HOW TEAMMATES SHOULD PUSH CODE

After completing work:

```bash
git add .
```

```bash
git commit -m "Completed inventory dashboard UI"
```

```bash
git push origin feature/inventory-dashboard
```

---

# 18. HOW YOU SHOULD MERGE CODE

Go to GitHub.

Create Pull Request.

Review changes.

Merge into:

```txt
main
```

Then locally:

```bash
git pull origin main
```

---

# IMPORTANT

Do NOT manually copy files between teammates.

Use Git properly.

---

# 19. YOUR TARGET FOR NEXT 2 DAYS

By next 2 days you should have:

* Auth working
* Roles working
* Django admin configured
* Vehicle models created
* Inventory locations working
* Initial APIs working
* Dashboard layouts completed
* Sidebar completed
* Inventory UI completed

---

# 20. CURRENT BEST STRATEGY

YOU:

* Backend
* Database
* APIs
* Business logic
* Authentication

TEAM:

* Dashboard pages
* UI components
* Tables/forms
* Charts/layouts
* API integration later

This is the fastest workflow for finishing the MVP.

---

# END OF DOCUMENT
