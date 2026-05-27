# KVR Motors ERP Application - Product Requirements Document (PRD)

---

# 1. Project Overview

## Product Name

KVR Motors ERP System

## Product Type

Multi-branch Electric Vehicle Dealership ERP & Inventory Management Platform

## Business Type

Electric Vehicle Showroom & Distribution Management

## Objective

The goal of this application is to digitize and centralize all operations of KVR Motors and Future Ride showrooms including:

* Vehicle inventory management
* Battery stock management
* Sales operations
* Purchase management
* Lead and enquiry tracking
* Ledger and financial entries
* Advance booking system
* Multi-branch management
* Staff and role management
* Stock movement tracking
* Real-time operational dashboards

The application should support both web dashboards and mobile applications.

---

# 2. Business Structure

## Branches

### Vizag

* KVR Showroom
* Future Ride Showroom

### Srikakulam

* KVR Showroom

### Kakinada

* KVR Showroom

---

# 3. Showroom Categories

## KVR

Vehicle Categories:

* Kinetic Green
* Frankly
* Dynamo
* Others

Admin should be able to:

* Add new categories
* Edit categories
* Disable categories

---

## Future Ride

Vehicle Categories:

* Kinetiq
* Watts Engineering

Admin should be able to:

* Add new categories
* Edit categories
* Disable categories

---

# 4. Inventory Locations

The system should support multiple inventory locations.

## Current Locations

1. Pendurthi Godown
2. Pineapple Colony Godown
3. Isukapalem Showroom
4. Akkayyapalem
5. Srikakulam
6. Kakinada

Each inventory location must support:

* Branch mapping
* Showroom mapping
* Stock visibility
* Stock transfers
* Stock movement history

---

# 5. User Roles & Permissions

## Roles

### Admin

Full access to all modules and system configuration.

### Owner

Access to:

* Analytics
* Sales reports
* Ledger reports
* Inventory overview
* Branch performance
* Staff performance

### Supervisor

Access to:

* Assigned branch inventory
* Sales monitoring
* Lead assignments
* Staff management
* Booking approvals

### Sales Executive

Access to:

* Lead management
* Customer management
* Sales creation
* Booking management
* Vehicle assignment

### Sales

Access to:

* Assigned leads
* Customer updates
* Booking updates
* Basic inventory visibility

---

# 6. Authentication System

## Features

* Secure login system
* Role-based access
* JWT authentication
* Session management
* Password reset
* Login activity logs

## Login Platforms

* Web Dashboard
* Mobile App

## Redirect Logic

Users should automatically redirect to role-specific dashboards after login.

---

# 7. Branch Management Module

## Features

* Create branch
* Edit branch
* Activate/deactivate branch
* Assign showrooms
* Assign inventory locations
* Branch-wise reporting
* Branch-wise stock visibility

## Functionalities

* Multi-branch operations
* Branch-based permissions
* Branch-specific analytics

---

# 8. Showroom Management Module

## Features

* Create showroom
* Assign categories
* Assign inventory locations
* Manage showroom inventory
* Track showroom sales

## Functionalities

* Showroom-level analytics
* Category-wise sales tracking
* Showroom-wise inventory allocation

---

# 9. Vehicle Management Module

## Objective

Manage both vehicle models and actual vehicle stock units.

---

## Vehicle Master Management

### Features

* Add vehicle model
* Edit vehicle model
* Add pricing
* Add category
* Add showroom type
* Add specifications
* Upload vehicle images

### Vehicle Fields

* Model Name
* Brand
* Category
* Base Price
* Vehicle Type
* Color Variants
* Battery Compatibility
* Description
* Status

---

## Vehicle Unit Management

Each physical vehicle should be uniquely tracked.

### Features

* Add stock units
* VIN tracking
* Motor number tracking
* Chassis tracking
* Auto-fill functionality
* Inventory mapping
* Status tracking

### Vehicle Unit Fields

* VIN Number
* Motor Number
* Chassis Number
* Color
* Vehicle Model
* Location
* Branch
* Showroom
* Purchase Date
* Stock Status
* Assigned Battery
* Booking Status

---

## Vehicle Status Types

* Available
* Reserved
* Booked
* Sold
* In Transit
* Service
* Damaged

---

## Auto-fill Functionality

If user enters:

* VIN Number
  OR
* Motor Number
  OR
* Chassis Number

Then system should automatically fetch:

* Vehicle details
* Model
* Color
* Status
* Assigned location
* Battery details

---

# 10. Inventory Management Module

## Objective

Manage stock movement across all locations.

---

## Features

