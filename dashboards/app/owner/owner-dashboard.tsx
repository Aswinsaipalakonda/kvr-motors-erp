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
import { getBranches, createBranch, updateBranch, getInventoryLocations, getShowrooms } from "../services/branches";
import { getVehicleBrands, getVehicleModels, getVehicleUnits, createVehicleModel, updateVehicleModel, createVehicleUnit, updateVehicleUnit, deleteVehicleUnit, lookupVehicleUnit } from "../services/vehicles";
import { getLeads, createLead, updateLead } from "../services/leads";
import { getBookings, createBooking, updateBooking } from "../services/bookings";
import { getSalesInvoices, updateSalesInvoice } from "../services/sales";
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus } from "../services/purchases";
import { getLedgerEntries } from "../services/ledger";
import { getBatteries, createBattery, updateBattery, deleteBattery } from "../services/batteries";
import { getActivityLogs, ActivityLog } from "../services/activityLogs";
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
  Truck
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
export default function OwnerDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const initialTab = lastSegment === "owner" ? "dashboard" : lastSegment;
  const [activeTab, setActiveTab] = useState(initialTab);

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

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    try {
      const payload = {
        name: branchName.trim(),
        address: branchAddress.trim(),
        phone_number: branchPhone.trim(),
        is_active: branchActive
      };
      if (editingBranchId) {
        await updateBranch(editingBranchId, payload);
        showToast("Branch updated.");
      } else {
        await createBranch(payload);
        showToast("Branch registered.");
      }
      setEditingBranchId(null);
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      setBranchActive(true);
      setIsAddBranchOpen(false);
      loadBranches();
    } catch (err) {
      console.error("Failed to save branch showroom in PostgreSQL:", err);
      showToast("Failed to save branch.", "error");
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
    getInventoryLocations().then(setLocationsList).catch(() => {});
    getShowrooms().then(setShowroomsList).catch(() => {});
  }, []);
  const systemUsers = [
    { name: "Ravi Varma", role: "Owner", userType: "Admin", branch: "KVR Motors - Visakhapatnam", status: "Active", lastLogin: "13 May 2024 09:30 AM" },
    { name: "Suresh Babu", role: "Supervisor", userType: "Staff", branch: "KVR Motors - Visakhapatnam", status: "Active", lastLogin: "13 May 2024 08:15 AM" },
    { name: "Anil Kumar", role: "Sales Executive", userType: "Staff", branch: "KVR Motors - Visakhapatnam", status: "Active", lastLogin: "13 May 2024 09:10 AM" },
    { name: "Venkatesh", role: "Sales Staff", userType: "Staff", branch: "Future Ride - Visakhapatnam", status: "Active", lastLogin: "13 May 2024 07:45 AM" },
    { name: "Prasad", role: "Sales Executive", userType: "Staff", branch: "KVR Motors - Srikakulam", status: "Active", lastLogin: "12 May 2024 05:20 PM" },
    { name: "Mahesh", role: "Sales Staff", userType: "Staff", branch: "KVR Motors - Kakinada", status: "Inactive", lastLogin: "10 May 2024 04:35 PM" },
  ];
  
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
    fullName: "",
    email: "",
    role: "Sales Staff",
    branch: "KVR Motors - Visakhapatnam",
    status: "Active",
    userType: "Staff"
  });
  const [users, setUsers] = useState(systemUsers);

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
    setIsAddBranchOpen(true);
  };
  const handleToggleBranch = async (branch: any) => {
    try {
      await updateBranch(branch.id, { name: branch.name, address: branch.address, phone_number: branch.phone_number, is_active: !branch.is_active });
      showToast(`Branch ${branch.is_active ? "deactivated" : "activated"}.`);
      loadBranches();
    } catch { showToast("Failed to update branch.", "error"); }
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
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "" };
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
  const emptyBattery = { serial_number: "", capacity: "", purchase_date: "", location: "", supplier: "", warranty_years: "3", status: "available" };
  const [newBattery, setNewBattery] = useState({ ...emptyBattery });
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);

  const openEditBattery = (batt: any) => {
    setEditingBatteryId(batt.id);
    setNewBattery({
      serial_number: batt.serial || "",
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
        showToast("Battery logged to FIFO registry.");
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
    } else if (reportModule === "Battery FIFO Allocations") {
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
    } else if (reportModule === "Battery FIFO Allocations") {
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

  // DYNAMIC COMPUTATIONS & MEMOIZED AGGREGATES
  const salesOverviewData = React.useMemo(() => {
    if (salesInvoices.length === 0) {
      return [
        { name: "01 May", ThisMonth: 4500000, LastMonth: 4000000 },
        { name: "06 May", ThisMonth: 7200000, LastMonth: 6100000 },
        { name: "11 May", ThisMonth: 9500000, LastMonth: 8200000 },
        { name: "16 May", ThisMonth: 14500000, LastMonth: 12100000 },
        { name: "21 May", ThisMonth: 19800000, LastMonth: 17200000 },
        { name: "26 May", ThisMonth: 24580000, LastMonth: 21800000 },
      ];
    }
    const grouped: Record<string, number> = {};
    salesInvoices.forEach((inv) => {
      const date = new Date(inv.sale_date || inv.created_at);
      const dayStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      grouped[dayStr] = (grouped[dayStr] || 0) + parseFloat(inv.sale_price || 0);
    });
    const sorted = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    return sorted.map((dateStr) => {
      cumulative += grouped[dateStr];
      return {
        name: dateStr,
        ThisMonth: cumulative,
        LastMonth: Math.round(cumulative * 0.9)
      };
    });
  }, [salesInvoices]);

  const stockStatusData = React.useMemo(() => {
    const available = vehicleUnitsList.filter(u => u.stock_status === "available").length;
    const booked = vehicleUnitsList.filter(u => u.stock_status === "booked").length;
    const reserved = vehicleUnitsList.filter(u => u.stock_status === "reserved").length;
    const sold = vehicleUnitsList.filter(u => u.stock_status === "sold").length;
    
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
  }, [vehicleUnitsList]);

  const enquiryCount = leadsList.filter(l => l.status === "enquiry").length;
  const leadCount = leadsList.filter(l => l.status === "new_lead" || l.status === "contacted" || l.status === "follow_up").length;
  const negoCount = leadsList.filter(l => l.status === "negotiation").length;
  const wonCount = leadsList.filter(l => l.status === "won").length;

  const leadsFunnelData = [
    { name: "Enquiries", count: enquiryCount, color: "#3b82f6" },
    { name: "Leads", count: leadCount, color: "#6366f1" },
    { name: "Negotiation", count: negoCount, color: "#f59e0b" },
    { name: "Won", count: wonCount, color: "#10b981" },
  ];

  const recentActivities = React.useMemo(() => {
    const list: any[] = [];
    salesInvoices.forEach((inv) => {
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
        { id: 1, action: "Vehicle Stock In", ref: "GRN-2024-0512", location: "Pendurthi Godown", user: "Ramesh", time: "2 mins ago" },
        { id: 2, action: "Sale Invoice Created", ref: "INV-2024-0789", location: "Isakapallem Showroom", user: "Suresh", time: "15 mins ago" },
        { id: 3, action: "Purchase Invoice Created", ref: "PINV-2024-0321", location: "Pineapple Colony Godown", user: "Ramesh", time: "1 hour ago" },
        { id: 4, action: "Lead Converted to Sale", ref: "LD-2024-0156", location: "Kakinada Showroom", user: "Suresh", time: "2 hours ago" },
      ];
    }
    return list.slice(0, 4);
  }, [salesInvoices, purchaseOrders]);

  const topSellingModels = React.useMemo(() => {
    const counts: Record<string, number> = {};
    salesInvoices.forEach((inv) => {
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
  }, [salesInvoices]);

  const netCashflow = ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0);
  const totalSalesValue = salesInvoices.reduce((acc, curr) => acc + parseFloat(curr.sale_price || 0), 0);

  // Showrooms / locations filtered by the branch chosen in the stock-unit form
  const branchShowrooms = showroomsList.filter((s) => String(s.branch) === stockUnitForm.branch);
  const branchLocations = locationsList.filter((l) => String(l.branch) === stockUnitForm.branch);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
      
      {/* Sidebar - Leaves existing Sidebar.tsx alone, uses DashboardSidebar */}
      <DashboardSidebar role="owner" activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar role="owner" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />
        {/* Dashboard Views */}
        <main data-lenis-prevent className={`flex-1 p-4 pb-24 lg:pb-4 smooth-scroll ${activeTab === "dashboard" ? "overflow-y-auto flex flex-col space-y-4 bg-[#FAFDFB]" : "overflow-y-auto space-y-6"}`}>
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
                        <CalendarDays className="h-3 w-3" /> 01 May – 31 May 2024
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
                  title="Total Sales" 
                  value={salesInvoicesLoading ? "..." : "₹ " + totalSalesValue.toLocaleString('en-IN')} 
                  trend="↑ 12.8%" 
                  trendType="success" 
                  description="Dynamic sales volume" 
                  icon={DollarSign} 
                  color="emerald" 
                  onClick={() => navigateTo("sales")}
                />
                <DashboardCard 
                  title="Total Purchases" 
                  value={purchaseOrdersLoading ? "..." : "₹ " + purchaseOrders.filter(po => po.status === "approved" || po.status === "received").reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0).toLocaleString('en-IN')} 
                  trend="↓ 6.2%" 
                  trendType="danger" 
                  description="Approved PO total" 
                  icon={ShoppingBag} 
                  color="rose" 
                  onClick={() => navigateTo("purchases")}
                />
                <DashboardCard 
                  title="Vehicles in Stock" 
                  value={vehiclesLoading ? "..." : `${vehicleUnitsList.filter(u => u.stock_status === "available").length} Units`} 
                  trend="↑ 8.4%" 
                  trendType="success" 
                  description="Available units" 
                  icon={Car} 
                  color="blue" 
                  onClick={() => navigateTo("vehicles")}
                />
                <DashboardCard 
                  title="Total Leads" 
                  value={`${leadsLoading ? "..." : leadsList.length} Leads`} 
                  trend="↑ 15.3%" 
                  trendType="success" 
                  description="Inflow conversion pace" 
                  icon={Compass} 
                  color="amber" 
                  onClick={() => navigateTo("leads")}
                />
                <DashboardCard 
                  title="Receivables" 
                  value={advanceBookingsLoading ? "..." : "₹ " + advanceBookings.filter(b => b.status === "confirmed").reduce((acc, curr) => acc + parseFloat(curr.advance_amount || 0), 0).toLocaleString('en-IN')} 
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
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight">Sales Analytics Overview</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Real-time cumulative sales volume dynamically updated</p>
                    </div>
                    <div className="flex items-center gap-3.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#04a700]" /> This Month</span>
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Last Month</span>
                    </div>
                  </div>
                  
                  <div className="h-[320px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={salesOverviewData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="glowBrandGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#04a700" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#04a700" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹ ${(val / 100000).toFixed(0)}L`} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                        <Tooltip formatter={(value: any) => [`₹ ${value.toLocaleString()}`, "Sales"]} />
                        <Area type="monotone" dataKey="ThisMonth" stroke="#04a700" strokeWidth={2.5} fillOpacity={1} fill="url(#glowBrandGreen)" name="This Month" />
                        <Area type="monotone" dataKey="LastMonth" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} name="Last Month" />
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
                      <span className="text-2xl font-black text-slate-800 font-mono">{vehiclesLoading ? "..." : vehicleUnitsList.length}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total units</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                    const targetPct = branch.targetPct || "74%";
                    return (
                      <tr key={branch.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{branch.name}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.address || "Visakhapatnam City"}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.phone_number || "Suresh Babu"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.stock || 120} Vehicles</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.sales || "₹ 1,12,00,000"}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-500">{branch.monthlyTarget || "₹ 1,50,00,000"}</td>
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
                          <button onClick={() => handleToggleBranch(branch)} className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Toggle Status</button>
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
            <div className="space-y-8">
              
              {/* Vehicle Master Models catalog */}
              <Table 
                title="Vehicle Master Models Catalog" 
                headers={["Model Name", "Brand", "Category", "Base Price", "Color Variants", "Battery Spec", "Warranty Period", "Range (km)", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Model
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-indigo-600" />
                         <span>Loading model catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleModelsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <EmptyState title="No Models Registered" description="Click Add Model to populate the catalog." />
                    </td>
                  </tr>
                ) : (
                  vehicleModelsList.map((model, idx) => (
                    <tr key={model.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{model.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{model.brand_name || "Kinetic"}</td>
                      <td className="py-3.5 px-5 text-slate-605">Electric</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(model.base_price).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">{Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "Green"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{model.battery_compatibility || "1.2 kWh"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">3 Yrs / 40K km</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-700">140 km</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          model.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {model.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button onClick={() => openEditModel(model)} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">Edit Model</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
              {/* Physical Stock Units tracking */}
              <Table 
                title="Physical Inventory Stock Units (VIN Registry)" 
                headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Branch Outlet", "Location Area", "Battery Assigned", "PDI Status", "Age in Stock", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={openAddStockUnit}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Stock Unit
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-indigo-600" />
                        <span>Loading physical units registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleUnitsList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center">
                      <EmptyState title="No Stock Units Found" description="No physical stock units registered." />
                    </td>
                  </tr>
                ) : (
                  vehicleUnitsList.map((unit, idx) => (
                    <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.motor_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.chassis_number || "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{unit.color}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.branch_name || "Visakhapatnam"}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{unit.location_name || "Warehouse"}</td>
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
          {/* TAB 4: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-5">
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
                    blue: "bg-blue-50 text-blue-600",
                    amber: "bg-amber-50 text-amber-600",
                    rose: "bg-rose-50 text-rose-600",
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
                      { date: "12 May 2024", model: "E-Luna Moped", vin: "KVRVIN2026X101", loc: "Pendurthi Godown", code: "GRN-2024-0512", carrier: "KVR Logistics", pdi: "Ramesh (Passed)", status: "Received" },
                      { date: "10 May 2024", model: "Dynamo Pro", vin: "KVRVIN2026X102", loc: "Isakapallem Showroom", code: "GRN-2024-0508", carrier: "SafeExpress", pdi: "Suresh (Passed)", status: "Received" },
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
                          <div><span className="text-slate-400 font-semibold">Carrier: </span><span className="font-bold text-slate-600">{r.carrier}</span></div>
                          <div><span className="text-slate-400 font-semibold">PDI: </span><span className="font-bold text-slate-600">{r.pdi}</span></div>
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
                      { date: "13 May 2024", model: "Dynamo Pro", vin: "KVRVIN2026X102", dest: "Visakhapatnam City Outlet", ref: "INV-2024-0789", driver: "Somu Naidu", status: "Sold Dispatch", tint: "indigo" },
                      { date: "11 May 2024", model: "Watts 100", vin: "KVRVIN2026X115", dest: "Kakinada Showroom", ref: "TRN-2024-0044", driver: "Appalaraju", status: "Internal Transfer", tint: "amber" },
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
                          <div><span className="text-slate-400 font-semibold">Driver: </span><span className="font-bold text-slate-600">{r.driver}</span></div>
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
                    { ref: "TRN-2024-0044", from: "Pendurthi Godown", to: "KVR Showroom - Visakhapatnam", qty: "Kinetic E-Luna (10 Units)", dispatch: "14 May 2024", transit: "4 hours", arrival: "14 May, 4:00 PM", approval: "Approved (Suresh Babu)", status: "Completed", done: true },
                    { ref: "TRN-2024-0049", from: "Pineapple Colony Godown", to: "KVR Showroom - Srikakulam", qty: "Dynamo Pro (5 Units)", dispatch: "18 May 2024", transit: "1 day", arrival: "18 May, 6:00 PM", approval: "Pending Review", status: "In Transit", done: false },
                  ].map((t, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono font-bold text-slate-700 text-xs">{t.ref}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${t.done ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{t.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 mb-3">
                        <span className="truncate">{t.from}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#04a700] shrink-0" />
                        <span className="truncate">{t.to}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                        <div className="col-span-2"><span className="text-slate-400 font-semibold">Model: </span><span className="font-bold text-slate-600">{t.qty}</span></div>
                        <div><span className="text-slate-400 font-semibold">Dispatch: </span><span className="font-bold text-slate-600">{t.dispatch}</span></div>
                        <div><span className="text-slate-400 font-semibold">Transit: </span><span className="font-bold text-slate-600">{t.transit}</span></div>
                        <div><span className="text-slate-400 font-semibold">Arrival: </span><span className="font-bold text-slate-600">{t.arrival}</span></div>
                        <div><span className="text-slate-400 font-semibold">Approval: </span><span className="font-bold text-slate-600">{t.approval}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                                <p className="text-[10px] text-slate-500 font-semibold leading-snug">{lead.contact_number}</p>
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
                        <button onClick={() => handleCancelBooking(bk)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Cancel</button>
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
                  <h4 className="text-sm font-bold text-amber-800">FIFO Stock Enforcement Protocol</h4>
                  <p className="text-xs text-amber-600 font-semibold mt-1">
                    System rules dictate that the oldest batteries purchased must be assigned to customer delivery invoices first.
                    Selecting a battery with a newer purchase date will trigger an override request block requiring Supervisor approval.
                  </p>
                </div>
              </div>
              <Table 
                title="Battery Storage Units (FIFO Registry)" 
                headers={["Battery Serial", "Capacity Rating", "Date Acquired", "Assigned EV", "Location Storage", "Manufacturer Corp", "Warranty Years", "Status", "Actions"]}
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
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading battery stock...</span>
                      </div>
                    </td>
                  </tr>
                ) : batteriesStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
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
                      <option>Battery FIFO Allocations</option>
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
                      <option>This Month (May 2026)</option>
                      <option>Last Month (April 2026)</option>
                      <option>Year to Date (2026)</option>
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
                      <span>KVR-Visakhapatnam Showroom • Delivered (INV-2024-0789)</span>
                      <span className="font-bold text-slate-800">₹ 98,500</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>KVR-Srikakulam Showroom • Delivered (INV-2024-0791)</span>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
                  >
                    <option>All Branches</option>
                    <option>KVR Motors - Visakhapatnam</option>
                    <option>Future Ride - Visakhapatnam</option>
                    <option>KVR Motors - Srikakulam</option>
                    <option>KVR Motors - Kakinada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">User Type</label>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
                  >
                    <option>All Roles</option>
                    <option>Owner</option>
                    <option>Supervisor</option>
                    <option>Sales Executive</option>
                    <option>Sales Staff</option>
                  </select>
                </div>
              </div>
              <Table title="Staff Directory & Role Assignments" headers={["Full Name", "Assigned Role", "User Type", "Branch Outlet", "Account Status", "Last Active Login"]}>
                {users
                  .filter((user) =>
                    (userBranchFilter === "All Branches" || user.branch === userBranchFilter) &&
                    (userTypeFilter === "All Types" || user.userType === userTypeFilter) &&
                    (userRoleFilter === "All Roles" || user.role === userRoleFilter)
                  )
                  .map((user, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{user.name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.role}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.userType}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.branch}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          user.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{user.lastLogin}</td>
                    </tr>
                  ))}
              </Table>
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
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <BottomNav role="owner" activeTab={activeTab} />
      {/* MODALS */}
      <Modal isOpen={isAddBranchOpen} onClose={() => { setIsAddBranchOpen(false); setEditingBranchId(null); setBranchName(""); setBranchAddress(""); setBranchPhone(""); setBranchActive(true); }} title={editingBranchId ? "Edit Showroom / Branch Outlet" : "Create New Showroom / Branch Outlet"}>
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
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Phone / Manager</label>
            <input 
              type="text" 
              placeholder="e.g. 9876543210" 
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]" 
              required 
            />
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setUsers([{ name: newUser.fullName, role: newUser.role, userType: newUser.userType, branch: newUser.branch, status: newUser.status, lastLogin: "Not yet logged in" }, ...users]);
            setNewUser({ fullName: "", email: "", role: "Sales Staff", branch: "KVR Motors - Visakhapatnam", status: "Active", userType: "Staff" });
            setIsAddUserOpen(false);
          }}
          className="space-y-4 text-left"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
            <input
              type="text"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              placeholder="e.g. Nikhil Rao"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="e.g. nikhil@kvrmotors.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Owner</option>
                <option>Supervisor</option>
                <option>Sales Executive</option>
                <option>Sales Staff</option>
                <option>Telecaller</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">User Type</label>
              <select
                value={newUser.userType}
                onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Admin</option>
                <option>Staff</option>
                <option>Customer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Assignment</label>
              <select
                value={newUser.branch}
                onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>KVR Motors - Visakhapatnam</option>
                <option>Future Ride - Visakhapatnam</option>
                <option>KVR Motors - Srikakulam</option>
                <option>KVR Motors - Kakinada</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Account Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            Create User
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
                onChange={(e) => { setStockUnitForm({ ...stockUnitForm, vin_number: e.target.value }); if (vinLookupState !== "idle") setVinLookupState("idle"); }}
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
              <input type="text" placeholder="e.g. MTR-90888" value={stockUnitForm.motor_number} onChange={(e) => { setStockUnitForm({ ...stockUnitForm, motor_number: e.target.value }); if (vinLookupState !== "idle") setVinLookupState("idle"); }} onBlur={(e) => handleIdentifierLookup("motor_number", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Number</label>
              <input type="text" placeholder="e.g. CHS-88988" value={stockUnitForm.chassis_number} onChange={(e) => { setStockUnitForm({ ...stockUnitForm, chassis_number: e.target.value }); if (vinLookupState !== "idle") setVinLookupState("idle"); }} onBlur={(e) => handleIdentifierLookup("chassis_number", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold font-mono outline-none focus:border-[#04a700]" />
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
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer">
            {editingLeadId ? "Save Changes" : "Add Lead to Pipeline"}
          </button>
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
      <Modal isOpen={isAddBatteryOpen} onClose={() => { setIsAddBatteryOpen(false); setEditingBatteryId(null); setNewBattery({ ...emptyBattery }); }} title={editingBatteryId ? "Edit Battery Stock" : "Log Battery Stock (FIFO Registry)"}>
        <form onSubmit={handleCreateBattery} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
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
