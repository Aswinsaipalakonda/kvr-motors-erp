"use client";
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import ProfileView from "../components/ProfileView";
import BranchExpenseView from "../components/BranchExpenseView";
import IssueReportView from "../components/IssueReportView";
import OwnerReportsView from "../components/OwnerReportsView";
import NotificationsView from "../components/NotificationsView";
import DashboardSmoothScroll from "../components/DashboardSmoothScroll";
import Toast from "../components/Toast";
import { getBranches, createBranch, updateBranch, getInventoryLocations, getShowrooms, deleteBranch, getStockTransfers } from "../services/branches";
import { getVehicleBrands, getVehicleModels, getVehicleUnits, createVehicleModel, updateVehicleModel, createVehicleUnit, updateVehicleUnit, deleteVehicleUnit, lookupVehicleUnit, deleteVehicleModel } from "../services/vehicles";
import { getLeads, createLead, updateLead, deleteLead } from "../services/leads";
import { getBookings, createBooking, updateBooking, deleteBooking } from "../services/bookings";
import { getSalesInvoices, updateSalesInvoice } from "../services/sales";
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus } from "../services/purchases";
import { getLedgerEntries } from "../services/ledger";
import { getBatteries, createBattery, updateBattery, deleteBattery } from "../services/batteries";
import { getActivityLogs, ActivityLog } from "../services/activityLogs";
import { getUsers, createUser, updateUser, deleteUser } from "../services/users";
import { getAttendanceLogs, verifyAttendance, bulkVerifyAttendance, AttendanceRecord } from "../services/attendance";
import MelaSubSidebar from "../components/MelaSubSidebar";
import {
  getMelaInventory,
  createMelaInventory,
  updateMelaInventory,
  deleteMelaInventory,
  getMelaBookings,
  completeMelaBooking,
  getMelaReports,
  getMelaSettingsList,
  createMelaSettings,
  updateMelaSettings,
  updateMelaBooking
} from "../services/mela";
import {
  TrendingUp,
  Percent,
  Plus,
  ArrowRight,
  TrendingDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Download,
  Printer,
  Calendar,
  XCircle,
  FileSpreadsheet,
  ShoppingBag,
  Car,
  Compass,
  CalendarDays,
  CreditCard,
  Battery,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Phone,
  Boxes,
  MapPin,
  RefreshCw,
  LayoutDashboard,
  BarChart2,
  Settings,
  Upload,
  Share2,
  ListOrdered,
  Eye,
  FileText,
  PenLine,
  Trash2,
  MessageSquare
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
const getDefaultRangeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[now.getMonth()];
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return `01 ${monthName} ${year} - ${String(lastDay).padStart(2, "0")} ${monthName} ${year}`;
};

const getDynamicDate = (day: number, offsetMonth: number = 0, format: "short" | "long" = "long") => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offsetMonth;
  const tempDate = new Date(year, month, day);
  const mName = tempDate.toLocaleString("en-US", { month: format });
  return `${day} ${mName} ${tempDate.getFullYear()}`;
};

