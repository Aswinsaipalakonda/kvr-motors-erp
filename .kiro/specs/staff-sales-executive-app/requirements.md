# Requirements Document

## Introduction

This feature adds a dedicated mobile experience for the **Sales Executive** role (backend role key `sales_executive`) within the KVR Motors ERP Expo React Native application. The KVR Motors ERP is a multi-branch electric vehicle (EV) dealership platform whose web dashboards are complete and whose mobile apps for `owner`, `supervisor`, and a partial `sales` role already exist under `mobile-app/src/app/{owner,sales,supervisor}`.

The Sales Executive App gives field sales staff the operational tools they need on a phone: secure login, a personalized dashboard, lead and follow-up management, customer history, vehicle and inventory checking, sale/invoice creation (including FIFO-aware battery assignment), advance booking management, in-app notifications, and a profile/settings area.

The app reuses the existing authentication system (JWT via `AuthContext` and `SecureStore`), the shared login screen, the shared `api` service (`src/services/api.ts` with automatic token refresh), the established visual design system (dark glassmorphic surfaces with brand green accents), and the existing backend REST API under `/api/v1`. This spec is mobile-only and adds `sales_executive` role routing so that a Sales Executive lands on a `/staff` screen set after login.

This spec does not introduce new backend models or endpoints. Where a concept (such as Customer or Notification) has no dedicated backend endpoint, the app derives that information on the client from existing endpoints (leads, bookings, sales invoices).

## Glossary

- **Sales_Executive**: A user whose backend `role` field equals `sales_executive`. The primary actor for this feature.
- **Staff_App**: The collection of mobile screens under the `/staff` route group that serve the Sales Executive role. The subject system for most requirements in this document.
- **Auth_Context**: The existing React context (`mobile-app/src/context/AuthContext.tsx`) that performs login, logout, session persistence, and exposes the current user profile.
- **Root_Router**: The navigation logic in `mobile-app/src/app/_layout.tsx` and `mobile-app/src/app/index.tsx` that redirects an authenticated user to a role-specific dashboard.
- **Api_Service**: The shared axios instance (`mobile-app/src/services/api.ts`) that attaches the JWT access token to requests and auto-refreshes expired tokens against `/api/auth/refresh/`.
- **User_Profile**: The authenticated user object stored in SecureStore, containing `id`, `username`, `full_name`, `role`, `branch`, `branch_name`, `showroom`, `phone_number`, and `is_active`.
- **Lead**: An enquiry record from the `/api/v1/leads/` endpoint with fields including `customer_name`, `contact_number`, `interested_vehicle`, `lead_source`, `assigned_executive`, `follow_up_date`, `status`, and `notes`.
- **Lead_Stage**: One of the backend `status` values for a Lead: `enquiry`, `new_lead`, `contacted`, `follow_up`, `negotiation`, `won`, `lost`.
- **Follow_Up**: A scheduled future contact for a Lead, represented by the Lead's `follow_up_date` field.
- **Customer**: A person derived on the client from the `customer_name` and `contact_number`/`customer_contact` fields across the Lead, Booking, and Sales_Invoice records associated with the Sales Executive. There is no dedicated backend Customer endpoint.
- **Vehicle_Model**: A model master record from `/api/v1/vehicle-models/` (brand, model_name, base_price, color_variants, battery_compatibility, status).
- **Vehicle_Unit**: A physical vehicle from `/api/v1/vehicle-units/` with `vin_number`, `motor_number`, `chassis_number`, `color`, `stock_status`, `branch`, `showroom`, `location`, and `assigned_battery`.
- **Stock_Status**: A Vehicle_Unit's availability state: `available`, `reserved`, `booked`, `sold`, `in_transit`, `service`, `damaged`.
- **Battery**: A battery stock record from `/api/v1/batteries/` with `serial_number`, `capacity`, `purchase_date`, `status`, `location`, and `supplier`. Batteries are ordered by `purchase_date` to support FIFO.
- **FIFO_Rule**: First-In-First-Out battery assignment rule requiring the oldest available battery (earliest `purchase_date`) to be assigned first.
- **FIFO_Override**: A record created via `/api/v1/fifo-overrides/` capturing a request to assign a battery out of FIFO order, requiring supervisor/admin approval.
- **Sales_Invoice**: A sale record from `/api/v1/sales-invoices/` with `invoice_number`, `customer_name`, `customer_contact`, `vehicle_unit`, `assigned_battery`, `sale_price`, `payment_mode`, `insurance_partner`, `delivery_status`, `sales_executive`, and `branch`.
- **Booking**: An advance booking from `/api/v1/bookings/` with `booking_id`, `customer_name`, `contact_number`, `vehicle_model`, `vehicle_unit`, `advance_amount`, `expiry_date`, `status`, and `assigned_executive`.
- **Booking_Status**: One of `pending`, `confirmed`, `converted`, `cancelled`, `expired`.
- **Notification**: A client-derived alert item (follow-up reminder, booking expiry alert, FIFO warning, or assignment notification) computed from Lead, Booking, and FIFO data; there is no dedicated backend notification endpoint.
- **Active_Lead**: A Lead assigned to the Sales Executive whose `status` is not `won` and not `lost`.
- **Conversion_Rate**: The percentage of the Sales Executive's Leads with `status` equal to `won` relative to the Sales Executive's total assigned Leads.
- **Design_System**: The established visual language: dark surfaces (`#090d16`, `#121824`), light content background (`#f8fafc`), brand green accent (`#04a700`), and the reusable components `ThemedText`, `ThemedView`, `FadeScaleTransition`, and `LogoHeader`.

