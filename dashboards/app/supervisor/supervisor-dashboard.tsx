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
import AttendanceView from "../components/AttendanceView";
import BranchExpenseView from "../components/BranchExpenseView";
import IssueReportView from "../components/IssueReportView";
import DashboardSmoothScroll from "../components/DashboardSmoothScroll";
import Toast from "../components/Toast";
import SearchableSelect from "../components/SearchableSelect";
import { useAuth } from "../context/AuthContext";

import { getBranches, getInventoryLocations, getShowrooms, getStockTransfers, updateStockTransfer, createStockTransfer } from "../services/branches";
import { getVehicleBrands, getVehicleModels, getVehicleUnits, createVehicleModel, updateVehicleModel, createVehicleUnit, updateVehicleUnit, deleteVehicleUnit, lookupVehicleUnit } from "../services/vehicles";
import { getLeads, createLead, updateLead } from "../services/leads";
import { getUsers } from "../services/users";
import { getBookings, createBooking, updateBooking } from "../services/bookings";
import { getSalesInvoices, updateSalesInvoice } from "../services/sales";
import { getBatteries, createBattery, updateBattery, deleteBattery, getFifoOverrides, updateFifoOverride } from "../services/batteries";
import { getAttendanceLogs, verifyAttendance, AttendanceRecord } from "../services/attendance";

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
  Search,
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
  Battery as BatteryIcon,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Clock,
  Boxes,
  Phone,
  RefreshCw,
  MapPin,
  MessageSquare,
  Share2
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