const getDynamicCode = (prefix: string, day: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${prefix}-${year}-${month}${dayStr}`;
};

export default function OwnerDashboard({ initialTab: initialTabProp }: { initialTab?: string } = {}) {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const derivedTab = lastSegment === "owner" ? "dashboard" : lastSegment;
  const initialTab = initialTabProp || derivedTab;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [selectedRange, setSelectedRange] = useState(getDefaultRangeString());

  // Sync state with browser back/forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "owner" ? "dashboard" : segment;
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);
  
  // Real database branches states
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchActive, setBranchActive] = useState(true);
  const [branchManagerName, setBranchManagerName] = useState("");
  const [branchTotalStock, setBranchTotalStock] = useState("");
  const [branchSalesVolume, setBranchSalesVolume] = useState("");
  const [branchMonthlyTarget, setBranchMonthlyTarget] = useState("");
  const [branchTargetPct, setBranchTargetPct] = useState("");
  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});

  // Real database vehicles states
  const [vehicleBrandsList, setVehicleBrandsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [vehicleUnitsList, setVehicleUnitsList] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<string>("All");

  // Real database leads states
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Real database bookings, sales, purchases, and ledger states
  const [advanceBookings, setAdvanceBookings] = useState<any[]>([]);
  const [advanceBookingsLoading, setAdvanceBookingsLoading] = useState(true);

  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [salesInvoicesLoading, setSalesInvoicesLoading] = useState(true);
  const [salesTimeFilter, setSalesTimeFilter] = useState<"week" | "month" | "six_months">("week");

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(true);

  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerEntriesLoading, setLedgerEntriesLoading] = useState(true);

  const [batteriesStock, setBatteriesStock] = useState<any[]>([]);
  const [batteriesLoading, setBatteriesLoading] = useState(true);

  // Activity logs states
  const [activityLogsList, setActivityLogsList] = useState<ActivityLog[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [selectedLogDetail, setSelectedLogDetail] = useState<ActivityLog | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Mela Campaign States
  const [melaInventoryList, setMelaInventoryList] = useState<any[]>([]);
  const [melaBookingsList, setMelaBookingsList] = useState<any[]>([]);
  const [melaReports, setMelaReportsData] = useState<any>(null);
  const [melaLoading, setMelaLoading] = useState(false);
  const [melaSearchQuery, setMelaSearchQuery] = useState("");
  const [melaFoundBooking, setMelaFoundBooking] = useState<any>(null);
  const [melaCheckoutError, setMelaCheckoutError] = useState("");
  const [melaCheckoutLoading, setMelaCheckoutLoading] = useState(false);
  const [checkoutPaymentType, setCheckoutPaymentType] = useState<string>("cash");
  const [checkoutPaymentProof, setCheckoutPaymentProof] = useState<File | null>(null);
  const [splitAmounts, setSplitAmounts] = useState<{ cash: string; card: string; upi: string; bajaj_finance: string }>({
    cash: "", card: "", upi: "", bajaj_finance: ""
  });
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);
  const [isAddMelaInventoryOpen, setIsAddMelaInventoryOpen] = useState(false);
  const [editingMelaInventoryId, setEditingMelaInventoryId] = useState<number | null>(null);

  // Edit Customer States
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerBookingId, setEditCustomerBookingId] = useState<number | null>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerLoading, setEditCustomerLoading] = useState(false);

  // Mela Settings States
  const [melaSettingsList, setMelaSettingsList] = useState<any[]>([]);
  const [melaNameSetting, setMelaNameSetting] = useState("Grand Monsoon Mela");
  const [melaStartDateSetting, setMelaStartDateSetting] = useState("");
  const [melaEndDateSetting, setMelaEndDateSetting] = useState("");
  const [melaLocationSetting, setMelaLocationSetting] = useState("Main Showroom Ground");
  const [melaSettingsId, setMelaSettingsId] = useState<number | null>(null);
  const [melaIsActiveSetting, setMelaIsActiveSetting] = useState(true);

  // Mela Inventory Form
  const [melaInvModel, setMelaInvModel] = useState("");
  const [melaInvColor, setMelaInvColor] = useState("");
  const [melaInvBattery, setMelaInvBattery] = useState("graphene");
  const [melaInvQty, setMelaInvQty] = useState("");
  const [melaInvPrice, setMelaInvPrice] = useState("");
  const [newBatteryName, setNewBatteryName] = useState("");
  const [newBatteryPrice, setNewBatteryPrice] = useState("");
  const [newBatteryQty, setNewBatteryQty] = useState("");

  // Mela Stock Adjustments & Groups
  const [melaStockLogs, setMelaStockLogs] = useState<any[]>([]);
  const [melaGroups, setMelaGroups] = useState<any[]>([]);
  const [melaAdjItem, setMelaAdjItem] = useState("");
  const [melaAdjType, setMelaAdjType] = useState("in");
  const [melaAdjQty, setMelaAdjQty] = useState("");
  const [melaAdjNotes, setMelaAdjNotes] = useState("");
  const [melaInvSubTab, setMelaInvSubTab] = useState<"registry" | "compatibility" | "operations">("registry");
  const [melaRegAddType, setMelaRegAddType] = useState<"vehicle" | "battery">("vehicle");
  
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLead, setNewGroupLead] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [newGroupTarget, setNewGroupTarget] = useState("10");

  // New PO form state
  const [newPOSupplier, setNewPOSupplier] = useState("");
  const [newPOModel, setNewPOModel] = useState("");
  const [newPOQty, setNewPOQty] = useState("");
  const [newPOPrice, setNewPOPrice] = useState("");
  const [newPOPaymentTerms, setNewPOPaymentTerms] = useState("");
  const [newPOEstDelivery, setNewPOEstDelivery] = useState("");

  // New Vehicle Model form state
  const [newModelBrand, setNewModelBrand] = useState<string>("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelPrice, setNewModelPrice] = useState("");
  const [newModelBattery, setNewModelBattery] = useState("");
  const [newModelColors, setNewModelColors] = useState("");
  const [newModelStatus, setNewModelStatus] = useState<"active" | "inactive">("active");

  // Stock Unit (VIN registry) form state — supports full add + edit
  const emptyStockUnit = {
    model: "", branch: "", showroom: "", location: "",
    vin_number: "", motor_number: "", chassis_number: "", color: "",
    purchase_date: "", stock_status: "available", assigned_battery: "",
    purchase_invoice_number: "", payment_status: "success",
    quantity: "1",
  };
  const [stockUnitForm, setStockUnitForm] = useState({ ...emptyStockUnit });
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [showroomsList, setShowroomsList] = useState<any[]>([]);
  const [vinLookupState, setVinLookupState] = useState<"idle" | "searching" | "found" | "notfound">("idle");

  const loadVehicles = async () => {
    try {
      setVehiclesLoading(true);
      const [brands, models, units] = await Promise.all([
        getVehicleBrands(),
        getVehicleModels(),
        getVehicleUnits()
      ]);
      setVehicleBrandsList(brands);
      setVehicleModelsList(models);
      setVehicleUnitsList(units);
    } catch (e) {
      console.error("Failed to load vehicle catalog from Django REST API:", e);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const data = await getBranches();
      setBranchesList(data);
    } catch (e) {
      console.error("Failed to load branches from Django REST API:", e);
    } finally {
      setBranchesLoading(false);
    }
  };

  const resetBranchForm = React.useCallback(() => {
    setEditingBranchId(null);
    setBranchName("");
    setBranchAddress("");
    setBranchPhone("");
    setBranchActive(true);
    setBranchManagerName("");
    setBranchTotalStock("");
    setBranchSalesVolume("");
    setBranchMonthlyTarget("");
    setBranchTargetPct("");
    setBranchErrors({});
  }, []);

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear errors
    const errors: Record<string, string> = {};
     
    // 1. Showroom Name Constraint
    if (!branchName.trim()) {
      errors.name = "Showroom name is required.";
    }
    
    // 2. Address / Location City Constraint
    if (!branchAddress.trim()) {
      errors.address = "Address / Location city is required.";
    }
    
    // 3. Manager Name Constraint: letters and spaces only
    if (!branchManagerName.trim()) {
      errors.manager_name = "Manager name is required.";
    } else if (!/^[a-zA-Z\s]+$/.test(branchManagerName.trim())) {
      errors.manager_name = "Manager name must contain letters and spaces only.";
    }
    
    // 4. Phone Number Constraint: exactly 10 digits
    if (!branchPhone.trim()) {
      errors.phone_number = "Phone number is required.";
    } else if (!/^\d{10}$/.test(branchPhone.trim())) {
      errors.phone_number = "Phone number must be exactly 10 digits.";
    }
    
    if (Object.keys(errors).length > 0) {
      setBranchErrors(errors);
      showToast("Please fix the validation errors in the form.", "error");
      return;
    }
    
    try {
      const payload = {
        name: branchName.trim(),
        address: branchAddress.trim(),
        phone_number: branchPhone.trim(),
        is_active: branchActive,
        manager_name: branchManagerName.trim()
      };
      
      if (editingBranchId) {
        await updateBranch(editingBranchId, payload);
        showToast("Branch updated.");
      } else {
        await createBranch(payload);
        showToast("Branch registered.");
      }
      
      resetBranchForm();
      setIsAddBranchOpen(false);
      loadBranches();
    } catch (err: any) {
      console.error("Failed to save branch showroom in PostgreSQL:", err);
      const errMsg = err.response?.data?.detail || err.message || "Failed to save branch.";
      showToast(errMsg, "error");
    }
  };

  const handleAddModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelBrand || !newModelName.trim() || !newModelPrice) return;
    try {
      const colorVariants = newModelColors.split(",").map(c => c.trim()).filter(Boolean);
      const payload = {
        brand: parseInt(newModelBrand),
        model_name: newModelName.trim(),
        base_price: parseFloat(newModelPrice),
        color_variants: colorVariants,
        battery_compatibility: newModelBattery.trim(),
        status: newModelStatus
      };
      if (editingModelId) {
        await updateVehicleModel(editingModelId, payload);
        showToast("Model updated.");
      } else {
        await createVehicleModel(payload);
        showToast("Model added to catalog.");
      }
      setEditingModelId(null);
      setNewModelBrand("");
      setNewModelName("");
      setNewModelPrice("");
      setNewModelBattery("");
      setNewModelColors("");
      setNewModelStatus("active");
      setIsAddVehicleOpen(false);
      loadVehicles();
    } catch (err) {
      console.error("Failed to save vehicle model to Django backend:", err);
      showToast("Failed to save model.", "error");
    }
  };

  const [newBrandName, setNewBrandName] = useState("");
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);

  const handleAddBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      if (editingBrandId) {
        await api.patch(`/vehicle-brands/${editingBrandId}/`, { name: newBrandName.trim() });
        showToast("Brand updated successfully.");
      } else {
        await api.post("/vehicle-brands/", { name: newBrandName.trim(), is_active: true });
        showToast("Brand registered successfully.");
      }
      setNewBrandName("");
      setEditingBrandId(null);
      // Refresh brands
      const brands = await getVehicleBrands();
      setVehicleBrandsList(brands);
    } catch (err) {
      console.error("Failed to save brand:", err);
      showToast("Failed to save brand. Ensure name is unique.", "error");
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const data = await getLeads();
      setLeadsList(data);
    } catch (e) {
      console.error("Failed to load leads from Django REST API:", e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setAdvanceBookingsLoading(true);
      const data = await getBookings();
      setAdvanceBookings(data);
    } catch (e) {
      console.error("Failed to load bookings from Django REST API:", e);
    } finally {
      setAdvanceBookingsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setSalesInvoicesLoading(true);
      const data = await getSalesInvoices();
      setSalesInvoices(data);
    } catch (e) {
      console.error("Failed to load sales from Django REST API:", e);
    } finally {
      setSalesInvoicesLoading(false);
    }
  };

  const handleSalesDelivery = async (id: number, status: string) => {
    try {
      await updateSalesInvoice(id, { delivery_status: status });
      showToast(`Delivery marked ${status}.`);
      loadSales();
    } catch {
      showToast("Failed to update delivery status.", "error");
    }
  };

  const loadPurchases = async () => {
    try {
      setPurchaseOrdersLoading(true);
      const data = await getPurchaseOrders();
      setPurchaseOrders(data);
    } catch (e) {
      console.error("Failed to load purchases from Django REST API:", e);
    } finally {
      setPurchaseOrdersLoading(false);
    }
  };

  const loadLedger = async () => {
    try {
      setLedgerEntriesLoading(true);
      const data = await getLedgerEntries();
      setLedgerEntries(data);
    } catch (e) {
      console.error("Failed to load ledger from Django REST API:", e);
    } finally {
      setLedgerEntriesLoading(false);
    }
  };

  const handleApprovePO = async (id: number) => {
    try {
      await updatePurchaseOrderStatus(id, "approved");
      showToast("Purchase order approved.");
      loadPurchases();
      loadLedger();
    } catch {
      showToast("Failed to approve purchase order.", "error");
    }
  };

  const handlePOStatus = async (id: number, status: string) => {
    try {
      await updatePurchaseOrderStatus(id, status);
      showToast(`Purchase order marked ${status}.`);
      loadPurchases();
      loadLedger();
    } catch {
      showToast("Failed to update purchase order.", "error");
    }
  };

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPOSupplier.trim() || !newPOModel || !newPOQty || !newPOPrice || !newPOPaymentTerms.trim()) return;
    try {
      await createPurchaseOrder({
        supplier_name: newPOSupplier.trim(),
        vehicle_model: parseInt(newPOModel),
        quantity: parseInt(newPOQty),
        unit_price: parseFloat(newPOPrice),
        payment_terms: newPOPaymentTerms.trim(),
        estimated_delivery: newPOEstDelivery || undefined
      });
      setNewPOSupplier("");
      setNewPOModel("");
      setNewPOQty("");
      setNewPOPrice("");
      setNewPOPaymentTerms("");
      setNewPOEstDelivery("");
      setIsAddPOOpen(false);
      loadPurchases();
      loadLedger();
    } catch (err) {
      console.error("Failed to create purchase order:", err);
    }
  };

  const loadBatteries = async () => {
    try {
      setBatteriesLoading(true);
      const data = await getBatteries();
      const mapped = data.map((b: any) => ({
        id: b.id,
        serial: b.serial_number,
        batteryCode: b.battery_code,
        capacity: b.capacity,
        purDate: b.purchase_date,
        rawStatus: b.status,
        status: b.status === "available" ? "Available" : b.status === "sold" ? "Sold" : b.status === "assigned" ? "Assigned" : b.status === "damaged" ? "Damaged" : b.status === "returned" ? "Returned" : "Available",
        vehicle: b.assigned_to_vin || "N/A",
        location: b.location_name || "Visakhapatnam Showroom",
        locationId: b.location,
        supplier: b.supplier || b.supplier_name || "Tesla Tech Pack",
        warrantyYears: `${b.warranty_years || 3} Years`,
        warrantyYearsRaw: b.warranty_years || 3,
      }));
      setBatteriesStock(mapped);
    } catch (e) {
      console.error("Failed to load batteries from Django REST API:", e);
    } finally {
      setBatteriesLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setActivityLogsLoading(true);
      const logs = await getActivityLogs();
      setActivityLogsList(logs);
    } catch (e) {
      console.error("Failed to load activity logs from Django REST API:", e);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const list = await getUsers();
      setUsersList(list);
    } catch (e) {
      console.error("Failed to load staff users:", e);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const data = await getAttendanceLogs();
      setAttendanceList(data);
    } catch (e) {
      console.error("Failed to load attendance logs:", e);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleVerifyAttendance = async (id: number, status: "verified" | "rejected", remarks: string = "") => {
    try {
      await verifyAttendance(id, status, remarks);
      showToast(`Attendance marked as ${status}.`);
      loadAttendance();
    } catch {
      showToast("Failed to verify attendance.", "error");
    }
  };

  const handleBulkVerifyAttendance = async (status: "verified" | "rejected", remarks: string = "") => {
    if (selectedAttendanceIds.length === 0) {
      showToast("Please select at least one record.", "error");
      return;
    }
    try {
      await bulkVerifyAttendance(selectedAttendanceIds, status, remarks);
      showToast(`Successfully updated ${selectedAttendanceIds.length} records to ${status}.`);
      setSelectedAttendanceIds([]);
      loadAttendance();
    } catch {
      showToast("Failed to bulk verify attendance.", "error");
    }
  };
  const [melaVehiclesList, setMelaVehiclesList] = useState<any[]>([]);
  const [melaBatteriesList, setMelaBatteriesList] = useState<any[]>([]);
  const [melaCompatibilitiesList, setMelaCompatibilitiesList] = useState<any[]>([]);

  // Editing states for Mela campaign inventory
  const [editingMelaVehicleId, setEditingMelaVehicleId] = useState<number | null>(null);
  const [editVehicleModelName, setEditVehicleModelName] = useState("");
  const [editVehicleColor, setEditVehicleColor] = useState("");
  const [editVehiclePrice, setEditVehiclePrice] = useState("");
  const [editVehicleInitialQty, setEditVehicleInitialQty] = useState("");
  const [editVehicleRemainingQty, setEditVehicleRemainingQty] = useState("");
  const [editVehicleRestockDate, setEditVehicleRestockDate] = useState("");

  const [editingMelaBatteryId, setEditingMelaBatteryId] = useState<number | null>(null);
  const [editBatteryName, setEditBatteryName] = useState("");
  const [editBatteryPrice, setEditBatteryPrice] = useState("");
  const [editBatteryInitialQty, setEditBatteryInitialQty] = useState("");
  const [editBatteryRemainingQty, setEditBatteryRemainingQty] = useState("");
  const [editBatteryRestockDate, setEditBatteryRestockDate] = useState("");

  const loadMelaData = async () => {
    try {
      setMelaLoading(true);
      const [inv, bookings, reports, settings, vehicles, batteries, compatibilities] = await Promise.all([
        getMelaInventory(),
        getMelaBookings(),
        getMelaReports(),
        getMelaSettingsList(),
        api.get("/mela-vehicles/").then((r: any) => r.data),
        api.get("/mela-batteries/").then((r: any) => r.data),
        api.get("/mela-compatibilities/").then((r: any) => r.data)
      ]);
      setMelaInventoryList(inv);
      setMelaBookingsList(bookings);
      setMelaReportsData(reports);
      setMelaSettingsList(settings);
      setMelaVehiclesList(vehicles);
      setMelaBatteriesList(batteries);
      setMelaCompatibilitiesList(compatibilities);

      const activeSetting = settings.find((s: any) => s.is_active) || settings[0];
      if (activeSetting) {
        setMelaNameSetting(activeSetting.mela_name);
        setMelaStartDateSetting(activeSetting.start_date || "");
        setMelaEndDateSetting(activeSetting.end_date || "");
        setMelaLocationSetting(activeSetting.location);
        setMelaSettingsId(activeSetting.id || null);
        setMelaIsActiveSetting(activeSetting.is_active ?? true);
      } else {
        setMelaIsActiveSetting(false);
      }
    } catch (e) {
      console.error("Failed to load Mela campaign details:", e);
    } finally {
      setMelaLoading(false);
    }
  };

  const handleSaveMelaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!melaNameSetting.trim() || !melaLocationSetting.trim()) {
      showToast("Please enter a campaign name and location.", "error");
      return;
    }

    try {
      setMelaLoading(true);
      const payload = {
        mela_name: melaNameSetting,
        start_date: melaStartDateSetting || null,
        end_date: melaEndDateSetting || null,
        location: melaLocationSetting,
        is_active: melaIsActiveSetting
      };

      if (melaSettingsId) {
        await updateMelaSettings(melaSettingsId, payload);
        showToast("Mela settings updated successfully.");
      } else {
        const newSetting = await createMelaSettings(payload);
        setMelaSettingsId(newSetting.id || null);
        showToast("Mela settings saved successfully.");
      }
      loadMelaData();
    } catch (err) {
      console.error("Failed to save Mela settings:", err);
      showToast("Failed to save Mela settings.", "error");
    } finally {
      setMelaLoading(false);
    }
  };
  const handleSaveVehicleEdit = async (id: number) => {
    if (!editVehicleModelName.trim() || !editVehicleColor.trim() || !editVehiclePrice || !editVehicleInitialQty || !editVehicleRemainingQty) {
      showToast("Please fill all fields.", "error");
      return;
    }
    try {
      await api.patch(`/mela-vehicles/${id}/`, {
        model_name: editVehicleModelName.trim(),
        color: editVehicleColor.trim(),
        price: parseFloat(editVehiclePrice),
        initial_quantity: parseInt(editVehicleInitialQty),
        remaining_quantity: parseInt(editVehicleRemainingQty),
        restock_date: editVehicleRestockDate || null
      });
      showToast("Campaign vehicle details updated.");
      setEditingMelaVehicleId(null);
      loadMelaData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update vehicle details.", "error");
    }
  };

  const handleSaveBatteryEdit = async (id: number) => {
    if (!editBatteryName.trim() || !editBatteryPrice || !editBatteryInitialQty || !editBatteryRemainingQty) {
      showToast("Please fill all fields.", "error");
      return;
    }
    try {
      await api.patch(`/mela-batteries/${id}/`, {
        battery_name: editBatteryName.trim(),
        price: parseFloat(editBatteryPrice),
        initial_quantity: parseInt(editBatteryInitialQty),
        remaining_quantity: parseInt(editBatteryRemainingQty),
        restock_date: editBatteryRestockDate || null
      });
      showToast("Campaign battery details updated.");
      setEditingMelaBatteryId(null);
      loadMelaData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update battery details.", "error");
    }
  };

  const handleAddMelaInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!melaInvModel || !melaInvColor.trim() || !melaInvQty || !melaInvPrice) {
      showToast("Please fill all required stock fields.", "error");
      return;
    }

    let remainingQty = parseInt(melaInvQty);
    if (editingMelaInventoryId) {
      const existing = melaInventoryList.find(item => item.id === editingMelaInventoryId);
      if (existing) {
        const diff = parseInt(melaInvQty) - existing.initial_quantity;
        remainingQty = Math.max(0, existing.remaining_quantity + diff);
      }
    }

    const payload = {
      vehicle_model: parseInt(melaInvModel),
      color: melaInvColor.trim(),
      battery_type: melaInvBattery,
      initial_quantity: parseInt(melaInvQty),
      remaining_quantity: remainingQty,
      price: parseFloat(melaInvPrice),
      is_active: true
    };
    try {
      if (editingMelaInventoryId) {
        await updateMelaInventory(editingMelaInventoryId, payload);
        showToast("Mela stock updated.");
      } else {
        await createMelaInventory(payload);
        showToast("Mela stock added.");
      }
      setEditingMelaInventoryId(null);
      setMelaInvModel("");
      setMelaInvColor("");
      setMelaInvBattery("graphene");
      setMelaInvQty("");
      setMelaInvPrice("");
      setIsAddMelaInventoryOpen(false);
      loadMelaData();
    } catch (err: any) {
      console.error("Failed to save Mela stock:", err);
      const msg = err.response?.data?.color || err.response?.data?.non_field_errors || "Failed to save stock.";
      showToast(Array.isArray(msg) ? msg[0] : String(msg), "error");
    }
  };

  const handleDeleteMelaInventory = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this vehicle from the Mela campaign?")) return;
    try {
      await deleteMelaInventory(id);
      showToast("Mela campaign stock deleted.");
      loadMelaData();
    } catch {
      showToast("Failed to delete Mela stock.", "error");
    }
  };

  const handleMelaStockAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!melaAdjItem || !melaAdjQty) {
      showToast("Please select a campaign item and enter adjustment quantity.", "error");
      return;
    }
    const qtyVal = parseInt(melaAdjQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast("Quantity must be greater than zero.", "error");
      return;
    }
    const selectedInv = melaVehiclesList.find(item => String(item.id) === melaAdjItem);
    if (!selectedInv) {
      showToast("Selected campaign item not found.", "error");
      return;
    }

    const newQty = melaAdjType === "in" 
      ? selectedInv.remaining_quantity + qtyVal 
      : selectedInv.remaining_quantity - qtyVal;

    if (newQty < 0) {
      showToast("Cannot subtract more stock than available.", "error");
      return;
    }

    try {
      const payload = {
        model_name: selectedInv.model_name,
        color: selectedInv.color,
        initial_quantity: selectedInv.initial_quantity + (melaAdjType === "in" ? qtyVal : 0),
        remaining_quantity: newQty,
        price: parseFloat(selectedInv.price),
        is_active: selectedInv.is_active
      };

      await api.patch(`/mela-vehicles/${selectedInv.id}/`, payload);
      
      const newLog = {
        id: Date.now(),
        date: getDynamicDate(new Date().getDate(), 0, "short"),
        model_name: selectedInv.model_name,
        color: selectedInv.color,
        battery_type: "",
        type: melaAdjType,
        quantity: qtyVal,
        notes: melaAdjNotes || (melaAdjType === "in" ? "Manual Stock-In Adjustment" : "Manual Stock-Out Adjustment")
      };
      
      setMelaStockLogs(prev => [newLog, ...prev]);
      showToast(`Stock successfully adjusted!`);
      
      setMelaAdjQty("");
      setMelaAdjNotes("");
      loadMelaData();
    } catch (err) {
      console.error(err);
      showToast("Failed to complete stock adjustment.", "error");
    }
  };

  const handleMelaAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupLead.trim()) {
      showToast("Please fill in Group Name and Lead.", "error");
      return;
    }
    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      lead: newGroupLead.trim(),
      members: newGroupMembers.trim() || newGroupLead.trim(),
      bookings: 0,
      target: parseInt(newGroupTarget) || 10,
      revenue: 0
    };
    setMelaGroups(prev => [...prev, newGroup]);
    showToast(`Campaign Group "${newGroupName}" created!`);
    setNewGroupName("");
    setNewGroupLead("");
    setNewGroupMembers("");
    setNewGroupTarget("10");
    setShowAddGroupForm(false);
  };

  const handleMelaCheckoutSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMelaCheckoutError("");
    setMelaFoundBooking(null);
    setCompletedOrderDetails(null);
    setCheckoutPaymentType("cash");
    setCheckoutPaymentProof(null);
    const q = melaSearchQuery.trim().toUpperCase();
    if (!q) {
      setMelaCheckoutError("Please enter a Booking ID.");
      return;
    }
    try {
      setMelaCheckoutLoading(true);
      const results = await getMelaBookings({ booking_id: q });
      if (results && results.length > 0) {
        setMelaFoundBooking(results[0]);
      } else {
        setMelaCheckoutError("No booking found with this Booking ID.");
      }
    } catch {
      setMelaCheckoutError("Error searching for Booking ID.");
    } finally {
      setMelaCheckoutLoading(false);
    }
  };

  const formatWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  const handlePrintReceipt = (booking: any) => {
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) {
      showToast("Popup blocker prevented opening the print receipt.", "error");
      return;
    }

    const formattedDate = booking.completed_at
      ? new Date(booking.completed_at).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });

    const priceStr = parseFloat(booking.price).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const paymentTypeMap: Record<string, string> = {
      cash: "CASH",
      upi: "UPI / ONLINE",
      card: "DEBIT/CREDIT CARD",
      bajaj_finance: "BAJAJ FINANCE"
    };
    const paymentLbl = paymentTypeMap[booking.payment_type] || booking.payment_type.toUpperCase();

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${booking.booking_id}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            width: 72mm;
            margin: 0 auto;
            padding: 6mm 4mm 20mm 4mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background-color: #fff;
            -webkit-print-color-adjust: exact;
            box-sizing: border-box;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .bold {
            font-weight: bold;
          }
          .brand-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 2px 0;
            letter-spacing: 1px;
          }
          .brand-subtitle {
            font-size: 10px;
            margin: 0 0 6px 0;
            text-transform: uppercase;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          .details-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          .details-table td.label {
            width: 40%;
            color: #333;
          }
          .details-table td.value {
            width: 60%;
            text-align: right;
            font-weight: bold;
          }
          .items-header {
            font-weight: bold;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .item-row {
            margin-bottom: 4px;
          }
          .item-desc {
            font-weight: bold;
          }
          .item-meta {
            font-size: 9px;
            color: #555;
            padding-left: 8px;
          }
          .total-section {
            margin-top: 8px;
            font-size: 13px;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0;
          }
          .footer-thanks {
            margin-top: 15px;
            font-size: 10px;
            text-align: center;
          }
          .signature-area {
            margin-top: 30px;
            text-align: right;
            font-size: 9px;
          }
          @media print {
            body {
              width: 72mm;
              padding: 6mm 4mm 20mm 4mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="brand-title">KVR MOTORS</div>
          <div class="brand-subtitle">Automobile ERP & Mela Campaign</div>
          <div style="font-size: 9px;">Authorized Dealer</div>
        </div>
        
        <div class="divider"></div>
        
        <table class="details-table">
          <tr>
            <td class="label">Receipt No:</td>
            <td class="value">${booking.booking_id}</td>
          </tr>
          <tr>
            <td class="label">Date/Time:</td>
            <td class="value">${formattedDate}</td>
          </tr>
          <tr>
            <td class="label">Customer:</td>
            <td class="value">${booking.customer_name}</td>
          </tr>
          <tr>
            <td class="label">Phone:</td>
            <td class="value">${booking.customer_phone}</td>
          </tr>
          <tr>
            <td class="label">Sales Exec:</td>
            <td class="value">${booking.executive_name || "Sales Executive"}</td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        <div class="items-header">
          <span>ITEM DESCRIPTION</span>
        </div>
        <div class="item-row">
          <div class="item-desc">${booking.vehicle_model_name || booking.model_name || ""}</div>
          <div class="item-meta">Color: ${booking.color || booking.vehicle_color || "N/A"}</div>
          <div class="item-meta">Battery: ${booking.battery_type || booking.battery_name || "N/A"}</div>
          <div class="text-right bold" style="margin-top: 2px;">1 x ₹ ${priceStr}</div>
        </div>
        
        <div class="total-section">
          <div style="display: flex; justify-content: space-between;">
            <span class="bold">GRAND TOTAL:</span>
            <span class="bold">₹ ${priceStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span>PAID BY:</span>
            <span class="bold">${paymentLbl}</span>
          </div>
        </div>
        
        <div class="footer-thanks">
          <div class="bold">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Please retain this receipt for warranty.</div>
          <div style="font-size: 8px; margin-top: 4px; color: #444;">System Generated Receipt</div>
        </div>
        
        <div class="signature-area">
          <br/><br/>
          <span>-----------------------</span><br/>
          <span>Authorized Signatory</span>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const numberToWordsIndian = (num: number): string => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    num = Math.floor(num);
    if (num === 0) return "Zero";

    const convertLessThanOneHundred = (n: number): string => {
      if (n < 20) return a[n];
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    };

    const convertLessThanOneThousand = (n: number): string => {
      if (n >= 100) {
        return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanOneHundred(n % 100) : "");
      }
      return convertLessThanOneHundred(n);
    };

    let word = "";
    let crores = Math.floor(num / 10000000);
    num %= 10000000;
    let lakhs = Math.floor(num / 100000);
    num %= 100000;
    let thousands = Math.floor(num / 1000);
    num %= 1000;
    let remaining = num;

    if (crores > 0) {
      word += convertLessThanOneThousand(crores) + " Crore ";
    }
    if (lakhs > 0) {
      word += convertLessThanOneThousand(lakhs) + " Lakh ";
    }
    if (thousands > 0) {
      word += convertLessThanOneThousand(thousands) + " Thousand ";
    }
    if (remaining > 0) {
      word += convertLessThanOneThousand(remaining);
    }

    return word.trim() + " Rupees Only";
  };

  const generateTaxInvoiceHtml = (details: {
    invoiceNo: string;
    date: string;
    placeOfSupply: string;
    poDate: string;
    poNo: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    vehicleModel: string;
    color: string;
    vinNo: string;
    motorNo: string;
    batteryNo: string;
    chargerNo: string;
    totalPrice: number;
    paymentMode: string;
    executiveName: string;
    logoUrl: string;
    signatureUrl: string;
  }) => {
    const totalAmount = details.totalPrice;
    const taxableAmount = totalAmount / 1.05;
    const totalTax = totalAmount - taxableAmount;
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;

    const formattedTaxable = taxableAmount.toFixed(2);
    const formattedTax = totalTax.toFixed(2);
    const formattedCgst = cgstAmount.toFixed(2);
    const formattedSgst = sgstAmount.toFixed(2);
    const formattedTotal = totalAmount.toFixed(2);

    const priceWords = numberToWordsIndian(totalAmount);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${details.invoiceNo}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            margin: 20px;
            background-color: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          
          .invoice-header-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
          }
          .invoice-header-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
          }
          .company-details {
            width: 55%;
          }
          .invoice-meta {
            width: 45%;
            padding: 0 !important;
          }
          .invoice-meta-table {
            width: 100%;
            border-collapse: collapse;
            height: 100%;
          }
          .invoice-meta-table td {
            border: none;
            border-bottom: 1px solid #000;
            padding: 6px 8px;
          }
          .invoice-meta-table tr:last-child td {
            border-bottom: none;
          }
          
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          .logo-text {
            font-size: 20px;
            font-weight: 900;
            color: #04a700;
            letter-spacing: 1px;
          }
          
          .bill-to-section {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .bill-to-section td {
            padding: 8px;
            vertical-align: top;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .totals-container-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .totals-container-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
          }
          .description-column {
            width: 55%;
          }
          .amounts-column {
            width: 45%;
            padding: 0 !important;
          }
          .amounts-table {
            width: 100%;
            border-collapse: collapse;
          }
          .amounts-table td {
            border: none;
            border-bottom: 1px solid #000;
            padding: 6px 8px;
          }
          .amounts-table tr:last-child td {
            border-bottom: none;
          }
          
          .tax-breakdown-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .tax-breakdown-table th, .tax-breakdown-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-size: 10px;
          }
          .tax-breakdown-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .bank-terms-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .bank-terms-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
            width: 33.33%;
          }
          
          @media print {
            body {
              margin: 10px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 5px; font-weight: bold; font-size: 14px;" class="text-center">Tax Invoice</div>
        <div style="font-size: 9px; font-weight: bold; margin-bottom: 5px;" class="text-right">ORIGINAL FOR RECIPIENT</div>
        
        <table class="invoice-header-table">
          <tr>
            <td class="company-details">
              <div class="logo-container">
                <img src="${details.logoUrl}" alt="KVR Logo" style="height: 45px; width: auto; object-fit: contain;" />
                <div class="logo-text">KVR MOTORS</div>
              </div>
              <div style="font-size: 10px; line-height: 1.3;">
                GROUND FLOOR, 54-1-13, ISUKATHOTA, MADDILAPALEM, KRANTHINAGAR, VISHAKAPATNAM, ANDHRAPRADESH,<br/>
                Phone no.: 9391099576<br/>
                Email: kvr.kinetic@gmail.com<br/>
                GSTIN: 37GEWPK2874E1ZU<br/>
                State: 37-Andhra Pradesh
              </div>
            </td>
            <td class="invoice-meta">
              <table class="invoice-meta-table">
                <tr>
                  <td class="bold">Invoice No.</td>
                  <td class="text-right bold">${details.invoiceNo}</td>
                </tr>
                <tr>
                  <td class="bold">Date</td>
                  <td class="text-right">${details.date}</td>
                </tr>
                <tr>
                  <td>Place of supply</td>
                  <td class="text-right">${details.placeOfSupply}</td>
                </tr>
                <tr>
                  <td>PO date</td>
                  <td class="text-right">${details.poDate}</td>
                </tr>
                <tr>
                  <td>PO number</td>
                  <td class="text-right">${details.poNo}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table class="bill-to-section">
          <tr>
            <td>
              <div class="bold" style="font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Bill To</div>
              <div class="bold" style="font-size: 12px; color: #000;">${details.customerName}</div>
              <div style="margin-top: 4px; font-weight: 500;">
                ${details.customerAddress}<br/>
                Contact No. : ${details.customerPhone}<br/>
                State: 37-Andhra Pradesh
              </div>
            </td>
          </tr>
        </table>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 25%;" class="text-left">Item name</th>
              <th style="width: 10%;">HSN/ SAC</th>
              <th style="width: 8%;">Colour</th>
              <th style="width: 12%;">VIN No</th>
              <th style="width: 10%;">Motor No</th>
              <th style="width: 10%;">Battery No</th>
              <th style="width: 10%;">Charger No</th>
              <th style="width: 5%;">Qty</th>
              <th style="width: 5%;">Unit</th>
              <th style="width: 10%;" class="text-right">Price/ Unit</th>
              <th style="width: 10%;" class="text-right">GST</th>
              <th style="width: 10%;" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td class="text-left bold">${details.vehicleModel}</td>
              <td>87116020</td>
              <td>${details.color}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.vinNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.motorNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.batteryNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.chargerNo}</td>
              <td>1</td>
              <td>VH</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (5%)</td>
              <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <table class="totals-container-table">
          <tr>
            <td class="description-column">
              <div style="margin-bottom: 8px;">
                <span class="bold">Invoice Amount in Words:</span><br/>
                <span style="font-style: italic; font-weight: bold; font-size: 11px;">${priceWords}</span>
              </div>
              <div style="font-size: 9px; line-height: 1.3; border-top: 1px solid #eee; pt-6;">
                <span class="bold" style="text-decoration: underline;">Description</span><br/>
                BATTERY WARRANTY - 3YEARS (or) 30,000KM (Whichever comes first)<br/>
                MOTOR WARRANTY - 2YEARS<br/>
                CONTROLLER WARRANTY - 2YEARS<br/>
                CHARGER WARRANTY - 1YEAR<br/>
                <span class="bold">NOTE ; NO FREE SERVICES</span>
              </div>
              <div style="margin-top: 8px; border-top: 1px solid #eee; pt-4;">
                <span class="bold">Payment mode:</span><br/>
                <span>KVR Motors UPI (351828801952 - 590201007448), ${details.paymentMode}</span>
              </div>
            </td>
            <td class="amounts-column">
              <table class="amounts-table">
                <tr>
                  <td class="bold">Amounts</td>
                  <td></td>
                </tr>
                <tr>
                  <td>Sub Total</td>
                  <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="bold">Total</td>
                  <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Received</td>
                  <td class="text-right bold" style="color: #04a700;">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Balance</td>
                  <td class="text-right bold">₹ 0.00</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table class="tax-breakdown-table">
          <thead>
            <tr>
              <th rowspan="2">HSN/ SAC</th>
              <th rowspan="2">Taxable amount</th>
              <th colspan="2">CGST</th>
              <th colspan="2">SGST</th>
              <th rowspan="2">Total Tax Amount</th>
            </tr>
            <tr>
              <th>Rate</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bold">87116020</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td>2.5%</td>
              <td class="text-right">₹ ${parseFloat(formattedCgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td>2.5%</td>
              <td class="text-right">₹ ${parseFloat(formattedSgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right bold">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="bold" style="background-color: #fafafa;">
              <td>Total</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td class="text-right">₹ ${parseFloat(formattedCgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td class="text-right">₹ ${parseFloat(formattedSgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <table class="bank-terms-table">
          <tr>
            <td>
              <div class="bold" style="text-decoration: underline; margin-bottom: 4px;">Bank Details</div>
              Name : ICICI BANK LIMITED, SRIKAKULAM<br/>
              Account No. : 070005500380<br/>
              IFSC code : ICIC0000700<br/>
              Account holder's name : KVR MOTORS
            </td>
            <td>
              <div class="bold" style="text-decoration: underline; margin-bottom: 4px;">Terms and conditions</div>
              Thanks You!<br/>
              Please Refer to Terms and Conditions in Page 2
            </td>
            <td class="text-center" style="position: relative; vertical-align: top;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">For KVR MOTORS</div>
              <div style="height: 35px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                <img src="${details.signatureUrl}" alt="Proprietor Signature" style="max-height: 35px; width: auto; object-fit: contain;" />
              </div>
              <div style="font-style: italic; font-weight: bold; color: #444; margin-bottom: 5px;">K. V. Raghava Reddy</div>
              <div class="bold" style="border-top: 1px solid #000; padding-top: 4px; font-size: 9px;">Proprietor</div>
            </td>
          </tr>
        </table>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  const handlePrintSalesInvoice = (inv: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      showToast("Popup blocker prevented opening the print invoice.", "error");
      return;
    }

    const formattedDate = inv.sale_date
      ? new Date(inv.sale_date).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const printHtml = generateTaxInvoiceHtml({
      invoiceNo: inv.invoice_number || `INV-${inv.id}`,
      date: formattedDate,
      placeOfSupply: "37-Andhra Pradesh",
      poDate: formattedDate,
      poNo: inv.invoice_number || "—",
      customerName: inv.customer_name,
      customerPhone: inv.customer_contact,
      customerAddress: "2-181, OLD DAIRY FARM, VISAKHAPATNAM - 530040",
      vehicleModel: inv.model_name || "DYNAMO X1 (60V 31.2AH)",
      color: inv.vehicle_color || "BLACK",
      vinNo: inv.vin_number || "—",
      motorNo: inv.motor_number || "R6VA014COMT010820",
      batteryNo: inv.battery_serial || "UESL026F01493",
      chargerNo: "XEVXNCMDZ06AEC30375",
      totalPrice: parseFloat(inv.sale_price || 0),
      paymentMode: inv.payment_mode || "Cash",
      executiveName: inv.executive_name || "Sales Executive",
      logoUrl: `${origin}/icon.png`,
      signatureUrl: `${origin}/signature.png`
    });

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleMelaCheckoutComplete = async (bookingId: number) => {
    if (checkoutPaymentType !== "cash" && checkoutPaymentType !== "split" && !checkoutPaymentProof) {
      showToast("Payment proof screenshot is required for non-cash payments.", "error");
      return;
    }

    if (checkoutPaymentType === "split") {
      const c = parseFloat(splitAmounts.cash || "0");
      const cr = parseFloat(splitAmounts.card || "0");
      const u = parseFloat(splitAmounts.upi || "0");
      const b = parseFloat(splitAmounts.bajaj_finance || "0");
      const total = c + cr + u + b;
      const target = parseFloat(melaFoundBooking.price);
      if (Math.abs(total - target) > 0.01) {
        showToast(`Split total (₹${total}) must exactly match the vehicle price (₹${target}).`, "error");
        return;
      }
    }

    try {
      setMelaCheckoutLoading(true);
      const formData = new FormData();
      formData.append("payment_type", checkoutPaymentType);
      if (checkoutPaymentType === "split") {
        formData.append("payment_details", JSON.stringify({
          cash: parseFloat(splitAmounts.cash || "0"),
          card: parseFloat(splitAmounts.card || "0"),
          upi: parseFloat(splitAmounts.upi || "0"),
          bajaj_finance: parseFloat(splitAmounts.bajaj_finance || "0")
        }));
      }
      if (checkoutPaymentProof) {
        formData.append("payment_proof", checkoutPaymentProof);
      }
      const completedBooking = await completeMelaBooking(bookingId, formData);
      showToast("Booking completed and finalized successfully!");
      setCompletedOrderDetails(completedBooking);
      setMelaFoundBooking(null);
      setMelaSearchQuery("");
      setCheckoutPaymentType("cash");
      setCheckoutPaymentProof(null);
      setSplitAmounts({ cash: "", card: "", upi: "", bajaj_finance: "" });
      loadMelaData();
      loadLedger();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to finalize checkout.";
      showToast(String(msg), "error");
    } finally {
      setMelaCheckoutLoading(false);
    }
  };

  const getInvoicePdfUrl = (path: string | null | undefined) => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}${path}`;
  };

  const handleOpenEditCustomer = (booking: any) => {
    setEditCustomerBookingId(booking.id);
    setEditCustomerName(booking.customer_name);
    setEditCustomerPhone(booking.customer_phone);
    setIsEditCustomerOpen(true);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomerBookingId) return;
    try {
      setEditCustomerLoading(true);
      await updateMelaBooking(editCustomerBookingId, {
        customer_name: editCustomerName,
        customer_phone: editCustomerPhone,
      });
      showToast("Customer details updated successfully!");
      setIsEditCustomerOpen(false);
      loadMelaData();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to update customer details", "error");
    } finally {
      setEditCustomerLoading(false);
    }
  };

  const [transfers, setTransfers] = useState<any[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(true);

  const loadTransfers = async (isSilent = false) => {
    try {
      if (!isSilent) setTransfersLoading(true);
      const data = await getStockTransfers();
      const mapped = data.map((t: any) => ({
        id: t.id,
        ref: t.transfer_id,
        from: t.from_location_name || "Vizag Central Godown",
        to: t.to_location_name || "Visakhapatnam Showroom",
        model: t.model_name || "Kinetic Green E-Luna",
        qty: t.vin_number ? `1 Unit (${t.vin_number})` : "1 Unit",
        requestedBy: t.requester_name || "Anil Kumar",
        priority: t.transfer_id.endsWith("904") ? "Urgent" : t.transfer_id.endsWith("902") ? "High" : "Medium",
        status: t.status === "approved" ? "Approved" : t.status === "rejected" ? "Rejected" : t.status === "pending" ? "Pending Approval" : t.status_display || "Pending Approval"
      }));
      setTransfers(mapped);
    } catch (e) {
      console.error("Failed to load stock transfers:", e);
    } finally {
      if (!isSilent) setTransfersLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadBranches();
    loadVehicles();
    loadLeads();
    loadBookings();
    loadSales();
    loadTransfers();
    loadPurchases();
    loadLedger();
    loadBatteries();
    loadActivityLogs();
    loadUsers();
    loadAttendance();
    loadMelaData();
    getInventoryLocations().then(setLocationsList).catch(() => {});
    getShowrooms().then(setShowroomsList).catch(() => {});
  }, []);
  
  // Modals state
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddBatteryOpen, setIsAddBatteryOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userBranchFilter, setUserBranchFilter] = useState("All Branches");
  const [userRoleFilter, setUserRoleFilter] = useState("All Roles");
  const [userTypeFilter, setUserTypeFilter] = useState("All Types");
  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "sales_executive",
    branch: ""
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceFilterBranch, setAttendanceFilterBranch] = useState("All Branches");
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState("All Statuses");
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<number[]>([]);

  // Edit user state hooks
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "sales_executive",
    branch: "",
    isActive: true,
    password: ""
  });

  // Lightweight feedback toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Tab navigation (mirrors sidebar behaviour so URL stays in sync)
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/owner" : `/owner/${tab}`;
    window.history.pushState({ path }, "", path);
  };

  // --- Branch edit / toggle ---
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const openEditBranch = (branch: any) => {
    setEditingBranchId(branch.id);
    setBranchName(branch.name || "");
    setBranchAddress(branch.address || "");
    setBranchPhone(branch.phone_number || "");
    setBranchActive(branch.is_active !== false);
    setBranchManagerName(branch.manager_name || "");
    setBranchTotalStock(branch.total_stock !== undefined && branch.total_stock !== null ? String(branch.total_stock) : "");
    setBranchSalesVolume(branch.sales_volume !== undefined && branch.sales_volume !== null ? String(branch.sales_volume) : "");
    setBranchMonthlyTarget(branch.monthly_target !== undefined && branch.monthly_target !== null ? String(branch.monthly_target) : "");
    setBranchTargetPct(branch.target_achieved_pct !== undefined && branch.target_achieved_pct !== null ? String(branch.target_achieved_pct) : "");
    setIsAddBranchOpen(true);
  };
  const handleToggleBranch = async (branch: any) => {
    try {
      await updateBranch(branch.id, { name: branch.name, address: branch.address, phone_number: branch.phone_number, is_active: !branch.is_active });
      showToast(`Branch ${branch.is_active ? "deactivated" : "activated"}.`);
      loadBranches();
    } catch { showToast("Failed to update branch.", "error"); }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this branch outlet? This action cannot be undone.")) return;
    try {
      await deleteBranch(id);
      showToast("Branch outlet deleted successfully.");
      loadBranches();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete branch.";
      showToast(errMsg, "error");
    }
  };

  const handleDeleteModel = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this vehicle model? This will affect stock catalog.")) return;
    try {
      await deleteVehicleModel(id);
      showToast("Vehicle model deleted from catalog.");
      loadVehicles();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete vehicle model.";
      showToast(errMsg, "error");
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
      showToast("Lead removed from pipeline.");
      setIsAddLeadOpen(false);
      loadLeads();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete lead.";
      showToast(errMsg, "error");
    }
  };

  const handleDeleteBooking = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this booking record?")) return;
    try {
      await deleteBooking(id);
      showToast("Booking record deleted.");
      loadBookings();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete booking.";
      showToast(errMsg, "error");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      await deleteUser(id);
      showToast("User account deleted.");
      loadUsers();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete user.";
      showToast(errMsg, "error");
    }
  };

  const handleResetUserPassword = async (usr: any) => {
    const newPass = window.prompt(`Enter new password for ${usr.full_name || usr.username}:`, "password123");
    if (newPass === null) return;
    if (!newPass.trim()) {
      showToast("Password cannot be empty.", "error");
      return;
    }
    try {
      await updateUser(usr.id, { password: newPass.trim() });
      showToast(`Password for ${usr.full_name || usr.username} has been reset successfully.`);
    } catch (err: any) {
      showToast("Failed to reset password.", "error");
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.fullName.trim() || !newUser.email.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(newUser.email.trim())) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    if (newUser.phoneNumber.trim()) {
      const cleanPhone = newUser.phoneNumber.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        showToast("Phone number must contain exactly 10 digits.", "error");
        return;
      }
    }
    try {
      const payload: any = {
        username: newUser.username.trim(),
        full_name: newUser.fullName.trim(),
        email: newUser.email.trim(),
        phone_number: newUser.phoneNumber.trim() || null,
        password: "password123",
        role: newUser.role,
      };
      if (newUser.role !== "owner" && newUser.role !== "admin") {
        payload.branch = newUser.branch ? newUser.branch.trim() : null;
      }
      await createUser(payload);
      showToast("User account created successfully.");
      setNewUser({
        username: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "sales_executive",
        branch: ""
      });
      setIsAddUserOpen(false);
      loadUsers();
    } catch {
      showToast("Failed to create user account. Ensure username or email is unique.", "error");
    }
  };

  const openEditUser = (usr: any) => {
    setEditingUser(usr);
    setEditUserForm({
      fullName: usr.full_name || "",
      email: usr.email || "",
      phoneNumber: usr.phone_number || "",
      role: usr.role || "sales_executive",
      branch: usr.branch ? String(usr.branch) : "",
      isActive: usr.is_active !== false,
      password: "",
    });
    setIsEditUserOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(editUserForm.email.trim())) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    if (editUserForm.phoneNumber.trim()) {
      const cleanPhone = editUserForm.phoneNumber.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        showToast("Phone number must contain exactly 10 digits.", "error");
        return;
      }
    }
    try {
      const payload: any = {
        full_name: editUserForm.fullName.trim(),
        email: editUserForm.email.trim(),
        phone_number: editUserForm.phoneNumber.trim() || null,
        role: editUserForm.role,
        is_active: editUserForm.isActive,
      };
      if (editUserForm.role !== "owner" && editUserForm.role !== "admin") {
        payload.branch = editUserForm.branch ? editUserForm.branch.trim() : null;
      } else {
        payload.branch = null;
      }
      if (editUserForm.password.trim()) {
        payload.password = editUserForm.password;
      }
      await updateUser(editingUser.id, payload);
      showToast("User account updated.");
      setEditingUser(null);
      setIsEditUserOpen(false);
      loadUsers();
    } catch {
      showToast("Failed to update user account.", "error");
    }
  };

  // --- Vehicle model edit ---
  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const openEditModel = (model: any) => {
    setEditingModelId(model.id);
    setNewModelBrand(String(model.brand || ""));
    setNewModelName(model.model_name || "");
    setNewModelPrice(String(model.base_price || ""));
    setNewModelBattery(model.battery_compatibility || "");
    setNewModelColors(Array.isArray(model.color_variants) ? model.color_variants.join(", ") : (model.color_variants || ""));
    setNewModelStatus(model.status === "inactive" ? "inactive" : "active");
    setIsAddVehicleOpen(true);
  };

  // --- Stock Unit (VIN registry) add / edit / delete ---
  const resetStockUnitForm = () => {
    setStockUnitForm({ ...emptyStockUnit });
    setEditingUnitId(null);
    setVinLookupState("idle");
  };
  const openAddStockUnit = () => {
    resetStockUnitForm();
    setIsAddStockOpen(true);
  };
  const openEditStockUnit = (unit: any) => {
    setVinLookupState("idle");
    setEditingUnitId(unit.id);
    setStockUnitForm({
      model: String(unit.model || ""),
      branch: String(unit.branch || ""),
      showroom: String(unit.showroom || ""),
      location: String(unit.location || ""),
      vin_number: unit.vin_number || "",
      motor_number: unit.motor_number || "",
      chassis_number: unit.chassis_number || "",
      color: unit.color || "",
      purchase_date: unit.purchase_date || "",
      stock_status: unit.stock_status || "available",
      assigned_battery: unit.assigned_battery || "",
      purchase_invoice_number: unit.purchase_invoice_number || "",
      payment_status: unit.payment_status || "success",
      quantity: "1",
    });
    setIsAddStockOpen(true);
  };

  // Auto-fill identifiers when one is entered. Vehicles are matched against the
  // already-loaded units registry by VIN, Motor, OR Chassis number — so filling
  // any one identifier pulls the rest. Falls back to the API lookup if needed.
  const applyMatchedUnit = (unit: any) => {
    setEditingUnitId(unit.id);
    setStockUnitForm((prev) => ({
      ...prev,
      model: String(unit.model ?? prev.model ?? ""),
      branch: String(unit.branch ?? prev.branch ?? ""),
      showroom: String(unit.showroom ?? prev.showroom ?? ""),
      location: String(unit.location ?? prev.location ?? ""),
      vin_number: unit.vin_number || prev.vin_number,
      motor_number: unit.motor_number || prev.motor_number || "",
      chassis_number: unit.chassis_number || prev.chassis_number || "",
      color: unit.color || "",
      purchase_date: unit.purchase_date || "",
      stock_status: unit.stock_status || "available",
      assigned_battery: unit.assigned_battery || "",
      purchase_invoice_number: unit.purchase_invoice_number || "",
      payment_status: unit.payment_status || "success",
    }));
    setVinLookupState("found");
  };

  const handleIdentifierLookup = async (
    field: "vin_number" | "motor_number" | "chassis_number",
    raw: string
  ) => {
    const q = raw.trim();
    if (q.length < 3) {
      setVinLookupState("idle");
      return;
    }
    setVinLookupState("searching");

    // 1) Instant client-side match against the loaded registry (any identifier).
    const local = vehicleUnitsList.find((u) => {
      const vals = [u.vin_number, u.motor_number, u.chassis_number]
        .filter(Boolean)
        .map((v: string) => String(v).toLowerCase());
      return vals.includes(q.toLowerCase());
    });
    if (local) {
      applyMatchedUnit(local);
      return;
    }

    // 2) Fall back to the backend lookup (matches VIN / motor / chassis exactly).
    try {
      const unit = await lookupVehicleUnit(q);
      if (unit && unit.id) {
        applyMatchedUnit(unit);
        return;
      }
      setEditingUnitId(null);
      setVinLookupState("notfound");
    } catch {
      setEditingUnitId(null);
      setVinLookupState("notfound");
    }
  };

  const handleStockUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = stockUnitForm;
    if (!f.model || !f.branch) {
      showToast("Select vehicle model and branch outlet.", "error");
      return;
    }
    const vin = f.vin_number.trim();
    const motor = f.motor_number.trim();
    const chassis = f.chassis_number.trim();

    // Auto-resolve primary showroom and inventory location for the branch since form selector is removed
    const branchId = parseInt(f.branch);
    const branchObj = branchesList.find((b) => b.id === branchId);
    const showroomId = branchObj?.showrooms?.[0]?.id || 3; // Default to Main Showroom ID 3 (KVR MOTORS)
    const locationId = branchObj?.inventory_locations?.[0]?.id || 3; // Default to Main Location ID 3 (KVR MOTORS)

    const payload = {
      model: parseInt(f.model),
      branch: branchId,
      showroom: showroomId,
      location: locationId,
      // Send null (not empty string) for blanks so the DB partial-unique
      // constraints treat missing identifiers as absent rather than duplicates.
      vin_number: vin || null,
      motor_number: motor || null,
      chassis_number: chassis || null,
      color: f.color.trim() || null,
      purchase_date: f.purchase_date || undefined,
      stock_status: f.stock_status,
      assigned_battery: f.assigned_battery.trim() || undefined,
      purchase_invoice_number: f.purchase_invoice_number.trim() || null,
      payment_status: f.payment_status || "success",
    };
    try {
      if (editingUnitId) {
        await updateVehicleUnit(editingUnitId, payload);
        showToast("Stock unit updated successfully! ✓");
      } else {
        await createVehicleUnit(payload);
        showToast("New stock unit added successfully! ✓");
      }
      resetStockUnitForm();
      setIsAddStockOpen(false);
      loadVehicles();
    } catch (err: any) {
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message || "Failed to save.";
      showToast(`Failed to save: ${errMsg}`, "error");
    }
  };
  const handleDeleteStockUnit = async (unit: any) => {
    if (!unit.id) return;
    const ident = unit.vin_number || unit.motor_number || unit.chassis_number || `#${unit.id}`;
    if (!window.confirm(`Delete stock unit ${ident}? This cannot be undone.`)) return;
    try {
      await deleteVehicleUnit(unit.id);
      showToast("Stock unit removed.");
      loadVehicles();
    } catch { showToast("Failed to delete stock unit.", "error"); }
  };

  // --- Add / Edit Lead + Kanban drag-drop ---
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "", assigned_executive: "" as string | number | null };
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const openAddLead = () => {
    setEditingLeadId(null);
    setNewLead({ ...emptyLead });
    setIsAddLeadOpen(true);
  };
  const openEditLead = (lead: any) => {
    setEditingLeadId(lead.id);
    setNewLead({
      customer_name: lead.customer_name || "",
      contact_number: lead.contact_number || "",
      interested_vehicle: String(lead.interested_vehicle || ""),
      lead_source: lead.lead_source || "walk_in",
      status: lead.status || "new_lead",
      notes: lead.notes || "",
      follow_up_date: lead.follow_up_date || "",
      assigned_executive: lead.assigned_executive || "",
    });
    setIsAddLeadOpen(true);
  };
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.customer_name.trim() || !newLead.contact_number.trim() || !newLead.interested_vehicle) return;
    const cleanPhone = newLead.contact_number.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Contact number must contain exactly 10 digits.", "error");
      return;
    }
    const payload = {
      customer_name: newLead.customer_name.trim(),
      contact_number: newLead.contact_number.trim(),
      interested_vehicle: parseInt(newLead.interested_vehicle),
      lead_source: newLead.lead_source,
      status: newLead.status,
      notes: newLead.notes.trim() || undefined,
      follow_up_date: newLead.follow_up_date || undefined,
      assigned_executive: newLead.assigned_executive ? parseInt(String(newLead.assigned_executive)) : null,
    };
    try {
      if (editingLeadId) {
        await updateLead(editingLeadId, payload);
        showToast("Lead updated.");
      } else {
        await createLead(payload);
        showToast("Lead added to pipeline.");
      }
      setNewLead({ ...emptyLead });
      setEditingLeadId(null);
      setIsAddLeadOpen(false);
      loadLeads();
    } catch { showToast("Failed to save lead.", "error"); }
  };

  // Move a lead to a new pipeline stage (drag-drop). Optimistic UI + API persist.
  const moveLeadToStage = async (leadId: number, newStatus: string) => {
    const lead = leadsList.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    const prevStatus = lead.status;
    setLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await updateLead(leadId, { status: newStatus });
      showToast(`Lead moved to ${newStatus.replace("_", " ")}.`);
    } catch {
      setLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: prevStatus } : l)));
      showToast("Failed to move lead.", "error");
    }
  };

  // --- Record Booking ---
  const [newBooking, setNewBooking] = useState({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const openEditBooking = (bk: any) => {
    setEditingBookingId(bk.id);
    setNewBooking({
      customer_name: bk.customer_name || "",
      contact_number: bk.contact_number || "",
      vehicle_model: String(bk.vehicle_model || ""),
      advance_amount: String(bk.advance_amount || ""),
      expiry_date: bk.expiry_date || "",
    });
    setIsAddBookingOpen(true);
  };
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customer_name.trim() || !newBooking.vehicle_model || !newBooking.advance_amount || !newBooking.expiry_date) return;
    if (newBooking.contact_number.trim()) {
      const cleanPhone = newBooking.contact_number.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        showToast("Contact number must contain exactly 10 digits.", "error");
        return;
      }
    }
    try {
      if (editingBookingId) {
        await updateBooking(editingBookingId, {
          customer_name: newBooking.customer_name.trim(),
          contact_number: newBooking.contact_number.trim(),
          vehicle_model: parseInt(newBooking.vehicle_model),
          advance_amount: parseFloat(newBooking.advance_amount),
          expiry_date: newBooking.expiry_date,
        });
        showToast("Booking updated.");
      } else {
        await createBooking({
          booking_id: `BK-${Date.now().toString().slice(-6)}`,
          customer_name: newBooking.customer_name.trim(),
          contact_number: newBooking.contact_number.trim(),
          vehicle_model: parseInt(newBooking.vehicle_model),
          advance_amount: parseFloat(newBooking.advance_amount),
          expiry_date: newBooking.expiry_date,
          status: "confirmed"
        });
        showToast("Booking recorded.");
      }
      setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
      setEditingBookingId(null);
      setIsAddBookingOpen(false);
      loadBookings();
    } catch { showToast("Failed to save booking.", "error"); }
  };
  const handleCancelBooking = async (bk: any) => {
    try {
      await updateBooking(bk.id, { status: "cancelled" });
      showToast("Booking cancelled.");
      loadBookings();
    } catch { showToast("Failed to cancel booking.", "error"); }
  };

  // --- Log / Edit Battery ---
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const emptyBattery = { serial_number: "", battery_code: "", capacity: "", purchase_date: "", location: "", supplier: "", warranty_years: "3", status: "available" };
  const [newBattery, setNewBattery] = useState({ ...emptyBattery });
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);

  const openEditBattery = (batt: any) => {
    setEditingBatteryId(batt.id);
    setNewBattery({
      serial_number: batt.serial || "",
      battery_code: batt.batteryCode || "",
      capacity: batt.capacity || "",
      purchase_date: batt.purDate || "",
      location: batt.locationId ? String(batt.locationId) : "",
      supplier: batt.supplier && batt.supplier !== "Tesla Tech Pack" ? batt.supplier : "",
      warranty_years: String(batt.warrantyYearsRaw || 3),
      status: batt.rawStatus || "available",
    });
    setIsAddBatteryOpen(true);
  };

  const handleCreateBattery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBattery.serial_number.trim() || !newBattery.capacity.trim() || !newBattery.purchase_date || !newBattery.location) return;
    try {
      const payload = {
        serial_number: newBattery.serial_number.trim(),
        battery_code: newBattery.battery_code.trim() || undefined,
        capacity: newBattery.capacity.trim(),
        purchase_date: newBattery.purchase_date,
        location: parseInt(newBattery.location),
        supplier: newBattery.supplier.trim() || "Unknown",
        warranty_years: parseInt(newBattery.warranty_years) || 3,
        status: newBattery.status,
      };
      if (editingBatteryId) {
        await updateBattery(editingBatteryId, payload);
        showToast("Battery updated.");
      } else {
        await createBattery(payload);
        showToast("Battery logged to stock registry.");
      }
      setNewBattery({ ...emptyBattery });
      setEditingBatteryId(null);
      setIsAddBatteryOpen(false);
      loadBatteries();
    } catch { showToast("Failed to save battery.", "error"); }
  };

  const handleDeleteBattery = async (batt: any) => {
    if (!batt.id) return;
    if (!window.confirm(`Delete battery ${batt.serial}? This cannot be undone.`)) return;
    try {
      await deleteBattery(batt.id);
      showToast("Battery removed from registry.");
      loadBatteries();
    } catch { showToast("Failed to delete battery.", "error"); }
  };

  // --- Battery history detail ---
  const [historyBattery, setHistoryBattery] = useState<any | null>(null);

  // --- Settings ---
  const [settings, setSettings] = useState({ name: "KVR Motors Group", gst: "18% SGST/CGST split" });
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kvr_settings");
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);
  const handleSaveSettings = () => {
    try { localStorage.setItem("kvr_settings", JSON.stringify(settings)); showToast("Settings saved."); }
    catch { showToast("Failed to save settings.", "error"); }
  };
  const handleResetSettings = () => {
    setSettings({ name: "KVR Motors Group", gst: "18% SGST/CGST split" });
    showToast("Settings reset to defaults.");
  };

  // --- Report CSV export ---
  const [reportModule, setReportModule] = useState("Sales Ledger Summary");
  const downloadReport = () => {
    let rows: string[][] = [];
    if (reportModule === "Inventory In-Out Movements") {
      rows = [["VIN", "Model", "Color", "Branch", "Status"], ...vehicleUnitsList.map(u => [u.vin_number, u.model_name, u.color, u.branch_name || "", u.stock_status])];
    } else if (reportModule === "Lead Conversion Pipeline") {
      rows = [["Lead ID", "Customer", "Contact", "Vehicle", "Status"], ...leadsList.map(l => [`LD-${l.id}`, l.customer_name, l.contact_number, l.interested_vehicle_name || "", l.status])];
    } else if (reportModule === "Battery Stock Allocations") {
      rows = [["Serial", "Capacity", "Acquired", "Status", "Location"], ...batteriesStock.map(b => [b.serial, b.capacity, b.purDate, b.status, b.location])];
    } else if (reportModule === "Executive Sales Commission") {
      const execData: Record<string, { count: number; total: number }> = {};
      salesInvoices.forEach(s => {
        const exec = s.executive_name || "Unassigned";
        if (!execData[exec]) execData[exec] = { count: 0, total: 0 };
        execData[exec].count += 1;
        execData[exec].total += parseFloat(s.sale_price || 0);
      });
      rows = [
        ["Executive Name", "Total Sales Count", "Total Revenue", "Estimated Commission"],
        ...Object.entries(execData).map(([exec, data]) => [
          exec,
          String(data.count),
          String(data.total),
          String(data.count * 2000)
        ])
      ];
    } else {
      rows = [["Invoice", "Customer", "Model", "Sale Price", "Date"], ...salesInvoices.map(s => [s.invoice_number, s.customer_name, s.model_name, s.sale_price, s.sale_date])];
    }
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportModule.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report exported as CSV.");
  };

  const printReport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    if (reportModule === "Inventory In-Out Movements") {
      headers = ["VIN", "Model", "Color", "Branch", "Status"];
      rows = vehicleUnitsList.map(u => [u.vin_number, u.model_name, u.color, u.branch_name || "", u.stock_status]);
    } else if (reportModule === "Lead Conversion Pipeline") {
      headers = ["Lead ID", "Customer", "Contact", "Vehicle", "Status"];
      rows = leadsList.map(l => [`LD-${l.id}`, l.customer_name, l.contact_number, l.interested_vehicle_name || "", l.status]);
    } else if (reportModule === "Battery Stock Allocations") {
      headers = ["Serial", "Capacity", "Acquired", "Status", "Location"];
      rows = batteriesStock.map(b => [b.serial, b.capacity, b.purDate, b.status, b.location]);
    } else if (reportModule === "Executive Sales Commission") {
      headers = ["Executive Name", "Total Sales Count", "Total Revenue", "Estimated Commission"];
      const execData: Record<string, { count: number; total: number }> = {};
      salesInvoices.forEach(s => {
        const exec = s.executive_name || "Unassigned";
        if (!execData[exec]) execData[exec] = { count: 0, total: 0 };
        execData[exec].count += 1;
        execData[exec].total += parseFloat(s.sale_price || 0);
      });
      rows = Object.entries(execData).map(([exec, data]) => [
        exec,
        `${data.count} units`,
        `₹ ${data.total.toLocaleString("en-IN")}`,
        `₹ ${(data.count * 2000).toLocaleString("en-IN")}`
      ]);
    } else {
      headers = ["Invoice", "Customer", "Model", "Sale Price", "Date"];
      rows = salesInvoices.map(s => [s.invoice_number, s.customer_name, s.model_name, `₹ ${parseFloat(s.sale_price || 0).toLocaleString("en-IN")}`, s.sale_date]);
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocker prevented printing. Please allow pop-ups for this site.", "error");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>${reportModule}</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 20mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #334155;
              margin: 0;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 15px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header h1 {
              font-size: 20px;
              margin: 0 0 5px 0;
              color: #0f172a;
            }
            .header .meta {
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              text-align: right;
            }
            .brand-title {
              text-align: left;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 15px;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              color: #475569;
              font-weight: 700;
              text-align: left;
              padding: 8px 10px;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #edf2f7;
              color: #334155;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              font-size: 9px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand-title">
              <h1>KVR MOTORS GROUP</h1>
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">Enterprise ERP System</div>
            </div>
            <div class="meta">
              <span>Report: ${reportModule}</span><br/>
              <span>Generated: ${new Date().toLocaleString("en-IN")}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell ?? "—"}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            KVR Motors Group Confidential Report Document. All rights reserved.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Helper to check if a date string falls within a selected range
  const isWithinDateRange = React.useCallback((dateString: string, range: string) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString);
    itemDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (range === getDefaultRangeString()) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "Today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "Last 7 Days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "This Month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "Last Month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "This Quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59);
      return itemDate >= start && itemDate <= end;
    }

    if (range === "This Year") {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return itemDate >= start && itemDate <= end;
    }

    return true;
  }, []);

  // DYNAMIC COMPUTATIONS & MEMOIZED AGGREGATES
  const filteredVehicleUnits = React.useMemo(() => {
    return vehicleUnitsList.filter((unit) => {
      if (selectedBranch === "All Branches") return true;
      return (
        unit.branch_name &&
        (unit.branch_name.toLowerCase().includes(selectedBranch.toLowerCase()) ||
          selectedBranch.toLowerCase().includes(unit.branch_name.toLowerCase()))
      );
    });
  }, [vehicleUnitsList, selectedBranch]);

  const filteredSalesInvoices = React.useMemo(() => {
    return salesInvoices.filter((inv) => {
      let matchesBranch = true;
      if (selectedBranch !== "All Branches") {
        matchesBranch = inv.branch_name && (
          inv.branch_name.toLowerCase().includes(selectedBranch.toLowerCase()) ||
          selectedBranch.toLowerCase().includes(inv.branch_name.toLowerCase())
        );
      }
      const matchesDate = isWithinDateRange(inv.sale_date || inv.created_at, selectedRange);
      return matchesBranch && matchesDate;
    });
  }, [salesInvoices, selectedBranch, selectedRange, isWithinDateRange]);

  const filteredLedgerEntries = React.useMemo(() => {
    return ledgerEntries.filter((entry) => {
      let matchesBranch = true;
      if (selectedBranch !== "All Branches") {
        matchesBranch = entry.branch_name && (
          entry.branch_name.toLowerCase().includes(selectedBranch.toLowerCase()) ||
          selectedBranch.toLowerCase().includes(entry.branch_name.toLowerCase())
        );
      }
      const matchesDate = isWithinDateRange(entry.created_at, selectedRange);
      return matchesBranch && matchesDate;
    });
  }, [ledgerEntries, selectedBranch, selectedRange, isWithinDateRange]);

  const filteredLeadsList = React.useMemo(() => {
    return leadsList.filter((lead) => {
      let matchesBranch = true;
      if (selectedBranch !== "All Branches") {
        matchesBranch = lead.branch && (
          lead.branch.toLowerCase().includes(selectedBranch.toLowerCase()) ||
          selectedBranch.toLowerCase().includes(lead.branch.toLowerCase())
        );
      }
      const matchesDate = isWithinDateRange(lead.created_at, selectedRange);
      return matchesBranch && matchesDate;
    });
  }, [leadsList, selectedBranch, selectedRange, isWithinDateRange]);

  const filteredAdvanceBookings = React.useMemo(() => {
    return advanceBookings.filter((booking) => {
      let matchesBranch = true;
      if (selectedBranch !== "All Branches") {
        if (!booking.vin_number) {
          matchesBranch = false;
        } else {
          const unit = vehicleUnitsList.find((u) => u.vin_number === booking.vin_number);
          matchesBranch = unit && unit.branch_name && (
            unit.branch_name.toLowerCase().includes(selectedBranch.toLowerCase()) ||
            selectedBranch.toLowerCase().includes(unit.branch_name.toLowerCase())
          );
        }
      }
      const matchesDate = isWithinDateRange(booking.booking_date, selectedRange);
      return matchesBranch && matchesDate;
    });
  }, [advanceBookings, vehicleUnitsList, selectedBranch, selectedRange, isWithinDateRange]);

  const filteredPurchaseOrders = React.useMemo(() => {
    return purchaseOrders.filter((po) => {
      return isWithinDateRange(po.order_date, selectedRange);
    });
  }, [purchaseOrders, selectedRange, isWithinDateRange]);


  const salesOverviewData = React.useMemo(() => {
    const now = new Date();
    const currentPeriodStart = new Date();
    
    let daysCount = 30;

    if (salesTimeFilter === "week") {
      daysCount = 7;
    } else if (salesTimeFilter === "month") {
      daysCount = 30;
    } else if (salesTimeFilter === "six_months") {
      daysCount = 180;
    }

    currentPeriodStart.setDate(now.getDate() - daysCount);

    if (filteredSalesInvoices.length === 0) {
      return [];
    }

    const dataPoints = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0,0,0,0);
      
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const prevD = new Date(d);
      prevD.setDate(prevD.getDate() - daysCount);

      let thisCount = 0;
      let prevCount = 0;

      filteredSalesInvoices.forEach(inv => {
        const invDate = new Date(inv.sale_date || inv.created_at);
        invDate.setHours(0,0,0,0);

        if (invDate.getTime() === d.getTime()) {
          thisCount++;
        } else if (invDate.getTime() === prevD.getTime()) {
          prevCount++;
        }
      });

      dataPoints.push({
        name: label,
        ThisPeriod: thisCount,
        PrevPeriod: prevCount
      });
    }
    return dataPoints;
  }, [filteredSalesInvoices, salesTimeFilter]);

  const stockStatusData = React.useMemo(() => {
    const available = filteredVehicleUnits.filter(u => u.stock_status === "available").length;
    const booked = filteredVehicleUnits.filter(u => u.stock_status === "booked").length;
    const reserved = filteredVehicleUnits.filter(u => u.stock_status === "reserved").length;
    const sold = filteredVehicleUnits.filter(u => u.stock_status === "sold").length;
    
    if (available + booked + reserved + sold === 0) {
      return [];
    }
    return [
      { name: "Available", value: available, color: "#2563eb" },
      { name: "Booked", value: booked, color: "#10b981" },
      { name: "In Transit / Reserved", value: reserved, color: "#f59e0b" },
      { name: "Sold", value: sold, color: "#64748b" }
    ];
  }, [filteredVehicleUnits]);

  const enquiryCount = filteredLeadsList.filter(l => l.status === "enquiry").length;
  const leadCount = filteredLeadsList.filter(l => l.status === "new_lead" || l.status === "contacted" || l.status === "follow_up").length;
  const negoCount = filteredLeadsList.filter(l => l.status === "negotiation").length;
  const wonCount = filteredLeadsList.filter(l => l.status === "won").length;

  const leadsFunnelData = [
    { name: "Enquiries", count: enquiryCount, color: "#3b82f6" },
    { name: "Leads", count: leadCount, color: "#6366f1" },
    { name: "Negotiation", count: negoCount, color: "#f59e0b" },
    { name: "Won", count: wonCount, color: "#10b981" },
  ];

  const recentActivities = React.useMemo(() => {
    const list: any[] = [];
    filteredSalesInvoices.forEach((inv) => {
      list.push({
        id: `sales-${inv.id}`,
        action: "Sale Invoice Created",
        ref: inv.invoice_number,
        location: inv.branch_name || "Visakhapatnam Showroom",
        user: inv.executive_name || "Anil Kumar",
        time: "Just now"
      });
    });
    purchaseOrders.forEach((po) => {
      list.push({
        id: `po-${po.id}`,
        action: `PO ${po.status.toUpperCase()}`,
        ref: po.po_number,
        location: "Visakhapatnam Showroom",
        user: "Ravi Varma",
        time: po.order_date
      });
    });
    if (list.length === 0) {
      return [];
    }
    return list.slice(0, 4);
  }, [filteredSalesInvoices, purchaseOrders]);

  const topSellingModels = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSalesInvoices.forEach((inv) => {
      const model = inv.model_name || "Kinetic Green E-Luna";
      counts[model] = (counts[model] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    if (sorted.length === 0) {
      return [];
    }
    return sorted.slice(0, 5);
  }, [filteredSalesInvoices]);

  const netCashflow = React.useMemo(() => {
    return filteredLedgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0);
  }, [filteredLedgerEntries]);

  const totalSalesValue = React.useMemo(() => {
    return filteredSalesInvoices.reduce((acc, curr) => acc + parseFloat(curr.sale_price || 0), 0);
  }, [filteredSalesInvoices]);


  // Showrooms / locations filtered by the branch chosen in the stock-unit form
  const branchShowrooms = React.useMemo(() => {
    return showroomsList.filter((s) => String(s.branch) === stockUnitForm.branch);
  }, [showroomsList, stockUnitForm.branch]);

  const branchLocations = React.useMemo(() => {
    return locationsList.filter((l) => String(l.branch) === stockUnitForm.branch);
  }, [locationsList, stockUnitForm.branch]);

  // Dynamically extract battery capacities from database batteriesStock
  const uniqueBatteryCapacities = React.useMemo(() => {
    const capacities = Array.from(new Set(batteriesStock.map((b) => b.capacity).filter(Boolean)));
    // Merge standard fallbacks to ensure options exist if database has few
    const defaults = ["Graphene", "Li-24", "Li-30", "Li-40"];
    const merged = Array.from(new Set([...capacities, ...defaults]));
    return merged;
  }, [batteriesStock]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
      <DashboardSidebar role="owner" activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab.startsWith("mela_") && (
        <MelaSubSidebar role="owner" activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar 
          role="owner" 
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} 
          activeBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          activeRange={selectedRange}
          onRangeChange={setSelectedRange}
          branchesList={branchesList}
        />
        <DashboardSmoothScroll className={`p-4 pb-28 lg:pb-6 ${
          activeTab.startsWith("mela_") 
            ? "pt-0 md:pt-4 flex flex-col space-y-4 bg-[#FAFDFB]" 
            : activeTab === "dashboard" 
              ? "flex flex-col space-y-4 bg-[#FAFDFB]" 
              : "space-y-6"
        }`}>
          {/* Mobile Mela Sub-Navigation Tab Bar */}
          {activeTab.startsWith("mela_") && (
            <div className="flex md:hidden overflow-x-auto gap-1.5 py-1.5 border-b border-slate-100 scrollbar-none shrink-0 bg-white -mx-4 px-4 sticky top-0 z-30 shadow-sm">
              {[
                { id: "mela_dashboard", label: "Overview", icon: LayoutDashboard },
                { id: "mela_inventory", label: "Stock", icon: Boxes },
                { id: "mela_checkout", label: "Checkout", icon: CreditCard },
                { id: "mela_orders", label: "Orders", icon: ListOrdered },
                { id: "mela_reports", label: "Leaderboard", icon: BarChart2 },
                { id: "mela_settings", label: "Settings", icon: Settings },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const TIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateTo(tab.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-normal transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#04a700] to-emerald-600 text-white shadow-md shadow-emerald-500/10 font-bold"
                        : "bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 font-normal"
                    }`}
                  >
                    <TIcon className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "mela_dashboard" && (() => {
            const lowVehicles = melaVehiclesList?.filter(v => v.remaining_quantity <= 2);
            const lowBatteries = melaBatteriesList?.filter(b => b.remaining_quantity <= 2);
            const hasLowStock = (lowVehicles?.length > 0) || (lowBatteries?.length > 0);
            return hasLowStock ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-left">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-800">Critical Low Stock Campaign Warning</h4>
                  <p className="text-[11px] text-rose-650 font-semibold leading-relaxed">
                    Some campaign resources have depleted to low or empty stocks (limit &le; 2 units):
                  </p>
                  <ul className="list-disc pl-4 text-[10px] text-rose-600 font-bold space-y-0.5">
                    {lowVehicles?.map(v => (
                      <li key={v.id}>
                        Vehicle: {v.model_name} ({v.color}) &mdash; {v.remaining_quantity} left {v.restock_date ? `(Restock expected: ${v.restock_date})` : "(No restock scheduled)"}
                      </li>
                    ))}
                    {lowBatteries?.map(b => (
                      <li key={b.id}>
                        Battery: {b.battery_name} &mdash; {b.remaining_quantity} left {b.restock_date ? `(Restock expected: ${b.restock_date})` : "(No restock scheduled)"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null;
          })()}

          {/* MELA TABS FOR OWNER */}
          {activeTab === "mela_dashboard" && (
            <div className="space-y-6 text-left">
              {/* Premium Glassmorphic Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#071f11] to-slate-900 border border-emerald-950 p-4 sm:p-8 shadow-xl">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {melaIsActiveSetting ? (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Campaign Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          Campaign Inactive
                        </span>
                      )}
                      {melaStartDateSetting && melaEndDateSetting ? (
                        <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                          📅 Campaign Period: {new Date(melaStartDateSetting).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {new Date(melaEndDateSetting).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          Date Range: {selectedRange}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-2xl font-semibold text-white tracking-tight leading-none whitespace-nowrap">
                      {melaNameSetting || "Mela Campaign Overview"}
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-400 max-w-xl">
                      Monitor real-time campaign sales, approve pending reservations, and manage team quotas.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => navigateTo("mela_checkout")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] sm:text-xs font-black py-2.5 px-4 rounded-full transition-all duration-200 shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                    >
                      Collect Cash Checkout
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("mela_inventory")}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-bold py-2.5 px-4 rounded-full transition-all duration-200 border border-slate-700 cursor-pointer w-full sm:w-auto text-center"
                    >
                      Manage Inventory
                    </button>
                  </div>
                </div>
              </div>

              {/* Styled Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Total Mela Sales",
                    value: `₹ ${(melaReports?.summary?.total_sales_revenue || 0).toLocaleString("en-IN")}`,
                    desc: "Accumulated checkout revenue",
                    tint: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
                    icon: DollarSign
                  },
                  {
                    title: "Delivered Vehicles",
                    value: `${melaReports?.summary?.completed_bookings || 0} Units`,
                    desc: "Finalized checkouts & handovers",
                    tint: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-650",
                    icon: CheckCircle2
                  },
                  {
                    title: "Pending Bookings",
                    value: `${melaReports?.summary?.unconfirmed_bookings || 0} Bookings`,
                    desc: "Awaiting cash collection",
                    tint: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600",
                    icon: AlertTriangle
                  },
                  {
                    title: "Today's Revenue",
                    value: `₹ ${(melaReports?.summary?.daily_sales_revenue || 0).toLocaleString("en-IN")}`,
                    desc: `${melaReports?.summary?.daily_completed_count || 0} deliveries completed today`,
                    tint: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600",
                    icon: TrendingUp
                  }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div 
                      key={idx} 
                      className={`bg-gradient-to-br ${card.tint} border p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left flex flex-col justify-between h-28 sm:h-32`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="mt-1 sm:mt-2 min-w-0">
                        <div className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none truncate">{card.value}</div>
                        <div className="text-[9px] font-bold text-slate-400 mt-1 sm:mt-1.5 truncate">{card.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Campaign Stocks Added by Owner */}
              <div className="space-y-6">
                
                {/* Active Vehicles Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Active Mela Vehicles Stock
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {melaVehiclesList.map((inv) => {
                      const pct = inv.initial_quantity > 0 ? Math.round((inv.remaining_quantity / inv.initial_quantity) * 100) : 0;
                      return (
                        <div 
                          key={inv.id} 
                          className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-extrabold text-slate-800 leading-none truncate">{inv.model_name}</h4>
                                <span className="text-[9px] font-black text-[#04a700] uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                                  {inv.brand_name || "Vehicle"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                <span className="text-[9px] font-bold bg-slate-50 border border-slate-100 text-slate-650 px-1.5 py-0.5 rounded capitalize">
                                  🎨 {inv.color}
                                </span>
                                {inv.restock_date && (
                                  <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    📅 {inv.restock_date}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase shrink-0 ${
                              inv.remaining_quantity === 0 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {inv.remaining_quantity === 0 ? "Sold Out" : `${inv.remaining_quantity} Available`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Mela Price</span>
                              <span className="text-base font-extrabold text-emerald-600 font-mono">
                                ₹ {parseFloat(inv.price).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Stock</span>
                              <span className="text-xs font-black text-slate-700 font-mono">
                                {inv.remaining_quantity} / {inv.initial_quantity} Units
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-550 ${
                                pct === 0 ? "bg-rose-500" : pct <= 30 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {melaVehiclesList.length === 0 && (
                      <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                        <div className="text-slate-400 font-bold text-xs">No active campaign vehicles registered.</div>
                        <p className="text-[10px] text-slate-405 mt-1">Go to the Campaign Stock tab to register new vehicle stocks for this campaign.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Batteries Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Active Mela Batteries Stock
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {melaBatteriesList.map((inv) => {
                      const pct = inv.initial_quantity > 0 ? Math.round((inv.remaining_quantity / inv.initial_quantity) * 100) : 0;
                      return (
                        <div 
                          key={inv.id} 
                          className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-extrabold text-slate-800 leading-none truncate">{inv.battery_name}</h4>
                                <span className="text-[9px] font-black text-blue-650 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                  Battery
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {inv.restock_date && (
                                  <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    📅 {inv.restock_date}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase shrink-0 ${
                              inv.remaining_quantity === 0 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {inv.remaining_quantity === 0 ? "Sold Out" : `${inv.remaining_quantity} Available`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Mela Price</span>
                              <span className="text-base font-extrabold text-blue-600 font-mono">
                                ₹ {parseFloat(inv.price).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Stock</span>
                              <span className="text-xs font-black text-slate-700 font-mono">
                                {inv.remaining_quantity} / {inv.initial_quantity} Units
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                            <div 
                              className={`h-full rounded-full transition-all duration-550 ${
                                pct === 0 ? "bg-rose-500" : pct <= 30 ? "bg-amber-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {melaBatteriesList.length === 0 && (
                      <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                        <div className="text-slate-400 font-bold text-xs">No active campaign batteries registered.</div>
                        <p className="text-[10px] text-slate-405 mt-1">Go to the Campaign Stock tab to register new battery stocks for this campaign.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Recent Campaign Orders Section */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                      Recent Campaign Bookings
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Latest reservations, delivery statuses, and collection details.
                    </p>
                  </div>
                  <button
                    onClick={() => navigateTo("mela_orders")}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-3 px-3">Booking ID</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Model</th>
                        <th className="py-3 px-3">Specs</th>
                        <th className="py-3 px-3">Mela Price</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {melaBookingsList.slice(0, 5).map((b) => {
                        const statusColors: Record<string, string> = {
                          completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                          unconfirmed: "bg-amber-50 text-amber-700 border border-amber-100",
                          cancelled: "bg-rose-50 text-rose-700 border border-rose-100"
                        };
                        const statusColor = statusColors[b.status] || "bg-slate-50 text-slate-700 border border-slate-100";
                        const paymentLabels: Record<string, string> = {
                          cash: "Cash",
                          upi: "UPI",
                          card: "Card",
                          bajaj_finance: "Bajaj Finance"
                        };
                        const paymentLbl = paymentLabels[b.payment_type || ""] || (b.payment_type ? b.payment_type.toUpperCase() : "Cash");

                        return (
                          <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-xs transition-colors">
                            <td className="py-3 px-3 font-black text-emerald-700 font-mono">{b.booking_id}</td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              <div>{b.customer_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{b.customer_phone}</div>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800">{b.vehicle_model_name || b.model_name || "Custom"}</td>
                            <td className="py-3 px-3 text-slate-500 font-medium">{b.vehicle_color || b.color} / {b.battery_name || b.battery_type}</td>
                            <td className="py-3 px-3 font-bold font-mono text-emerald-600">₹ {parseFloat(b.price).toLocaleString("en-IN")}</td>
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-slate-600 text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded">{paymentLbl}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                {b.payment_proof && (
                                  <a
                                    href={b.payment_proof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Proof</span>
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    const msg =
                                      `*KVR MOTORS - MELA ORDER RECEIPT*\n` +
                                      `=============================\n` +
                                      `*Booking ID:* ${b.booking_id}\n` +
                                      `*Customer:* ${b.customer_name}\n` +
                                      `*Phone:* ${b.customer_phone}\n` +
                                      `-----------------------------\n` +
                                      `*Vehicle:* ${b.vehicle_model_name || b.model_name || ""}\n` +
                                      `*Color:* ${b.color || b.vehicle_color || ""}\n` +
                                      `*Battery:* ${b.battery_type || b.battery_name || ""}\n` +
                                      `-----------------------------\n` +
                                      `*Total Paid:* ₹${parseFloat(b.price).toLocaleString("en-IN")}\n` +
                                      `*Payment Mode:* ${(b.payment_type || "CASH").toUpperCase()}\n` +
                                      `*Status:* Confirmed\n` +
                                      (b.status === "delivered" && b.invoice_pdf ? `-----------------------------\n*Invoice:* ${getInvoicePdfUrl(b.invoice_pdf)}\n` : "") +
                                      `=============================\n` +
                                      `Thank you for purchasing with KVR Motors!`;
                                    window.open(`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(b.customer_phone)}&text=${encodeURIComponent(msg)}`, "_blank");
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors cursor-pointer"
                                  title="Share to WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePrintReceipt(b)}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                  title="Print Receipt"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {melaBookingsList.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">No bookings registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>



              {/* Campaign Groups / Teams Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Active Groups List */}
                <div className="lg:col-span-2">
                  <Table
                    title="Active Campaign Groups / Teams"
                    headers={["Group / Team Name", "Team Leader", "Members", "Bookings Progress", "Revenue Generated"]}
                  >
                    {melaGroups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold text-xs">
                          No campaign groups registered yet.
                        </td>
                      </tr>
                    ) : (
                      melaGroups.map((grp) => {
                        const pct = Math.min(100, Math.round((grp.bookings / grp.target) * 100));
                        return (
                          <tr key={grp.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                            <td className="py-3.5 px-5 font-bold text-slate-800">{grp.name}</td>
                            <td className="py-3.5 px-5 font-semibold text-slate-700">{grp.lead}</td>
                            <td className="py-3.5 px-5 text-slate-500 max-w-[200px] truncate" title={grp.members}>{grp.members}</td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{grp.bookings} / {grp.target}</span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] text-emerald-600 font-bold">({pct}%)</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 font-bold font-mono text-slate-800">₹ {grp.revenue.toLocaleString("en-IN")}</td>
                          </tr>
                        );
                      })
                    )}
                  </Table>
                </div>

                {/* Add Team Panel */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 h-fit text-left">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Register Mela Sales Group</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Define team groups for this campaign to track collective performance.</p>
                  </div>
                  <form onSubmit={handleMelaAddGroupSubmit} className="space-y-3 text-xs font-semibold text-slate-655">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Visakhapatnam Challengers"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Team Leader</label>
                      <input
                        type="text"
                        placeholder="e.g. Anil Kumar"
                        value={newGroupLead}
                        onChange={(e) => setNewGroupLead(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Members (Comma Separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Suresh Babu, Rajesh Gowd"
                        value={newGroupMembers}
                        onChange={(e) => setNewGroupMembers(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Target Bookings</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={newGroupTarget}
                        onChange={(e) => setNewGroupTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-[#04a700]/25 transition-all text-center"
                    >
                      Create Campaign Group
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mela_inventory" && (
            <div className="space-y-6 text-left">
              {/* Secondary Sub-Tab Navigation Bar */}
              <div className="flex gap-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto whitespace-nowrap">
                {[
                  { id: "registry", label: "Stock Registry", icon: Boxes },
                  { id: "compatibility", label: "Battery Compatibility", icon: Zap },
                  { id: "operations", label: "Stock Operations", icon: RefreshCw },
                ].map((subTab) => {
                  const isActive = melaInvSubTab === subTab.id;
                  const SubIcon = subTab.icon;
                  return (
                    <button
                      key={subTab.id}
                      onClick={() => setMelaInvSubTab(subTab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-100 text-slate-800 border border-slate-200"
                          : "bg-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <SubIcon className="h-3.5 w-3.5" />
                      <span>{subTab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-tab 1: Registry */}
              {melaInvSubTab === "registry" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Tables for Active vehicles & batteries */}
                  <div className="xl:col-span-2 space-y-6">
                    <Table
                      title="Mela Campaign Active Vehicles"
                      headers={["Vehicle Model", "Color Variant", "Mela Price", "Initial Stock", "Remaining Stock", "Restock Date", "Actions"]}
                    >
                      {melaVehiclesList?.map((v) => {
                        const isEditing = editingMelaVehicleId === v.id;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editVehicleModelName}
                                  onChange={(e) => setEditVehicleModelName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold outline-none"
                                />
                              ) : (
                                <span className="font-semibold text-slate-800">{v.model_name}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editVehicleColor}
                                  onChange={(e) => setEditVehicleColor(e.target.value)}
                                  className="w-24 bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span className="text-slate-600 capitalize">{v.color}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editVehiclePrice}
                                  onChange={(e) => setEditVehiclePrice(e.target.value)}
                                  className="w-20 bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold outline-none"
                                />
                              ) : (
                                <span className="font-bold font-mono text-slate-800">₹ {parseFloat(v.price).toLocaleString("en-IN")}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editVehicleInitialQty}
                                  onChange={(e) => setEditVehicleInitialQty(e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span className="font-mono text-slate-550">{v.initial_quantity} Units</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editVehicleRemainingQty}
                                  onChange={(e) => setEditVehicleRemainingQty(e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span className={`font-mono font-black ${v.remaining_quantity === 0 ? "text-rose-600" : "text-slate-800"}`}>
                                  {v.remaining_quantity} Units
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-mono">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editVehicleRestockDate}
                                  onChange={(e) => setEditVehicleRestockDate(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span>{v.restock_date || "-"}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 whitespace-nowrap space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveVehicleEdit(v.id)}
                                    className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMelaVehicleId(null)}
                                    className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMelaVehicleId(v.id);
                                      setEditVehicleModelName(v.model_name || "");
                                      setEditVehicleColor(v.color || "");
                                      setEditVehiclePrice(String(v.price || ""));
                                      setEditVehicleInitialQty(String(v.initial_quantity || ""));
                                      setEditVehicleRemainingQty(String(v.remaining_quantity || ""));
                                      setEditVehicleRestockDate(v.restock_date || "");
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm("Delete campaign vehicle?")) {
                                        try {
                                          await api.delete(`/mela-vehicles/${v.id}/`);
                                          showToast("Campaign vehicle deleted.");
                                          loadMelaData();
                                        } catch {
                                          showToast("Failed to delete.", "error");
                                        }
                                      }
                                    }}
                                    className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {melaVehiclesList?.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">No vehicles registered yet.</td>
                        </tr>
                      )}
                    </Table>

                    <Table
                      title="Mela Campaign Active Batteries"
                      headers={["Battery Name", "Price", "Initial Stock", "Remaining Stock", "Restock Date", "Actions"]}
                    >
                      {melaBatteriesList?.map((b) => {
                        const isEditing = editingMelaBatteryId === b.id;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editBatteryName}
                                  onChange={(e) => setEditBatteryName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold outline-none"
                                />
                              ) : (
                                <span className="font-semibold text-slate-800">{b.battery_name}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editBatteryPrice}
                                  onChange={(e) => setEditBatteryPrice(e.target.value)}
                                  className="w-24 bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold outline-none"
                                />
                              ) : (
                                <span className="font-bold font-mono text-slate-800">₹ {parseFloat(b.price).toLocaleString("en-IN")}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editBatteryInitialQty}
                                  onChange={(e) => setEditBatteryInitialQty(e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span className="font-mono text-slate-550">{b.initial_quantity} Units</span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editBatteryRemainingQty}
                                  onChange={(e) => setEditBatteryRemainingQty(e.target.value)}
                                  className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span className={`font-mono font-black ${b.remaining_quantity === 0 ? "text-rose-600" : "text-slate-800"}`}>
                                  {b.remaining_quantity} Units
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-5 font-mono">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editBatteryRestockDate}
                                  onChange={(e) => setEditBatteryRestockDate(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded p-1 text-xs outline-none"
                                />
                              ) : (
                                <span>{b.restock_date || "-"}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 whitespace-nowrap space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveBatteryEdit(b.id)}
                                    className="text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMelaBatteryId(null)}
                                    className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMelaBatteryId(b.id);
                                      setEditBatteryName(b.battery_name || "");
                                      setEditBatteryPrice(String(b.price || ""));
                                      setEditBatteryInitialQty(String(b.initial_quantity || ""));
                                      setEditBatteryRemainingQty(String(b.remaining_quantity || ""));
                                      setEditBatteryRestockDate(b.restock_date || "");
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm("Delete campaign battery?")) {
                                        try {
                                          await api.delete(`/mela-batteries/${b.id}/`);
                                          showToast("Campaign battery deleted.");
                                          loadMelaData();
                                        } catch {
                                          showToast("Failed to delete.", "error");
                                        }
                                      }
                                    }}
                                    className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {melaBatteriesList?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">No batteries registered yet.</td>
                        </tr>
                      )}
                    </Table>
                  </div>

                  {/* Right Side: Registration pane with inner sub-tabs to switch vehicle/battery */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                          Register Campaign Stock
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Add new vehicles or batteries to the campaign registry.
                        </p>
                      </div>

                      {/* Mini Toggle */}
                      <div className="flex bg-slate-150/70 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setMelaRegAddType("vehicle")}
                          className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                            melaRegAddType === "vehicle"
                              ? "bg-white text-slate-800 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          + Vehicle
                        </button>
                        <button
                          type="button"
                          onClick={() => setMelaRegAddType("battery")}
                          className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                            melaRegAddType === "battery"
                              ? "bg-white text-slate-800 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          + Battery
                        </button>
                      </div>

                      {melaRegAddType === "vehicle" ? (
                        <div className="space-y-3 text-xs font-semibold text-slate-655">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Okinawa Praise, AMO X1"
                              value={melaInvModel || ""}
                              onChange={(e) => setMelaInvModel(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variant</label>
                            <input
                              type="text"
                              placeholder="e.g. Red, Black"
                              value={melaInvColor || ""}
                              onChange={(e) => setMelaInvColor(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Mela Price (INR)</label>
                              <input
                                type="number"
                                placeholder="Price"
                                value={melaInvPrice || ""}
                                onChange={(e) => setMelaInvPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Qty</label>
                              <input
                                type="number"
                                placeholder="Qty"
                                value={melaInvQty || ""}
                                onChange={(e) => setMelaInvQty(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!melaInvModel.trim() || !melaInvColor.trim() || !melaInvQty || !melaInvPrice) {
                                showToast("Please fill all vehicle fields.", "error");
                                return;
                              }
                              try {
                                await api.post("/mela-vehicles/", {
                                  model_name: melaInvModel.trim(),
                                  color: melaInvColor.trim(),
                                  price: parseFloat(melaInvPrice),
                                  initial_quantity: parseInt(melaInvQty),
                                  remaining_quantity: parseInt(melaInvQty),
                                  is_active: true
                                });
                                showToast("Vehicle registered successfully.");
                                setMelaInvModel("");
                                setMelaInvColor("");
                                setMelaInvPrice("");
                                setMelaInvQty("");
                                loadMelaData();
                              } catch (err: any) {
                                showToast(err.response?.data?.error || "Failed to register vehicle.", "error");
                              }
                            }}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer transition-all text-center"
                          >
                            Add Campaign Vehicle
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs font-semibold text-slate-655">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Name</label>
                            <input
                              type="text"
                              placeholder="e.g. 4 battery Graphene"
                              value={newBatteryName || ""}
                              onChange={(e) => setNewBatteryName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Mela Price (INR)</label>
                              <input
                                type="number"
                                placeholder="Price"
                                value={newBatteryPrice || ""}
                                onChange={(e) => setNewBatteryPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Qty</label>
                              <input
                                type="number"
                                placeholder="Qty"
                                value={newBatteryQty || ""}
                                onChange={(e) => setNewBatteryQty(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!newBatteryName.trim() || !newBatteryPrice || !newBatteryQty) {
                                showToast("Please fill all battery fields.", "error");
                                return;
                              }
                              try {
                                await api.post("/mela-batteries/", {
                                  battery_name: newBatteryName.trim(),
                                  price: parseFloat(newBatteryPrice),
                                  initial_quantity: parseInt(newBatteryQty),
                                  remaining_quantity: parseInt(newBatteryQty),
                                  is_active: true
                                });
                                showToast("Battery registered successfully.");
                                setNewBatteryName("");
                                setNewBatteryPrice("");
                                setNewBatteryQty("");
                                loadMelaData();
                              } catch (err: any) {
                                showToast(err.response?.data?.error || "Failed to register battery.", "error");
                              }
                            }}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer transition-all text-center"
                          >
                            Add Campaign Battery
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Compatibility */}
              {melaInvSubTab === "compatibility" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left: Compatibilities mapping list */}
                  <div className="xl:col-span-2">
                    <Table
                      title="Vehicle & Battery Compatibility Mapping"
                      headers={["Vehicle Stock (Model - Color)", "Compatible Battery Pack", "Actions"]}
                    >
                      {melaCompatibilitiesList?.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                          <td className="py-3 px-5 font-semibold text-slate-800">{c.vehicle_model_name} ({c.vehicle_color})</td>
                          <td className="py-3 px-5 text-slate-700 font-bold">{c.battery_name}</td>
                          <td className="py-3 px-5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm("Delete compatibility mapping?")) {
                                  try {
                                    await api.delete(`/mela-compatibilities/${c.id}/`);
                                    showToast("Compatibility mapping deleted.");
                                    loadMelaData();
                                  } catch {
                                    showToast("Failed to delete mapping.", "error");
                                  }
                                }
                              }}
                              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Unlink
                            </button>
                          </td>
                        </tr>
                      ))}
                      {melaCompatibilitiesList?.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">No compatibilities mapped yet.</td>
                        </tr>
                      )}
                    </Table>
                  </div>

                  {/* Right: Map Compatibility form */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                    <div>
                      <h3 className="text-sm font-bold text-slate-855">Set Compatibility</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Map a battery pack to a vehicle model.</p>
                    </div>
                    <div className="space-y-3 text-xs font-semibold text-slate-655">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Vehicle</label>
                        <select
                          id="compVehicleSelect"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                        >
                          <option value="">-- Choose Campaign Vehicle --</option>
                          {melaVehiclesList?.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.model_name} ({v.color})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Battery</label>
                        <select
                          id="compBatterySelect"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-bold"
                        >
                          <option value="">-- Choose Campaign Battery --</option>
                          {melaBatteriesList?.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.battery_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const vehicleVal = (document.getElementById("compVehicleSelect") as HTMLSelectElement)?.value;
                          const batteryVal = (document.getElementById("compBatterySelect") as HTMLSelectElement)?.value;
                          if (!vehicleVal || !batteryVal) {
                            showToast("Please select both vehicle and battery.", "error");
                            return;
                          }
                          try {
                            await api.post("/mela-compatibilities/", {
                              vehicle_stock: parseInt(vehicleVal),
                              battery_stock: parseInt(batteryVal)
                            });
                            showToast("Compatibility mapped successfully.");
                            loadMelaData();
                          } catch (err: any) {
                            showToast(err.response?.data?.error || "Failed mapping compatibility.", "error");
                          }
                        }}
                        className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold rounded-xl cursor-pointer transition-all text-center"
                      >
                        Map Compatibility
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Operations */}
              {melaInvSubTab === "operations" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left: Adjustment logs */}
                  <div className="xl:col-span-2">
                    <Table
                      title="Mela Campaign Stock Adjustment Logs"
                      headers={["Date & Time", "Campaign Item", "Type", "Adjusted Qty", "Reason / Notes"]}
                    >
                      {melaStockLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                          <td className="py-3 px-5 font-mono text-slate-500">{log.date || "N/A"}</td>
                          <td className="py-3 px-5 font-bold text-slate-800">
                            {log.model_name} ({log.color}) {log.battery_type ? ` - ${log.battery_type}` : ""}
                          </td>
                          <td className="py-3 px-5">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              log.type === "in"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                                : "bg-rose-50 text-rose-700 border border-rose-150"
                            }`}>
                              {log.type === "in" ? "Stock-In" : "Stock-Out"}
                            </span>
                          </td>
                          <td className="py-3 px-5 font-bold font-mono text-slate-800">
                            {log.type === "in" ? "+" : "-"}{log.quantity} Units
                          </td>
                          <td className="py-3 px-5 text-slate-600 font-semibold">{log.notes || "--"}</td>
                        </tr>
                      ))}
                    </Table>
                  </div>

                  {/* Right: Stock adjustment form */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-855">Stock Adjustment</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Manually add or subtract stock levels.</p>
                    </div>
                    <form onSubmit={handleMelaStockAdjustmentSubmit} className="space-y-3.5 text-xs font-semibold text-slate-655">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Vehicle</label>
                        <select
                          value={melaAdjItem}
                          onChange={(e) => setMelaAdjItem(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                          required
                        >
                          <option value="">-- Choose Campaign Item --</option>
                          {melaVehiclesList.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.model_name} ({item.color}) - Qty: {item.remaining_quantity}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="adjType"
                              value="in"
                              checked={melaAdjType === "in"}
                              onChange={() => setMelaAdjType("in")}
                              className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span>Stock-In (Add)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="adjType"
                              value="out"
                              checked={melaAdjType === "out"}
                              onChange={() => setMelaAdjType("out")}
                              className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                            />
                            <span>Stock-Out (Subtract)</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Quantity</label>
                        <input
                          type="number"
                          placeholder="Quantity to change"
                          value={melaAdjQty}
                          onChange={(e) => setMelaAdjQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Damage PDI writeoff"
                          value={melaAdjNotes}
                          onChange={(e) => setMelaAdjNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-md transition-all text-center"
                      >
                        Submit Stock Adjustment
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "mela_checkout" && (
            <div className="space-y-6 text-left max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                {!completedOrderDetails && (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Mela Campaign Booking Checkout</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Enter the Booking ID (MELA-XXXX) given by the customer to verify details and process payment checkout.</p>
                    </div>

                    <form onSubmit={handleMelaCheckoutSearch} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter Booking ID (e.g. MELA-1024)"
                        value={melaSearchQuery}
                        onChange={(e) => setMelaSearchQuery(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-850 font-bold font-mono outline-none focus:border-[#04a700]"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#04a700]/20 cursor-pointer shrink-0"
                      >
                        Search Booking
                      </button>
                    </form>

                    {melaCheckoutError && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4.5 w-4.5" />
                        <span>{melaCheckoutError}</span>
                      </div>
                    )}

                    {melaCheckoutLoading && (
                      <div className="py-6 flex justify-center items-center gap-2 text-xs font-bold text-slate-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Processing transaction details...</span>
                      </div>
                    )}

                    {melaFoundBooking && (
                      <div className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm bg-[#FAFDFB]">
                        <div className="bg-[#04a700]/10 border-b border-emerald-100 p-4 flex justify-between items-center">
                          <span className="text-xs font-black text-[#04a700] font-mono tracking-wider">{melaFoundBooking.booking_id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            melaFoundBooking.status === "completed"
                              ? "bg-emerald-100 text-emerald-855"
                              : "bg-amber-100 text-amber-855 animate-pulse"
                          }`}>
                            {melaFoundBooking.status_display}
                          </span>
                        </div>

                        <div className="p-5 space-y-4 text-xs font-semibold text-slate-600">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                              <div className="text-slate-800 font-extrabold mt-0.5">{melaFoundBooking.customer_name}</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Contact</label>
                              <div className="text-slate-800 font-mono mt-0.5">{melaFoundBooking.customer_phone}</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
                              <div className="text-slate-850 font-extrabold mt-0.5">{melaFoundBooking.vehicle_model_name || melaFoundBooking.model_name}</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Specs (Color / Battery)</label>
                              <div className="text-slate-800 font-extrabold capitalize mt-0.5">{melaFoundBooking.color || melaFoundBooking.vehicle_color} / {melaFoundBooking.battery_type || melaFoundBooking.battery_name}</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Rep</label>
                              <div className="text-slate-855 font-bold mt-0.5">{melaFoundBooking.executive_name || melaFoundBooking.sales_executive} (Serial #{melaFoundBooking.executive_serial_number})</div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Special Campaign Price</label>
                              <div className="text-emerald-700 font-black text-sm font-mono mt-0.5">₹ {parseFloat(melaFoundBooking.price).toLocaleString("en-IN")}</div>
                            </div>
                          </div>

                          {melaFoundBooking.status === "unconfirmed" && (
                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-2">Select Payment Method</label>
                                <select
                                  value={checkoutPaymentType}
                                  onChange={(e) => {
                                    setCheckoutPaymentType(e.target.value);
                                    setCheckoutPaymentProof(null);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-855 font-bold outline-none focus:border-[#04a700] transition-colors cursor-pointer"
                                >
                                  <option value="cash">Cash Payment</option>
                                  <option value="upi">UPI / Online Transfer</option>
                                  <option value="card">Debit / Credit Card</option>
                                  <option value="bajaj_finance">Bajaj Finance</option>
                                  <option value="split">Split Payment (Multiple Modes)</option>
                                </select>
                              </div>

                              {checkoutPaymentType === "split" && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                  <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block">Split Details (Target: ₹{parseFloat(melaFoundBooking.price).toLocaleString("en-IN")})</span>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-450 uppercase">Cash Amount</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={splitAmounts.cash}
                                        onChange={(e) => setSplitAmounts({ ...splitAmounts, cash: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#04a700]"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-450 uppercase">Card Amount</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={splitAmounts.card}
                                        onChange={(e) => setSplitAmounts({ ...splitAmounts, card: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#04a700]"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-450 uppercase">UPI Amount</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={splitAmounts.upi}
                                        onChange={(e) => setSplitAmounts({ ...splitAmounts, upi: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#04a700]"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-450 uppercase">Bajaj Finance</label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={splitAmounts.bajaj_finance}
                                        onChange={(e) => setSplitAmounts({ ...splitAmounts, bajaj_finance: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-[#04a700]"
                                      />
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-extrabold text-slate-500 pt-1 text-right">
                                    Total Entered: ₹{
                                      ((parseFloat(splitAmounts.cash || "0")) +
                                      (parseFloat(splitAmounts.card || "0")) +
                                      (parseFloat(splitAmounts.upi || "0")) +
                                      (parseFloat(splitAmounts.bajaj_finance || "0"))).toLocaleString("en-IN")
                                    }
                                  </div>
                                </div>
                              )}

                              {checkoutPaymentType !== "cash" && checkoutPaymentType !== "split" && (
                                <div className="space-y-2">
                                  <label className="block text-[10px] font-bold text-slate-450 uppercase">Upload Payment Screenshot / Proof</label>
                                  <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          setCheckoutPaymentProof(e.target.files[0]);
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      required
                                    />
                                    <div className="text-center space-y-1">
                                      <Upload className="mx-auto h-8 w-8 text-slate-450" />
                                      <div className="text-xs font-bold text-slate-700">
                                        {checkoutPaymentProof ? (
                                          <span className="text-[#04a700] font-black">{checkoutPaymentProof.name}</span>
                                        ) : (
                                          <span>Click to upload screenshot</span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400">JPEG, PNG up to 5MB</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleMelaCheckoutComplete(melaFoundBooking.id)}
                                className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md shadow-[#04a700]/25 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                              >
                                <DollarSign className="h-4.5 w-4.5" />
                                Complete Payment &amp; Finalize Order
                              </button>
                            </div>
                          )}

                          {(melaFoundBooking.status === "completed" || melaFoundBooking.status === "delivered") && (
                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <span>Order is {melaFoundBooking.status} and fully paid on {new Date(melaFoundBooking.completed_at).toLocaleString()}.</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <a
                                  href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(melaFoundBooking.customer_phone)}&text=${encodeURIComponent(
                                    `*KVR MOTORS - MELA ORDER RECEIPT*\n` +
                                    `=============================\n` +
                                    `*Booking ID:* ${melaFoundBooking.booking_id}\n` +
                                    `*Customer:* ${melaFoundBooking.customer_name}\n` +
                                    `*Phone:* ${melaFoundBooking.customer_phone}\n` +
                                    `-----------------------------\n` +
                                    `*Vehicle:* ${melaFoundBooking.vehicle_model_name || melaFoundBooking.model_name || ""}\n` +
                                    `*Color:* ${melaFoundBooking.color || melaFoundBooking.vehicle_color || ""}\n` +
                                    `*Battery:* ${melaFoundBooking.battery_type || melaFoundBooking.battery_name || ""}\n` +
                                    `-----------------------------\n` +
                                    `*Total Paid:* ₹${parseFloat(melaFoundBooking.price).toLocaleString("en-IN")}\n` +
                                    `*Payment Mode:* ${(melaFoundBooking.payment_type || "CASH").toUpperCase()}\n` +
                                    `*Status:* Confirmed\n` +
                                    (melaFoundBooking.status === "delivered" && melaFoundBooking.invoice_pdf ? `-----------------------------\n*Invoice:* ${getInvoicePdfUrl(melaFoundBooking.invoice_pdf)}\n` : "") +
                                    `=============================\n` +
                                    `Thank you for purchasing with KVR Motors!`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                                >
                                  <Share2 className="h-4 w-4" />
                                  Share on WhatsApp
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handlePrintReceipt(melaFoundBooking)}
                                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Printer className="h-4 w-4" />
                                  Print Receipt
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {completedOrderDetails && (
                  <div className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm bg-[#FAFDFB]">
                    <div className="bg-[#04a700]/10 border-b border-emerald-100 p-4 flex justify-between items-center">
                      <span className="text-xs font-black text-[#04a700] font-mono tracking-wider">{completedOrderDetails.booking_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-855">
                        {completedOrderDetails.status_display || "PAID & DELIVERED"}
                      </span>
                    </div>

                    <div className="p-5 space-y-4 text-xs font-semibold text-slate-600">
                      <div className="text-center pb-2">
                        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-black text-emerald-800">Checkout Completed Successfully!</h4>
                        <p className="text-[11px] text-slate-400">The vehicle booking transaction is now closed and logged.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                          <div className="text-slate-800 font-extrabold mt-0.5">{completedOrderDetails.customer_name}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Contact</label>
                          <div className="text-slate-805 font-mono mt-0.5">{completedOrderDetails.customer_phone}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
                          <div className="text-slate-855 font-extrabold mt-0.5">{completedOrderDetails.vehicle_model_name || completedOrderDetails.model_name}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Specs (Color / Battery)</label>
                          <div className="text-slate-800 font-extrabold capitalize mt-0.5">{completedOrderDetails.color || completedOrderDetails.vehicle_color} / {completedOrderDetails.battery_type || completedOrderDetails.battery_name}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</label>
                          <div className="text-emerald-700 font-black text-sm font-mono mt-0.5">₹ {parseFloat(completedOrderDetails.price).toLocaleString("en-IN")}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</label>
                          <div className="text-slate-805 font-extrabold uppercase mt-0.5">{completedOrderDetails.payment_type}</div>
                        </div>
                        {completedOrderDetails.payment_proof && (
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Proof Screenshot</label>
                            <div className="mt-1">
                              <a
                                href={completedOrderDetails.payment_proof}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
                              >
                                <FolderOpen className="h-4 w-4" />
                                View Uploaded Screenshot
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <a
                          href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(completedOrderDetails.customer_phone)}&text=${encodeURIComponent(
                            `*KVR MOTORS - MELA ORDER RECEIPT*\n` +
                            `=============================\n` +
                            `*Booking ID:* ${completedOrderDetails.booking_id}\n` +
                            `*Customer:* ${completedOrderDetails.customer_name}\n` +
                            `*Phone:* ${completedOrderDetails.customer_phone}\n` +
                            `-----------------------------\n` +
                            `*Vehicle:* ${completedOrderDetails.vehicle_model_name || completedOrderDetails.model_name || ""}\n` +
                            `*Color:* ${completedOrderDetails.color || completedOrderDetails.vehicle_color || ""}\n` +
                            `*Battery:* ${completedOrderDetails.battery_type || completedOrderDetails.battery_name || ""}\n` +
                            `-----------------------------\n` +
                            `*Total Paid:* ₹${parseFloat(completedOrderDetails.price).toLocaleString("en-IN")}\n` +
                            `*Payment Mode:* ${(completedOrderDetails.payment_type || "CASH").toUpperCase()}\n` +
                            `*Status:* Confirmed\n` +
                            (completedOrderDetails.status === "delivered" && completedOrderDetails.invoice_pdf ? `-----------------------------\n*Invoice:* ${getInvoicePdfUrl(completedOrderDetails.invoice_pdf)}\n` : "") +
                            `=============================\n` +
                            `Thank you for purchasing with KVR Motors!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Share2 className="h-4.5 w-4.5" />
                          Share on WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(completedOrderDetails)}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="h-4.5 w-4.5" />
                          Print 80mm Receipt
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCompletedOrderDetails(null);
                          setMelaFoundBooking(null);
                          setMelaSearchQuery("");
                        }}
                        className="w-full mt-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Checkout Another Booking
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "mela_orders" && (
            <div className="space-y-6 text-left">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Mela Order History</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">All campaign bookings with payment details and uploaded proofs.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
                    {melaBookingsList.length} Total Orders
                  </span>
                </div>

                {melaBookingsList.length === 0 ? (
                  <div className="py-16 text-center">
                    <ListOrdered className="mx-auto h-10 w-10 text-slate-250 mb-3" />
                    <p className="text-xs font-bold text-slate-400">No mela bookings found yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                          <th className="py-3 px-3">Booking ID</th>
                          <th className="py-3 px-3">Customer</th>
                          <th className="py-3 px-3">Vehicle</th>
                          <th className="py-3 px-3">Amount</th>
                          <th className="py-3 px-3">Payment</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {melaBookingsList.map((b: any) => {
                          const paymentLabels: Record<string, string> = {
                            cash: "Cash",
                            upi: "UPI",
                            card: "Card",
                            bajaj_finance: "Bajaj Finance"
                          };
                          const paymentLabel = paymentLabels[b.payment_type] || (b.payment_type ? b.payment_type.toUpperCase() : "Cash");
                          const statusColors: Record<string, string> = {
                            completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
                            delivered: "bg-indigo-50 text-indigo-700 border-indigo-100",
                            unconfirmed: "bg-amber-50 text-amber-700 border-amber-100",
                            cancelled: "bg-rose-50 text-rose-700 border-rose-100"
                          };
                          const statusBg = statusColors[b.status] || "bg-slate-50 text-slate-600 border-slate-100";
                          const proofUrl = b.payment_proof;

                          return (
                            <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-3 font-black text-[#04a700] font-mono tracking-wide">{b.booking_id}</td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <div>
                                    <div className="font-bold text-slate-800">{b.customer_name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{b.customer_phone}</div>
                                  </div>
                                  <button
                                    onClick={() => handleOpenEditCustomer(b)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                    title="Edit Customer"
                                  >
                                    <PenLine className="h-3 w-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-700">{b.vehicle_model_name || b.model_name || "—"}</div>
                                <div className="text-[10px] text-slate-400 capitalize">{b.color || b.vehicle_color || ""} / {b.battery_type || b.battery_name || ""}</div>
                              </td>
                              <td className="py-3.5 px-3 font-black text-slate-855 font-mono">₹{parseFloat(b.price).toLocaleString("en-IN")}</td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  {paymentLabel}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <select
                                  value={b.status}
                                  onChange={async (e) => {
                                    const nextStatus = e.target.value as any;
                                    if (nextStatus === b.status) return;
                                    try {
                                      await updateMelaBooking(b.id, { status: nextStatus });
                                      showToast(`Booking status updated to ${nextStatus}!`);
                                      loadMelaData();
                                    } catch (err: any) {
                                      showToast(err.response?.data?.error || "Failed to update status", "error");
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border cursor-pointer bg-white outline-none ${statusBg}`}
                                >
                                  <option value="unconfirmed">Unconfirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-3 text-slate-500 font-semibold">
                                {b.completed_at
                                  ? new Date(b.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                  : new Date(b.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  {proofUrl && (
                                    <a
                                      href={proofUrl.startsWith("http") ? proofUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "")}${proofUrl}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
                                      title="Preview Payment Proof"
                                    >
                                      <Eye className="h-3 w-3" />
                                      Preview
                                    </a>
                                  )}
                                  
                                  {(b.status === "completed" || b.status === "delivered") && (
                                    <>
                                      <a
                                        href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(b.customer_phone)}&text=${encodeURIComponent(
                                          `*KVR MOTORS - MELA ORDER RECEIPT*\n` +
                                          `=============================\n` +
                                          `*Booking ID:* ${b.booking_id}\n` +
                                          `*Customer:* ${b.customer_name}\n` +
                                          `*Phone:* ${b.customer_phone}\n` +
                                          `-----------------------------\n` +
                                          `*Vehicle:* ${b.vehicle_model_name || b.model_name || ""}\n` +
                                          `*Color:* ${b.color || b.vehicle_color || ""}\n` +
                                          `*Battery:* ${b.battery_type || b.battery_name || ""}\n` +
                                          `-----------------------------\n` +
                                          `*Total Paid:* ₹${parseFloat(b.price).toLocaleString("en-IN")}\n` +
                                          `*Payment Mode:* ${(b.payment_type || "CASH").toUpperCase()}\n` +
                                          `*Status:* Confirmed\n` +
                                          (b.status === "delivered" && b.invoice_pdf ? `-----------------------------\n*Invoice:* ${getInvoicePdfUrl(b.invoice_pdf)}\n` : "") +
                                          `=============================\n` +
                                          `Thank you for purchasing with KVR Motors!`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md"
                                        title="Share Receipt on WhatsApp"
                                      >
                                        <Share2 className="h-3 w-3" />
                                        WhatsApp
                                      </a>

                                      <button
                                        type="button"
                                        onClick={() => handlePrintReceipt(b)}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-800 hover:underline transition-colors bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-100"
                                        title="Print Receipt"
                                      >
                                        <Printer className="h-3 w-3" />
                                        Print
                                      </button>

                                      {b.status === "delivered" && b.invoice_pdf && (
                                        <a
                                          href={getInvoicePdfUrl(b.invoice_pdf)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md"
                                          title="View Tax Invoice"
                                        >
                                          <FileText className="h-3 w-3" />
                                          Invoice
                                        </a>
                                      )}
                                    </>
                                  )}
                                  
                                  {!proofUrl && b.status !== "completed" && b.status !== "delivered" && (
                                    <span className="text-[10px] text-slate-300 font-semibold">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "mela_reports" && (
            <div className="space-y-6 text-left">
              {/* Leaderboard & performance reports */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Statistics panel */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                  <h3 className="text-sm font-black text-slate-800">Mela Campaign Performance</h3>
                  <p className="text-[11px] font-semibold text-slate-400 -mt-2">Summary of billing metrics</p>
                  
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500 font-bold">Total Sales Billing</span>
                      <span className="font-mono font-black text-slate-850">₹ {(melaReports?.summary?.total_sales_revenue || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500 font-bold">Today's Sales Billing</span>
                      <span className="font-mono font-black text-emerald-700">₹ {(melaReports?.summary?.daily_sales_revenue || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500 font-bold">Total Deliveries</span>
                      <span className="font-bold text-slate-850">{melaReports?.summary?.completed_bookings || 0} Vehicles</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500 font-bold">Active Reservations</span>
                      <span className="font-bold text-amber-700">{melaReports?.summary?.unconfirmed_bookings || 0} Bookings</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500 font-bold">Cancelled Bookings</span>
                      <span className="font-bold text-rose-600">{melaReports?.summary?.cancelled_bookings || 0} Bookings</span>
                    </div>
                  </div>
                </div>

                {/* Sales Representative Leaderboard */}
                <div className="lg:col-span-2">
                  <Table
                    title="Sales Executive Leaderboard"
                    headers={["Rank", "Executive Name", "Total Bookings", "Delivered Units", "Total Mela Revenue"]}
                  >
                    {melaReports?.executive_performance?.map((ex: any, idx: number) => (
                      <tr key={ex.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                        <td className="py-3.5 px-5 font-extrabold text-slate-450">
                          {idx === 0 ? "🏆 1st" : idx === 1 ? "🥈 2nd" : idx === 2 ? "🥉 3rd" : `${idx + 1}th`}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{ex.full_name}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-500">{ex.total_bookings} Bookings</td>
                        <td className="py-3.5 px-5 font-black text-[#04a700]">{ex.completed_bookings} Delivered</td>
                        <td className="py-3.5 px-5 font-bold font-mono text-slate-855">₹ {ex.total_revenue.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    {(!melaReports?.executive_performance || melaReports.executive_performance.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                          No sales data registered for executives.
                        </td>
                      </tr>
                    )}
                  </Table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mela_settings" && (
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Mela Settings & Configuration</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Configure the dates, name, and venue details for your active Mela Campaign.</p>
                </div>
                
                <form onSubmit={handleSaveMelaSettings} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mela Campaign Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Grand Monsoon Mela"
                      value={melaNameSetting}
                      onChange={(e) => setMelaNameSetting(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold outline-none focus:border-[#04a700]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Start Date</label>
                      <input
                        type="date"
                        value={melaStartDateSetting}
                        onChange={(e) => setMelaStartDateSetting(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-750 font-mono outline-none focus:border-[#04a700]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">End Date</label>
                      <input
                        type="date"
                        value={melaEndDateSetting}
                        onChange={(e) => setMelaEndDateSetting(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-750 font-mono outline-none focus:border-[#04a700]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mela Location / Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Showroom Ground"
                      value={melaLocationSetting}
                      onChange={(e) => setMelaLocationSetting(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-semibold outline-none focus:border-[#04a700]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="space-y-0.5">
                      <label className="text-xs font-extrabold text-slate-700 block">Campaign Active Status</label>
                      <span className="text-[10px] font-semibold text-slate-400 block">Toggle to enable/disable Mela Booking for Sales Executives</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={melaIsActiveSetting} 
                        onChange={(e) => setMelaIsActiveSetting(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={melaLoading}
                      className="bg-gradient-to-r from-[#04a700] to-emerald-600 hover:from-[#038a00] hover:to-emerald-700 text-white font-extrabold text-xs py-3 px-6 rounded-full shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {melaLoading ? "Saving..." : "Save Mela Configuration"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Premium Welcome Hero — light, integrated with the dashboard surface */}
              <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                {/* soft brand accent wash on the right */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#04a700]/[0.07] to-transparent" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#04a700]/10 blur-3xl" />
                {/* green left rail */}
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#04a700] to-emerald-600" />

                <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#04a700]/30 bg-[#04a700]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#04a700]">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#04a700] opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#04a700]" />
                        </span>
                        Enterprise Live
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500">
                        <CalendarDays className="h-3 w-3" /> {selectedRange}
                      </span>
                    </div>
                    <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      Welcome back, Ravi Varma
                      <Sparkles className="h-5 w-5 text-[#04a700]" />
                    </h2>
                    <p className="mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                      Here&apos;s a live snapshot of your multi-branch automotive enterprise across Visakhapatnam, Srikakulam &amp; Kakinada.
                    </p>
                  </div>

                  {/* Net Cashflow stat */}
                  <div className="flex w-full shrink-0 items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-5 py-4 lg:w-auto lg:min-w-[240px]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#04a700]/10 text-[#04a700]">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Net Cashflow (MTD)</span>
                      <div className={`font-mono text-xl font-black tracking-tight sm:text-2xl ${netCashflow >= 0 ? "text-slate-900" : "text-rose-500"}`}>
                        ₹ {netCashflow.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-[#04a700]">
                        <TrendingUp className="h-3 w-3" /> Auto-journaled from ledger
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Create PO", icon: ShoppingBag, onClick: () => setIsAddPOOpen(true) },
                  { label: "Add Lead", icon: Compass, onClick: () => setIsAddLeadOpen(true) },
                  { label: "Record Booking", icon: CalendarDays, onClick: () => setIsAddBookingOpen(true) },
                  { label: "Add Branch", icon: Building, onClick: () => { setEditingBranchId(null); setBranchName(""); setBranchAddress(""); setBranchPhone(""); setIsAddBranchOpen(true); } },
                  { label: "Generate Report", icon: FileSpreadsheet, onClick: () => navigateTo("reports") },
                ].map((qa, i) => {
                  const QAIcon = qa.icon;
                  return (
                    <button
                      key={i}
                      onClick={qa.onClick}
                      className="group flex items-center gap-2.5 bg-white border border-emerald-100/70 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-[#04a700]/40 hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                    >
                      <span className="h-9 w-9 shrink-0 rounded-full bg-[#04a700]/10 border border-[#04a700]/20 flex items-center justify-center text-[#04a700] group-hover:bg-[#04a700] group-hover:text-white transition-colors">
                        <QAIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-extrabold text-slate-700 truncate">{qa.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid Metric Cards (clickable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard 
                  title="Total Units Sold" 
                  value={salesInvoicesLoading ? "..." : `${filteredSalesInvoices.length} Units`} 
                  trend="↑ 12.8%" 
                  trendType="success" 
                  description="Total vehicles invoiced" 
                  icon={Boxes} 
                  color="emerald" 
                  onClick={() => navigateTo("sales")}
                />
                <DashboardCard 
                  title="Total Purchases" 
                  value={purchaseOrdersLoading ? "..." : "₹ " + filteredPurchaseOrders.filter(po => po.status === "approved" || po.status === "received").reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0).toLocaleString('en-IN')} 
                  trend="↓ 6.2%" 
                  trendType="danger" 
                  description="Approved PO total" 
                  icon={ShoppingBag} 
                  color="rose" 
                  onClick={() => navigateTo("purchases")}
                />
                <DashboardCard 
                  title="Vehicles in Stock" 
                  value={vehiclesLoading ? "..." : `${filteredVehicleUnits.filter(u => u.stock_status === "available").length} Units`} 
                  trend="↑ 8.4%" 
                  trendType="success" 
                  description="Available units" 
                  icon={Car} 
                  color="blue" 
                  onClick={() => navigateTo("vehicles")}
                />
                <DashboardCard 
                  title="Total Leads" 
                  value={`${leadsLoading ? "..." : filteredLeadsList.length} Leads`} 
                  trend="↑ 15.3%" 
                  trendType="success" 
                  description="Inflow conversion pace" 
                  icon={Compass} 
                  color="amber" 
                  onClick={() => navigateTo("leads")}
                />
                <DashboardCard 
                  title="Receivables" 
                  value={advanceBookingsLoading ? "..." : "₹ " + filteredAdvanceBookings.filter(b => b.status === "confirmed").reduce((acc, curr) => acc + parseFloat(curr.advance_amount || 0), 0).toLocaleString('en-IN')} 
                  trend="↓ 3.7%" 
                  trendType="danger" 
                  description="Deposit pipeline" 
                  icon={Briefcase} 
                  color="purple" 
                  onClick={() => navigateTo("bookings")}
                />
              </div>
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[460px]">
                
                {/* Sales Overview Chart (Line) */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm shadow-emerald-950/2 flex flex-col justify-between h-full min-h-[440px] hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Sales Performance (Units Sold)</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Real-time day-wise vehicle sales volume analysis</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Period Filter Buttons */}
                      <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        {[
                          { key: "week", label: "Week" },
                          { key: "month", label: "Month" },
                          { key: "six_months", label: "6 Months" }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => setSalesTimeFilter(btn.key as any)}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-md cursor-pointer transition-all ${
                              salesTimeFilter === btn.key 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#04a700]" /> Units Sold</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[320px] w-full relative">
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={salesOverviewData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="glowBrandGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#04a700" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#04a700" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} interval="preserveStartEnd" minTickGap={35} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val} Unit${val !== 1 ? 's' : ''}`} tick={{ fill: "#94a3b8", fontSize: 9 }} allowDecimals={false} />
                        <Tooltip formatter={(value: any) => [`${value} Unit${value !== 1 ? 's' : ''}`, "Units Sold"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                        <Area type="monotone" dataKey="ThisPeriod" stroke="#04a700" strokeWidth={2.5} fillOpacity={1} fill="url(#glowBrandGreen)" name="Units Sold" activeDot={{ r: 5, strokeWidth: 0, fill: '#04a700' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Stock by Status (Donut) */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm shadow-emerald-950/2 flex flex-col h-full min-h-[440px] justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Vehicle Stock Status</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Physical vehicle distribution loaded from database</p>
                  </div>
                  <div className="h-[220px] w-full flex flex-col justify-center items-center relative">
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 font-mono">{vehiclesLoading ? "..." : filteredVehicleUnits.length}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total units</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={stockStatusData}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stockStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Units`, "Stock"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    {stockStatusData.map((item, idx) => {
                      const totalSum = stockStatusData.reduce((s, c) => s + c.value, 0) || 1;
                      return (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name} ({((item.value / totalSum) * 100).toFixed(0)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Lower Section Charts & Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:min-h-80">
                
                {/* Leads Funnel representation */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm shadow-emerald-950/2 flex flex-col h-full justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Leads Conversion Funnel</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Pipeline sales stage conversion ratios this month</p>
                    </div>
                    <button onClick={() => navigateTo("leads")} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#04a700] hover:gap-1.5 transition-all cursor-pointer shrink-0">
                      View <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1 min-h-0 space-y-3">
                    {leadsFunnelData.map((stage, index) => {
                      const maxVal = leadsList.length || 1;
                      const percentage = (stage.count / maxVal) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-650">
                            <span className="font-extrabold uppercase tracking-wide text-slate-500">{stage.name}</span>
                            <span className="font-mono">{stage.count} Units ({((stage.count / maxVal) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${percentage}%`, backgroundColor: stage.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm shadow-emerald-950/2 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Recent Enterprise Activities</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Live operational logs across all showrooms</p>
                    </div>
                    <button onClick={() => navigateTo("ledger")} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#04a700] hover:gap-1.5 transition-all cursor-pointer shrink-0">
                      View <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto slim-scrollbar smooth-scroll max-h-[220px]">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 truncate">{act.action}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">{act.ref} • {act.location}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-bold shrink-0">
                          <span className="text-slate-600 font-extrabold">{act.user}</span>
                          <span className="text-slate-400 font-mono mt-0.5">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Selling Models */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm shadow-emerald-950/2 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Top Performing EV Models</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ranked by dynamic monthly delivery volume</p>
                    </div>
                    <button onClick={() => navigateTo("sales")} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#04a700] hover:gap-1.5 transition-all cursor-pointer shrink-0">
                      View <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col justify-between divide-y divide-slate-100">
                    {topSellingModels.map((model, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-2 text-xs text-left">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-5.5 w-5.5 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-black text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-700 truncate">{model.name}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-bold shrink-0">
                          <span className="text-slate-800 font-mono font-black">{model.count} Units</span>
                          <span className="text-[9px] text-[#04a700] font-mono mt-0.5">₹ {((model.count * 85000)).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {/* TAB 2: BRANCH & SHOWROOMS */}
          {activeTab === "branches" && (
            <div className="space-y-6">
              <Table 
                title="Branch Locations Registry" 
                headers={["Showroom Name", "Location City", "Manager Assigned", "Status", "Actions"]}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                actions={
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddBranchOpen(true)}
                      className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Branch
                    </button>
                  </div>
                }
              >
                {branchesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading branch outlets...</span>
                      </div>
                    </td>
                  </tr>
                ) : branchesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <EmptyState 
                        title="No Showrooms Found" 
                        description="Register a new showroom or branch outlet using the Add Branch button above." 
                      />
                    </td>
                  </tr>
                ) : (() => {
                  const filteredBranches = branchesList.filter((branch) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      branch.name.toLowerCase().includes(q) ||
                      (branch.address || "").toLowerCase().includes(q) ||
                      (branch.manager_name || "").toLowerCase().includes(q)
                    );
                  });

                  if (filteredBranches.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <EmptyState 
                            title="No Matching Showrooms" 
                            description="Try adjusting your search query to find the desired branch." 
                          />
                        </td>
                      </tr>
                    );
                  }

                  return filteredBranches.map((branch, idx) => {
                    return (
                      <tr key={branch.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{branch.name}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.address || "—"}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.manager_name || "—"}</td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            branch.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditBranch(branch)} 
                              title="Edit Showroom"
                              className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleToggleBranch(branch)} 
                              title="Toggle Active Status"
                              className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-800 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBranch(branch.id)} 
                              title="Delete Showroom"
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </Table>
            </div>
          )}
          {/* TAB 3: VEHICLE MANAGEMENT */}
          {activeTab === "vehicles" && (
            <div className="space-y-6 text-left">
              {/* Header block with modern feel */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-805 tracking-tight">Vehicle Master Models Catalog</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Configure models, battery specifications, colors, and base retail pricing.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsManageBrandsOpen(true)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer transition-all border border-slate-205"
                  >
                    Manage Brands
                  </button>
                  <button 
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="flex items-center gap-1.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Model
                  </button>
                </div>
              </div>

              {/* Dynamic Search & Brand Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                <input 
                  type="text" 
                  placeholder="Search catalog models..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                />
                <select
                  value={activeFilterTab}
                  onChange={(e) => setActiveFilterTab(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700] min-w-[160px] cursor-pointer"
                >
                  <option value="All">All Brands</option>
                  {vehicleBrandsList.map((brand) => (
                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>

              {vehiclesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-205 border-t-[#04a700]" />
                  <span className="text-xs font-semibold text-slate-405">Loading model catalog...</span>
                </div>
              ) : (() => {
                const filteredModels = vehicleModelsList.filter((model) => {
                  const matchesSearch = !searchQuery.trim() || 
                    model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (model.brand_name || "").toLowerCase().includes(searchQuery.toLowerCase());
                  
                  const matchesBrand = activeFilterTab === "All" || model.brand_name === activeFilterTab;
                  return matchesSearch && matchesBrand;
                });

                if (filteredModels.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                      <EmptyState title="No Matching Models" description="Try adjusting your filter or search query." />
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredModels.map((model, idx) => {
                      const isKinetic = (model.brand_name || "").toLowerCase().includes("kinetic");
                      const isDynamo = (model.brand_name || "").toLowerCase().includes("dynamo");
                      const headerGradient = isKinetic 
                        ? "from-emerald-900 to-[#0b1329]" 
                        : isDynamo 
                          ? "from-blue-950 to-[#0b1329]" 
                          : "from-indigo-950 to-[#0b1329]";
                      const priceBadgeBg = isKinetic 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                        : isDynamo 
                          ? "bg-blue-50 text-blue-800 border-blue-100" 
                          : "bg-indigo-50 text-indigo-800 border-indigo-100";

                      return (
                        <div key={model.id || idx} className="bg-white border border-slate-100 rounded-3xl shadow-md hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                          {/* Premium Header with Brand Specific Gradients */}
                          <div className={`bg-gradient-to-r ${headerGradient} border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-white/10">
                                <Car className="h-4 w-4 text-white shrink-0" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-white px-2.5 py-1 rounded-md">
                                {model.brand_name || "Kinetic"}
                              </span>
                            </div>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                              model.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-700/50 text-slate-300 border-slate-600/30"
                            }`}>
                              {model.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {/* Card Content containing ONLY actual fields */}
                          <div className="p-6 space-y-4 text-left flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-lg font-black text-slate-850 tracking-tight leading-tight group-hover:text-[#04a700] transition-colors">{model.model_name}</h4>
                              <div className="flex items-center justify-between mt-3.5">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Base Showroom Price</span>
                                <span className={`px-3 py-1 rounded-xl text-sm font-black font-mono border ${priceBadgeBg}`}>
                                  ₹ {parseFloat(model.base_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-2.5 pt-3 border-t border-slate-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  <Battery className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Battery Spec</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700">{model.battery_compatibility || "—"}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-450" />
                                  <span>Color Options</span>
                                </div>
                                <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]" title={Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "—"}>
                                  {Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 flex justify-end gap-4">
                            <button
                              onClick={() => openEditModel(model)}
                              className="text-[11px] font-black text-[#04a700] hover:text-[#038a00] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="text-[11px] font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              Delete Catalog
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
          {/* TAB 4: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-6 text-left">
              {/* Summary metric strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Units Registered", value: vehiclesLoading ? "..." : String(filteredVehicleUnits.length), icon: ArrowDownLeft, tint: "emerald" },
                  { label: "Units Sold (MTD)", value: salesInvoicesLoading ? "..." : String(filteredSalesInvoices.length), icon: ArrowUpRight, tint: "blue" },
                  { label: "Units Reserved / Transit", value: vehiclesLoading ? "..." : String(filteredVehicleUnits.filter(u => u.stock_status === "reserved" || u.stock_status === "in_transit").length), icon: Truck, tint: "amber" },
                  { label: "Pending POs", value: purchaseOrdersLoading ? "..." : String(purchaseOrders.filter(po => po.status === "pending").length), icon: AlertTriangle, tint: "rose" },
                ].map((s, i) => {
                  const SIcon = s.icon;
                  const tintMap: Record<string, string> = {
                    emerald: "bg-[#04a700]/10 text-[#04a700]",
                    blue: "bg-blue-50 text-blue-605",
                    amber: "bg-amber-50 text-amber-605",
                    rose: "bg-rose-50 text-rose-605",
                  };
                  return (
                    <div key={i} className="bg-white border border-emerald-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                      <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${tintMap[s.tint]}`}>
                        <SIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-lg font-extrabold text-slate-800 leading-none">{s.value}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1 truncate">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stock In + Out as responsive card lists (no horizontal scroll) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Stock In */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                    <span className="h-7 w-7 rounded-lg bg-[#04a700]/10 text-[#04a700] flex items-center justify-center"><ArrowDownLeft className="h-4 w-4" /></span>
                    <h3 className="text-sm font-bold text-slate-800">Stock Intake Log (Stock-In)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                      No stock intake logs recorded.
                    </div>
                  </div>
                </div>

                {/* Stock Out */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                    <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></span>
                    <h3 className="text-sm font-bold text-slate-800">Stock Outflow Log (Stock-Out)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                      No stock outflow logs recorded.
                    </div>
                  </div>
                </div>
              </div>

              {/* Inter-branch transfers as dynamic table */}
              <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm overflow-hidden">
                <Table title="Inter-Location / Inter-Branch Stock Transfers" headers={["Transfer Ref", "Source Location", "Target Showroom", "Vehicle Details", "Quantity", "Requested By", "Priority Level", "Approval Status"]}>
                  {transfersLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading stock transfers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-xs text-slate-400 font-semibold">
                        No inter-branch transfers recorded.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((tr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{tr.ref}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{tr.from}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{tr.to}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{tr.model}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{tr.qty}</td>
                        <td className="py-3.5 px-5 text-slate-650 font-bold">{tr.requestedBy}</td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            tr.priority === "Urgent" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            tr.priority === "High" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {tr.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            tr.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            tr.status === "Rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>

              {/* Physical Inventory Stock Units (VIN Registry - Moved from Vehicles tab to Stock Management tab to keep operations grouped logically and fully functional) */}
              <Table 
                title="Physical Inventory Stock Units (VIN Registry)" 
                headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Branch Outlet", "Location Area", "Battery Assigned", "Days in Stock", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={openAddStockUnit}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/15"
                  >
                    <Plus className="h-4 w-4" /> Add Stock Unit
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-[#04a700]" />
                        <span>Loading physical units registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredVehicleUnits.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center">
                      <EmptyState 
                        title="No Stock Units Found" 
                        description={vehicleUnitsList.length === 0 ? "No physical stock units registered." : "No stock units registered for the selected branch outlet."} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredVehicleUnits.map((unit, idx) => (
                    <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.motor_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.chassis_number || "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{unit.color}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.branch_name || "Visakhapatnam"}</td>
                      <td className="py-3.5 px-5 text-slate-450 font-medium">{unit.location_name || "Warehouse"}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.assigned_battery || "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-650">
                        {(() => {
                          if (!unit.purchase_date) return "—";
                          const pDate = new Date(unit.purchase_date);
                          const diffTime = Math.abs(new Date().getTime() - pDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return `${diffDays} days`;
                        })()}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          unit.stock_status === "available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          unit.stock_status === "booked" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          unit.stock_status === "reserved" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-slate-100 text-slate-505 border border-slate-205"
                        }`}>
                          {unit.stock_status.charAt(0).toUpperCase() + unit.stock_status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button onClick={() => openEditStockUnit(unit)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteStockUnit(unit)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 5: PURCHASE MANAGEMENT */}
          {activeTab === "purchases" && (
            <div className="space-y-6">
              
              <Table 
                title="Purchase Orders Register" 
                headers={["PO Reference", "Supplier Entity", "Items Specified", "Quantity Ordered", "Total Price", "Date Sent", "Payment Terms", "Est Delivery", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddPOOpen(true)}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Purchase Order
                  </button>
                }
              >
                {purchaseOrdersLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading purchase orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <EmptyState 
                        title="No Purchase Orders Registered" 
                        description="Stock purchase orders will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po, idx) => (
                    <tr key={po.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">{po.po_number}</td>
                      <td className="py-3.5 px-5 text-slate-700 font-semibold">{po.supplier_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{po.vehicle_model_name}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-700">{po.quantity} units</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(po.total_price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{po.order_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{po.payment_terms}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{po.estimated_delivery || "N/A"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          po.status === "approved" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          po.status === "received" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          po.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {po.status_display || po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {po.status === "pending" && (
                          <>
                            <button 
                              onClick={() => handleApprovePO(po.id)}
                              className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handlePOStatus(po.id, "cancelled")}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {po.status === "approved" && (
                          <button 
                            onClick={() => handlePOStatus(po.id, "received")}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                          >
                            Mark Received
                          </button>
                        )}
                        {(po.status === "received" || po.status === "cancelled") && (
                          <span className="text-[10px] font-bold text-slate-300">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 6: SALES MANAGEMENT */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              
              <Table title="Invoiced Sales Records" headers={["Invoice Number", "Customer Name", "Contact", "Vehicle Model", "Battery Serial", "Sale Price", "Invoice Date", "Payment Mode", "Insurance Partner", "Sales Person", "Delivery Status", "Actions"]}>
                {salesInvoicesLoading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading invoiced sales records...</span>
                      </div>
                    </td>
                  </tr>
                ) : salesInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center">
                      <EmptyState 
                        title="No Sales Invoices Registered" 
                        description="Finalized customer sales invoices will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  salesInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                      <td className="py-3.5 px-5 text-slate-800 font-bold">{inv.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono">{inv.customer_contact}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{inv.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono">{inv.battery_serial || "N/A"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(inv.sale_price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{inv.sale_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{inv.payment_mode}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{inv.insurance_partner || "N/A"}</td>
                      <td className="py-3.5 px-5 text-slate-650 font-semibold">{inv.executive_name || "Unassigned"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {inv.delivery_status_display || inv.delivery_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {inv.delivery_status === "processing" && (
                          <button onClick={() => handleSalesDelivery(inv.id, "ready")} className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer">Mark Ready</button>
                        )}
                        {inv.delivery_status === "ready" && (
                          <button onClick={() => handleSalesDelivery(inv.id, "delivered")} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold cursor-pointer">Mark Delivered</button>
                        )}
                        {inv.delivery_status === "delivered" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePrintSalesInvoice(inv)}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-650 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                            >
                              <Printer className="h-3 w-3" /> Print Invoice
                            </button>
                            <a
                              href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(inv.customer_contact)}&text=${encodeURIComponent(
                                `*KVR MOTORS - SALES INVOICE RECEIPT*\n` +
                                `=============================\n` +
                                `*Invoice Ref:* ${inv.invoice_number || ('INV-' + inv.id)}\n` +
                                `*Customer:* ${inv.customer_name}\n` +
                                `*Phone:* ${inv.customer_contact}\n` +
                                `-----------------------------\n` +
                                `*Vehicle:* ${inv.model_name || ""}\n` +
                                `*Color:* ${inv.vehicle_color || "N/A"}\n` +
                                `*Battery:* ${inv.battery_type || inv.battery_serial || "N/A"}\n` +
                                `-----------------------------\n` +
                                `*Total Paid:* ₹${parseFloat(inv.sale_price).toLocaleString("en-IN")}\n` +
                                `*Payment Mode:* ${inv.payment_mode || "CASH"}\n` +
                                `*Status:* Delivered\n` +
                                `=============================\n` +
                                `Thank you for purchasing with KVR Motors!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-650 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3 w-3" /> WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold italic">Awaiting Delivery</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {activeTab === "leads" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Leads Conversion Pipeline</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Drag a card across stages to update its status — changes sync instantly to the database.</p>
                </div>
                <button 
                  onClick={openAddLead}
                  className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add Lead
                </button>
              </div>
              {leadsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#04a700]" />
                  <span className="text-xs font-semibold text-slate-500">Loading leads conversion pipeline...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  {[
                    { key: "enquiry", label: "Enquiry", statuses: ["enquiry"], accent: "#64748b", soft: "bg-slate-50", bar: "bg-slate-400" },
                    { key: "new_lead", label: "New Lead", statuses: ["new_lead", "contacted", "follow_up"], accent: "#2563eb", soft: "bg-blue-50/60", bar: "bg-blue-500" },
                    { key: "negotiation", label: "Negotiation", statuses: ["negotiation"], accent: "#ea580c", soft: "bg-amber-50/60", bar: "bg-amber-500" },
                    { key: "won", label: "Won", statuses: ["won"], accent: "#04a700", soft: "bg-emerald-50/60", bar: "bg-[#04a700]" },
                    { key: "lost", label: "Lost", statuses: ["lost"], accent: "#dc2626", soft: "bg-rose-50/50", bar: "bg-rose-500" },
                  ].map((col) => {
                    const filteredLeads = leadsList.filter((lead) => col.statuses.includes(lead.status));
                    const isDragTarget = dragOverStage === col.key;
                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => { e.preventDefault(); setDragOverStage(col.key); }}
                        onDragLeave={() => setDragOverStage((s) => (s === col.key ? null : s))}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedLeadId != null) moveLeadToStage(draggedLeadId, col.key);
                          setDraggedLeadId(null);
                          setDragOverStage(null);
                        }}
                        className={`rounded-2xl border flex flex-col min-h-[420px] transition-all duration-200 ${col.soft} ${isDragTarget ? "border-[#04a700] ring-2 ring-[#04a700]/30 scale-[1.01]" : "border-slate-200/70"}`}
                      >
                        <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/70">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.accent }} />
                            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">{col.label}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-extrabold">{filteredLeads.length}</span>
                        </div>

                        <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto slim-scrollbar max-h-[60vh]">
                          {filteredLeads.length === 0 ? (
                            <div className={`text-[10px] font-semibold text-slate-400 text-center py-10 rounded-xl border-2 border-dashed ${isDragTarget ? "border-[#04a700]/40 text-[#04a700]" : "border-slate-200/70"}`}>
                              {isDragTarget ? "Drop here" : "No leads in stage"}
                            </div>
                          ) : (
                            filteredLeads.map((lead) => (
                              <div
                                key={lead.id}
                                draggable
                                onDragStart={() => setDraggedLeadId(lead.id)}
                                onDragEnd={() => { setDraggedLeadId(null); setDragOverStage(null); }}
                                onClick={() => openEditLead(lead)}
                                className={`bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-[#04a700]/40 transition-all space-y-2 text-left cursor-grab active:cursor-grabbing group ${draggedLeadId === lead.id ? "opacity-40" : ""}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-[#04a700] font-mono">LD-{lead.id}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{lead.source_display || lead.lead_source?.replace("_", " ")}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{lead.customer_name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-semibold leading-snug">{lead.contact_number}</span>
                                  <a 
                                    href={`tel:${lead.contact_number}`} 
                                    onClick={(e) => e.stopPropagation()} 
                                    className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer shadow-sm transition-colors" 
                                    title="Call Customer"
                                  >
                                    <Phone className="h-2.5 w-2.5" />
                                  </a>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-snug truncate">{lead.interested_vehicle_name || "—"}</p>
                                {lead.follow_up_date && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                                    <CalendarDays className="h-3 w-3" /> {lead.follow_up_date}
                                  </div>
                                )}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[9px] text-slate-400 font-bold truncate">{lead.executive_name || "Unassigned"}</span>
                                  <span className="text-[9px] font-extrabold text-[#04a700] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* TAB 8: ADVANCE BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              
              <Table 
                title="Customer Booking Commitments" 
                headers={["Booking ID", "Customer Details", "Vehicle Reserved", "Advance Payment", "Booking Date", "Expiry Threshold", "Assigned Exec", "PDI Verified", "Approval State", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddBookingOpen(true)}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Record Booking
                  </button>
                }
              >
                {advanceBookingsLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading advance bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : advanceBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <EmptyState 
                        title="No Bookings Registered" 
                        description="Customer bookings recorded by sales executives will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  advanceBookings.map((bk, idx) => (
                    <tr key={bk.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{bk.booking_id}</td>
                      <td className="py-3.5 px-5 text-slate-800"><div className="font-bold">{bk.customer_name}</div><div className="text-[10px] text-slate-400">{bk.contact_number}</div></td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{bk.vehicle_model_name}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">₹ {parseFloat(bk.advance_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{bk.booking_date}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono font-semibold">{bk.expiry_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{bk.executive_name || "Unassigned"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.pdi_verified === "yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.pdi_verified === "yes" ? "Yes" : bk.pdi_verified === "no" ? "No" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          bk.status === "converted" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          bk.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.status_display || bk.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button onClick={() => openEditBooking(bk)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                        <button onClick={() => handleCancelBooking(bk)} className="text-xs text-amber-600 hover:text-amber-800 font-bold mr-3 cursor-pointer">Cancel</button>
                        <button onClick={() => handleDeleteBooking(bk.id)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 9: BATTERIES MANAGEMENT */}
          {activeTab === "batteries" && (
            <div className="space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Battery Stock Sequence Protocol</h4>
                  <p className="text-xs text-amber-600 font-semibold mt-1">
                    System rules dictate that the oldest batteries purchased must be assigned to customer delivery invoices first.
                    Selecting a battery with a newer purchase date will trigger an override request block requiring Supervisor approval.
                  </p>
                </div>
              </div>
              <Table 
                title="Battery Storage Units" 
                headers={["Battery Serial", "Battery Code", "Capacity Rating", "Date Acquired", "Assigned EV", "Location Storage", "Manufacturer Corp", "Warranty Years", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddBatteryOpen(true)}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Log Battery Stock
                  </button>
                }
              >
                {batteriesLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading battery stock...</span>
                      </div>
                    </td>
                  </tr>
                ) : batteriesStock.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <EmptyState 
                        title="No Batteries Registered" 
                        description="Battery units registered in the system will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  batteriesStock.map((batt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{batt.serial}</td>
                      <td className="py-3.5 px-5 text-slate-650 font-bold font-mono">{batt.batteryCode || "—"}</td>
                      <td className="py-3.5 px-5 text-slate-650 font-bold">{batt.capacity}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{batt.purDate}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono">{batt.vehicle}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{batt.location}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">{batt.supplier}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{batt.warrantyYears}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          batt.status === "Available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          batt.status === "Sold" ? "bg-slate-100 text-slate-505" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {batt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button onClick={() => openEditBattery(batt)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                        <button onClick={() => setHistoryBattery(batt)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold mr-3 cursor-pointer">History</button>
                        <button onClick={() => handleDeleteBattery(batt)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 10: LEDGER MANAGEMENT */}
          {activeTab === "ledger" && (
            <div className="space-y-6">
              
              {/* Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Ledger Income</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Purchase Cost</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.filter(row => row.ledger_type === "purchase_expense").reduce((acc, curr) => acc + parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Operating Expense</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.filter(row => row.ledger_type !== "purchase_expense").reduce((acc, curr) => acc + parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Net Cashflow</span>
                  <span className={`text-xl font-bold ${
                    ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    ₹ {ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <Table title="General Ledger Entries List" headers={["Transaction ID", "Category Type", "Branch Outlet", "Details Memo", "Cash Inward", "Cash Outward", "Payment Mode", "Approved By", "Entry Date"]}>
                {ledgerEntriesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading ledger transaction records...</span>
                      </div>
                    </td>
                  </tr>
                ) : ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <EmptyState 
                        title="No Transactions Logged" 
                        description="Financial activities across branches will register on this ledger automatically." 
                      />
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{row.transaction_id}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{row.ledger_type_display || row.ledger_type}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{row.branch_name}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-medium">{row.detail}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">{parseFloat(row.income) > 0 ? "₹ " + parseFloat(row.income).toLocaleString('en-IN') : "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-rose-600">{parseFloat(row.expense) > 0 ? "₹ " + parseFloat(row.expense).toLocaleString('en-IN') : "—"}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{row.payment_mode}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-bold">{row.approver_name || "System"}</td>
                      <td className="py-3.5 px-5 text-slate-450 font-medium">{row.created_at}</td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 11: REPORTS & ANALYTICS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Enterprise Report Generator</h3>
                <p className="text-xs text-slate-400 font-semibold mb-6">Choose filters below to generate and extract spreadsheets/PDFs summaries.</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Report Module</label>
                    <select value={reportModule} onChange={(e) => setReportModule(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>Sales Ledger Summary</option>
                      <option>Inventory In-Out Movements</option>
                      <option>Battery Stock Allocations</option>
                      <option>Executive Sales Commission</option>
                      <option>Lead Conversion Pipeline</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Branch Outlet</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>All Branches</option>
                      <option>Visakhapatnam Showroom</option>
                      <option>Srikakulam Showroom</option>
                      <option>Kakinada Showroom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date Range Filter</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>This Month ({new Date().toLocaleString("en-US", { month: "long" })} {new Date().getFullYear()})</option>
                      <option>Last Month ({(() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - 1);
                        return d.toLocaleString("en-US", { month: "long" }) + " " + d.getFullYear();
                      })()})</option>
                      <option>Year to Date ({new Date().getFullYear()})</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={downloadReport} className="flex-1 flex items-center justify-center gap-1.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-3 rounded-full shadow-md shadow-[#04a700]/20 transition-all cursor-pointer truncate">
                      <Download className="h-4 w-4 shrink-0" /> CSV
                    </button>
                    <button onClick={printReport} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-3 rounded-full shadow-md transition-all cursor-pointer truncate">
                      <Printer className="h-4 w-4 shrink-0" /> Print
                    </button>
                  </div>
                </div>
                {/* Simulated data table preview */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Report Preview (First 3 entries)</span>
                    <span onClick={() => navigateTo(reportModule === "Inventory In-Out Movements" ? "stock" : reportModule === "Lead Conversion Pipeline" ? "leads" : reportModule === "Battery FIFO Allocations" ? "batteries" : "sales")} className="text-indigo-600 font-extrabold cursor-pointer hover:underline">View full table</span>
                  </div>
                  <div className="p-4 text-xs font-semibold text-slate-500 space-y-2">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>KVR-Visakhapatnam Showroom • Delivered ({getDynamicCode("INV", 89)})</span>
                      <span className="font-bold text-slate-800">₹ 98,500</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>KVR-Srikakulam Showroom • Delivered ({getDynamicCode("INV", 91)})</span>
                      <span className="font-bold text-slate-800">₹ 1,15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>KVR-Visakhapatnam Showroom • Booking Confirm (BK-8021)</span>
                      <span className="font-bold text-slate-800">₹ 10,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TAB 12: USERS & ROLES */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Staff Directory & Role Assignments</h2>
                  <p className="text-xs text-slate-400 mt-1">Filter users by branch, user type, or role and add new user accounts for any permitted role.</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-4 rounded-full shadow-md shadow-[#04a700]/20 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add New User
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                  <select
                    value={userBranchFilter}
                    onChange={(e) => setUserBranchFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-[#04a700]"
                  >
                    <option>All Branches</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">User Type</label>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-[#04a700]"
                  >
                    <option>All Types</option>
                    <option>Admin</option>
                    <option>Staff</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-[#04a700]"
                  >
                    <option>All Roles</option>
                    <option>Owner</option>
                    <option>Supervisor</option>
                    <option>Sales Executive</option>
                    <option>Telecaller</option>
                  </select>
                </div>
              </div>
              <Table title="Staff Directory & Role Assignments" headers={["Full Name", "Username / Email", "Assigned Role", "Branch Outlet / Showroom", "Account Status", "Actions"]}>
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-indigo-600" />
                        <span>Loading user accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <EmptyState title="No Users Registered" description="User accounts will display here dynamically." />
                    </td>
                  </tr>
                ) : (
                  usersList
                    .filter((u) => {
                      const branchMatch = userBranchFilter === "All Branches" || !u.branch || u.branch.toLowerCase() === userBranchFilter.toLowerCase();
                      const roleMatch = userRoleFilter === "All Roles" ||
                        (userRoleFilter === "Owner" && u.role === "owner") ||
                        (userRoleFilter === "Supervisor" && u.role === "supervisor") ||
                        (userRoleFilter === "Sales Executive" && (u.role === "sales_executive" || u.role === "sales")) ||
                        (userRoleFilter === "Telecaller" && u.role === "telecaller");
                      
                      const typeMatch = userTypeFilter === "All Types" ||
                        (userTypeFilter === "Admin" && u.role === "owner") ||
                        (userTypeFilter === "Staff" && u.role !== "owner");
                      
                      return branchMatch && roleMatch && typeMatch;
                    })
                    .map((usr, idx) => (
                      <tr key={usr.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{usr.full_name || usr.username}</td>
                        <td className="py-3.5 px-5 text-slate-605">
                          <div className="font-bold">{usr.username}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{usr.email}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold uppercase">{usr.role}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{usr.branch || "—"}{usr.showroom ? ` / ${usr.showroom}` : ""}</td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            usr.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {usr.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <button onClick={() => openEditUser(usr)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                          <button onClick={() => handleResetUserPassword(usr)} className="text-xs text-amber-600 hover:text-amber-800 font-bold mr-3 cursor-pointer">Reset Password</button>
                          <button onClick={() => handleDeleteUser(usr.id)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                        </td>
                      </tr>
                    ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 12.2: STAFF ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Staff Attendance & Location Verification</h2>
                  <p className="text-xs text-slate-400 mt-1">Monitor staff and supervisor check-ins, verify photos and captured GPS coordinates.</p>
                </div>
                <button
                  onClick={loadAttendance}
                  className="inline-flex items-center gap-2 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-4 rounded-full shadow-md shadow-[#04a700]/20 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh Logs
                </button>
              </div>

              {/* Filters */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Filter by Branch</label>
                  <select
                    value={attendanceFilterBranch}
                    onChange={(e) => setAttendanceFilterBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-[#04a700]"
                  >
                    <option>All Branches</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Filter by Verification Status</label>
                  <select
                    value={attendanceFilterStatus}
                    onChange={(e) => setAttendanceFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-[#04a700]"
                  >
                    <option>All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Selected Count / Bulk Actions */}
              {(() => {
                const filteredLogs = attendanceList.filter((log) => {
                  const branchMatch = attendanceFilterBranch === "All Branches" || 
                    log.user_details?.branch === attendanceFilterBranch;
                  const statusMatch = attendanceFilterStatus === "All Statuses" || 
                    log.status === attendanceFilterStatus;
                  return branchMatch && statusMatch;
                });
                const pendingLogs = filteredLogs.filter(log => log.status === 'pending');
                const allSelected = pendingLogs.length > 0 && pendingLogs.every(log => selectedAttendanceIds.includes(log.id));
                
                const toggleSelectAll = () => {
                  if (allSelected) {
                    setSelectedAttendanceIds(prev => prev.filter(id => !pendingLogs.map(l => l.id).includes(id)));
                  } else {
                    setSelectedAttendanceIds(prev => {
                      const next = [...prev];
                      pendingLogs.forEach(l => {
                        if (!next.includes(l.id)) next.push(l.id);
                      });
                      return next;
                    });
                  }
                };

                return (
                  <>
                    {selectedAttendanceIds.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                        <span className="text-xs text-emerald-800 font-bold">
                          Selected {selectedAttendanceIds.length} pending record(s)
                        </span>
                        <button
                          onClick={() => handleBulkVerifyAttendance("verified", "Bulk approved by Owner")}
                          className="bg-[#04a700] hover:bg-[#038e00] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                        >
                          Approve Selected
                        </button>
                        <button
                          onClick={() => handleBulkVerifyAttendance("rejected", "Bulk rejected by Owner")}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                        >
                          Reject Selected
                        </button>
                        <button
                          onClick={() => setSelectedAttendanceIds([])}
                          className="text-[11px] text-slate-400 hover:text-slate-650 font-bold ml-auto cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}

                    {/* Data Table */}
                    <Table 
                      title="Attendance Check-ins" 
                      headers={[
                        <input 
                          key="select-all"
                          type="checkbox" 
                          checked={allSelected} 
                          onChange={toggleSelectAll} 
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />,
                        "Date", 
                        "Employee Name", 
                        "Role / Branch", 
                        "Check-in Photo", 
                        "Workplace GPS Location", 
                        "Verification", 
                        "Actions"
                      ]}
                    >
                      {attendanceLoading ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-semibold">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                              <span>Loading attendance logs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center">
                            <EmptyState title="No Attendance Logs" description="Check-in entries will display here once employees mark their attendance." />
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          const getImageUrl = (path: string) => {
                            if (!path) return "/avatar_owner.png";
                            if (path.startsWith("http")) return path;
                            const base = typeof window !== "undefined" && window.location.hostname === "localhost" 
                              ? "http://127.0.0.1:8000" 
                              : "";
                            return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
                          };
                          const isSelected = selectedAttendanceIds.includes(log.id);
                          const toggleSelect = () => {
                            if (isSelected) {
                              setSelectedAttendanceIds(prev => prev.filter(id => id !== log.id));
                            } else {
                              setSelectedAttendanceIds(prev => [...prev, log.id]);
                            }
                          };

                          return (
                            <tr key={log.id} className={`hover:bg-slate-50 border-b border-slate-100 ${isSelected ? 'bg-emerald-50/20' : ''}`}>
                              <td className="py-3.5 px-5">
                                {log.status === 'pending' ? (
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected} 
                                    onChange={toggleSelect} 
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-slate-350">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 font-bold text-slate-800">
                                {new Date(log.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-slate-800">{log.user_details?.full_name || log.user_details?.username}</div>
                                <div className="text-[10px] text-slate-400 font-bold">@{log.user_details?.username}</div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="text-xs font-semibold text-slate-600 uppercase">{log.user_details?.role.replace("_", " ")}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{log.user_details?.branch || "Global"}</div>
                              </td>
                              <td className="py-3.5 px-5">
                                {log.photo ? (
                                  <a href={getImageUrl(log.photo)} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:scale-105 transition-transform cursor-pointer">
                                    <img src={getImageUrl(log.photo)} alt="Check-in Face" className="w-full h-full object-cover" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-400">No Photo</span>
                                )}
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="text-xs font-bold text-slate-700">{log.location_name || "Workspace"}</div>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[10px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <MapPin className="h-3 w-3 inline" /> {Number(log.latitude).toFixed(4)}, {Number(log.longitude).toFixed(4)}
                                </a>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="flex flex-col">
                                  <span className={`inline-flex self-start px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    log.status === 'verified' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                      : log.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {log.status.toUpperCase()}
                                  </span>
                                  {log.status !== 'pending' && (
                                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">
                                      by {log.verified_by_details?.full_name || 'Admin'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-5 whitespace-nowrap">
                                {log.status === "pending" ? (
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleVerifyAttendance(log.id, "verified", "Approved by Owner")} 
                                      className="text-xs text-emerald-600 hover:text-emerald-800 font-extrabold cursor-pointer"
                                    >
                                      Verify
                                    </button>
                                    <button 
                                      onClick={() => handleVerifyAttendance(log.id, "rejected", "Rejected by Owner")} 
                                      className="text-xs text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 font-bold">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </Table>
                  </>
                );
              })()}
            </div>
          )}
          {/* TAB 12.5: ACTIVITY LOGS */}
          {activeTab === "activity-logs" && (
            <div className="space-y-6">
              <Table
                title="Activity Logs & System Audits"
                headers={["Timestamp", "User Initiator", "Action", "Model / Object Type", "Target Record", "IP Address", "Actions"]}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                actions={
                  <button
                    onClick={loadActivityLogs}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-bold text-xs py-2 px-4 rounded-full cursor-pointer transition-colors"
                  >
                    Refresh Audit Trail
                  </button>
                }
              >
                {activityLogsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading audit trail logs from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : activityLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <EmptyState
                        title="No Activities Logged"
                        description="Audit logs will appear here as users perform updates, additions, or deletions across the ERP system."
                      />
                    </td>
                  </tr>
                ) : (
                  activityLogsList
                    .filter((log) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        (log.user_detail?.full_name || "System").toLowerCase().includes(q) ||
                        log.model_name.toLowerCase().includes(q) ||
                        log.object_repr.toLowerCase().includes(q) ||
                        log.action.toLowerCase().includes(q)
                      );
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-800">
                              {log.user_detail?.full_name || "System Automated"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {log.user_detail?.role || "System Action"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                              log.action === "CREATE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : log.action === "UPDATE"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                          {log.model_name}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 font-semibold">{log.object_repr}</td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">{log.ip_address || "127.0.0.1"}</td>
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => {
                              setSelectedLogDetail(log);
                              setIsLogModalOpen(true);
                            }}
                            className="text-xs text-[#04a700] hover:text-[#038a00] font-black cursor-pointer"
                          >
                            Inspect Diff
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </Table>

              {/* Inspect Log details Modal */}
              <Modal
                isOpen={isLogModalOpen}
                onClose={() => {
                  setIsLogModalOpen(false);
                  setSelectedLogDetail(null);
                }}
                title="System Audit - Inspect Record Differences"
              >
                {selectedLogDetail && (
                  <div className="space-y-4 text-left text-xs text-slate-700">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Object</span>
                        <span className="font-bold text-slate-800 uppercase text-sm mt-0.5 block">
                          {selectedLogDetail.model_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Record Repr</span>
                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedLogDetail.object_repr}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initiator</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {selectedLogDetail.user_detail?.full_name || "System"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IP Address</span>
                        <span className="font-mono text-slate-600 mt-0.5 block">{selectedLogDetail.ip_address || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                        <span className="font-mono text-slate-600 mt-0.5 block">
                          {new Date(selectedLogDetail.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Field Modification Diff</span>
                      {Object.keys(selectedLogDetail.changes).length === 0 ? (
                        <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-450 font-semibold italic">
                          No specific fields recorded or record was deleted.
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase text-[9px] tracking-widest">
                                <th className="py-2.5 px-4">Field Name</th>
                                <th className="py-2.5 px-4">Previous Value</th>
                                <th className="py-2.5 px-4 text-[#04a700]">New Modified Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {Object.entries(selectedLogDetail.changes).map(([field, diff]) => (
                                <tr key={field} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-bold text-slate-800 uppercase tracking-wide text-[10px]">
                                    {field}
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-slate-500 truncate max-w-[150px]" title={diff.before || "None"}>
                                    {diff.before === null || diff.before === "None" ? (
                                      <span className="text-slate-400 italic font-sans">empty</span>
                                    ) : (
                                      diff.before
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 font-mono text-[#04a700] font-bold truncate max-w-[150px]" title={diff.after || "None"}>
                                    {diff.after === null || diff.after === "None" ? (
                                      <span className="text-slate-300 italic font-sans font-normal">empty</span>
                                    ) : (
                                      diff.after
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}
          {/* TAB 13: SYSTEM SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Portal Configuration Settings</h3>
                <div className="space-y-4 max-w-xl text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Name</label>
                      <input type="text" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Currency</label>
                      <input type="text" defaultValue="INR (₹)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tax Rate Code (GST%)</label>
                    <input type="text" value={settings.gst} onChange={(e) => setSettings({ ...settings, gst: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500" />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <button onClick={handleSaveSettings} className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-6 rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
                      Save Settings
                    </button>
                    <button onClick={handleResetSettings} className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-2 px-4 rounded-full cursor-pointer">
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "expenses" && (
            <BranchExpenseView role="owner" />
          )}
          {activeTab === "issues" && (
            <IssueReportView role="owner" />
          )}
          {activeTab === "reports" && (
            <OwnerReportsView />
          )}
          {activeTab === "profile" && (
            <ProfileView />
          )}
          {activeTab === "notifications" && (
            <NotificationsView role="owner" />
          )}
        </DashboardSmoothScroll>
      </div>
      {/* Mobile bottom navigation */}
      <BottomNav role="owner" activeTab={activeTab} />
      {/* MODALS */}
      <Modal isOpen={isEditCustomerOpen} onClose={() => setIsEditCustomerOpen(false)} title="Edit Customer Details">
        <form onSubmit={handleEditCustomerSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input 
              type="text" 
              value={editCustomerName}
              onChange={(e) => setEditCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
            <input 
              type="tel" 
              value={editCustomerPhone}
              onChange={(e) => setEditCustomerPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <button 
              type="button" 
              onClick={() => setIsEditCustomerOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={editCustomerLoading}
              className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-6 rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer disabled:opacity-50"
            >
              {editCustomerLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddBranchOpen} onClose={() => { resetBranchForm(); setIsAddBranchOpen(false); }} title={editingBranchId ? "Edit Showroom / Branch Outlet" : "Create New Showroom / Branch Outlet"}>
        <form onSubmit={handleAddBranchSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom Name</label>
            <input 
              type="text" 
              placeholder="e.g. KVR Motors - Gajuwaka" 
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.name && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Address / Location City</label>
            <input 
              type="text" 
              placeholder="e.g. Visakhapatnam City High Road, Visakhapatnam" 
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.address && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.address}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
            <input 
              type="tel" 
              placeholder="e.g. 9876543210" 
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.phone_number && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.phone_number}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Manager Assigned</label>
            <input 
              type="text" 
              placeholder="e.g. Ramesh Babu" 
              value={branchManagerName}
              onChange={(e) => setBranchManagerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.manager_name && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.manager_name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Operational Status</label>
            <select
              value={branchActive ? "active" : "inactive"}
              onChange={(e) => setBranchActive(e.target.value === "active")}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingBranchId ? "Save Changes" : "Register Branch"}
          </button>
        </form>
      </Modal>
      {/* 2. Add User */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Add New User Account">
        <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Username (Unique)</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="e.g. nikhil_sales"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="e.g. Nikhil Rao"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
              <input
                type="tel"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="e.g. 9876543210"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g. nikhil@kvrmotors.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="owner">Owner</option>
                <option value="supervisor">Supervisor</option>
                <option value="sales_executive">Sales Executive</option>
                <option value="telecaller">Telecaller</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            {newUser.role !== "owner" && newUser.role !== "admin" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Assignment</label>
                <select
                  value={newUser.branch}
                  onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                  required
                >
                  <option value="">Select branch...</option>
                  {branchesList.map((branch) => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            Create User Account
          </button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditUserOpen} onClose={() => setIsEditUserOpen(false)} title="Edit User Account">
        <form onSubmit={handleEditUserSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                value={editUserForm.fullName}
                onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                placeholder="e.g. Nikhil Rao"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
              <input
                type="tel"
                value={editUserForm.phoneNumber}
                onChange={(e) => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="e.g. 9876543210"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <input
              type="email"
              value={editUserForm.email}
              onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              placeholder="e.g. nikhil@kvrmotors.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
              <select
                value={editUserForm.role}
                onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="owner">Owner</option>
                <option value="supervisor">Supervisor</option>
                <option value="sales_executive">Sales Executive</option>
                <option value="telecaller">Telecaller</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Account Status</label>
              <select
                value={editUserForm.isActive ? "active" : "inactive"}
                onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.value === "active" })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editUserForm.role !== "owner" && editUserForm.role !== "admin" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Assignment</label>
                <select
                  value={editUserForm.branch}
                  onChange={(e) => setEditUserForm({ ...editUserForm, branch: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                  required
                >
                  <option value="">Select branch...</option>
                  {branchesList.map((branch) => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={editUserForm.password}
                onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            Save User Changes
          </button>
        </form>
      </Modal>
      {/* 2. Add Vehicle Model */}
      <Modal isOpen={isAddVehicleOpen} onClose={() => { setIsAddVehicleOpen(false); setEditingModelId(null); }} title={editingModelId ? "Edit Vehicle Model" : "Add Vehicle Model to Catalog"}>
        <form onSubmit={handleAddModelSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Model Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                placeholder="e.g. Dynamo Pro" 
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Brand <span className="text-red-500">*</span></label>
              <select 
                value={newModelBrand}
                onChange={(e) => setNewModelBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
                required
              >
                <option value="">-- Select Brand --</option>
                {vehicleBrandsList.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Base Price (INR) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                placeholder="e.g. 98500" 
                value={newModelPrice}
                onChange={(e) => setNewModelPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Compatibility (optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 2.0 kWh Swappable" 
                value={newModelBattery}
                onChange={(e) => setNewModelBattery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variants (comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Red, Blue, Matte Black" 
              value={newModelColors}
              onChange={(e) => setNewModelColors(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Catalog Status</label>
            <select
              value={newModelStatus}
              onChange={(e) => setNewModelStatus(e.target.value as "active" | "inactive")}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingModelId ? "Save Changes" : "Add Model"}
          </button>
        </form>
      </Modal>

      {/* Brand Management Modal */}
      <Modal isOpen={isManageBrandsOpen} onClose={() => { setIsManageBrandsOpen(false); setEditingBrandId(null); setNewBrandName(""); }} title={editingBrandId ? "Edit Brand Manufacturer" : "Register Brand Manufacturer"}>
        <div className="space-y-4 text-left">
          <form onSubmit={handleAddBrandSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{editingBrandId ? "Update Brand Name" : "Brand Name"}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Kinetic Green, TVS, Dynamo" 
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
                  required 
                />
                <button type="submit" className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs px-4 rounded-lg cursor-pointer">
                  {editingBrandId ? "Update" : "Add Brand"}
                </button>
                {editingBrandId && (
                  <button type="button" onClick={() => { setEditingBrandId(null); setNewBrandName(""); }} className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs px-3 rounded-lg cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
          <div className="border-t border-slate-100 pt-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Registered Brands</label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {vehicleBrandsList.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
                  <span>{brand.name}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingBrandId(brand.id); setNewBrandName(brand.name); }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Edit
                    </button>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/10">Active</span>
                  </div>
                </div>
              ))}
              {vehicleBrandsList.length === 0 && (
                <p className="text-[11px] font-semibold text-slate-400">No brands registered yet.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {/* 3. Add / Edit Stock Unit */}
      <Modal isOpen={isAddStockOpen} onClose={() => { setIsAddStockOpen(false); resetStockUnitForm(); }} title={editingUnitId ? "Edit Stock Unit (VIN Registry)" : "Log Physical Stock Unit Entry"}>
        <form onSubmit={handleStockUnitSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model <span className="text-red-500">*</span></label>
            <select
              value={stockUnitForm.model}
              onChange={(e) => setStockUnitForm({ ...stockUnitForm, model: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            >
              <option value="">-- Select Model --</option>
              {vehicleModelsList.map((m) => (
                <option key={m.id} value={m.id}>{m.brand_name ? `${m.brand_name} - ` : ""}{m.model_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">VIN Number (optional)</label>
            <input
              type="text"
              placeholder="e.g. KVRVIN2026X990"
              value={stockUnitForm.vin_number}
              onChange={(e) => setStockUnitForm({ ...stockUnitForm, vin_number: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Motor Number (optional)</label>
              <input
                type="text"
                placeholder="e.g. MTR-90888"
                value={stockUnitForm.motor_number}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, motor_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Number (optional)</label>
              <input
                type="text"
                placeholder="e.g. CHS-88988"
                value={stockUnitForm.chassis_number}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, chassis_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Color</label>
              <input type="text" placeholder="e.g. Matte Black" value={stockUnitForm.color} onChange={(e) => setStockUnitForm({ ...stockUnitForm, color: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Purchase Date</label>
              <input type="date" value={stockUnitForm.purchase_date} onChange={(e) => setStockUnitForm({ ...stockUnitForm, purchase_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Outlet <span className="text-red-500">*</span></label>
            <select
              value={stockUnitForm.branch}
              onChange={(e) => setStockUnitForm({ ...stockUnitForm, branch: e.target.value, showroom: "", location: "" })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            >
              <option value="">-- Select Branch --</option>
              {branchesList.filter((b) => b.is_active !== false).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {/* Removed Purchase Invoice and Payment Status from Stock In per user requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Status</label>
              <select
                value={stockUnitForm.stock_status}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, stock_status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
                <option value="in_transit">In Transit</option>
                <option value="service">Service</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Serial (optional)</label>
              <input type="text" placeholder="e.g. BAT-2026-0091" value={stockUnitForm.assigned_battery} onChange={(e) => setStockUnitForm({ ...stockUnitForm, assigned_battery: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingUnitId ? "Save Changes" : "Log Stock Unit"}
          </button>
        </form>
      </Modal>
      {/* 4. Create Purchase Order */}
      <Modal isOpen={isAddPOOpen} onClose={() => setIsAddPOOpen(false)} title="Create Supplier Purchase Order">
        <form onSubmit={handleCreatePOSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier Entity Name</label>
            <input 
              type="text" 
              placeholder="e.g. Dynamo EV Manufacturers" 
              value={newPOSupplier}
              onChange={(e) => setNewPOSupplier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
              <select 
                value={newPOModel}
                onChange={(e) => setNewPOModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2.5 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required
              >
                <option value="">-- Select Model --</option>
                {vehicleModelsList.map((model) => (
                  <option key={model.id} value={model.id}>{model.model_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
              <input 
                type="number" 
                placeholder="e.g. 30" 
                value={newPOQty}
                onChange={(e) => setNewPOQty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price (INR)</label>
              <input 
                type="number" 
                placeholder="e.g. 78000" 
                value={newPOPrice}
                onChange={(e) => setNewPOPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Terms</label>
              <input 
                type="text" 
                placeholder="e.g. Net 30" 
                value={newPOPaymentTerms}
                onChange={(e) => setNewPOPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Estimated Delivery Date</label>
            <input 
              type="date" 
              value={newPOEstDelivery}
              onChange={(e) => setNewPOEstDelivery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            Create Purchase Order
          </button>
        </form>
      </Modal>

      {/* 5. Add Lead */}
      <Modal isOpen={isAddLeadOpen} onClose={() => { setIsAddLeadOpen(false); setEditingLeadId(null); setNewLead({ ...emptyLead }); }} title={editingLeadId ? "Edit Lead" : "Add New Lead / Enquiry"}>
        <form onSubmit={handleCreateLead} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Naidu"
              value={newLead.customer_name}
              onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={newLead.contact_number}
              onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested Vehicle</label>
            <select
              value={newLead.interested_vehicle}
              onChange={(e) => setNewLead({ ...newLead, interested_vehicle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            >
              <option value="">Select a model...</option>
              {vehicleModelsList.map((m) => (
                <option key={m.id} value={m.id}>{m.brand_name ? `${m.brand_name} - ` : ""}{m.model_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Source</label>
              <select
                value={newLead.lead_source}
                onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              >
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
                <option value="reference">Reference</option>
                <option value="phone">Phone Call</option>
                <option value="social">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage</label>
              <select
                value={newLead.status}
                onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              >
                <option value="enquiry">Enquiry</option>
                <option value="new_lead">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow-up</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Follow-up Date (optional)</label>
            <input
              type="date"
              value={newLead.follow_up_date}
              onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes (optional)</label>
            <textarea
              placeholder="Customer preferences, budget, call summary..."
              value={newLead.notes}
              onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#04a700] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Executive / Telecaller</label>
            <select
              value={newLead.assigned_executive || ""}
              onChange={(e) => setNewLead({ ...newLead, assigned_executive: e.target.value || null })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
            >
              <option value="">Unassigned</option>
              {usersList
                .filter(u => u.role === "telecaller")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} (Telecaller)
                  </option>
                ))
              }
            </select>
          </div>
          <div className={editingLeadId ? "grid grid-cols-2 gap-4" : "w-full"}>
            <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
              {editingLeadId ? "Save Changes" : "Add Lead to Pipeline"}
            </button>
            {editingLeadId && (
              <button
                type="button"
                onClick={() => handleDeleteLead(editingLeadId)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Delete Lead
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* 6. Record Booking */}
      <Modal isOpen={isAddBookingOpen} onClose={() => { setIsAddBookingOpen(false); setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" }); }} title={editingBookingId ? "Edit Advance Booking" : "Record Advance Booking"}>
        <form onSubmit={handleCreateBooking} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Lakshmi Devi"
                value={newBooking.customer_name}
                onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={newBooking.contact_number}
                onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
            <select
              value={newBooking.vehicle_model}
              onChange={(e) => setNewBooking({ ...newBooking, vehicle_model: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select a model...</option>
              {vehicleModelsList.map((m) => (
                <option key={m.id} value={m.id}>{m.model_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Advance Amount (INR)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={newBooking.advance_amount}
                onChange={(e) => setNewBooking({ ...newBooking, advance_amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
              <input
                type="date"
                value={newBooking.expiry_date}
                onChange={(e) => setNewBooking({ ...newBooking, expiry_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingBookingId ? "Save Changes" : "Record Booking"}
          </button>
        </form>
      </Modal>

      {/* 7. Log Battery Stock */}
      <Modal isOpen={isAddBatteryOpen} onClose={() => { setIsAddBatteryOpen(false); setEditingBatteryId(null); setNewBattery({ ...emptyBattery }); }} title={editingBatteryId ? "Edit Battery Stock" : "Log Battery Stock"}>
        <form onSubmit={handleCreateBattery} className="space-y-4 text-left">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Serial Number</label>
              <input
                type="text"
                placeholder="e.g. BAT-2026-0091"
                value={newBattery.serial_number}
                onChange={(e) => setNewBattery({ ...newBattery, serial_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Code</label>
              <input
                type="text"
                placeholder="e.g. BAT-LFP-6030"
                value={newBattery.battery_code}
                onChange={(e) => setNewBattery({ ...newBattery, battery_code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity Rating</label>
              <input
                type="text"
                placeholder="e.g. 2.2 kWh"
                value={newBattery.capacity}
                onChange={(e) => setNewBattery({ ...newBattery, capacity: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Purchase Date</label>
              <input
                type="date"
                value={newBattery.purchase_date}
                onChange={(e) => setNewBattery({ ...newBattery, purchase_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Storage Location</label>
              <select
                value={newBattery.location}
                onChange={(e) => setNewBattery({ ...newBattery, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="">Select location...</option>
                {locationsList.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier</label>
              <input
                type="text"
                placeholder="e.g. Exide Tech"
                value={newBattery.supplier}
                onChange={(e) => setNewBattery({ ...newBattery, supplier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Warranty (Years)</label>
              <input
                type="number"
                placeholder="3"
                value={newBattery.warranty_years}
                onChange={(e) => setNewBattery({ ...newBattery, warranty_years: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select
              value={newBattery.status}
              onChange={(e) => setNewBattery({ ...newBattery, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="sold">Sold</option>
              <option value="damaged">Damaged</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingBatteryId ? "Save Changes" : "Log Battery to Registry"}
          </button>
        </form>
      </Modal>

      {/* 8. Battery History */}
      <Modal isOpen={historyBattery !== null} onClose={() => setHistoryBattery(null)} title="Battery Lifecycle History">
        {historyBattery && (
          <div className="space-y-4 text-left">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 text-sm">{historyBattery.serial}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  historyBattery.status === "Available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                  historyBattery.status === "Sold" ? "bg-slate-100 text-slate-500" :
                  "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {historyBattery.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                <div><span className="text-slate-400 font-semibold block">Capacity</span><span className="font-bold text-slate-700">{historyBattery.capacity}</span></div>
                <div><span className="text-slate-400 font-semibold block">Date Acquired</span><span className="font-bold text-slate-700">{historyBattery.purDate}</span></div>
                <div><span className="text-slate-400 font-semibold block">Location</span><span className="font-bold text-slate-700">{historyBattery.location}</span></div>
                <div><span className="text-slate-400 font-semibold block">Manufacturer</span><span className="font-bold text-slate-700">{historyBattery.supplier}</span></div>
                <div><span className="text-slate-400 font-semibold block">Assigned EV</span><span className="font-bold text-slate-700 font-mono">{historyBattery.vehicle}</span></div>
                <div><span className="text-slate-400 font-semibold block">Warranty</span><span className="font-bold text-slate-700">{historyBattery.warrantyYears}</span></div>
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Movement Timeline</span>
              {[
                { label: "Stock intake recorded (GRN)", date: historyBattery.purDate, done: true },
                { label: `Stored at ${historyBattery.location}`, date: historyBattery.purDate, done: true },
                { label: historyBattery.status === "Available" ? "Awaiting FIFO allocation" : `Assigned to ${historyBattery.vehicle}`, date: "—", done: historyBattery.status !== "Available" },
                { label: "Delivered with vehicle invoice", date: "—", done: historyBattery.status === "Sold" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${step.done ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-300"}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-[11px] font-semibold ${step.done ? "text-slate-700" : "text-slate-400"}`}>{step.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setHistoryBattery(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-full cursor-pointer">
              Close History
            </button>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