## Requirements

### Requirement 1: Authentication and Role-Based Routing

**User Story:** As a Sales Executive, I want to log in through the shared login screen and be taken to my own app section, so that I can securely access only the tools relevant to my role.

#### Acceptance Criteria

1. WHEN a Sales_Executive submits valid credentials on the shared login screen, THE Auth_Context SHALL authenticate against `/api/auth/login/` and store the access token, refresh token, and User_Profile in SecureStore.
2. WHEN authentication succeeds AND the User_Profile `role` equals `sales_executive`, THE Root_Router SHALL redirect the Sales_Executive to the staff dashboard route `/staff/dashboard`.
3. WHILE a valid session exists in SecureStore for a User_Profile with `role` equal to `sales_executive`, THE Root_Router SHALL restore the session on app launch and redirect to `/staff/dashboard` without requiring re-entry of credentials.
4. IF a user with `role` equal to `sales_executive` is not authenticated AND navigates to any `/staff` route, THEN THE Root_Router SHALL redirect the user to the login screen.
5. IF the submitted credentials are invalid, THEN THE Staff_App SHALL display an error message describing the failed login and remain on the login screen.
6. WHEN a Sales_Executive submits credentials, THE Auth_Context SHALL verify the credentials and the `is_active` status together as part of authentication, and IF the account `is_active` is false, THEN THE Staff_App SHALL deny access to `/staff` routes and display a message stating the account is inactive.
7. WHEN a Sales_Executive selects logout from the Staff_App, THE Auth_Context SHALL remove the access token, refresh token, and User_Profile from SecureStore and redirect to the login screen.
8. WHEN the Api_Service receives a 401 response AND the refresh token is missing or rejected, THE Api_Service SHALL clear the stored session and redirect to the login screen.

### Requirement 2: Staff Dashboard

**User Story:** As a Sales Executive, I want a personalized home screen with my key metrics and quick actions, so that I can understand my performance and start common tasks quickly.

#### Acceptance Criteria