* Stock In
* Stock Out
* Internal transfers
* Inventory adjustments
* Location tracking
* Batch uploads
* Stock history
* Real-time stock availability

---

## Functionalities

* Branch-wise stock visibility
* Location-wise stock visibility
* Vehicle availability checking
* Stock transfer approvals
* Transfer history tracking
* Inventory reconciliation

---

## Inventory Operations

### Stock In

* Purchase stock entry
* Vehicle assignment
* Battery assignment
* Location allocation

### Stock Out

* Sales dispatch
* Transfer dispatch
* Damage removal

### Transfers

* Godown to showroom
* Branch transfers
* Inter-location movement

---

# 11. Battery Management Module

## Objective

Track battery stock with FIFO validation.

---

## Features

* Battery stock entry
* Battery assignment
* FIFO validation
* Battery serial tracking
* Battery stock visibility
* Battery history

---

## Battery Fields

* Serial Number
* Capacity
* Purchase Date
* Status
* Assigned Vehicle
* Inventory Location
* Supplier

---

## Battery Status

* Available
* Assigned
* Sold
* Damaged
* Returned

---

## FIFO Rule

The system must enforce FIFO inventory handling.

### Requirements

* Oldest battery stock should be sold first
* If newer stock selected before older stock:

  * Show warning message
  * Require supervisor/admin override

### Validation Flow

* Check available stock
* Compare purchase dates
* Identify oldest stock
* Validate assignment

---

# 12. Purchase Management Module

## Objective

Manage all purchase operations and stock intake.

---

## Features

* Supplier management
* Purchase order creation
* Purchase approvals
* Stock receiving
* Invoice upload
* Purchase history
* Purchase analytics

---

## Purchase Fields

* Purchase Number
* Supplier
* Vehicle Details
* Quantity
* Purchase Price
* Invoice Number
* Invoice Date
* Received Date
* Assigned Location
* Payment Status

---

## Functionalities

* Auto stock generation
* Ledger integration
* Inventory synchronization
* Supplier-wise reporting

---

# 13. Sales Management Module

## Objective

Manage vehicle sales and customer transactions.

---

## Features

* Customer creation
* Sales entry
* Invoice generation
* Vehicle assignment
* Booking conversion
* Payment tracking
* Delivery management
* Sales analytics

---

## Sales Fields

* Customer Name
* Customer Contact
* Vehicle Details
* Assigned Battery
* Payment Details
* Delivery Status
* Sales Executive
* Branch
* Invoice Number

---

## Functionalities

* Vehicle stock deduction
* Ledger integration
* Booking conversion
* Sales commission tracking
* Daily sales analytics

---

# 14. Advance Booking Module

## Objective

Allow customers to reserve vehicles before final purchase.

---

## Features

* Booking creation
* Advance payment tracking
* Vehicle reservation
* Booking conversion to sale
* Booking cancellation
* Booking history

---

## Functionalities

* Stock reservation
* Booking validity tracking
* Automatic vehicle locking
* Refund tracking

---

## Booking Status

* Pending
* Confirmed
* Converted
* Cancelled
* Expired

---

# 15. Lead Management Module

## Objective

Track enquiries and sales pipeline.

---

## Features

* Enquiry creation
* Lead assignment
* Follow-up tracking
* Stage management
* Sales conversion tracking
* Lead analytics

---

## Lead Stages

* Enquiry
* New Lead
* Contacted
* Follow-up
* Negotiation
* Won
* Lost

---

## Lead Fields

* Customer Name
* Contact Number
* Interested Vehicle
* Lead Source
* Assigned Executive
* Follow-up Date
* Lead Status
* Notes

---

## Functionalities

* Lead reminders
* Follow-up scheduling
* Lead conversion metrics
* Executive-wise performance

---

# 16. Ledger Management Module

## Objective

Track financial entries and operational expenses.

---

## Features

* Income entries
* Expense entries
* Sales ledger
* Purchase ledger
* Salary expenses
* Booking payments
* Refund entries
* Financial reporting

---

## Ledger Types

* Sales Income
* Purchase Expense
* Salary Expense
* Operational Expense
* Booking Amount
* Refund
* Transfer Expense

---

## Functionalities

* Auto entries from sales
* Auto entries from purchases
* Branch-wise ledger
* Daily financial summary
* Monthly reports

---

# 17. Dashboard & Analytics Module

## Admin Dashboard

* Total inventory
* Branch performance
* Total sales
* Total bookings
* Pending leads
* Financial overview
* User activity

---

## Owner Dashboard

* Revenue analytics
* Branch comparison
* Sales trends
* Inventory reports
* Lead conversion analytics
* Expense tracking

---

## Supervisor Dashboard

