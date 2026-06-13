# Fix Priority List - KVR Motors ERP

This list is ordered from the highest business impact (security, transaction integrity, compilation) to the lowest (UI enhancements, DevOps diagnostics).

---

## 1. Security & Access Control [CRITICAL]
- **Issue**: Views fall back to `AllowAny` permissions, letting guest users modify ERP records.
- **Affected Files**:
  - All viewsets in:
    - [branches/views.py](file:///d:/HPS/kvr-motors-erp/backend/branches/views.py)
    - [vehicles/views.py](file:///d:/HPS/kvr-motors-erp/backend/vehicles/views.py)
    - [battery/views.py](file:///d:/HPS/kvr-motors-erp/backend/battery/views.py)
    - [leads/views.py](file:///d:/HPS/kvr-motors-erp/backend/leads/views.py)
    - [booking/views.py](file:///d:/HPS/kvr-motors-erp/backend/booking/views.py)
    - [sales/views.py](file:///d:/HPS/kvr-motors-erp/backend/sales/views.py)
    - [purchases/views.py](file:///d:/HPS/kvr-motors-erp/backend/purchases/views.py)
    - [ledger/views.py](file:///d:/HPS/kvr-motors-erp/backend/ledger/views.py)
    - [inventory/views.py](file:///d:/HPS/kvr-motors-erp/backend/inventory/views.py)
- **Fix**: Override `permission_classes = [IsAuthenticated]` or create custom RBAC classes for each viewset.

---

## 2. Mobile App Compilation Failures [CRITICAL]
- **Issue**: 973 compilation errors in Expo React Native mobile app due to invalid style parameters and lucide-react-native imports.
- **Affected Files**:
  - Files under [mobile-app/src/app/](file:///d:/HPS/kvr-motors-erp/mobile-app/src/app/) (e.g. `bookings.tsx`, `purchases.tsx`, `sales.tsx`)
- **Fix**: Replace web-only style properties (`cursor`, `userSelect`, etc.) with React Native compatible stylesheet entries, and correct the lucide icons import structure.

---

## 3. Missing Transaction Business Logic [CRITICAL]
- **Issue**: Creating invoices, transfers, bookings, and purchases does not update inventory status or generate ledger entries.
- **Affected Files**:
  - [sales/views.py](file:///d:/HPS/kvr-motors-erp/backend/sales/views.py) & [sales/serializers.py](file:///d:/HPS/kvr-motors-erp/backend/sales/serializers.py)
  - [booking/views.py](file:///d:/HPS/kvr-motors-erp/backend/booking/views.py) & [booking/serializers.py](file:///d:/HPS/kvr-motors-erp/backend/booking/serializers.py)
  - [inventory/views.py](file:///d:/HPS/kvr-motors-erp/backend/inventory/views.py) & [inventory/serializers.py](file:///d:/HPS/kvr-motors-erp/backend/inventory/serializers.py)
  - [purchases/views.py](file:///d:/HPS/kvr-motors-erp/backend/purchases/views.py) & [purchases/serializers.py](file:///d:/HPS/kvr-motors-erp/backend/purchases/serializers.py)
- **Fix**: Implement transactional overrides in `perform_create()` or serializer `save()` routines to handle:
  - Vehicle and Battery stock updates (`available` -> `sold` / `booked` / `assigned`).
  - Automatic `LedgerEntry` generation from Sales and Purchases.
  - Location/Branch transitions for Stock Transfers.

---

## 4. FIFO Battery Validation Enforcement [HIGH]
- **Issue**: FIFO check utility endpoint exists but is bypassable during sales creation.
- **Affected Files**:
  - [sales/serializers.py](file:///d:/HPS/kvr-motors-erp/backend/sales/serializers.py)
- **Fix**: Check `assigned_battery` against the oldest available serial in the serializer's `validate()` method. Reject creation if newer stock is chosen without supervisor overrides.

---

## 5. Frontend Monolithic Refactoring [MEDIUM]
- **Issue**: 4,200+ line `owner-dashboard.tsx` creates high maintenance costs and slow render paths.
- **Affected Files**:
  - [dashboards/app/owner/owner-dashboard.tsx](file:///d:/HPS/kvr-motors-erp/dashboards/app/owner/owner-dashboard.tsx)
  - [dashboards/app/supervisor/supervisor-dashboard.tsx](file:///d:/HPS/kvr-motors-erp/dashboards/app/supervisor/supervisor-dashboard.tsx)
- **Fix**: Break down into modular page components (e.g. `OwnerSalesTab.tsx`, `OwnerInventoryTab.tsx`, `BranchDetailsModal.tsx`).

---

## 6. Database Schema Constraints & Indexes [MEDIUM]
- **Issue**: Lacks column validation triggers for negative numerical pricing or indexes for lookup optimization.
- **Affected Files**:
  - All local app `models.py` files (e.g. [vehicles/models.py](file:///d:/HPS/kvr-motors-erp/backend/vehicles/models.py))
- **Fix**: Add check constraints on database fields, and include `db_index=True` on VIN, chassis numbers, serial numbers, and status filters.

---

## 7. Security Hardening [MEDIUM]
- **Issue**: Storing JWT tokens in client-accessible cookie scopes. Hardcoded settings credentials.
- **Affected Files**:
  - [dashboards/app/context/AuthContext.tsx](file:///d:/HPS/kvr-motors-erp/dashboards/app/context/AuthContext.tsx)
  - [backend/config/settings.py](file:///d:/HPS/kvr-motors-erp/backend/config/settings.py)
- **Fix**: Update token response to set secure HTTP-only cookies, and load Django secrets from environment variables.