1. WHEN the staff dashboard loads, THE Staff_App SHALL display a greeting containing the Sales_Executive `full_name` and the `branch_name` from the User_Profile.
2. WHEN the staff dashboard loads, THE Staff_App SHALL display the count of Active_Leads assigned to the Sales_Executive.
3. WHEN the staff dashboard loads, THE Staff_App SHALL display the total value of Sales_Invoice records where `sales_executive` equals the Sales_Executive `id`, formatted in Indian Rupees.
4. WHEN the staff dashboard loads, THE Staff_App SHALL display the Conversion_Rate for the Sales_Executive as a percentage.
5. WHEN the staff dashboard loads, THE Staff_App SHALL display the count of Follow_Up items assigned to the Sales_Executive with a `follow_up_date` on or before the current date.
6. WHEN a Sales_Executive selects a quick action on the staff dashboard, THE Staff_App SHALL navigate to the corresponding screen for that action.
7. IF navigation triggered by a quick action fails, THEN THE Staff_App SHALL remain on the dashboard and display an error message describing the failed navigation.
8. WHILE dashboard data is being retrieved, THE Staff_App SHALL display a loading indicator.
9. IF a dashboard data request fails, THEN THE Staff_App SHALL hide the dashboard metric and quick-action elements and display an error state with a retry control.

### Requirement 3: Lead Management

**User Story:** As a Sales Executive, I want to view and manage the leads assigned to me, so that I can progress enquiries through the sales pipeline.

#### Acceptance Criteria

1. WHEN the lead list loads, THE Staff_App SHALL display only Lead records where `assigned_executive` equals the Sales_Executive `id`.
2. WHEN a Sales_Executive selects a Lead, THE Staff_App SHALL display a lead detail view containing `customer_name`, `contact_number`, `interested_vehicle_name`, `lead_source`, `status`, `follow_up_date`, and `notes`.
3. WHEN a Sales_Executive submits a new lead with a customer name, a contact number, and a selected Vehicle_Model, THE Staff_App SHALL create the Lead via `/api/v1/leads/` with `assigned_executive` set to the Sales_Executive `id`.
4. IF a Sales_Executive submits a new lead without a customer name, without a contact number, or without a selected Vehicle_Model, THEN THE Staff_App SHALL display a validation message identifying the missing field and SHALL NOT submit the Lead.
5. WHEN a Sales_Executive updates an existing Lead, THE Staff_App SHALL persist the changes via a PATCH request to `/api/v1/leads/{id}/`.
6. WHEN a Sales_Executive changes a Lead's stage, THE Staff_App SHALL set the Lead `status` to one of the Lead_Stage values: `enquiry`, `new_lead`, `contacted`, `follow_up`, `negotiation`, `won`, or `lost`.
7. WHEN a Sales_Executive saves follow-up notes for a Lead, THE Staff_App SHALL persist the text to the Lead `notes` field via `/api/v1/leads/{id}/`.
8. WHEN a Sales_Executive sets a follow-up date for a Lead, THE Staff_App SHALL persist the date to the Lead `follow_up_date` field in `YYYY-MM-DD` format.
9. WHEN a Sales_Executive applies a stage filter to the lead list, THE Staff_App SHALL display only the Sales_Executive's Leads matching the selected stage.
10. IF a lead create or update request fails, THEN THE Staff_App SHALL display an error message and retain the entered data for retry.

### Requirement 4: Follow-Up Management

**User Story:** As a Sales Executive, I want to see my due and upcoming follow-ups, so that I never miss a scheduled customer contact.

#### Acceptance Criteria

1. WHEN the follow-up list loads, THE Staff_App SHALL display Lead records assigned to the Sales_Executive that have a non-empty `follow_up_date`.
2. WHEN the follow-up list loads, THE Staff_App SHALL group follow-ups into a due group, where `follow_up_date` is on or before the current date, and an upcoming group, where `follow_up_date` is after the current date.
3. WHEN the follow-up list is displayed, THE Staff_App SHALL order follow-ups by `follow_up_date` in ascending order.
4. WHEN a Sales_Executive marks a follow-up complete, THE Staff_App SHALL update the associated Lead via `/api/v1/leads/{id}/` to record completion of that follow-up.
5. IF the Sales_Executive has no Leads with a `follow_up_date`, THEN THE Staff_App SHALL display an empty state indicating there are no scheduled follow-ups.

### Requirement 5: Customer Management