* Assigned branch analytics
* Staff activity
* Pending approvals
* Inventory movement
* Daily sales summary

---

## Sales Dashboard

* Assigned leads
* Booking status
* Daily targets
* Customer interactions
* Pending follow-ups

---

# 18. Mobile Application

## Objective

Provide mobile accessibility for operational users.

---

## Mobile Users

* Supervisor
* Sales Executive
* Sales

---

## Mobile Features

* Login
* Lead updates
* Sales entry
* Inventory checking
* Booking updates
* Customer details
* Follow-up updates
* Notifications

---

# 19. Notifications System

## Notification Types

* Lead follow-up reminders
* Booking expiry alerts
* Low stock alerts
* Transfer approvals
* Payment reminders
* FIFO warnings

---

# 20. Reports Module

## Reports

* Sales reports
* Inventory reports
* Branch reports
* Vehicle-wise reports
* Executive-wise reports
* Booking reports
* Lead conversion reports
* Financial reports

---

# 21. Audit & Logs

## Features

* User activity logs
* Stock movement logs
* Sales logs
* Booking logs
* Inventory adjustments
* Login history

---

# 22. System Requirements

## Web Application

* Responsive dashboard
* Multi-role access
* Real-time inventory visibility
* Fast search functionality

---

## Mobile Application

* Cross-platform support
* Lightweight performance
* Real-time synchronization

---

# 23. Technical Architecture

## Frontend

* Next.js Web Dashboard
* Expo React Native Mobile App

---

## Backend

* Django
* Django REST Framework

---

## Database

* PostgreSQL

---

## Authentication

* JWT Authentication

---

## Deployment

* Dockerized PostgreSQL
* Cloud-hosted backend
* Web deployment for dashboards

---

# 24. Non-Functional Requirements

## Performance

* Fast inventory lookup
* Optimized search
* Real-time stock updates

---

## Scalability

* Multi-branch scalability
* New showroom support
* New vehicle categories support
* Future role expansion

---

## Security

* Role-based access control
* Secure authentication
* Activity logging
* Data validation

---

## Reliability

* Inventory consistency
* Transaction validation
* FIFO enforcement
* Backup support

---

# 25. Future Scope

## Future Enhancements

* WhatsApp integration
* SMS notifications
* GST invoice generation
* QR scanning
* Barcode support
* Vehicle service management
* Customer mobile app
* Payment gateway integration
* Advanced accounting
* AI analytics
* Vendor portal
* CRM automation

---

# 26. Visual System Architecture

```text
                                ┌─────────────────────┐
                                │     Mobile App      │
                                │   Expo React Native │
                                └──────────┬──────────┘
                                           │
                                           │ API Requests
                                           │
┌─────────────────────┐         ┌──────────▼──────────┐         ┌─────────────────────┐
│   Web Dashboard     │────────▶│     Django API      │◀────────│   Admin Dashboard   │
│      Next.js        │         │   REST Backend      │         │     Next.js         │
└─────────────────────┘         └──────────┬──────────┘         └─────────────────────┘
                                           │
                                           │
                           ┌───────────────▼────────────────┐
                           │        Business Modules         │
                           ├─────────────────────────────────┤
                           │ Authentication & Roles          │
                           │ Branch Management               │
                           │ Showroom Management             │
                           │ Inventory Management            │
                           │ Vehicle Management              │
                           │ Battery FIFO System             │
                           │ Purchase Management             │
                           │ Sales Management                │
                           │ Lead Management                 │
                           │ Booking Management              │
                           │ Ledger Management               │
                           │ Reports & Analytics             │
                           └───────────────┬────────────────┘
                                           │
                                           │
                                ┌──────────▼──────────┐
                                │    PostgreSQL DB    │
                                │    Docker Hosted    │
                                └─────────────────────┘
```

---

# 27. Final MVP Scope

## MVP Priority Modules

### Phase 1

* Authentication
* Roles & Users
* Branches
* Showrooms
* Inventory Locations
* Vehicle Management
* Inventory Management

### Phase 2

* Purchase Management
* Sales Management
* Lead Management

### Phase 3

* Battery FIFO Management
* Ledger Management
* Booking System

### Phase 4

* Mobile App
* Analytics
* Reports

---

# 28. Project Success Criteria

The project will be considered successful if:

* All branches operate under one centralized system
* Inventory is accurately tracked
* FIFO battery logic works correctly
* Sales and bookings update stock in real-time
* Lead management improves follow-up tracking
* Financial records are centralized
* Multi-role dashboards work securely
* Mobile operations function smoothly
* Reports provide operational visibility

---

# END OF DOCUMENT
