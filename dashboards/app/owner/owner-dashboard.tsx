"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import ProfileView from "../components/ProfileView";
import DashboardSmoothScroll from "../components/DashboardSmoothScroll";
import { getBranches, createBranch, updateBranch, getInventoryLocations, getShowrooms, deleteBranch } from "../services/branches";
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
  updateMelaSettings
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
  Settings
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

export default function OwnerDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const initialTab = lastSegment === "owner" ? "dashboard" : lastSegment;
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
  const [isAddMelaInventoryOpen, setIsAddMelaInventoryOpen] = useState(false);
  const [editingMelaInventoryId, setEditingMelaInventoryId] = useState<number | null>(null);

  // Mela Settings States
  const [melaSettingsList, setMelaSettingsList] = useState<any[]>([]);
  const [melaNameSetting, setMelaNameSetting] = useState("Grand Monsoon Mela");
  const [melaStartDateSetting, setMelaStartDateSetting] = useState("");
  const [melaEndDateSetting, setMelaEndDateSetting] = useState("");
  const [melaLocationSetting, setMelaLocationSetting] = useState("Main Showroom Ground");
  const [melaSettingsId, setMelaSettingsId] = useState<number | null>(null);

  // Mela Inventory Form
  const [melaInvModel, setMelaInvModel] = useState("");
  const [melaInvColor, setMelaInvColor] = useState("");
  const [melaInvBattery, setMelaInvBattery] = useState("graphene");
  const [melaInvQty, setMelaInvQty] = useState("");
  const [melaInvPrice, setMelaInvPrice] = useState("");

  // Mela Stock Adjustments & Groups
  const [melaStockLogs, setMelaStockLogs] = useState<any[]>([
    { id: 1, date: getDynamicDate(20, 0, "short"), model_name: "E-Luna Moped", color: "Red", battery_type: "graphene", type: "in", quantity: 15, notes: "Campaign Intake" },
    { id: 2, date: getDynamicDate(22, 0, "short"), model_name: "Dynamo Pro", color: "Blue", battery_type: "Li-30", type: "out", quantity: 2, notes: "PDI Transit Damage" }
  ]);
  const [melaGroups, setMelaGroups] = useState([
    { id: "group-1", name: "Team Visakhapatnam Retailers", lead: "Anil Kumar", members: "Anil Kumar, Suresh Babu, Rajesh Gowd", bookings: 14, target: 20, revenue: 1340000 },
    { id: "group-2", name: "Team Srikakulam Direct Sales", lead: "Suresh Babu", members: "Suresh Babu, Kiran Kumar, Lakshmi", bookings: 8, target: 15, revenue: 780000 },
    { id: "group-3", name: "Team Kakinada Roadshow", lead: "Somu Naidu", members: "Somu Naidu, Ravi Varma, Prasad", bookings: 5, target: 10, revenue: 490000 }
  ]);
  const [melaAdjItem, setMelaAdjItem] = useState("");
  const [melaAdjType, setMelaAdjType] = useState("in");
  const [melaAdjQty, setMelaAdjQty] = useState("");
  const [melaAdjNotes, setMelaAdjNotes] = useState("");
  
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
    
    // 5. Total Stock Constraint: non-negative integer
    if (!branchTotalStock.trim()) {
      errors.total_stock = "Total stock is required.";
    } else if (!/^\d+$/.test(branchTotalStock.trim())) {
      errors.total_stock = "Total stock must be a non-negative integer.";
    }
    
    // 6. Sales Volume Constraint: non-negative decimal
    if (!branchSalesVolume.trim()) {
      errors.sales_volume = "Sales volume is required.";
    } else if (isNaN(parseFloat(branchSalesVolume.trim())) || parseFloat(branchSalesVolume.trim()) < 0) {
      errors.sales_volume = "Sales volume must be a non-negative number.";
    }
    
    // 7. Monthly Target Constraint: non-negative decimal
    if (!branchMonthlyTarget.trim()) {
      errors.monthly_target = "Monthly target is required.";
    } else if (isNaN(parseFloat(branchMonthlyTarget.trim())) || parseFloat(branchMonthlyTarget.trim()) < 0) {
      errors.monthly_target = "Monthly target must be a non-negative number.";
    }
    
    // 8. Target Achieved Pct Constraint: integer between 0 and 100
    if (!branchTargetPct.trim()) {
      errors.target_achieved_pct = "Target percentage is required.";
    } else {
      const pct = parseInt(branchTargetPct.trim());
      if (isNaN(pct) || pct < 0 || pct > 100) {
        errors.target_achieved_pct = "Target percentage must be an integer between 0 and 100.";
      }
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
        manager_name: branchManagerName.trim(),
        total_stock: parseInt(branchTotalStock.trim()),
        sales_volume: parseFloat(branchSalesVolume.trim()),
        monthly_target: parseFloat(branchMonthlyTarget.trim()),
        target_achieved_pct: parseInt(branchTargetPct.trim())
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
  const loadMelaData = async () => {
    try {
      setMelaLoading(true);
      const [inv, bookings, reports, settings] = await Promise.all([
        getMelaInventory(),
        getMelaBookings(),
        getMelaReports(),
        getMelaSettingsList()
      ]);
      setMelaInventoryList(inv);
      setMelaBookingsList(bookings);
      setMelaReportsData(reports);
      setMelaSettingsList(settings);

      const activeSetting = settings.find((s: any) => s.is_active) || settings[0];
      if (activeSetting) {
        setMelaNameSetting(activeSetting.mela_name);
        setMelaStartDateSetting(activeSetting.start_date || "");
        setMelaEndDateSetting(activeSetting.end_date || "");
        setMelaLocationSetting(activeSetting.location);
        setMelaSettingsId(activeSetting.id || null);
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
        is_active: true
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
    const selectedInv = melaInventoryList.find(item => String(item.id) === melaAdjItem);
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
        vehicle_model: selectedInv.vehicle_model,
        color: selectedInv.color,
        battery_type: selectedInv.battery_type,
        initial_quantity: selectedInv.initial_quantity + (melaAdjType === "in" ? qtyVal : 0),
        remaining_quantity: newQty,
        price: parseFloat(selectedInv.price),
        is_active: selectedInv.is_active
      };

      await updateMelaInventory(selectedInv.id, payload);
      
      const newLog = {
        id: Date.now(),
        date: getDynamicDate(new Date().getDate(), 0, "short"),
        model_name: selectedInv.model_name,
        color: selectedInv.color,
        battery_type: selectedInv.battery_type,
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
    const q = melaSearchQuery.trim();
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

  const handleMelaCheckoutComplete = async (bookingId: number) => {
    try {
      setMelaCheckoutLoading(true);
      await completeMelaBooking(bookingId);
      showToast("Payment collected! Booking completed & delivered.");
      setMelaSearchQuery("");
      setMelaFoundBooking(null);
      loadMelaData();
      loadLedger();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to finalize checkout.";
      showToast(String(msg), "error");
    } finally {
      setMelaCheckoutLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadBranches();
    loadVehicles();
    loadLeads();
    loadBookings();
    loadSales();
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
    role: "sales",
    branch: "",
    showroom: ""
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
    role: "sales",
    branch: "",
    showroom: "",
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

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.fullName.trim() || !newUser.email.trim() || !newUser.password) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    try {
      await createUser({
        username: newUser.username.trim(),
        full_name: newUser.fullName.trim(),
        email: newUser.email.trim(),
        phone_number: newUser.phoneNumber.trim() || null,
        password: newUser.password,
        role: newUser.role,
        branch: newUser.branch ? newUser.branch.trim() : null,
        showroom: newUser.showroom ? newUser.showroom.trim() : null,
      });
      showToast("User account created successfully.");
      setNewUser({
        username: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "sales",
        branch: "",
        showroom: ""
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
      role: usr.role || "sales",
      branch: usr.branch ? String(usr.branch) : "",
      showroom: usr.showroom ? String(usr.showroom) : "",
      isActive: usr.is_active !== false,
      password: "",
    });
    setIsEditUserOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = {
        full_name: editUserForm.fullName.trim(),
        email: editUserForm.email.trim(),
        phone_number: editUserForm.phoneNumber.trim() || null,
        role: editUserForm.role,
        branch: editUserForm.branch ? editUserForm.branch.trim() : null,
        showroom: editUserForm.showroom ? editUserForm.showroom.trim() : null,
        is_active: editUserForm.isActive,
      };
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
      motor_number: unit.motor_number || "",
      chassis_number: unit.chassis_number || "",
      color: unit.color || "",
      purchase_date: unit.purchase_date || "",
      stock_status: unit.stock_status || "available",
      assigned_battery: unit.assigned_battery || "",
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
    if (!f.model || !f.branch || !f.showroom || !f.location) {
      showToast("Select model, branch, showroom and location.", "error");
      return;
    }
    const vin = f.vin_number.trim();
    const motor = f.motor_number.trim();
    const chassis = f.chassis_number.trim();
    if (!vin && !motor && !chassis) {
      showToast("Enter at least one identifier — VIN, Motor, or Chassis number.", "error");
      return;
    }
    const payload = {
      model: parseInt(f.model),
      branch: parseInt(f.branch),
      showroom: parseInt(f.showroom),
      location: parseInt(f.location),
      // Send null (not empty string) for blanks so the DB partial-unique
      // constraints treat missing identifiers as absent rather than duplicates.
      vin_number: vin || null,
      motor_number: motor || null,
      chassis_number: chassis || null,
      color: f.color.trim() || null,
      purchase_date: f.purchase_date || undefined,
      stock_status: f.stock_status,
      assigned_battery: f.assigned_battery.trim() || undefined,
    };
    try {
      if (editingUnitId) {
        await updateVehicleUnit(editingUnitId, payload);
        showToast("Stock unit updated.");
      } else {
        await createVehicleUnit(payload);
        showToast("Stock unit logged.");
      }
      resetStockUnitForm();
      setIsAddStockOpen(false);
      loadVehicles();
    } catch {
      showToast("Failed to save. An identifier may already be in use.", "error");
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

    // If there are no sales invoices in the database, return mockup day-wise unit counts
    if (filteredSalesInvoices.length === 0) {
      const mockPoints = [];
      const pointCount = salesTimeFilter === "week" ? 7 : salesTimeFilter === "six_months" ? 12 : 15;
      const step = Math.ceil(daysCount / pointCount);
      for (let i = pointCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i * step);
        const name = d.toLocaleDateString("en-IN", salesTimeFilter === "six_months" ? { month: "short" } : { day: "numeric", month: "short" });
        const seed = (i + 3) * 7;
        mockPoints.push({
          name,
          ThisPeriod: (seed % 5) + 1,
          PrevPeriod: ((seed + 2) % 4) + 1
        });
      }
      return mockPoints;
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
    
    // If all stats are zero, fallback to visual mock parameters
    if (available + booked + reserved + sold === 0) {
      return [
        { name: "Available", value: 186, color: "#2563eb" },
        { name: "Booked", value: 45, color: "#10b981" },
        { name: "In Transit", value: 32, color: "#f59e0b" },
        { name: "Sold", value: 49, color: "#64748b" },
      ];
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
      return [
        { id: 1, action: "Vehicle Stock In", ref: getDynamicCode("GRN", 12), location: "Pendurthi Godown", user: "Ramesh", time: "2 mins ago" },
        { id: 2, action: "Sale Invoice Created", ref: getDynamicCode("INV", 89), location: "Isakapallem Showroom", user: "Suresh", time: "15 mins ago" },
        { id: 3, action: "Purchase Invoice Created", ref: getDynamicCode("PINV", 21), location: "Pineapple Colony Godown", user: "Ramesh", time: "1 hour ago" },
        { id: 4, action: "Lead Converted to Sale", ref: getDynamicCode("LD", 56), location: "Kakinada Showroom", user: "Suresh", time: "2 hours ago" },
      ];
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
      return [
        { name: "Kinetic Green E-Luna", count: 72 },
        { name: "Dynamo Pro", count: 61 },
        { name: "Frankly 79", count: 48 },
        { name: "Watts 100", count: 38 }
      ];
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
      <DashboardSmoothScroll />
      
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
        <main className={`flex-1 p-4 pb-24 lg:pb-4 ${
          activeTab.startsWith("mela_") 
            ? "pt-0 md:pt-4 overflow-y-auto flex flex-col space-y-4 bg-[#FAFDFB]" 
            : activeTab === "dashboard" 
              ? "overflow-y-auto flex flex-col space-y-4 bg-[#FAFDFB]" 
              : "overflow-y-auto space-y-6"
        }`}>
          {/* Mobile Mela Sub-Navigation Tab Bar */}
          {activeTab.startsWith("mela_") && (
            <div className="flex md:hidden overflow-x-auto gap-1.5 py-1.5 border-b border-slate-100 scrollbar-none shrink-0 bg-white -mx-4 px-4 sticky top-0 z-30 shadow-sm">
              {[
                { id: "mela_dashboard", label: "Overview", icon: LayoutDashboard },
                { id: "mela_inventory", label: "Stock", icon: Boxes },
                { id: "mela_checkout", label: "Checkout", icon: CreditCard },
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
                      <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        Campaign Live
                      </span>
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
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
                  Active Mela Vehicles Stock
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {melaInventoryList.map((inv) => {
                    const pct = inv.initial_quantity > 0 ? Math.round((inv.remaining_quantity / inv.initial_quantity) * 100) : 0;
                    return (
                      <div 
                        key={inv.id} 
                        className="bg-white border border-emerald-100/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {inv.brand_name || "EV Brand"}
                              </span>
                              <h4 className="text-sm font-black text-slate-800 mt-1.5">{inv.model_name}</h4>
                            </div>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                              inv.remaining_quantity === 0 
                                ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}>
                              {inv.remaining_quantity === 0 ? "Sold Out" : `${inv.remaining_quantity} Available`}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] font-semibold bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-lg capitalize">
                              🎨 {inv.color}
                            </span>
                            <span className="text-[10px] font-semibold bg-slate-50 border border-slate-100 text-slate-605 px-2 py-0.5 rounded-lg">
                              🔋 {inv.battery_type}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Mela Pricing</div>
                            <div className="text-base font-black text-[#04a700] font-mono">
                              ₹ {parseFloat(inv.price).toLocaleString("en-IN")}
                            </div>
                          </div>
                          
                          {/* Stock progress bar */}
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                              <span>Remaining Stock</span>
                              <span>{inv.remaining_quantity} / {inv.initial_quantity} Units</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct === 0 ? "bg-rose-500" : pct <= 30 ? "bg-amber-500" : "bg-[#04a700]"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {melaInventoryList.length === 0 && (
                    <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 p-8 rounded-2xl text-center">
                      <div className="text-slate-400 font-bold text-xs">No active campaign stocks registered.</div>
                      <p className="text-[10px] text-slate-400 mt-1">Go to the Campaign Stock tab to register new stocks for this campaign.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Bookings table */}
              <Table
                title="Recent Campaign Bookings"
                headers={["Booking ID", "Customer", "Contact", "Vehicle Model", "Color", "Battery", "Price", "Executive", "Status"]}
              >
                {melaBookingsList.slice(0, 10).map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                    <td className="py-3 px-5 font-bold font-mono text-slate-800">{bk.booking_id}</td>
                    <td className="py-3 px-5 font-semibold text-slate-700">{bk.customer_name}</td>
                    <td className="py-3 px-5 font-mono text-slate-500">{bk.customer_phone}</td>
                    <td className="py-3 px-5 text-slate-700 font-medium">{bk.model_name}</td>
                    <td className="py-3 px-5 text-slate-600 capitalize">{bk.color}</td>
                    <td className="py-3 px-5 text-slate-650 font-bold">{bk.battery_type}</td>
                    <td className="py-3 px-5 font-bold font-mono text-slate-800">₹ {parseFloat(bk.price).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-5 text-slate-600 font-semibold">{bk.executive_name || bk.sales_executive}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                        bk.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-250"
                          : bk.status === "cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-250"
                          : "bg-amber-50 text-amber-700 border border-amber-250"
                      }`}>
                        {bk.status_display || bk.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {melaBookingsList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-450 font-semibold">
                      No campaign bookings recorded yet.
                    </td>
                  </tr>
                )}
              </Table>

              {/* Campaign Groups / Teams Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Active Groups List */}
                <div className="lg:col-span-2">
                  <Table
                    title="Active Campaign Groups / Teams"
                    headers={["Group / Team Name", "Team Leader", "Members", "Bookings Progress", "Revenue Generated"]}
                  >
                    {melaGroups.map((grp) => {
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
                    })}
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
              {/* Campaign stock list & Add stock forms */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Column: Active Inventory Table & Stock Movement Log */}
                <div className="xl:col-span-2 space-y-6">
                  <Table
                    title="Mela Campaign Active Inventory"
                    headers={["Vehicle Model", "Color Variant", "Battery Spec", "Mela Price", "Initial Stock", "Remaining Stock", "Status", "Actions"]}
                  >
                    {melaInventoryList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                        <td className="py-3 px-5 font-semibold text-slate-800">{inv.model_name}</td>
                        <td className="py-3 px-5 text-slate-600 capitalize">{inv.color}</td>
                        <td className="py-3 px-5 text-slate-700 font-bold">{inv.battery_type}</td>
                        <td className="py-3 px-5 font-bold font-mono text-slate-800">₹ {parseFloat(inv.price).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-5 font-mono text-slate-550">{inv.initial_quantity} Units</td>
                        <td className="py-3 px-5 font-mono">
                          <span className={`font-black ${inv.remaining_quantity === 0 ? "text-rose-600" : "text-slate-800"}`}>
                            {inv.remaining_quantity} Units
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.remaining_quantity === 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            {inv.remaining_quantity === 0 ? "Sold Out" : "In Stock"}
                          </span>
                        </td>
                        <td className="py-3 px-5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMelaInventoryId(inv.id);
                              setMelaInvModel(String(inv.vehicle_model));
                              setMelaInvColor(inv.color);
                              setMelaInvBattery(inv.battery_type);
                              setMelaInvQty(String(inv.initial_quantity));
                              setMelaInvPrice(String(inv.price));
                            }}
                            className="text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMelaInventory(inv.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {melaInventoryList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-450 font-semibold">
                          No active campaign stocks. Register new stock on the right panel.
                        </td>
                      </tr>
                    )}
                  </Table>

                  {/* Mela Stock Movements Log */}
                  <Table
                    title="Mela Campaign Stock Movements (In & Out Logs)"
                    headers={["Log Date", "Campaign Vehicle", "Type", "Adjusted Qty", "Notes / Reference"]}
                  >
                    {melaStockLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                        <td className="py-3 px-5 font-medium text-slate-505">{log.date}</td>
                        <td className="py-3 px-5 font-bold text-slate-800">
                          {log.model_name} <span className="text-[10px] text-slate-400">({log.color} / {log.battery_type})</span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            log.type === "in" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {log.type === "in" ? "Stock-In" : "Stock-Out"}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-mono font-black text-slate-800">
                          {log.type === "in" ? "+" : "-"}{log.quantity} Units
                        </td>
                        <td className="py-3 px-5 font-medium text-slate-500">{log.notes}</td>
                      </tr>
                    ))}
                    {melaStockLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                          No manual stock movements recorded yet.
                        </td>
                      </tr>
                    )}
                  </Table>
                </div>

                {/* Right Column: Register Stock & Manual Adjustments Forms */}
                <div className="space-y-6">
                  
                  {/* Form 1: Add Campaign Vehicle */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-855">
                          {editingMelaInventoryId ? "Edit Campaign Vehicle" : "Add Campaign Vehicle"}
                        </h3>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          {editingMelaInventoryId ? "Modify campaign specifications and pricing." : "Define specs and quantities for the Mela."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddVehicleOpen(true)}
                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#04a700] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-all"
                      >
                        + Add New Model
                      </button>
                    </div>

                    <form onSubmit={handleAddMelaInventorySubmit} className="space-y-3.5 text-xs font-semibold text-slate-655">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Model</label>
                        <select
                          value={melaInvModel}
                          onChange={(e) => {
                            if (e.target.value === "add_new") {
                              setIsAddVehicleOpen(true);
                              setMelaInvModel("");
                            } else {
                              setMelaInvModel(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        >
                          <option value="">-- Choose Model --</option>
                          {vehicleModelsList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.brand_name || m.brand} - {m.model_name}
                            </option>
                          ))}
                          <option value="add_new" className="text-emerald-600 font-bold bg-emerald-50">
                            + Add New Model (Master Registry)...
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variant</label>
                        <input
                          type="text"
                          placeholder="e.g. Red, Black, Green"
                          value={melaInvColor}
                          onChange={(e) => setMelaInvColor(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Type Option</label>
                        <select
                          value={melaInvBattery}
                          onChange={(e) => {
                            if (e.target.value === "add_new") {
                              setIsAddBatteryOpen(true);
                              setMelaInvBattery("graphene");
                            } else {
                              setMelaInvBattery(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        >
                          <option value="">-- Choose Battery Spec --</option>
                          {uniqueBatteryCapacities.map((cap) => (
                            <option key={cap} value={cap}>
                              {cap}
                            </option>
                          ))}
                          <option value="add_new" className="text-emerald-600 font-bold bg-emerald-50">
                            + Add New Battery (Master Registry)...
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Campaign Price</label>
                          <input
                            type="number"
                            placeholder="e.g. 65000"
                            value={melaInvPrice}
                            onChange={(e) => setMelaInvPrice(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Qty</label>
                          <input
                            type="number"
                            placeholder="e.g. 10"
                            value={melaInvQty}
                            onChange={(e) => setMelaInvQty(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-[#04a700]/25 transition-all text-center"
                      >
                        {editingMelaInventoryId ? "Update Campaign Stock" : "Register Campaign Stock"}
                      </button>
                      {editingMelaInventoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMelaInventoryId(null);
                            setMelaInvModel("");
                            setMelaInvColor("");
                            setMelaInvBattery("graphene");
                            setMelaInvQty("");
                            setMelaInvPrice("");
                          }}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all text-center mt-2 border border-slate-200"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>
                  </div>

                  {/* Form 2: Mela Stock Adjustments (In / Out) */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-855">Campaign Stock Adjustment</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Manually record Stock-In or Stock-Out actions for Mela vehicles.</p>
                    </div>

                    <form onSubmit={handleMelaStockAdjustmentSubmit} className="space-y-3.5 text-xs font-semibold text-slate-655">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Campaign Vehicle</label>
                        <select
                          value={melaAdjItem}
                          onChange={(e) => setMelaAdjItem(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        >
                          <option value="">-- Choose Campaign Item --</option>
                          {melaInventoryList.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.model_name} ({item.color} / {item.battery_type}) - Qty: {item.remaining_quantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
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

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Quantity</label>
                        <input
                          type="number"
                          placeholder="Quantity to add/subtract"
                          value={melaAdjQty}
                          onChange={(e) => setMelaAdjQty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Adjustment Notes / Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Supplier Refill, Damage Write-off"
                          value={melaAdjNotes}
                          onChange={(e) => setMelaAdjNotes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
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
              </div>
            </div>
          )}

          {activeTab === "mela_checkout" && (
            <div className="space-y-6 text-left max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Mela Cash Collection &amp; Order Checkout</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Enter the Booking ID given by the customer to verify details and complete cash delivery.</p>
                </div>

                <form onSubmit={handleMelaCheckoutSearch} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter Booking ID (e.g. MELA-20260623-1425)"
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
                          ? "bg-emerald-100 text-emerald-850"
                          : "bg-amber-100 text-amber-850 animate-pulse"
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
                          <div className="text-slate-850 font-extrabold mt-0.5">{melaFoundBooking.model_name}</div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Specs (Color / Battery)</label>
                          <div className="text-slate-800 font-extrabold capitalize mt-0.5">{melaFoundBooking.color} / {melaFoundBooking.battery_type}</div>
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
                        <div className="pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleMelaCheckoutComplete(melaFoundBooking.id)}
                            className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md shadow-[#04a700]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <DollarSign className="h-4.5 w-4.5" />
                            Collect Cash &amp; Finalize Order
                          </button>
                        </div>
                      )}

                      {melaFoundBooking.status === "completed" && (
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="h-4.5 w-4.5" />
                          <span>Order completed, fully paid, and delivered on {new Date(melaFoundBooking.completed_at).toLocaleString()}.</span>
                        </div>
                      )}
                    </div>
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
                headers={["Showroom Name", "Location City", "Manager Assigned", "Total Stock", "Sales Volume", "Monthly Target", "Target Achieved", "Status", "Actions"]}
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
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading branch outlets...</span>
                      </div>
                    </td>
                  </tr>
                ) : branchesList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <EmptyState 
                        title="No Showrooms Found" 
                        description="Register a new showroom or branch outlet using the Add Branch button above." 
                      />
                    </td>
                  </tr>
                ) : (
                  branchesList.map((branch, idx) => {
                    const targetPct = branch.target_achieved_pct !== undefined && branch.target_achieved_pct !== null ? `${branch.target_achieved_pct}%` : "0%";
                    return (
                      <tr key={branch.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{branch.name}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.address || "—"}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.manager_name || "—"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.total_stock !== undefined && branch.total_stock !== null ? `${branch.total_stock} Vehicles` : "0 Vehicles"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.sales_volume !== undefined && branch.sales_volume !== null ? `₹ ${parseFloat(branch.sales_volume).toLocaleString('en-IN')}` : "₹ 0"}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-500">{branch.monthly_target !== undefined && branch.monthly_target !== null ? `₹ ${parseFloat(branch.monthly_target).toLocaleString('en-IN')}` : "₹ 0"}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700 text-[11px]">{targetPct}</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: targetPct }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            branch.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button onClick={() => openEditBranch(branch)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold mr-3 cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleBranch(branch)} className="text-xs text-slate-450 hover:text-slate-600 font-bold cursor-pointer mr-3">Toggle Status</button>
                          <button onClick={() => handleDeleteBranch(branch.id)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </Table>
            </div>
          )}
          {/* TAB 3: VEHICLE MANAGEMENT */}
          {activeTab === "vehicles" && (
            <div className="space-y-6 text-left">
              {/* Header block with modern feel */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-805 tracking-tight">Vehicle Master Models Catalog</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Configure models, battery specifications, colors, and base retail pricing.</p>
                </div>
                <button 
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="flex items-center gap-1.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 transition-all"
                >
                  <Plus className="h-4 w-4" /> Add Model
                </button>
              </div>

              {vehiclesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-205 border-t-[#04a700]" />
                  <span className="text-xs font-semibold text-slate-405">Loading model catalog...</span>
                </div>
              ) : vehicleModelsList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                  <EmptyState title="No Models Registered" description="Click Add Model to populate the catalog." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicleModelsList.map((model, idx) => (
                    <div key={model.id || idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 overflow-hidden flex flex-col justify-between group">
                      {/* Premium Header */}
                      <div className="bg-[#0b1329] border-b border-slate-800 text-white px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                            {model.brand_name || "Kinetic"}
                          </span>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          model.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"
                        }`}>
                          {model.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Card Content with Bento Grid */}
                      <div className="p-5 space-y-4 text-left">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800 tracking-tight leading-none group-hover:text-[#04a700] transition-colors">{model.model_name}</h4>
                          <div className="flex items-baseline gap-1 mt-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Base Price</span>
                            <span className="text-lg font-black text-slate-900 font-mono">₹ {parseFloat(model.base_price).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Battery compatibility */}
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between min-h-[58px]">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              <Battery className="h-3.5 w-3.5 text-slate-400" />
                              <span>Battery Spec</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-700 truncate mt-1">{model.battery_compatibility || "1.2 kWh"}</span>
                          </div>

                          {/* Color variants */}
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between min-h-[58px]">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Color Options</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-700 truncate mt-1">{Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "Red, Blue, Green"}</span>
                          </div>

                          {/* Range */}
                          <div className="bg-emerald-50/20 border border-emerald-100/60 p-3 rounded-xl flex flex-col justify-between min-h-[58px]">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                              <Zap className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Est. Range</span>
                            </div>
                            <span className="text-xs font-black text-emerald-800 mt-1">140 km</span>
                          </div>

                          {/* Warranty */}
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between min-h-[58px]">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              <span className="text-[10px] text-slate-400 font-bold">🛡️</span>
                              <span>Warranty</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-700 mt-1">3 Yrs / 40K km</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex justify-end gap-3">
                        <button
                          onClick={() => openEditModel(model)}
                          className="text-[11px] font-extrabold text-[#04a700] hover:text-[#038a00] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="text-[11px] font-extrabold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Delete Catalog
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* TAB 4: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-6 text-left">
              {/* Summary metric strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Units In (MTD)", value: "24", icon: ArrowDownLeft, tint: "emerald" },
                  { label: "Units Out (MTD)", value: "18", icon: ArrowUpRight, tint: "blue" },
                  { label: "In Transit", value: "6", icon: Truck, tint: "amber" },
                  { label: "Pending Approval", value: "1", icon: AlertTriangle, tint: "rose" },
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
                    {[
                      { date: getDynamicDate(12, 0, "long"), model: "E-Luna Moped", vin: "KVRVIN2026X101", loc: "Pendurthi Godown", code: getDynamicCode("GRN", 12), carrier: "KVR Logistics", pdi: "Ramesh (Passed)", status: "Received" },
                      { date: getDynamicDate(10, 0, "long"), model: "Dynamo Pro", vin: "KVRVIN2026X102", loc: "Isakapallem Showroom", code: getDynamicCode("GRN", 8), carrier: "SafeExpress", pdi: "Suresh (Passed)", status: "Received" },
                    ].map((r, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">{r.model}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{r.vin}</div>
                          </div>
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{r.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[11px]">
                          <div><span className="text-slate-400 font-semibold">Location: </span><span className="font-bold text-slate-600">{r.loc}</span></div>
                          <div><span className="text-slate-400 font-semibold">GRN: </span><span className="font-bold text-slate-600">{r.code}</span></div>
                          <div><span className="text-slate-400 font-semibold">Carrier: </span><span className="font-bold text-slate-650">{r.carrier}</span></div>
                          <div><span className="text-slate-400 font-semibold">PDI: </span><span className="font-bold text-slate-650">{r.pdi}</span></div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-2">{r.date}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Out */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                    <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></span>
                    <h3 className="text-sm font-bold text-slate-800">Stock Outflow Log (Stock-Out)</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { date: getDynamicDate(13, 0, "long"), model: "Dynamo Pro", vin: "KVRVIN2026X102", dest: "Visakhapatnam City Outlet", ref: getDynamicCode("INV", 89), driver: "Somu Naidu", status: "Sold Dispatch", tint: "indigo" },
                      { date: getDynamicDate(11, 0, "long"), model: "Watts 100", vin: "KVRVIN2026X115", dest: "Kakinada Showroom", ref: getDynamicCode("TRN", 44), driver: "Appalaraju", status: "Internal Transfer", tint: "amber" },
                    ].map((r, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 truncate">{r.model}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{r.vin}</div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${r.tint === "indigo" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{r.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[11px]">
                          <div><span className="text-slate-400 font-semibold">Destination: </span><span className="font-bold text-slate-600">{r.dest}</span></div>
                          <div><span className="text-slate-400 font-semibold">Ref: </span><span className="font-bold text-slate-600">{r.ref}</span></div>
                          <div><span className="text-slate-400 font-semibold">Driver: </span><span className="font-bold text-slate-650">{r.driver}</span></div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-2">{r.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inter-branch transfers as responsive cards */}
              <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <span className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Truck className="h-4 w-4" /></span>
                  <h3 className="text-sm font-bold text-slate-800">Inter-Location / Inter-Branch Stock Transfers</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {[
                    { ref: getDynamicCode("TRN", 44), from: "Pendurthi Godown", to: "KVR Showroom - Visakhapatnam", qty: "Kinetic E-Luna (10 Units)", dispatch: getDynamicDate(14, 0, "long"), transit: "4 hours", arrival: `${getDynamicDate(14, 0, "short")}, 4:00 PM`, approval: "Approved (Suresh Babu)", status: "Completed", done: true },
                    { ref: getDynamicCode("TRN", 49), from: "Pineapple Colony Godown", to: "KVR Showroom - Srikakulam", qty: "Dynamo Pro (5 Units)", dispatch: getDynamicDate(18, 0, "long"), transit: "1 day", arrival: `${getDynamicDate(18, 0, "short")}, 6:00 PM`, approval: "Pending Review", status: "In Transit", done: false },
                  ].map((t, i) => (
                    <div key={i} className="rounded-xl border border-slate-105 bg-slate-50/40 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono font-bold text-slate-705 text-xs">{t.ref}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${t.done ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{t.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 mb-3">
                        <span className="truncate">{t.from}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#04a700] shrink-0" />
                        <span className="truncate">{t.to}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <div className="col-span-2"><span className="text-slate-400 font-semibold">Model: </span><span className="font-bold text-slate-600">{t.qty}</span></div>
                        <div><span className="text-slate-400 font-semibold">Dispatch: </span><span className="font-bold text-slate-650">{t.dispatch}</span></div>
                        <div><span className="text-slate-400 font-semibold">Transit: </span><span className="font-bold text-slate-655">{t.transit}</span></div>
                        <div><span className="text-slate-400 font-semibold">Arrival: </span><span className="font-bold text-slate-655">{t.arrival}</span></div>
                        <div><span className="text-slate-400 font-semibold">Approval: </span><span className="font-bold text-slate-655">{t.approval}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Inventory Stock Units (VIN Registry - Moved from Vehicles tab to Stock Management tab to keep operations grouped logically and fully functional) */}
              <Table 
                title="Physical Inventory Stock Units (VIN Registry)" 
                headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Branch Outlet", "Location Area", "Battery Assigned", "PDI Status", "Age in Stock", "Status", "Actions"]}
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
                      <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.assigned_battery || "N/A"}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Passed
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-650">5 days</td>
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
                        {inv.delivery_status === "delivered" && (
                          <span className="text-[10px] font-bold text-slate-300">Completed</span>
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
          {activeTab === "profile" && (
            <ProfileView />
          )}
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <BottomNav role="owner" activeTab={activeTab} />
      {/* MODALS */}
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
              type="text" 
              placeholder="e.g. 9876543210" 
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">Total Stock</label>
            <input 
              type="number" 
              placeholder="e.g. 120" 
              value={branchTotalStock}
              onChange={(e) => setBranchTotalStock(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.total_stock && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.total_stock}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Volume (INR)</label>
            <input 
              type="number" 
              step="any"
              placeholder="e.g. 11200000" 
              value={branchSalesVolume}
              onChange={(e) => setBranchSalesVolume(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.sales_volume && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.sales_volume}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Target (INR)</label>
            <input 
              type="number" 
              step="any"
              placeholder="e.g. 15000000" 
              value={branchMonthlyTarget}
              onChange={(e) => setBranchMonthlyTarget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.monthly_target && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.monthly_target}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Achieved (%)</label>
            <input 
              type="number" 
              placeholder="e.g. 74" 
              value={branchTargetPct}
              onChange={(e) => setBranchTargetPct(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
            {branchErrors.target_achieved_pct && <p className="text-red-500 text-[10px] font-bold mt-1">{branchErrors.target_achieved_pct}</p>}
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
              <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
              <input
                type="tel"
                value={newUser.phoneNumber}
                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              />
            </div>
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
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom Assignment</label>
              <select
                value={newUser.showroom}
                onChange={(e) => setNewUser({ ...newUser, showroom: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="">Select showroom...</option>
                {showroomsList.map((showroom) => (
                  <option key={showroom.id} value={showroom.name}>{showroom.name}</option>
                ))}
              </select>
            </div>
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
                onChange={(e) => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
                placeholder="e.g. 9876543210"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom Assignment</label>
              <select
                value={editUserForm.showroom}
                onChange={(e) => setEditUserForm({ ...editUserForm, showroom: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                required
              >
                <option value="">Select showroom...</option>
                {showroomsList.map((showroom) => (
                  <option key={showroom.id} value={showroom.name}>{showroom.name}</option>
                ))}
              </select>
            </div>
          </div>
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
              <label className="text-[10px] font-bold text-slate-400 uppercase">Model Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dynamo Pro" 
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Brand</label>
              <select 
                value={newModelBrand}
                onChange={(e) => setNewModelBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2.5 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required
              >
                <option value="">-- Select Brand --</option>
                {vehicleBrandsList.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
                {vehicleBrandsList.length === 0 && (
                  <option value="1">Kinetic Green</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Base Price (INR)</label>
              <input 
                type="number" 
                placeholder="e.g. 98500" 
                value={newModelPrice}
                onChange={(e) => setNewModelPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Compatibility</label>
              <input 
                type="text" 
                placeholder="e.g. 2.0 kWh Swappable" 
                value={newModelBattery}
                onChange={(e) => setNewModelBattery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
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
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Catalog Status</label>
            <select
              value={newModelStatus}
              onChange={(e) => setNewModelStatus(e.target.value as "active" | "inactive")}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2.5 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500"
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
      {/* 3. Add / Edit Stock Unit */}
      <Modal isOpen={isAddStockOpen} onClose={() => { setIsAddStockOpen(false); resetStockUnitForm(); }} title={editingUnitId ? "Edit Stock Unit (VIN Registry)" : "Log Physical Stock Unit Entry"}>
        <form onSubmit={handleStockUnitSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">VIN Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. KVRVIN2026X990"
                value={stockUnitForm.vin_number}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockUnitForm((prev) => {
                    const updates: any = { ...prev, vin_number: val };
                    if (!prev.motor_number || prev.motor_number === prev.vin_number) {
                      updates.motor_number = val;
                    }
                    if (!prev.chassis_number || prev.chassis_number === prev.vin_number) {
                      updates.chassis_number = val;
                    }
                    return updates;
                  });
                  if (vinLookupState !== "idle") setVinLookupState("idle");
                }}
                onBlur={(e) => handleIdentifierLookup("vin_number", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pr-9 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]"
              />
              {vinLookupState === "searching" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-slate-200 border-t-[#04a700] animate-spin" />
              )}
              {vinLookupState === "found" && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#04a700]" />
              )}
            </div>
            {vinLookupState === "found" && (
              <p className="text-[10px] font-bold text-[#04a700]">Existing unit found — details auto-filled. Saving will update this record.</p>
            )}
            {vinLookupState === "notfound" && stockUnitForm.vin_number.trim().length >= 3 && (
              <p className="text-[10px] font-semibold text-slate-400">New identifier — fill the details below.</p>
            )}
          </div>
          <div className="rounded-lg bg-[#04a700]/5 border border-[#04a700]/15 px-3 py-2">
            <p className="text-[10px] font-bold text-[#04a700]">Enter at least one identifier (VIN, Motor, or Chassis). Type any one — if the vehicle already exists, the rest auto-fill.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Motor Number</label>
              <input
                type="text"
                placeholder="e.g. MTR-90888"
                value={stockUnitForm.motor_number}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockUnitForm({ ...stockUnitForm, motor_number: val });
                  if (vinLookupState !== "idle") setVinLookupState("idle");
                }}
                onBlur={(e) => handleIdentifierLookup("motor_number", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Number</label>
              <input
                type="text"
                placeholder="e.g. CHS-88988"
                value={stockUnitForm.chassis_number}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockUnitForm({ ...stockUnitForm, chassis_number: val });
                  if (vinLookupState !== "idle") setVinLookupState("idle");
                }}
                onBlur={(e) => handleIdentifierLookup("chassis_number", e.target.value)}
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Outlet</label>
            <select
              value={stockUnitForm.branch}
              onChange={(e) => setStockUnitForm({ ...stockUnitForm, branch: e.target.value, showroom: "", location: "" })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            >
              <option value="">-- Select Branch --</option>
              {branchesList.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom</label>
              <select
                value={stockUnitForm.showroom}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, showroom: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700] disabled:opacity-50"
                required
                disabled={!stockUnitForm.branch}
              >
                <option value="">-- Select --</option>
                {branchShowrooms.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Location Area</label>
              <select
                value={stockUnitForm.location}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700] disabled:opacity-50"
                required
                disabled={!stockUnitForm.branch}
              >
                <option value="">-- Select --</option>
                {branchLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
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
              placeholder="e.g. 98765 43210"
              value={newLead.contact_number}
              onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value })}
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
                placeholder="e.g. 90000 12345"
                value={newBooking.contact_number}
                onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value })}
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
    </div>
  );
}