**User Story:** As a Sales Executive, I want to view and manage my customers and their history, so that I can provide informed service across enquiries, bookings, and sales.

#### Acceptance Criteria

1. WHEN the customer list loads, THE Staff_App SHALL derive the Customer list from the Lead, Booking, and Sales_Invoice records associated with the Sales_Executive, grouped by `contact_number`.
2. WHEN a Sales_Executive selects a Customer, THE Staff_App SHALL display that Customer's history including associated Leads, Bookings, and Sales_Invoices.
3. WHEN a Sales_Executive enters a search term in the customer list, THE Staff_App SHALL display only Customers whose name or contact number contains the search term.
4. WHEN a Sales_Executive creates a new customer record, THE Staff_App SHALL create a corresponding Lead via `/api/v1/leads/` capturing the customer name and contact number with `assigned_executive` set to the Sales_Executive `id`.
5. IF a customer data request fails for any reason, including connectivity loss, THEN THE Staff_App SHALL display an error state, and THE Staff_App SHALL present a retry control either immediately or following an additional user action based on the error type.
6. WHEN the derived Customer list is empty, THE Staff_App SHALL display an empty state indicating there are no customers.

### Requirement 6: Vehicle and Inventory Checking

**User Story:** As a Sales Executive, I want to browse available vehicles and check stock, so that I can advise customers on what is in stock and where.

#### Acceptance Criteria

1. WHEN the inventory screen loads, THE Staff_App SHALL retrieve Vehicle_Unit records from `/api/v1/vehicle-units/` and Vehicle_Model records from `/api/v1/vehicle-models/`.
2. WHEN a Sales_Executive selects a Vehicle_Unit, THE Staff_App SHALL display the unit's `vin_number`, `motor_number`, `chassis_number`, `color`, `stock_status`, `model_name`, `branch_name`, and `location_name`.
3. WHEN a Sales_Executive filters the vehicle list by availability, THE Staff_App SHALL display only Vehicle_Unit records with `stock_status` equal to `available`.
4. WHEN a Sales_Executive enters a search term, THE Staff_App SHALL display only Vehicle_Unit records whose `vin_number`, `motor_number`, `chassis_number`, or `model_name` contains the search term.
5. WHEN a Sales_Executive enters a complete VIN number, motor number, or chassis number in the lookup field, THE Staff_App SHALL display the matching Vehicle_Unit details including model, color, status, location, and assigned battery.
6. WHILE inventory data is being retrieved, THE Staff_App SHALL display a loading indicator for the duration of every retrieval, including retrievals that complete within milliseconds.

### Requirement 7: Sale and Invoice Creation

**User Story:** As a Sales Executive, I want to create a sale and generate an invoice with the correct vehicle and battery, so that I can complete a customer purchase from the field.

#### Acceptance Criteria

1. WHEN a Sales_Executive creates a sale, THE Staff_App SHALL require selection of a Customer, a Vehicle_Unit, a `sale_price`, and a `payment_mode` before submission.
2. IF a Sales_Executive attempts to submit a sale missing the Customer, the Vehicle_Unit, the `sale_price`, or the `payment_mode`, THEN THE Staff_App SHALL display a validation message identifying the missing field and SHALL NOT submit the sale.
3. WHEN a Sales_Executive submits a valid sale, THE Staff_App SHALL create a Sales_Invoice via `/api/v1/sales-invoices/` with `sales_executive` set to the Sales_Executive `id` and `branch` set to the Sales_Executive's branch.
4. WHEN a Sales_Executive selects a Vehicle_Unit for a sale, THE Staff_App SHALL offer only Vehicle_Unit records with `stock_status` equal to `available`.
5. WHEN a Sales_Executive assigns a Battery to a sale, THE Staff_App SHALL present available Battery records ordered by `purchase_date` in ascending order.
6. IF a Sales_Executive selects a Battery that is not the oldest available Battery for the assignment, THEN THE Staff_App SHALL display a FIFO warning and SHALL require a supervisor/admin override before completing the assignment.
7. WHEN a Sales_Executive confirms a FIFO override, THE Staff_App SHALL create a FIFO_Override record via `/api/v1/fifo-overrides/` referencing the selected Battery and the Sales_Executive.
8. WHEN a Sales_Invoice is created successfully, THE Staff_App SHALL display the generated `invoice_number` and a confirmation of the sale.
9. IF a sale creation request fails, THEN THE Staff_App SHALL display an error message and retain the entered sale data for retry.