export default function SupervisorDashboard({ initialTab: initialTabProp }: { initialTab?: string } = {}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const derivedTab = lastSegment === "supervisor" ? "dashboard" : lastSegment;
  const initialTab = initialTabProp || derivedTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with browser back/forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "supervisor" ? "dashboard" : segment;
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadModelSearch, setLeadModelSearch] = useState("");
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddBatteryOpen, setIsAddBatteryOpen] = useState(false);
  const [isRequestTransferOpen, setIsRequestTransferOpen] = useState(false);
  const [selectedTransferUnit, setSelectedTransferUnit] = useState<any>(null);
  const [requestPriority, setRequestPriority] = useState("Medium");
  const [requestDestinationLocation, setRequestDestinationLocation] = useState("");

  // Live data states
  const [liveOverridesList, setLiveOverridesList] = useState<any[]>([]);
  const [liveOverridesLoading, setLiveOverridesLoading] = useState(true);

  const [vehicleBrandsList, setVehicleBrandsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [vehicleUnitsList, setVehicleUnitsList] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<string>("All");

  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [advanceBookings, setAdvanceBookings] = useState<any[]>([]);
  const [advanceBookingsLoading, setAdvanceBookingsLoading] = useState(true);

  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [salesInvoicesLoading, setSalesInvoicesLoading] = useState(true);

  const [batteriesStock, setBatteriesStock] = useState<any[]>([]);
  const [batteriesLoading, setBatteriesLoading] = useState(true);

  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [showroomsList, setShowroomsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState("All Statuses");
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<number[]>([]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Static Supervisor alerts
  const [staticAlerts, setStaticAlerts] = useState<any[]>([
    { id: "static-2", type: "Expiring Insurance Soon", details: "Vehicle KVRVIN2026X112 insurance expires in 8 days (Visakhapatnam Showroom)", active: true },
    { id: "static-3", type: "RC Expiring Soon", details: "Vehicle KVRVIN2026X105 registration certificate expires in 5 days", active: true }
  ]);

  const alerts = React.useMemo(() => {
    const list = [...staticAlerts.filter(a => a.active)];
    advanceBookings.filter(b => b.pdi_verified === "pending").forEach((b) => {
      list.push({
        id: `booking-${b.id}`,
        bookingId: b.id,
        bookingRef: b.booking_id,
        type: "Pending PDI",
        details: `Pre-delivery inspection pending for booking ${b.booking_id} (Customer: ${b.customer_name})`,
        active: true
      });
    });
    return list;
  }, [staticAlerts, advanceBookings]);

  const [transfers, setTransfers] = useState<any[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(true);

  // CRUD Form States
  // 1. Vehicle Model
  const [editingModelId, setEditingModelId] = useState<number | null>(null);
  const [newModelBrand, setNewModelBrand] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelPrice, setNewModelPrice] = useState("");
  const [newModelBattery, setNewModelBattery] = useState("");
  const [newModelColors, setNewModelColors] = useState("");
  const [newModelStatus, setNewModelStatus] = useState<"active" | "inactive">("active");

  // 2. Stock Unit (VIN registry)
  const emptyStockUnit = {
    model: "", branch: "", showroom: "", location: "",
    vin_number: "", motor_number: "", chassis_number: "", color: "",
    purchase_date: "", stock_status: "available", assigned_battery: "",
    purchase_invoice_number: "", payment_status: "success",
    quantity: "1",
  };
  const [stockUnitForm, setStockUnitForm] = useState({ ...emptyStockUnit });
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [vinLookupState, setVinLookupState] = useState<"idle" | "searching" | "found" | "notfound">("idle");

  // 3. Lead CRUD & Kanban
  const [usersList, setUsersList] = useState<any[]>([]);
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "", assigned_executive: "" as string | number | null };
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // 4. Booking CRUD
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    contact_number: "",
    vehicle_model: "",
    advance_amount: "",
    expiry_date: "",
    payment_mode: "Cash",
    payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" }
  });
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);

  // 5. Battery CRUD
  const emptyBattery = { serial_number: "", battery_code: "", capacity: "", purchase_date: "", location: "", supplier: "", warranty_years: "3", status: "available" };
  const [newBattery, setNewBattery] = useState({ ...emptyBattery });
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);

  // 6. Payment Verification & Order Closure Modal States
  const [isPaymentVerificationOpen, setIsPaymentVerificationOpen] = useState(false);
  const [verifyingInvoice, setVerifyingInvoice] = useState<any>(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("SBI Finance");
  const [paymentProofImage, setPaymentProofImage] = useState("");
  const [editSplitCash, setEditSplitCash] = useState("");
  const [editSplitUpi, setEditSplitUpi] = useState("");
  const [editSplitCard, setEditSplitCard] = useState("");
  const [editSplitFinance, setEditSplitFinance] = useState("");

  const openVerificationModal = (inv: any) => {
    setVerifyingInvoice(inv);
    setEditCustomerName(inv.customer_name || "");
    setEditCustomerPhone(inv.customer_contact || "");
    setEditPaymentMode(inv.payment_mode || "SBI Finance");
    setPaymentProofImage(inv.payment_proof || "");
    const splitObj = inv.payment_split_details || {};
    setEditSplitCash(splitObj.cash ? String(splitObj.cash) : "");
    setEditSplitUpi(splitObj.upi ? String(splitObj.upi) : "");
    setEditSplitCard(splitObj.card ? String(splitObj.card) : "");
    setEditSplitFinance(splitObj.finance || splitObj.bajaj_finance ? String(splitObj.finance || splitObj.bajaj_finance) : "");
    setIsPaymentVerificationOpen(true);
  };

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be under 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofImage(reader.result as string);
        showToast("Payment receipt screenshot uploaded. ✓");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPaymentAndCloseSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingInvoice?.id) return;
    if (!editCustomerName.trim()) {
      showToast("Please enter customer name.", "error");
      return;
    }
    const cleanPhone = editCustomerPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Contact number must contain exactly 10 digits.", "error");
      return;
    }

    const isPureCash = editPaymentMode === "Cash";
    if (!isPureCash && !paymentProofImage) {
      showToast("Please upload payment receipt / screenshot proof before confirming sale.", "error");
      return;
    }

    let splitDetails: any = null;
    if (editPaymentMode === "Split Payment") {
      const c = parseFloat(editSplitCash) || 0;
      const u = parseFloat(editSplitUpi) || 0;
      const cd = parseFloat(editSplitCard) || 0;
      const f = parseFloat(editSplitFinance) || 0;
      const totalSplit = c + u + cd + f;
      const salePrice = parseFloat(verifyingInvoice.sale_price) || 0;
      if (totalSplit <= 0) {
        showToast("Please specify split payment amounts.", "error");
        return;
      }
      if (salePrice > 0 && Math.abs(totalSplit - salePrice) > 1) {
        showToast(`Split sum (₹${totalSplit.toLocaleString("en-IN")}) must equal sale price (₹${salePrice.toLocaleString("en-IN")}).`, "error");
        return;
      }
      splitDetails = { cash: c, upi: u, card: cd, finance: f };
    }

    try {
      const payload: any = {
        customer_name: editCustomerName.trim(),
        customer_contact: cleanPhone,
        payment_mode: editPaymentMode,
        payment_split_details: splitDetails,
        delivery_status: "ready"
      };
      if (paymentProofImage) {
        payload.payment_proof = paymentProofImage;
      }
      await updateSalesInvoice(verifyingInvoice.id, payload);

      // Update matching lead status to won (sale completed)
      try {
        const leads = await getLeads();
        const matchingLead = leads.find((l: any) => l.contact_number === cleanPhone || l.customer_name?.toLowerCase() === editCustomerName.trim().toLowerCase());
        if (matchingLead) {
          await updateLead(matchingLead.id, { status: "won" });
        }
      } catch (leadErr) {
        console.error("Auto lead won status sync error:", leadErr);
      }

      showToast("Payment verified & sale closed! Stock marked SOLD. ✓");
      setIsPaymentVerificationOpen(false);
      setVerifyingInvoice(null);
      loadSales();
      loadVehicles();
      loadBatteries();
      loadLeads();
    } catch (err: any) {
      console.error("Payment verification failure:", err);
      const serverErr = err.response?.data;
      let msg = "Failed to verify payment and close sale.";
      if (serverErr) {
        if (typeof serverErr === "string") msg = serverErr;
        else if (typeof serverErr === "object") {
          msg = Object.entries(serverErr)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
            .join(" | ");
        }
      }
      showToast(msg, "error");
    }
  };

  // Tab navigation
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/supervisor" : `/supervisor/${tab}`;
    window.history.pushState({ path }, "", path);
  };

  // API loaders
  const loadVehicles = async (isSilent = false) => {
    try {
      if (!isSilent) setVehiclesLoading(true);
      const [brands, models, units] = await Promise.all([
        getVehicleBrands(),
        getVehicleModels(),
        getVehicleUnits()
      ]);
      setVehicleBrandsList(brands);
      setVehicleModelsList(models);
      setVehicleUnitsList(units);
    } catch (e) {
      console.error("Failed to load vehicle catalog:", e);
    } finally {
      if (!isSilent) setVehiclesLoading(false);
    }
  };

  const loadLeads = async (isSilent = false) => {
    try {
      if (!isSilent) setLeadsLoading(true);
      const data = await getLeads();
      if (user) {
        const myBranch = (user.branch || user.showroom || "").toLowerCase();
        const filtered = data.filter((lead: any) => {
          if (lead.assigned_executive === user.id) return true;
          if (!myBranch) return true;
          const leadBranch = (lead.branch_name || lead.showroom_name || "").toLowerCase();
          return !leadBranch || leadBranch.includes(myBranch) || myBranch.includes(leadBranch);
        });
        setLeadsList(filtered);
      } else {
        setLeadsList(data);
      }
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      if (!isSilent) setLeadsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (e) {
      console.error("Failed to load staff list:", e);
    }
  };

  const loadBookings = async (isSilent = false) => {
    try {
      if (!isSilent) setAdvanceBookingsLoading(true);
      const data = await getBookings();
      setAdvanceBookings(data);
    } catch (e) {
      console.error("Failed to load bookings:", e);
    } finally {
      if (!isSilent) setAdvanceBookingsLoading(false);
    }
  };

  const loadSales = async (isSilent = false) => {
    try {
      if (!isSilent) setSalesInvoicesLoading(true);
      const data = await getSalesInvoices();
      setSalesInvoices(data);
    } catch (e) {
      console.error("Failed to load sales invoices:", e);
    } finally {
      if (!isSilent) setSalesInvoicesLoading(false);
    }
  };

  const loadBatteries = async (isSilent = false) => {
    try {
      if (!isSilent) setBatteriesLoading(true);
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
        supplier: b.supplier || b.supplier_name || "Unknown",
        warrantyYearsRaw: b.warranty_years || 3,
        soh: "98%"
      }));
      setBatteriesStock(mapped);
    } catch (e) {
      console.error("Failed to load batteries:", e);
    } finally {
      if (!isSilent) setBatteriesLoading(false);
    }
  };

  const loadOverrides = async (isSilent = false) => {
    try {
      if (!isSilent) setLiveOverridesLoading(true);
      const data = await getFifoOverrides();
      setLiveOverridesList(data);
    } catch (e) {
      console.error("Failed to load FIFO overrides:", e);
    } finally {
      if (!isSilent) setLiveOverridesLoading(false);
    }
  };

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
        status: t.status === "pending" ? "Pending Approval" : t.status === "approved" ? "Approved" : t.status === "rejected" ? "Rejected" : t.status_display || "Pending Approval"
      }));
      setTransfers(mapped);
    } catch (e) {
      console.error("Failed to load stock transfers:", e);
    } finally {
      if (!isSilent) setTransfersLoading(false);
    }
  };

  const loadAttendance = async (isSilent = false) => {
    try {
      if (!isSilent) setAttendanceLoading(true);
      const data = await getAttendanceLogs();
      setAttendanceList(data);
    } catch (e) {
      console.error("Failed to load branch attendance:", e);
    } finally {
      if (!isSilent) setAttendanceLoading(false);
    }
  };

  const handleVerifyAttendance = async (id: number, status: "verified" | "rejected", remarks: string = "") => {
    try {
      await verifyAttendance(id, status, remarks);
      showToast(`Staff check-in marked as ${status}.`);
      loadAttendance();
    } catch {
      showToast("Failed to verify attendance.", "error");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadVehicles();
    loadLeads();
    loadBookings();
    loadSales();
    loadBatteries();
    loadOverrides();
    loadTransfers();
    loadUsers();
    loadAttendance();
    getInventoryLocations().then(setLocationsList).catch(() => {});
    getShowrooms().then(setShowroomsList).catch(() => {});
    getBranches().then(setBranchesList).catch(() => {});

    const interval = setInterval(() => {
      loadOverrides(true);
      loadLeads(true);
      loadBookings(true);
      loadSales(true);
      loadVehicles(true);
      loadBatteries(true);
      loadTransfers(true);
      loadUsers();
      loadAttendance(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Handlers ---
  // FIFO Overrides
  const handleApproveOverrideRequest = async (id: number, status: "approved" | "rejected") => {
    try {
      await updateFifoOverride(id, {
        status: status,
        reviewed_by: "Suresh Babu"
      });
      showToast(`FIFO Override ${status}.`);
      loadOverrides();
    } catch (e) {
      showToast("Failed to process override request.", "error");
    }
  };

  // Vehicles Catalog Handlers
  const openEditModel = (model: any) => {
    setEditingModelId(model.id);
    setNewModelBrand(String(model.brand || ""));
    setNewModelName(model.model_name || "");
    const parsedPrice = Math.round(parseFloat(model.base_price || 0));
    setNewModelPrice(isNaN(parsedPrice) || parsedPrice === 0 ? "" : String(parsedPrice));
    setNewModelBattery(model.battery_compatibility || "");
    setNewModelColors(Array.isArray(model.color_variants) ? model.color_variants.join(", ") : (model.color_variants || ""));
    setNewModelStatus(model.status === "inactive" ? "inactive" : "active");
    setIsAddVehicleOpen(true);
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

  const handleToggleBrandActive = async (brand: any) => {
    const newStatus = brand.is_active === false ? true : false;
    try {
      await api.patch(`/vehicle-brands/${brand.id}/`, { is_active: newStatus });
      showToast(`Brand "${brand.name}" set to ${newStatus ? "ACTIVE" : "INACTIVE"}.`, "success");
      const brands = await getVehicleBrands();
      setVehicleBrandsList(brands);
    } catch (err: any) {
      console.error("Failed to update brand status:", err);
      showToast("Failed to change brand status.", "error");
    }
  };

  // Physical Stock Units Handlers
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

  const handleIdentifierLookup = async (field: string, raw: string) => {
    const q = raw.trim();
    if (q.length < 3) {
      setVinLookupState("idle");
      return;
    }
    setVinLookupState("searching");

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

    // Auto-resolve primary showroom and inventory location for the selected branch dynamically
    const branchId = parseInt(f.branch);
    const branchObj = branchesList.find((b) => b.id === branchId);
    const showroomId = branchObj?.showrooms?.[0]?.id || (branchObj?.showrooms?.length ? branchObj.showrooms[0].id : 1);
    const locationId = branchObj?.inventory_locations?.[0]?.id || (branchObj?.inventory_locations?.length ? branchObj.inventory_locations[0].id : 1);

    const payload = {
      model: parseInt(f.model),
      branch: branchId,
      showroom: showroomId,
      location: locationId,
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
    if (!window.confirm(`Delete stock unit ${unit.vin_number || "this"}?`)) return;
    try {
      await deleteVehicleUnit(unit.id);
      showToast("Stock unit removed.");
      loadVehicles();
    } catch { showToast("Failed to delete stock unit.", "error"); }
  };

  const openRequestTransfer = (unit: any) => {
    setSelectedTransferUnit(unit);
    // Auto-select first matching destination location for supervisor's showroom if available
    const myShowroomObj = showroomsList.find(s => s.name === user?.showroom);
    const myLocations = locationsList.filter(l => l.showroom === myShowroomObj?.id);
    if (myLocations.length > 0) {
      setRequestDestinationLocation(String(myLocations[0].id));
    } else {
      setRequestDestinationLocation("");
    }
    setRequestPriority("Medium");
    setIsRequestTransferOpen(true);
  };

  const handleRequestTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferUnit || !requestDestinationLocation) {
      showToast("Please select a target destination location.", "error");
      return;
    }
    try {
      const myLocationId = parseInt(requestDestinationLocation);
      const trfId = "TRF-" + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      
      await createStockTransfer({
        transfer_id: trfId,
        vehicle_unit: selectedTransferUnit.id,
        from_location: selectedTransferUnit.location,
        to_location: myLocationId,
        status: "pending",
        requested_by: user?.id
      });
      showToast("Stock transfer request submitted successfully!");
      setIsRequestTransferOpen(false);
      setSelectedTransferUnit(null);
      loadTransfers();
    } catch (err) {
      console.error(err);
      showToast("Failed to request stock transfer.", "error");
    }
  };

  // Leads CRUD & Drag-Drop Kanban
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
    const vId = parseInt(newLead.interested_vehicle);
    // Check if paired vehicle stock is available in stockUnitsList
    const pairedStockAvailable = vehicleUnitsList.some(
      (u: any) => u.model === vId && (u.stock_status === "available" || u.stock_status === "in_stock") && u.assigned_battery
    );

    const initialStatus = newLead.status && newLead.status !== "new_lead" 
      ? newLead.status 
      : (pairedStockAvailable ? "enquiry" : "new_lead");

    const payload = {
      customer_name: newLead.customer_name.trim(),
      contact_number: newLead.contact_number.trim(),
      interested_vehicle: vId,
      lead_source: newLead.lead_source,
      status: initialStatus,
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
        showToast("Lead added.");
      }
      setNewLead({ ...emptyLead });
      setEditingLeadId(null);
      setIsAddLeadOpen(false);
      loadLeads();
    } catch { showToast("Failed to save lead.", "error"); }
  };

  const moveLeadToStage = async (leadId: number, newStatus: string) => {
    const lead = leadsList.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    const prevStatus = lead.status;
    setLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await updateLead(leadId, { status: newStatus });
      showToast(`Lead advanced to ${newStatus.replace("_", " ")}.`);
    } catch {
      setLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: prevStatus } : l)));
      showToast("Failed to update lead stage.", "error");
    }
  };

  const handleAssignLead = async (leadId: number, assignedId: number | null) => {
    try {
      await updateLead(leadId, {
        assigned_executive: assignedId,
        status: assignedId ? "new_lead" : "enquiry"
      });
      showToast(assignedId ? "Executive assigned." : "Lead unassigned.");
      loadLeads();
    } catch {
      showToast("Failed to assign lead.", "error");
    }
  };

  // Booking CRUD
  const openEditBooking = (bk: any) => {
    setEditingBookingId(bk.id);
    setNewBooking({
      customer_name: bk.customer_name || "",
      contact_number: bk.contact_number || "",
      vehicle_model: String(bk.vehicle_model || ""),
      advance_amount: bk.advance_amount ? String(Math.round(parseFloat(bk.advance_amount))) : "",
      expiry_date: bk.expiry_date || "",
      payment_mode: bk.payment_mode || "Cash",
      payment_split_details: bk.payment_split_details ? {
        cash: bk.payment_split_details.cash ? String(Math.round(parseFloat(bk.payment_split_details.cash))) : "",
        card: bk.payment_split_details.card ? String(Math.round(parseFloat(bk.payment_split_details.card))) : "",
        upi: bk.payment_split_details.upi ? String(Math.round(parseFloat(bk.payment_split_details.upi))) : "",
        bajaj_finance: bk.payment_split_details.bajaj_finance ? String(Math.round(parseFloat(bk.payment_split_details.bajaj_finance))) : ""
      } : { cash: "", card: "", upi: "", bajaj_finance: "" }
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

    // Split validation
    if (newBooking.payment_mode === "split") {
      const cashVal = parseFloat(newBooking.payment_split_details.cash || "0");
      const cardVal = parseFloat(newBooking.payment_split_details.card || "0");
      const upiVal = parseFloat(newBooking.payment_split_details.upi || "0");
      const bajajVal = parseFloat(newBooking.payment_split_details.bajaj_finance || "0");
      const totalSplit = cashVal + cardVal + upiVal + bajajVal;
      const targetVal = parseFloat(newBooking.advance_amount || "0");
      if (totalSplit !== targetVal) {
        showToast(`Split total (₹${totalSplit.toLocaleString("en-IN")}) must equal Advance Amount (₹${targetVal.toLocaleString("en-IN")})`, "error");
        return;
      }
    }

    try {
      const payload: any = {
        customer_name: newBooking.customer_name.trim(),
        contact_number: newBooking.contact_number.trim(),
        vehicle_model: parseInt(newBooking.vehicle_model),
        advance_amount: parseFloat(newBooking.advance_amount),
        expiry_date: newBooking.expiry_date,
        payment_mode: newBooking.payment_mode,
        payment_split_details: newBooking.payment_mode === "split" ? {
          cash: parseFloat(newBooking.payment_split_details.cash || "0"),
          card: parseFloat(newBooking.payment_split_details.card || "0"),
          upi: parseFloat(newBooking.payment_split_details.upi || "0"),
          bajaj_finance: parseFloat(newBooking.payment_split_details.bajaj_finance || "0")
        } : null
      };

      if (editingBookingId) {
        await updateBooking(editingBookingId, payload);
        showToast("Booking updated.");
      } else {
        await createBooking({
          ...payload,
          booking_id: `BK-${Date.now().toString().slice(-6)}`,
          status: "pending"
        });
        showToast("Booking recorded.");
      }
      setNewBooking({
        customer_name: "",
        contact_number: "",
        vehicle_model: "",
        advance_amount: "",
        expiry_date: "",
        payment_mode: "Cash",
        payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" }
      });
      setEditingBookingId(null);
      setIsAddBookingOpen(false);
      loadBookings();
    } catch { showToast("Failed to save booking.", "error"); }
  };

  const handleApproveBookingLive = async (id: number, action: "confirmed" | "cancelled") => {
    try {
      await updateBooking(id, { status: action });
      showToast(`Booking lock ${action}.`);
      loadBookings();
    } catch (e) {
      showToast("Failed to update booking.", "error");
    }
  };

  // Batteries CRUD
  const openAddBattery = () => {
    const year = new Date().getFullYear();
    const seq = String((batteriesStock?.length || 0) + 1).padStart(4, "0");
    const defaultLocId = locationsList[0]?.id ? String(locationsList[0].id) : "3";
    setEditingBatteryId(null);
    setNewBattery({
      ...emptyBattery,
      serial_number: `BATT-${year}-${seq}`,
      location: defaultLocId,
      purchase_date: new Date().toISOString().slice(0, 10),
    });
    setIsAddBatteryOpen(true);
  };

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
    if (!newBattery.serial_number.trim()) {
      showToast("Please enter battery serial number.", "error");
      return;
    }
    try {
      const locId = newBattery.location ? parseInt(newBattery.location) : (locationsList[0]?.id || 3);
      const payload: any = {
        serial_number: newBattery.serial_number.trim(),
        battery_code: newBattery.battery_code.trim() || undefined,
        capacity: newBattery.capacity.trim() || "2.0 kWh",
        purchase_date: newBattery.purchase_date || new Date().toISOString().slice(0, 10),
        location: locId,
        supplier: newBattery.supplier.trim() || "Tesla Tech Pack",
        warranty_years: parseInt(newBattery.warranty_years) || 3,
        status: newBattery.status || "available",
      };
      if (editingBatteryId) {
        await updateBattery(editingBatteryId, payload);
        showToast("Battery details updated successfully! ✓");
      } else {
        await createBattery(payload);
        showToast("Battery logged to stock registry successfully! ✓");
      }
      setNewBattery({ ...emptyBattery });
      setEditingBatteryId(null);
      setIsAddBatteryOpen(false);
      loadBatteries();
    } catch (err: any) {
      console.error("Failed to save battery:", err);
      const serverErr = err.response?.data;
      let errMsg = "Failed to save battery.";
      if (serverErr) {
        if (typeof serverErr === "string") errMsg = serverErr;
        else if (serverErr.serial_number) errMsg = `Serial number error: ${Array.isArray(serverErr.serial_number) ? serverErr.serial_number[0] : serverErr.serial_number}`;
        else if (serverErr.location) errMsg = `Location error: ${Array.isArray(serverErr.location) ? serverErr.location[0] : serverErr.location}`;
        else if (serverErr.detail) errMsg = String(serverErr.detail);
      }
      showToast(errMsg, "error");
    }
  };

  const handleDeleteBattery = async (batt: any) => {
    if (!batt.id) return;
    if (!window.confirm(`Delete battery ${batt.serial}?`)) return;
    try {
      await deleteBattery(batt.id);
      showToast("Battery removed.");
      loadBatteries();
    } catch { showToast("Failed to delete battery.", "error"); }
  };

  // Transfers & Alerts
  const handleApproveAlert = async (alertId: string | number) => {
    const alertItem = alerts.find(a => String(a.id) === String(alertId));
    if (!alertItem) return;
    
    if (alertItem.type === "Pending PDI" && alertItem.bookingId) {
      try {
        await updateBooking(alertItem.bookingId, { pdi_verified: "yes" });
        showToast("PDI marked as passed.");
        loadBookings();
      } catch {
        showToast("Failed to update PDI status.", "error");
      }
    } else {
      setStaticAlerts(prev => prev.map(a => String(a.id) === String(alertId) ? { ...a, active: false } : a));
      showToast("Alert cleared.");
    }
  };

  const handleUpdateTransferStatus = async (id: number, status: string) => {
    try {
      await updateStockTransfer(id, { status: status });
      showToast(`Transfer marked as ${status}.`);
      loadTransfers();
      loadVehicles();
    } catch {
      showToast(`Failed to update transfer status to ${status}.`, "error");
    }
  };

  const handleSalesDelivery = async (id: number, status: string) => {
    try {
      await updateSalesInvoice(id, { delivery_status: status });
      const targetSale = salesInvoices.find(s => s.id === id);
      if (targetSale?.vehicle_unit) {
        try {
          await updateVehicleUnit(targetSale.vehicle_unit, { stock_status: "sold" });
        } catch {}
      }
      showToast(`Sales invoice marked as ${status === "delivered" ? "Delivered (Completed Sale)" : status}. Vehicle unit marked SOLD in inventory. ✓`);
      loadSales();
      loadVehicles();
    } catch {
      showToast("Failed to update delivery status.", "error");
    }
  };

  const formatWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
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

  // CSV Report
  const [reportModule, setReportModule] = useState("Sales Ledger Summary");
  const downloadReport = () => {
    let rows: string[][] = [];
    if (reportModule === "Inventory In-Out Movements") {
      rows = [["VIN", "Model", "Color", "Branch", "Status"], ...vehicleUnitsList.map(u => [u.vin_number, u.model_name, u.color, u.branch_name || "", u.stock_status])];
    } else if (reportModule === "Lead Conversion Pipeline") {
      rows = [["Lead ID", "Customer", "Contact", "Vehicle", "Status"], ...leadsList.map(l => [`LD-${l.id}`, l.customer_name, l.contact_number, l.interested_vehicle_name || "", l.status])];
    } else if (reportModule === "Battery Stock Allocations") {
      rows = [["Serial", "Capacity", "Acquired", "Status", "Location"], ...batteriesStock.map(b => [b.serial, b.capacity, b.purDate, b.status, b.location])];
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

  // Aggregates & Charts
  const stockByLocationData = React.useMemo(() => {
    const locations: Record<string, number> = {};
    vehicleUnitsList.forEach((unit) => {
      const loc = unit.location_name || "Visakhapatnam Showroom";
      locations[loc] = (locations[loc] || 0) + 1;
    });
    const data = Object.entries(locations).map(([location, Available]) => ({
      location,
      Available
    }));
    if (data.length === 0) {
      return [];
    }
    return data;
  }, [vehicleUnitsList]);

  const stockMovementData = React.useMemo(() => {
    const locations = ["Vizag Central Godown", "KVR Showroom - Visakhapatnam", "KVR Showroom - Srikakulam", "KVR Showroom - Kakinada", "KVR Showroom - Vizag"];
    return locations.map((loc) => {
      const inCount = vehicleUnitsList.filter(u => u.location_name?.includes(loc)).length;
      const outCount = salesInvoices.filter(s => s.branch_name?.includes(loc)).length;
      return {
        name: loc,
        StockIn: inCount,
        StockOut: outCount
      };
    });
  }, [vehicleUnitsList, salesInvoices]);

  const recentActivities = React.useMemo(() => {
    const list: any[] = [];
    salesInvoices.forEach((s) => {
      list.push({
        activity: "Stock Out/Sale",
        ref: s.invoice_number,
        location: s.branch_name || "Visakhapatnam Showroom",
        user: s.executive_name || "Anil Kumar",
        time: "Just now"
      });
    });
    if (list.length === 0) {
      return [];
    }
    return list.slice(0, 4);
  }, [salesInvoices]);

  // branch locations for stock unit selection
  const branchShowrooms = React.useMemo(() => {
    return showroomsList.filter((s) => String(s.branch) === stockUnitForm.branch);
  }, [showroomsList, stockUnitForm.branch]);

  const branchLocations = React.useMemo(() => {
    return locationsList.filter((l) => String(l.branch) === stockUnitForm.branch);
  }, [locationsList, stockUnitForm.branch]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
      {/* Unified Sidebar */}
      <DashboardSidebar role="supervisor" activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar role="supervisor" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />

        {/* Dashboard Views with Lenis Smooth Scroll */}
        <DashboardSmoothScroll className={`p-4 pb-28 lg:pb-6 ${activeTab === "dashboard" ? "flex flex-col space-y-4 bg-[#FAFDFB]" : "space-y-6"}`}>
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* Premium Welcome Hero */}
              <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#04a700]/[0.07] to-transparent" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#04a700]/10 blur-3xl" />
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#04a700] to-emerald-600" />

                <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#04a700]/30 bg-[#04a700]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#04a700]">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#04a700] opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#04a700]" />
                        </span>
                        Supervisor Live
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500">
                        <CalendarDays className="h-3 w-3" /> Branch Operations
                      </span>
                    </div>
                    <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      Welcome back, Suresh Babu
                      <Sparkles className="h-5 w-5 text-[#04a700]" />
                    </h2>
                    <p className="mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                      Monitor inventory levels, PDI verifications, and FIFO battery allocations at your branch outlet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Log Physical Unit", icon: Plus, onClick: openAddStockUnit },
                  { label: "Add Battery Pack", icon: BatteryIcon, onClick: openAddBattery },
                  { label: "Check Bookings", icon: Clock, onClick: () => navigateTo("bookings") },
                  { label: "Clear Alerts", icon: AlertTriangle, onClick: () => navigateTo("dashboard") },
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

              {/* Grid Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">

                <DashboardCard title="Total Stock Units" value={vehiclesLoading ? "..." : `${vehicleUnitsList.length} Units`} trend="Available" trendType="success" description="Physical warehouse stock" icon={Boxes} color="blue" onClick={() => navigateTo("vehicles")} />
                <DashboardCard title="Intake received" value={vehiclesLoading ? "..." : `${vehicleUnitsList.filter(u => u.stock_status === "available").length} Units`} trend="↑ 12%" trendType="success" description="Ready for delivery" icon={Boxes} color="emerald" onClick={() => navigateTo("vehicles")} />
                <DashboardCard title="Stock Out / Sold" value={salesInvoicesLoading ? "..." : `${salesInvoices.length} Units`} trend="Dispatched" trendType="success" description="Total vehicles invoiced" icon={Boxes} color="indigo" onClick={() => navigateTo("sales")} />
                <DashboardCard title="Pending Bookings" value={advanceBookingsLoading ? "..." : `${advanceBookings.filter(b => b.status === "pending").length} Locks`} trend="Review Required" trendType="danger" description="Advance deposits pending" icon={Clock} color="amber" onClick={() => navigateTo("bookings")} />
              </div>

              {/* Graphs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stock by Location (Bar) */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-[#04a700]" /> Stock by Location
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Physical vehicle distribution in Visakhapatnam cluster</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#04a700] border border-emerald-200">
                      {stockByLocationData.reduce((acc, curr) => acc + curr.Available, 0)} Total Units
                    </span>
                  </div>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stockByLocationData} barSize={28} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="availableGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#04a700" stopOpacity={1} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1">
                                  <p className="font-extrabold text-emerald-400">{label}</p>
                                  <p className="font-bold text-slate-200">{payload[0].value} Vehicles Available</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="Available" fill="url(#availableGrad)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Alerts Column */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-3">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Recent Alerts</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Critical approvals & actions required</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left slim-scrollbar">
                    {/* Live Override approvals */}
                    {liveOverridesList.filter(o => o.status === "pending").map((override) => (
                      <div key={`live-${override.id}`} className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3 animate-pulse" /> Battery Override Request
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-snug">
                          Executive {override.sales_executive} requests battery {override.battery_serial} ({override.battery_capacity}) for invoice ref {override.invoice_reference}
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-rose-200/50 mt-1">
                          <button 
                            onClick={() => handleApproveOverrideRequest(override.id, "approved")}
                            className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[9px] px-3 py-1 rounded-full cursor-pointer transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleApproveOverrideRequest(override.id, "rejected")}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-650 font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Other static alerts */}
                    {alerts.filter(a => a.active).map((alert) => (
                      <div key={alert.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" /> {alert.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 leading-snug">{alert.details}</p>
                        
                        {alert.type === "Pending PDI" ? (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
                            <button 
                              onClick={() => handleApproveAlert(alert.id)}
                              className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[9px] px-3 py-1 rounded-full cursor-pointer transition-colors"
                            >
                              Mark Passed
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end pt-1 border-t border-slate-200 mt-1">
                            <button 
                              onClick={() => handleApproveAlert(alert.id)}
                              className="text-[9px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                            >
                              Clear Alert
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {liveOverridesList.filter(o => o.status === "pending").length === 0 && alerts.filter(a => a.active).length === 0 && (
                      <EmptyState title="All Clear!" description="No pending alert logs." />
                    )}
                  </div>
                </div>
              </div>

              {/* Lower Section Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stock Movement */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/60 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-indigo-600" /> Stock Movement (This Month)
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Intake inflow vs sales outflow per warehouse</p>
                    </div>
                  </div>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stockMovementData} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="stockInGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="stockOutGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                            <stop offset="100%" stopColor="#fb7185" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 space-y-1">
                                  <p className="font-extrabold text-indigo-400">{label}</p>
                                  <p className="font-bold text-indigo-300">Stock In: {payload[0]?.value || 0} Units</p>
                                  <p className="font-bold text-rose-300">Stock Out / Sold: {payload[1]?.value || 0} Units</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px" }} />
                        <Bar dataKey="StockIn" name="Stock In" fill="url(#stockInGrad)" radius={[6, 6, 0, 0]} barSize={16} />
                        <Bar dataKey="StockOut" name="Stock Out / Sold" fill="url(#stockOutGrad)" radius={[6, 6, 0, 0]} barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Recent Activities</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Branch operational events logs</p>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto slim-scrollbar">
                    {recentActivities.map((act, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 truncate">{act.activity}</span>
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
              </div>
            </div>
          )}


          {/* TAB 2: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-6">
              <Table 
                title="Pending Internal Stock Transfers Approval" 
                headers={["Transfer Ref", "Source Location", "Target Showroom", "Vehicle Details", "Quantity", "Requested By", "Priority Level", "Approval Status", "Actions"]}
                actions={
                  <button
                    onClick={() => {
                      const availUnits = vehicleUnitsList.filter(u => u.stock_status === "available");
                      if (availUnits.length > 0) {
                        openRequestTransfer(availUnits[0]);
                      } else {
                        showToast("No available units to transfer.", "error");
                      }
                    }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Create Transfer
                  </button>
                }
              >
                {transfersLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading stock transfers...</span>
                      </div>
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Stock Transfers" description="No pending or past stock transfer requests found." />
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{tr.ref}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{tr.from}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{tr.to}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{tr.model}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-700">{tr.qty} Units</td>
                    <td className="py-3.5 px-5 text-slate-650 font-bold">{tr.requestedBy}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        tr.priority === "Urgent" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        tr.priority === "High" ? "bg-amber-50 text-amber-750 border border-amber-200" :
                        "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        {tr.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        tr.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {tr.status === "Pending Approval" ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateTransferStatus(tr.id, "approved")}
                            className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[10px] px-3 py-1 rounded-full cursor-pointer"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateTransferStatus(tr.id, "rejected")}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : tr.status === "Approved" && (tr.to === user?.showroom || tr.to === user?.branch) ? (
                        <button 
                          onClick={() => handleUpdateTransferStatus(tr.id, "received")}
                          className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[10px] px-3 py-1 rounded-full cursor-pointer"
                        >
                          Mark Received
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">{tr.status}</span>
                      )}
                    </td>
                  </tr>
                )))}
              </Table>
            </div>
          )}

          {/* TAB 3: VEHICLE MANAGEMENT (WITH CRUD & TRANSFERS) */}
          {activeTab === "vehicles" && (() => {
            const myShowroomName = user?.showroom || "KVR Showroom - Visakhapatnam";
            const myBranchUnits = vehicleUnitsList.filter(u => u.showroom_name === myShowroomName || u.branch_name === user?.branch || (!user?.showroom && !user?.branch));
            const availableBranchUnits = myBranchUnits.filter(u => u.stock_status !== "sold" && u.stock_status !== "delivered");
            const soldBranchUnits = myBranchUnits.filter(u => u.stock_status === "sold" || u.stock_status === "delivered");
            const otherBranchUnits = vehicleUnitsList.filter(u => u.showroom_name !== myShowroomName && u.branch_name !== user?.branch && (user?.showroom || user?.branch));
            const totalModels = vehicleModelsList.length;
            const localAvailable = availableBranchUnits.length;
            const otherAvailable = otherBranchUnits.filter(u => u.stock_status === "available" || u.stock_status === "in_stock").length;
            const activeRequests = transfers.filter(t => t.status === "Pending Approval").length;

            return (
              <div className="space-y-6">
                {/* Premium KPI Banners */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DashboardCard title="Active EV Models" value={totalModels} icon={Zap} description="EV Catalog Range" color="indigo" />
                  <DashboardCard title="Local Showroom Stock" value={`${localAvailable} / ${myBranchUnits.length}`} icon={Boxes} description="Available Units" color="emerald" />
                  <DashboardCard title="Other Branch Outlets" value={`${otherAvailable} / ${otherBranchUnits.length}`} icon={Compass} description="Units at Other Branches" color="amber" />
                  <DashboardCard title="Pending Transfers" value={activeRequests} icon={Truck} description="Requests Awaiting Review" color="rose" />
                </div>

                {/* Vehicle Master Models catalog */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-base font-black text-slate-805">Vehicle Master Models Catalog</h4>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Configure models, battery specifications, colors, and base retail pricing.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsManageBrandsOpen(true)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-full cursor-pointer transition-all border border-slate-250"
                      >
                        Manage Brands
                      </button>
                      <button 
                        onClick={() => { setEditingModelId(null); setNewModelBrand(""); setNewModelName(""); setNewModelPrice(""); setNewModelBattery(""); setNewModelColors(""); setNewModelStatus("active"); setIsAddVehicleOpen(true); }}
                        className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                      >
                        <Plus className="h-4 w-4" /> Add Model
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <input 
                      type="text" 
                      placeholder="Search catalog models..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
                    />
                    <select
                      value={activeFilterTab}
                      onChange={(e) => setActiveFilterTab(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700] min-w-[160px] cursor-pointer"
                    >
                      <option value="All">All Brands</option>
                      {vehicleBrandsList.map((brand) => (
                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <Table 
                    title=""
                    headers={["Model Name", "Brand", "Base Price", "Color Variants", "Battery Spec", "Status", "Actions"]}
                    actions={null}
                  >
                    {(() => {
                      const filteredModels = vehicleModelsList.filter((model) => {
                        const matchesSearch = !searchQuery.trim() || 
                          model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (model.brand_name || "").toLowerCase().includes(searchQuery.toLowerCase());
                        
                        const matchesBrand = activeFilterTab === "All" || model.brand_name === activeFilterTab;
                        return matchesSearch && matchesBrand;
                      });

                      if (vehiclesLoading) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-semibold">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                                <span>Loading models...</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      if (filteredModels.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-8 text-center">
                              <EmptyState title="No Matching Models" description="Try adjusting your filter or search query." />
                            </td>
                          </tr>
                        );
                      }

                      return filteredModels.map((model, idx) => (
                        <tr key={model.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                          <td className="py-3.5 px-5 font-bold text-slate-800">{model.model_name}</td>
                          <td className="py-3.5 px-5 text-slate-605 font-semibold">{model.brand_name || "Kinetic"}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(model.base_price).toLocaleString('en-IN')}</td>
                          <td className="py-3.5 px-5 text-slate-500 font-medium">{Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "—"}</td>
                          <td className="py-3.5 px-5 text-slate-550 font-semibold">{model.battery_compatibility || "—"}</td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              model.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {model.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <button onClick={() => openEditModel(model)} className="text-xs text-indigo-650 hover:text-indigo-805 font-bold cursor-pointer">Edit</button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </Table>
                </div>

                {/* Physical Stock Units Registry (CRUD) */}
                <Table 
                  title={`Physical Inventory Stock Units (${myShowroomName} Showroom)`} 
                  headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Quantity", "Showroom", "Battery", "Days in Stock", "Status", "Actions"]}
                  actions={
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={openAddBattery}
                        className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-3.5 rounded-full cursor-pointer shadow-sm transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add Battery
                      </button>
                      <button 
                        onClick={openAddStockUnit}
                        className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                      >
                        <Plus className="h-4 w-4" /> Add Stock Unit
                      </button>
                    </div>
                  }
                >
                  {vehiclesLoading ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading physical units registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : availableBranchUnits.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center">
                        <EmptyState title="No Available Stock Units Found" description="No available physical units registered for this local showroom." />
                      </td>
                    </tr>
                  ) : (
                    availableBranchUnits.map((unit, idx) => (
                      <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.motor_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.chassis_number || "—"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.color}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">1 Unit</span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.showroom_name || "Visakhapatnam"}</td>
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
                            "bg-slate-100 text-slate-500 border border-slate-200"
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

                {/* Sold Vehicles Inventory Ledger */}
                <Table 
                  title={`Sold Vehicles Registry (${myShowroomName} Showroom)`} 
                  headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Quantity", "Showroom", "Battery", "Sale Status"]}
                >
                  {vehiclesLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading sold units registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : soldBranchUnits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <EmptyState title="No Sold Vehicle Units" description="Vehicle units marked as Sold or Delivered will be listed here." />
                      </td>
                    </tr>
                  ) : (
                    soldBranchUnits.map((unit, idx) => (
                      <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.motor_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.chassis_number || "—"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.color}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">1 Unit</span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.showroom_name || "Visakhapatnam"}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.assigned_battery || "—"}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {unit.stock_status === "delivered" ? "Delivered" : "Sold"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>

                {/* Available Stock at Other Branch Outlets (Transfers Eligible) */}
                <Table 
                  title="Available Stock at Other Branch Outlets (Internal Transfers Request)" 
                  headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color Specification", "Current Branch", "PDI Status", "Stock Status", "Actions"]}
                >
                  {vehiclesLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading other showroom stocks...</span>
                        </div>
                      </td>
                    </tr>
                  ) : otherBranchUnits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center">
                        <EmptyState title="No Other Branch Stocks Available" description="Vehicle inventory at other branches is currently empty." />
                      </td>
                    </tr>
                  ) : (
                    otherBranchUnits.map((unit, idx) => (
                      <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.motor_number || "—"}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-550">{unit.chassis_number || "—"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.color}</td>
                        <td className="py-3.5 px-5 text-amber-700 font-bold">{unit.showroom_name || unit.branch_name || "Other"}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Passed
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            unit.stock_status === "available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            unit.stock_status === "booked" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            unit.stock_status === "reserved" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {unit.stock_status.charAt(0).toUpperCase() + unit.stock_status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          {unit.stock_status === "available" ? (
                            <button
                              onClick={() => openRequestTransfer(unit)}
                              className="inline-flex items-center gap-1.5 bg-[#04a700]/10 hover:bg-[#04a700]/20 text-[#04a700] font-bold text-[10px] py-1.5 px-3 rounded-full cursor-pointer transition-colors"
                            >
                              <Truck className="h-3.5 w-3.5" /> Request Transfer
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Unavailable for Transfer</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>
            );
          })()}

          {/* TAB 4: SALES MONITORING */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <Table title="Showroom Daily Sales Monitoring Ledger" headers={["Invoice Ref", "Customer Name", "Contact", "Vehicle Model", "Sale Price", "Payment Mode", "Delivery Status", "Actions"]}>
                {salesInvoicesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading sales records...</span>
                      </div>
                    </td>
                  </tr>
                ) : salesInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <EmptyState title="No Sales Invoices" description="No invoices registered yet." />
                    </td>
                  </tr>
                ) : (
                  salesInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">{inv.invoice_number || `INV-${inv.id}`}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{inv.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{inv.customer_contact}</td>
                      <td className="py-3.5 px-5 text-slate-700 font-semibold">{inv.model_name}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">₹ {parseFloat(inv.sale_price).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{inv.payment_mode}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          inv.delivery_status === "delivered" || inv.delivery_status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          inv.delivery_status === "ready" || inv.delivery_status === "sold" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {inv.delivery_status === "delivered" || inv.delivery_status === "completed" ? "Completed (Delivered)" :
                           inv.delivery_status === "ready" || inv.delivery_status === "sold" ? "Sold (Awaiting Delivery)" :
                           "Pending Payment Verification"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {inv.delivery_status === "delivered" ? (
                          <div className="flex items-center gap-2 inline-flex">
                            <button
                              onClick={() => openVerificationModal(inv)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                            >
                              Edit / Proof
                            </button>
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
                                `*Status:* Verified & Sold\n` +
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
                        ) : inv.delivery_status === "ready" || inv.delivery_status === "sold" ? (
                          <div className="flex items-center gap-2 inline-flex">
                            <button
                              onClick={() => openVerificationModal(inv)}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                            >
                              Edit Payment
                            </button>
                            <button
                              onClick={() => handleSalesDelivery(inv.id, "delivered")}
                              className="inline-flex items-center gap-1 text-xs text-white font-extrabold bg-[#04a700] hover:bg-[#038a00] px-3.5 py-1.5 rounded-full shadow-sm cursor-pointer transition-colors"
                            >
                              <Truck className="h-3.5 w-3.5" /> Mark Delivered
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 inline-flex">
                            <button
                              onClick={() => openVerificationModal(inv)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-900 font-bold bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-sm"
                            >
                              Confirm Payment / Proof
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}

          {/* TAB 5: LEADS KANBAN PIPELINE */}
          {activeTab === "leads" && (
            <div className="space-y-5 text-left">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Leads Pipeline Management</h3>
                  <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Drag and drop cards to update status stages. Click cards to edit.</p>
                </div>
                <button 
                  onClick={openAddLead}
                  className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add Lead
                </button>
              </div>

              {/* Normal List Type Lead Management */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Lead Management Catalog</h3>
                    <p className="text-xs font-semibold text-slate-500">Filter, search, assign executives, and manage branch leads</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer, vehicle, notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 slim-scrollbar">
                  {[
                    { id: "all", label: "All Leads" },
                    { id: "enquiry", label: "Enquiry" },
                    { id: "negotiation", label: "Interested (Booking Created)" },
                    { id: "won", label: "Won (Sale Completed)" },
                    { id: "lost", label: "Not Interested" },
                  ].map((filter) => {
                    const count = filter.id === "all" ? leadsList.length : (filter.id === "enquiry" ? leadsList.filter(l => ["enquiry", "new_lead", "contacted", "follow_up"].includes(l.status)).length : leadsList.filter(l => l.status === filter.id).length);
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSearchQuery(filter.id === "all" ? "" : filter.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          (searchQuery === filter.id || (filter.id === "all" && !searchQuery))
                            ? "bg-[#04a700] text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {filter.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <Table headers={["Lead ID", "Customer Details", "Contact No", "Vehicle Model", "Sales Executive", "Followup Date", "Stage State", "Actions"]}>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                            <span>Loading leads registry...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (leadsList.filter(l => !searchQuery || l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_number.includes(searchQuery) || l.status === searchQuery)).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <EmptyState title="No leads found" description="No leads logged matching your filter." />
                        </td>
                      </tr>
                    ) : (
                      leadsList.filter(l => !searchQuery || l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_number.includes(searchQuery) || l.status === searchQuery).map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50 border-b border-slate-100">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">LD-{lead.id}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">{lead.customer_name}</td>
                          <td className="py-3.5 px-5 font-semibold text-slate-600">
                            <div className="flex items-center gap-2">
                              <span>{lead.contact_number}</span>
                              <a href={`tel:${lead.contact_number}`} className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer shadow-sm transition-colors" title="Call Customer">
                                <Phone className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-semibold">{lead.interested_vehicle_name || "—"}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">
                            {lead.assigned_executive_name || lead.created_by_name || salesInvoices.find(s => s.customer_contact === lead.contact_number || s.customer_name?.toLowerCase() === lead.customer_name?.toLowerCase())?.executive_name || "Sales Executive"}
                          </td>
                          <td className="py-3.5 px-5 text-slate-500 font-semibold">{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "—"}</td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              lead.status === "won" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              lead.status === "negotiation" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              lead.status === "lost" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-slate-50 text-slate-650 border border-slate-200"
                            }`}>
                              {lead.status === "won" ? "Sale Completed (Won)" :
                               lead.status === "negotiation" ? "Interested (Booking Created)" :
                               lead.status === "lost" ? "Not Interested" :
                               "Enquiry Registered"}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 flex items-center gap-3">
                            <button onClick={() => openEditLead(lead)} className="text-xs font-bold text-[#04a700] hover:text-emerald-800 cursor-pointer">Edit</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADVANCE BOOKINGS (WITH CRUD) */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <Table 
                title="Pending Booking Commitments Approval Queue" 
                headers={["Booking ID", "Customer Details", "Vehicle Model", "Contact", "Advance Payment", "Booking Date", "Expiry Date", "PDI Status", "Approval State", "Actions"]}
                actions={
                  <button 
                    onClick={() => { setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "", payment_mode: "Cash", payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" } }); setIsAddBookingOpen(true); }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Record Booking
                  </button>
                }
              >
                {advanceBookingsLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : advanceBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <EmptyState title="No Bookings Found" description="Advance bookings list is empty." />
                    </td>
                  </tr>
                ) : (
                  advanceBookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">{bk.booking_id}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{bk.customer_name}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{bk.vehicle_model_name || "Kinetic Green EV"}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{bk.contact_number}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">₹ {parseFloat(bk.advance_amount).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{bk.expiry_date ? new Date(bk.expiry_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.pdi_verified === "yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          bk.pdi_verified === "no" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.pdi_verified === "yes" ? "PDI Passed" : bk.pdi_verified === "no" ? "PDI Failed" : "PDI Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          bk.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.status === "pending" ? "Pending Approval" : bk.status.charAt(0).toUpperCase() + bk.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {bk.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApproveBookingLive(bk.id, "confirmed")}
                              className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[10px] px-3 py-1 rounded-full cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleApproveBookingLive(bk.id, "cancelled")}
                              className="text-xs text-rose-600 font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {bk.status !== "pending" && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEditBooking(bk)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold cursor-pointer">Edit</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}

          {/* TAB 7: BATTERIES MANAGEMENT (WITH CRUD) */}
          {activeTab === "batteries" && (
            <div className="space-y-6">
              <Table 
                title="Assigned Outlet Battery Stock (Sequence Check)" 
                headers={["Battery Serial", "Battery Code", "Capacity Rating", "Acquisition Date", "Warehouse Location", "Stock Priority", "Health Index (SoH)", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => { setEditingBatteryId(null); setNewBattery({ ...emptyBattery }); setIsAddBatteryOpen(true); }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Add Battery
                  </button>
                }
              >
                {batteriesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading batteries...</span>
                      </div>
                    </td>
                  </tr>
                ) : batteriesStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Batteries Found" description="No batteries registered." />
                    </td>
                  </tr>
                ) : (
                  batteriesStock.map((batt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-805">{batt.serial}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-bold font-mono">{batt.batteryCode || "—"}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-bold">{batt.capacity}</td>
                      <td className="py-3.5 px-5 text-slate-505 font-semibold">{batt.purDate}</td>
                      <td className="py-3.5 px-5 text-slate-605">{batt.location}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{batt.fifoRank}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-700">{batt.soh}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          batt.rawStatus === "available" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {batt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button onClick={() => openEditBattery(batt)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteBattery(batt)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="bg-white border border-emerald-100 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Assigned Branch Performance Report</h3>
                <p className="text-xs text-slate-400 font-semibold mb-6">Select report parameters for Visakhapatnam branch metrics extraction.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <select 
                    value={reportModule} 
                    onChange={(e) => setReportModule(e.target.value)} 
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none w-full sm:w-64"
                  >
                    <option>Sales Ledger Summary</option>
                    <option>Inventory In-Out Movements</option>
                    <option>Lead Conversion Pipeline</option>
                    <option>Battery Stock Allocations</option>
                  </select>
                  <button 
                    onClick={downloadReport}
                    className="flex items-center gap-1.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-3 px-6 rounded-full shadow-md cursor-pointer transition-colors w-full sm:w-auto justify-center"
                  >
                    <Download className="h-4 w-4" /> Download Report (CSV)
                  </button>
                  <button 
                    onClick={printReport}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-6 rounded-full shadow-md cursor-pointer transition-colors w-full sm:w-auto justify-center"
                  >
                    <Printer className="h-4 w-4" /> Print Report
                  </button>
                </div>
              </div>
            </div>
          )}



          {activeTab === "attendance" && (
            <AttendanceView role="supervisor" />
          )}
          {activeTab === "expenses" && (
            <BranchExpenseView role="supervisor" />
          )}
          {activeTab === "issues" && (
            <IssueReportView role="supervisor" />
          )}
          {activeTab === "profile" && (
            <ProfileView />
          )}


        </DashboardSmoothScroll>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav role="supervisor" activeTab={activeTab} />

      {/* Floated Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 shadow-xl ${
            toast.type === "success" 
              ? "bg-[#04a700] border-[#038a00] text-white" 
              : "bg-rose-600 border-rose-700 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-xs font-bold">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Vehicle Model */}
      <Modal isOpen={isAddVehicleOpen} onClose={() => setIsAddVehicleOpen(false)} title={editingModelId ? "Edit Vehicle Model Catalog" : "Add Model to Vehicle Catalog"}>
        <form onSubmit={handleAddModelSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Brand</label>
            <select 
              value={newModelBrand} 
              onChange={(e) => setNewModelBrand(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" 
              required
            >
              <option value="">Select Brand...</option>
              {vehicleBrandsList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Model Name</label>
            <input type="text" placeholder="e.g. Dynamo Pro" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Base Showroom Price (INR)</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 98500" value={newModelPrice} onChange={(e) => setNewModelPrice(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variants (comma-separated)</label>
            <input type="text" placeholder="e.g. Gray, Red, White" value={newModelColors} onChange={(e) => setNewModelColors(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Compatibility Spec</label>
            <input type="text" placeholder="e.g. 2.0 kWh Li-ion" value={newModelBattery} onChange={(e) => setNewModelBattery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select value={newModelStatus} onChange={(e) => setNewModelStatus(e.target.value as "active" | "inactive")} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer">
            Save Model
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
                    <button
                      type="button"
                      onClick={() => handleToggleBrandActive(brand)}
                      title="Click to toggle active/inactive status"
                      className={`text-[9px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded border cursor-pointer transition-all hover:scale-105 ${
                        brand.is_active !== false 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20" 
                          : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      {brand.is_active !== false ? "ACTIVE" : "INACTIVE"}
                    </button>
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

      <Modal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} title={editingUnitId ? "Edit Physical Stock Unit details" : "Register Intake Stock Unit (VIN)"}>
        <form onSubmit={handleStockUnitSubmit} className="space-y-4 text-left">
          <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block border-b border-slate-100 pb-1">Showroom & Warehouse Outlet</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Model <span className="text-red-500">*</span></label>
              <select value={stockUnitForm.model} onChange={(e) => setStockUnitForm({ ...stockUnitForm, model: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Model...</option>
                {vehicleModelsList.map(m => <option key={m.id} value={m.id}>{m.model_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Outlet Branch <span className="text-red-500">*</span></label>
              <select value={stockUnitForm.branch} onChange={(e) => setStockUnitForm({ ...stockUnitForm, branch: e.target.value, showroom: "", location: "" })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Branch...</option>
                {branchesList.filter((b) => b.is_active !== false).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Removed Purchase Invoice and Payment Status from Stock In per user requirements */}

          <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block border-b border-slate-100 pb-1 mt-6">Indent Codes</span>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">VIN (Vehicle Identification Number) (optional)</label>
            <input type="text" placeholder="e.g. KVRVIN2026X..." value={stockUnitForm.vin_number} onChange={(e) => setStockUnitForm({ ...stockUnitForm, vin_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Motor Code (optional)</label>
              <input type="text" placeholder="e.g. MTR-90802" value={stockUnitForm.motor_number} onChange={(e) => setStockUnitForm({ ...stockUnitForm, motor_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Code (optional)</label>
              <input type="text" placeholder="e.g. CHS-88902" value={stockUnitForm.chassis_number} onChange={(e) => setStockUnitForm({ ...stockUnitForm, chassis_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" />
            </div>
          </div>

          <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block border-b border-slate-100 pb-1 mt-6">Details</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Color</label>
              <input type="text" placeholder="e.g. Gray" value={stockUnitForm.color} onChange={(e) => setStockUnitForm({ ...stockUnitForm, color: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Acquisition Date</label>
              <input type="date" max={new Date().toISOString().split("T")[0]} value={stockUnitForm.purchase_date} onChange={(e) => setStockUnitForm({ ...stockUnitForm, purchase_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Battery (FIFO Paired)</label>
                <span className="text-[9px] font-extrabold text-emerald-600">⚡ FIFO Rule Active</span>
              </div>
              <select value={stockUnitForm.assigned_battery} onChange={(e) => setStockUnitForm({ ...stockUnitForm, assigned_battery: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none font-mono">
                <option value="">-- Unassigned (Pair Battery via FIFO) --</option>
                {(() => {
                  const selectedModelObj = vehicleModelsList.find((m) => String(m.id) === String(stockUnitForm.model));
                  const modelCompat = selectedModelObj?.battery_compatibility ? selectedModelObj.battery_compatibility.toLowerCase().trim() : "";
                  
                  const filteredBatts = batteriesStock.filter((b) => {
                    if (b.rawStatus !== "available" && b.serial !== stockUnitForm.assigned_battery) return false;
                    if (!modelCompat) return true;
                    const battCap = (b.capacity || "").toLowerCase().trim();
                    const battCode = (b.batteryCode || "").toLowerCase().trim();
                    return modelCompat.includes(battCap) || battCap.includes(modelCompat) || modelCompat.includes(battCode) || battCode.includes(modelCompat);
                  }).sort((a, b) => new Date(a.purDate || 0).getTime() - new Date(b.purDate || 0).getTime());

                  if (filteredBatts.length === 0) {
                    return (
                      <option value="" disabled>
                        No compatible available batteries found {modelCompat ? `for spec "${selectedModelObj?.battery_compatibility}"` : ""}
                      </option>
                    );
                  }

                  return filteredBatts.map((b, idx) => (
                    <option key={b.id || idx} value={b.serial}>
                      {b.serial} ({b.capacity} | Pur: {b.purDate || "Oldest"}) {idx === 0 ? "★ OLDEST (FIFO Recommended)" : ""}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>
          {!editingUnitId && (
            <div className="space-y-1.5 mt-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Bulk Insertion Quantity (Add multiple at once)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                max="100"
                value={stockUnitForm.quantity}
                onChange={(e) => setStockUnitForm({ ...stockUnitForm, quantity: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none"
              />
            </div>
          )}
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Stock Unit
          </button>
        </form>
      </Modal>

      {/* 3. Register / Edit Lead */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title={editingLeadId ? "Update Pipeline Lead details" : "Register Pipeline Lead Enquiry"}>
        <form onSubmit={handleCreateLead} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. Sita Kumari" value={newLead.customer_name} onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="tel" placeholder="e.g. 9876543210" value={newLead.contact_number} onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <SearchableSelect
              options={(() => {
                const optionsList: { value: string; label: string; sublabel: string }[] = [];
                const availableUnits = (vehicleUnitsList || []).filter(
                  (u: any) => (u.stock_status === "available" || u.stock_status === "in_stock" || u.stock_status === "AVAILABLE" || u.stock_status === "IN_STOCK") && u.assigned_battery
                );
                vehicleModelsList.forEach((m: any) => {
                  const matching = availableUnits.filter((u: any) => u.model === m.id || String(u.model) === String(m.id));
                  if (matching.length === 0) return;
                  const groups: Record<string, { color: string; battery: string; count: number }> = {};
                  matching.forEach((u: any) => {
                    const color = u.color || "Standard Color";
                    const battery = u.assigned_battery_code || u.assigned_battery_capacity || u.assigned_battery_spec || u.assigned_battery || "2.0 kWh Battery";
                    const key = `${color}___${battery}`;
                    if (!groups[key]) {
                      groups[key] = { color, battery, count: 0 };
                    }
                    groups[key].count += 1;
                  });
                  const mName = m.brand_name ? `${m.brand_name} - ${m.model_name}` : m.model_name;
                  Object.values(groups).forEach((g) => {
                    optionsList.push({
                      value: String(m.id),
                      label: `${mName} (${g.color})`,
                      sublabel: `Battery: ${g.battery} • ${g.count} Unit${g.count === 1 ? '' : 's'} in Stock`,
                    });
                  });
                });
                return optionsList;
              })()}
              value={String(newLead.interested_vehicle || "")}
              onChange={(val) => setNewLead({ ...newLead, interested_vehicle: val })}
              placeholder="Select EV Model (In-Stock Only)..."
              searchPlaceholder="Search EV models by name, color, or brand..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Inflow Source</label>
            <select value={newLead.lead_source} onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none">
              <option value="walk_in">Walk-in Inquiry</option>
              <option value="website">Website Portal</option>
              <option value="reference">Customer Reference</option>
              <option value="social">Social Media Ads</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage</label>
            <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none">
              <option value="enquiry">Enquiry Registered</option>
              <option value="negotiation">Interested (Booking Created)</option>
              <option value="won">Won (Sale Completed)</option>
              <option value="lost">Not Interested</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Requirements</label>
            <textarea placeholder="e.g. Discussing finance options" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold outline-none h-20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-up Date (Future Date Only)</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} value={newLead.follow_up_date} onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Sales Executive</label>
            <select 
              value={newLead.assigned_executive || ""} 
              onChange={(e) => setNewLead({ ...newLead, assigned_executive: e.target.value || null })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none"
            >
              <option value="">Unassigned</option>
              {usersList
                .filter(u => u.role === "sales" || u.role === "telecaller")
                .map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role === "sales" ? "Sales Executive" : "Telecaller"})</option>
                ))
              }
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Lead
          </button>
        </form>
      </Modal>

      {/* 4. Record Booking / Edit Booking */}
      <Modal isOpen={isAddBookingOpen} onClose={() => { setIsAddBookingOpen(false); setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "", payment_mode: "Cash", payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" } }); }} title={editingBookingId ? "Edit Booking Details" : "Record Advance Booking Commitment"}>
        <form onSubmit={handleCreateBooking} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. T. Gouri Shankar" value={newBooking.customer_name} onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="tel" placeholder="e.g. 9876543210" value={newBooking.contact_number} onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <SearchableSelect
              options={vehicleModelsList.map((m) => ({
                value: String(m.id),
                label: m.brand_name ? `${m.brand_name} - ${m.model_name}` : m.model_name,
              }))}
              value={String(newBooking.vehicle_model || "")}
              onChange={(val) => setNewBooking({ ...newBooking, vehicle_model: val })}
              placeholder="Select vehicle..."
              searchPlaceholder="Search EV models by name or brand..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Advance Deposit Paid (INR)</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 5000" value={newBooking.advance_amount} onChange={(e) => setNewBooking({ ...newBooking, advance_amount: e.target.value.replace(/\D/g, '') })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry date (Future Date Only)</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} value={newBooking.expiry_date} onChange={(e) => setNewBooking({ ...newBooking, expiry_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
            <select
              value={newBooking.payment_mode}
              onChange={(e) => setNewBooking({ ...newBooking, payment_mode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Cash">Cash Payment</option>
              <option value="UPI">UPI / Online Transfer</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Bajaj Finance">Bajaj Finance EMI</option>
              <option value="split">Split Payment (Multiple Modes)</option>
            </select>
          </div>

          {newBooking.payment_mode === "split" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Split Details (Target: ₹{parseFloat(newBooking.advance_amount || "0").toLocaleString("en-IN")})</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cash Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.cash}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, cash: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Card Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.card}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, card: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">UPI Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.upi}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, upi: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Bajaj Finance</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.bajaj_finance}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, bajaj_finance: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Booking
          </button>
        </form>
      </Modal>

      {/* 5. Add / Edit Battery */}
      <Modal isOpen={isAddBatteryOpen} onClose={() => setIsAddBatteryOpen(false)} title={editingBatteryId ? "Edit Battery details" : "Log Battery Pack"}>
        <form onSubmit={handleCreateBattery} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Serial Number</label>
                <button
                  type="button"
                  onClick={() => {
                    const year = new Date().getFullYear();
                    const seq = String((batteriesStock?.length || 0) + 1).padStart(4, "0");
                    setNewBattery({ ...newBattery, serial_number: `BATT-${year}-${seq}` });
                  }}
                  className="text-[9px] font-bold text-[#04a700] hover:underline cursor-pointer"
                >
                  ⚡ Auto-Generate
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. BATT-2026-0001"
                value={newBattery.serial_number}
                onChange={(e) => setNewBattery({ ...newBattery, serial_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Code</label>
              <input type="text" placeholder="e.g. BAT-LFP-6030" value={newBattery.battery_code} onChange={(e) => setNewBattery({ ...newBattery, battery_code: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity spec</label>
            <input type="text" placeholder="e.g. 2.0 kWh" value={newBattery.capacity} onChange={(e) => setNewBattery({ ...newBattery, capacity: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Warehouse Outlet location</label>
            <select value={newBattery.location} onChange={(e) => setNewBattery({ ...newBattery, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none cursor-pointer">
              {locationsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              {locationsList.length === 0 && <option value="3">Vizag Central Godown</option>}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Warranty Period (Years)</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 3" value={newBattery.warranty_years} onChange={(e) => setNewBattery({ ...newBattery, warranty_years: e.target.value.replace(/\D/g, '') })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Acquisition Purchase Date</label>
              <input type="date" max={new Date().toISOString().split("T")[0]} value={newBattery.purchase_date} onChange={(e) => setNewBattery({ ...newBattery, purchase_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select value={newBattery.status} onChange={(e) => setNewBattery({ ...newBattery, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none">
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="assigned">Assigned</option>
              <option value="damaged">Damaged</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Battery Pack
          </button>
        </form>
      </Modal>

      {/* Request Stock Transfer Modal */}
      <Modal isOpen={isRequestTransferOpen} onClose={() => { setIsRequestTransferOpen(false); setSelectedTransferUnit(null); }} title="Request Internal Stock Transfer">
        <form onSubmit={handleRequestTransferSubmit} className="space-y-4 text-left">
          {selectedTransferUnit && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Model Name</span>
                  <span className="font-bold text-slate-900">{selectedTransferUnit.model_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">VIN / Identifier</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTransferUnit.vin_number || selectedTransferUnit.motor_number || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Color Spec</span>
                  <span>{selectedTransferUnit.color || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Branch</span>
                  <span className="text-amber-700 font-bold">{selectedTransferUnit.showroom_name || selectedTransferUnit.branch_name || "Other"}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Showroom (Auto-assigned)</label>
            <input
              type="text"
              value={user?.showroom || "KVR Showroom - Visakhapatnam"}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 font-bold outline-none cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Storage Location Area</label>
            <select
              value={requestDestinationLocation}
              onChange={(e) => setRequestDestinationLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-[#04a700]"
              required
            >
              <option value="">Select location...</option>
              {locationsList
                .filter(l => !user?.showroom || l.showroom === showroomsList.find(s => s.name === user?.showroom)?.id)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))
              }
            </select>
          </div>

          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md shadow-[#04a700]/20 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <Truck className="h-4 w-4" /> Request Branch Transfer
          </button>
        </form>
      </Modal>

      {/* Payment Verification & Proof Upload Modal */}
      {isPaymentVerificationOpen && verifyingInvoice && (
        <Modal 
          isOpen={isPaymentVerificationOpen} 
          onClose={() => { setIsPaymentVerificationOpen(false); setVerifyingInvoice(null); }}
          title={`Sales Payment Verification (${verifyingInvoice.invoice_number || ('INV-' + verifyingInvoice.id)})`}
        >
          <form onSubmit={handleConfirmPaymentAndCloseSaleSubmit} className="space-y-4 text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Sale & Vehicle Specs Summary</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Vehicle Model</span>
                  <span className="font-bold text-slate-900">{verifyingInvoice.model_name || "Kinetic Green EV"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Total Sale Price</span>
                  <span className="font-bold text-emerald-600">₹ {parseFloat(verifyingInvoice.sale_price || "74999").toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Payment Mode</span>
                  <span className="font-bold text-slate-800">{verifyingInvoice.payment_mode || "SBI Finance"}</span>
                </div>
              </div>
            </div>

            {/* Editable Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                <input 
                  type="text" 
                  value={editCustomerName} 
                  onChange={(e) => setEditCustomerName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">10-Digit Contact Phone</label>
                <input 
                  type="tel" 
                  value={editCustomerPhone} 
                  onChange={(e) => setEditCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  maxLength={10} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Verified Payment Method / Financier</label>
              <select 
                value={editPaymentMode} 
                onChange={(e) => setEditPaymentMode(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500"
              >
                <option value="SBI Finance">SBI Finance</option>
                <option value="HDFC Bank Loan">HDFC Bank Loan</option>
                <option value="L&T Finance">L&T Finance</option>
                <option value="UPI / Online QR">UPI / Online QR</option>
                <option value="Cash">Cash</option>
                <option value="Split Payment">Split Payment</option>
              </select>
            </div>

            {/* Split Payment Breakdown Fields */}
            {editPaymentMode === "Split Payment" && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Split Payment Breakdown</span>
                  <span className="text-xs font-bold text-slate-600">
                    Total: <strong className="text-emerald-700">₹{((parseFloat(editSplitCash)||0) + (parseFloat(editSplitUpi)||0) + (parseFloat(editSplitCard)||0) + (parseFloat(editSplitFinance)||0)).toLocaleString("en-IN")}</strong> / ₹{parseFloat(verifyingInvoice.sale_price || "0").toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Cash (₹)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={editSplitCash} 
                      onChange={(e) => setEditSplitCash(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">UPI (₹)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={editSplitUpi} 
                      onChange={(e) => setEditSplitUpi(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Card (₹)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={editSplitCard} 
                      onChange={(e) => setEditSplitCard(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Bank / Finance (₹)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={editSplitFinance} 
                      onChange={(e) => setEditSplitFinance(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof Image Upload */}
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {editPaymentMode === "Cash"
                  ? "Upload Payment Receipt / Proof (Optional for Cash)"
                  : "Upload Payment Receipt / Transaction Screenshot * Required"}
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePaymentProofUpload} 
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
              />
              {paymentProofImage && (
                <div 
                  onClick={() => setPreviewZoomImage(paymentProofImage)}
                  className="mt-3 relative w-36 h-36 rounded-xl overflow-hidden border-2 border-emerald-500 bg-white shadow-sm cursor-pointer group hover:opacity-90 transition-all"
                  title="Click to view full size preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={paymentProofImage} alt="Payment Receipt Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-full flex items-center gap-1">
                      🔍 Tap to Zoom
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setIsPaymentVerificationOpen(false); setVerifyingInvoice(null); }} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-extrabold rounded-full shadow-md transition-colors cursor-pointer"
              >
                Confirm Payment & Close Sale Order
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox Preview Modal for Payment Receipt Proof */}
      {previewZoomImage && (
        <Modal 
          isOpen={!!previewZoomImage} 
          onClose={() => setPreviewZoomImage(null)} 
          title="Payment Proof Receipt Image Preview"
        >
          <div className="flex flex-col items-center space-y-4 p-2">
            <div className="w-full max-h-[70vh] overflow-auto border border-slate-200 rounded-xl bg-slate-900/5 p-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={previewZoomImage} 
                alt="Full Payment Proof Receipt" 
                className="max-w-full h-auto max-h-[65vh] object-contain rounded-lg shadow-md" 
              />
            </div>
            <button 
              onClick={() => setPreviewZoomImage(null)} 
              className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-full cursor-pointer transition-colors"
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