### Requirement 8: Booking Management

**User Story:** As a Sales Executive, I want to create and manage advance bookings, so that customers can reserve a vehicle before final purchase.

#### Acceptance Criteria

1. WHEN a Sales_Executive creates a booking, THE Staff_App SHALL require a customer name, a contact number, a selected Vehicle_Model, an `advance_amount`, and an `expiry_date` before submission.
2. WHEN a Sales_Executive submits a valid booking, THE Staff_App SHALL create a Booking via `/api/v1/bookings/` with `assigned_executive` set to the Sales_Executive `id`.
3. WHEN the booking list loads, THE Staff_App SHALL display only Booking records where `assigned_executive` equals the Sales_Executive `id`.
4. WHEN a Sales_Executive views a Booking, THE Staff_App SHALL display the `booking_id`, `customer_name`, `advance_amount`, `expiry_date`, `vehicle_model_name`, and `status_display`.
5. WHEN a Sales_Executive cancels a Booking, THE Staff_App SHALL update the Booking `status` to `cancelled` via `/api/v1/bookings/{id}/`.
6. WHEN a Sales_Executive converts a confirmed Booking to a sale, THE Staff_App SHALL update the Booking `status` to `converted` and initiate creation of a Sales_Invoice for the booked Customer and vehicle.
7. WHERE a Booking `status` is `expired`, THE Staff_App SHALL visually distinguish the expired Booking in the booking list.
8. IF a booking create or update request fails, THEN THE Staff_App SHALL display an error message and retain the entered booking data for retry.

### Requirement 9: Notifications

**User Story:** As a Sales Executive, I want timely alerts about follow-ups, booking expiries, and FIFO issues, so that I can act before something is missed.

#### Acceptance Criteria

1. WHEN the notifications view is opened, THE Staff_App SHALL generate a Notification for each Lead assigned to the Sales_Executive whose `follow_up_date` is on or before the current date.
2. WHEN the notifications view is opened, THE Staff_App SHALL generate a Notification for each Booking assigned to the Sales_Executive whose `expiry_date` is within the next 3 days and whose `status` is `pending` or `confirmed`.
3. WHEN a FIFO warning is triggered during battery assignment, THE Staff_App SHALL generate a FIFO Notification describing the affected Battery.
4. WHEN a Lead is assigned to the Sales_Executive, THE Staff_App SHALL generate an assignment Notification for that Lead.
5. WHEN a Sales_Executive selects a Notification, THE Staff_App SHALL navigate to the screen for the record referenced by the Notification.
6. WHEN the notifications view is opened AND there are no Notifications for the Sales_Executive, THE Staff_App SHALL display an empty state indicating there are no new notifications.

### Requirement 10: Profile and Settings

**User Story:** As a Sales Executive, I want to view my profile and branch details and log out, so that I can confirm my account context and end my session securely.

#### Acceptance Criteria

1. WHEN the profile screen loads, THE Staff_App SHALL display the Sales_Executive `full_name`, `username`, `email`, `phone_number`, `role`, and `branch_name` from the User_Profile.
2. WHEN a Sales_Executive selects logout from the profile screen, THE Staff_App SHALL invoke the Auth_Context logout, clear the locally stored session data, and redirect to the login screen regardless of whether any remote logout step succeeds.
3. WHILE the Staff_App is offline or the profile request fails, THE Staff_App SHALL display the locally stored User_Profile values from SecureStore.

### Requirement 11: Navigation and Visual Design Consistency

**User Story:** As a Sales Executive, I want the app to look and behave like the rest of the KVR Motors mobile experience, so that it feels familiar and trustworthy.

#### Acceptance Criteria

1. THE Staff_App SHALL present a bottom tab bar with three tabs styled as the dark glassmorphic navigation bar used by the existing role layouts.
2. THE Staff_App SHALL use the Design_System colors: dark surfaces `#090d16` and `#121824`, light content background `#f8fafc`, and brand green accent `#04a700`.
3. THE Staff_App SHALL reuse the `ThemedText`, `ThemedView`, `FadeScaleTransition`, and `LogoHeader` components for shared UI elements.
4. WHEN a Sales_Executive navigates between primary tabs, THE Staff_App SHALL render the selected screen using the established transition behavior.

### Requirement 12: Role-Scoped Data Access

**User Story:** As a Sales Executive, I want to see only my own and my branch's data, so that I work within my authorized scope.

#### Acceptance Criteria

1. THE Staff_App SHALL display all Lead, Booking, and Sales_Invoice records associated with the Sales_Executive `id` and SHALL NOT display records associated with other users.
2. THE Api_Service SHALL attach the Sales_Executive's JWT access token to every request to `/api/v1` endpoints.
3. WHERE inventory data is displayed, THE Staff_App SHALL default the visible Vehicle_Unit records to those whose `branch` matches the Sales_Executive's branch.
4. THE Staff_App SHALL store the access token, refresh token, and User_Profile only in SecureStore.

### Requirement 13: Reliability and Performance

**User Story:** As a Sales Executive working in the field, I want the app to handle weak connectivity and respond quickly, so that I can keep working under real conditions.

#### Acceptance Criteria

1. IF a network request fails due to connectivity loss, THEN THE Staff_App SHALL display an error state with a retry control rather than terminating.
2. WHEN a list screen has no records to display, THE Staff_App SHALL display an empty state describing the absence of data.
3. WHILE any remote data request is in progress, THE Staff_App SHALL display a loading indicator for the affected screen.
4. WHEN the Api_Service receives a 401 response with a valid refresh token, THE Api_Service SHALL refresh the access token and retry the original request transparently.
5. IF the access token refresh fails, THEN THE Api_Service SHALL clear the stored session and require the Sales_Executive to re-authenticate by redirecting to the login screen.

## Scope

### In Scope

- A new mobile screen group under `mobile-app/src/app/staff` for the `sales_executive` role.
- Addition of `sales_executive` role handling in `Root_Router` (`_layout.tsx` and `index.tsx`) to redirect to `/staff/dashboard`.
- Reuse of the existing shared login screen, `AuthContext`, `Api_Service`, backend `/api/v1` endpoints, and Design_System components.
- Sales Executive features: authentication/routing, dashboard, lead management, follow-ups, customer management, vehicle/inventory checking, sale/invoice creation with FIFO-aware battery assignment, booking management, client-derived notifications, and profile/settings.

### Out of Scope

- Web dashboard changes (web dashboards are already built and are not modified).
- New backend models, endpoints, or schema migrations (the app consumes existing endpoints only).
- Admin system configuration (branches, showrooms, categories, users management).
- Ledger and financial reporting screens.
- Purchase management and supplier management.
- Multi-branch administration and cross-branch reporting.
- Mobile apps for the `owner`, `supervisor`, and `sales` roles (covered by their own specs).
- Future-scope items from the PRD such as WhatsApp/SMS integration, GST invoice generation, QR/barcode scanning, and payment gateway integration.

## Assumptions and Dependencies

- The backend `User.role` choices already include `sales_executive`; no backend change is required to support this role.
- Customer and Notification concepts are derived on the client from existing Lead, Booking, and Sales_Invoice data because no dedicated backend endpoints exist for them.
- Data scoping to the Sales_Executive is performed on the client (consistent with the existing `sales` role screens), since the listed `/api/v1` endpoints return unscoped lists with optional `assigned_executive`/`sales_executive` filters.
- FIFO override approval is performed by a supervisor or admin through existing channels; the Staff_App only creates the FIFO_Override request record.
