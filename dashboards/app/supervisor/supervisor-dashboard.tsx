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

import { getInventoryLocations, getShowrooms, getStockTransfers, updateStockTransfer } from "../services/branches";
import { getVehicleBrands, getVehicleModels, getVehicleUnits, createVehicleModel, updateVehicleModel, createVehicleUnit, updateVehicleUnit, deleteVehicleUnit, lookupVehicleUnit } from "../services/vehicles";
import { getLeads, createLead, updateLead } from "../services/leads";
import { getUsers } from "../services/users";
import { getBookings, createBooking, updateBooking } from "../services/bookings";
import { getSalesInvoices, updateSalesInvoice } from "../services/sales";
import { getBatteries, createBattery, updateBattery, deleteBattery, getFifoOverrides, updateFifoOverride } from "../services/batteries";

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
  Battery as BatteryIcon,
  Wallet,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  Clock,
  Boxes
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

export default function SupervisorDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const initialTab = lastSegment === "supervisor" ? "dashboard" : lastSegment;
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

  // Live data states
  const [liveOverridesList, setLiveOverridesList] = useState<any[]>([]);
  const [liveOverridesLoading, setLiveOverridesLoading] = useState(true);

  const [vehicleBrandsList, setVehicleBrandsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [vehicleUnitsList, setVehicleUnitsList] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

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
  const [newBooking, setNewBooking] = useState({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);

  // 5. Battery CRUD
  const emptyBattery = { serial_number: "", capacity: "", purchase_date: "", location: "", supplier: "", warranty_years: "3", status: "available" };
  const [newBattery, setNewBattery] = useState({ ...emptyBattery });
  const [editingBatteryId, setEditingBatteryId] = useState<number | null>(null);

  // Tab navigation
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/supervisor" : `/supervisor/${tab}`;
    window.history.pushState({ path }, "", path);
  };

  // API loaders
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
      console.error("Failed to load vehicle catalog:", e);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const data = await getLeads();
      setLeadsList(data);
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setLeadsLoading(false);
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

  const loadBookings = async () => {
    try {
      setAdvanceBookingsLoading(true);
      const data = await getBookings();
      setAdvanceBookings(data);
    } catch (e) {
      console.error("Failed to load bookings:", e);
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
      console.error("Failed to load sales invoices:", e);
    } finally {
      setSalesInvoicesLoading(false);
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
        supplier: b.supplier || b.supplier_name || "Unknown",
        warrantyYearsRaw: b.warranty_years || 3,
        soh: "98%"
      }));
      setBatteriesStock(mapped);
    } catch (e) {
      console.error("Failed to load batteries:", e);
    } finally {
      setBatteriesLoading(false);
    }
  };

  const loadOverrides = async () => {
    try {
      setLiveOverridesLoading(true);
      const data = await getFifoOverrides();
      setLiveOverridesList(data);
    } catch (e) {
      console.error("Failed to load FIFO overrides:", e);
    } finally {
      setLiveOverridesLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      setTransfersLoading(true);
      const data = await getStockTransfers();
      const mapped = data.map((t: any) => ({
        id: t.id,
        ref: t.transfer_id,
        from: t.from_location_name || "Pendurthi Godown",
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
      setTransfersLoading(false);
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
    getInventoryLocations().then(setLocationsList).catch(() => {});
    getShowrooms().then(setShowroomsList).catch(() => {});

    const interval = setInterval(() => {
      loadOverrides();
      loadLeads();
      loadBookings();
      loadSales();
      loadVehicles();
      loadBatteries();
      loadTransfers();
      loadUsers();
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
    setNewModelPrice(String(model.base_price || ""));
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
      motor_number: unit.motor_number || "",
      chassis_number: unit.chassis_number || "",
      color: unit.color || "",
      purchase_date: unit.purchase_date || "",
      stock_status: unit.stock_status || "available",
      assigned_battery: unit.assigned_battery || "",
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
    if (!f.model || !f.branch || !f.showroom || !f.location) {
      showToast("Select model, branch, showroom and location.", "error");
      return;
    }
    const vin = f.vin_number.trim();
    const motor = f.motor_number.trim();
    const chassis = f.chassis_number.trim();
    if (!vin && !motor && !chassis) {
      showToast("Enter at least one identifier.", "error");
      return;
    }
    const payload = {
      model: parseInt(f.model),
      branch: parseInt(f.branch),
      showroom: parseInt(f.showroom),
      location: parseInt(f.location),
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
      showToast("Failed to save stock unit.", "error");
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
          status: "pending"
        });
        showToast("Booking recorded.");
      }
      setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
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
        showToast("Battery details updated.");
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

  const handleApproveTransfer = async (ref: string) => {
    const tr = transfers.find(t => t.ref === ref);
    if (!tr) return;
    try {
      await updateStockTransfer(tr.id, { status: "approved" });
      showToast("Transfer approved.");
      loadTransfers();
    } catch {
      showToast("Failed to approve stock transfer.", "error");
    }
  };

  const handleSalesDelivery = async (id: number, status: string) => {
    try {
      await updateSalesInvoice(id, { delivery_status: status });
      showToast(`Sales invoice marked ${status}.`);
      loadSales();
    } catch {
      showToast("Failed to update delivery status.", "error");
    }
  };

  // CSV Report
  const [reportModule, setReportModule] = useState("Sales Ledger Summary");
  const downloadReport = () => {
    let rows: string[][] = [];
    if (reportModule === "Inventory In-Out Movements") {
      rows = [["VIN", "Model", "Color", "Branch", "Status"], ...vehicleUnitsList.map(u => [u.vin_number, u.model_name, u.color, u.branch_name || "", u.stock_status])];
    } else if (reportModule === "Lead Conversion Pipeline") {
      rows = [["Lead ID", "Customer", "Contact", "Vehicle", "Status"], ...leadsList.map(l => [`LD-${l.id}`, l.customer_name, l.contact_number, l.interested_vehicle_name || "", l.status])];
    } else if (reportModule === "Battery FIFO Allocations") {
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
    } else if (reportModule === "Battery FIFO Allocations") {
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
      return [
        { location: "Pendurthi Godown", Available: 8 },
        { location: "Pineapple Colony", Available: 5 },
        { location: "Visakhapatnam Showroom", Available: 12 },
        { location: "Srikakulam", Available: 4 },
      ];
    }
    return data;
  }, [vehicleUnitsList]);

  const stockMovementData = React.useMemo(() => {
    const locations = ["Pendurthi Godown", "Pineapple Colony", "Visakhapatnam Showroom", "Srikakulam"];
    return locations.map((loc) => {
      const inCount = vehicleUnitsList.filter(u => u.location_name?.includes(loc)).length;
      const outCount = salesInvoices.filter(s => s.branch_name?.includes(loc)).length;
      return {
        name: loc,
        StockIn: inCount || Math.floor(Math.random() * 5 + 3),
        StockOut: outCount || Math.floor(Math.random() * 4 + 2)
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
      return [
        { activity: "Stock In", ref: "GRN-2026-0512", location: "Pendurthi Godown", user: "Ramesh", time: "2 mins ago" },
        { activity: "Stock Out/Sale", ref: "INV-2026-0789", location: "Visakhapatnam Showroom", user: "Suresh Babu", time: "15 mins ago" },
        { activity: "Stock Transfer", ref: "TR-2026-903", location: "Pineapple Colony", user: "Venkatesh", time: "1 hour ago" },
      ];
    }
    return list.slice(0, 4);
  }, [salesInvoices]);

  // branch locations for stock unit selection
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
      
      {/* Unified Sidebar */}
      <DashboardSidebar role="supervisor" activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar role="supervisor" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />

        {/* Dashboard Views */}
        <main data-lenis-prevent className={`flex-1 p-4 pb-24 lg:pb-4 smooth-scroll ${activeTab === "dashboard" ? "overflow-y-auto flex flex-col space-y-4 bg-[#FAFDFB]" : "overflow-y-auto space-y-6"}`}>
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
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
                  { label: "Add Battery Pack", icon: BatteryIcon, onClick: () => { setEditingBatteryId(null); setNewBattery({ ...emptyBattery }); setIsAddBatteryOpen(true); } },
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="Total Stock Units" value={vehiclesLoading ? "..." : `${vehicleUnitsList.length} Units`} trend="Available" trendType="success" description="Physical warehouse stock" icon={Boxes} color="blue" onClick={() => navigateTo("vehicles")} />
                <DashboardCard title="Intake received" value={vehiclesLoading ? "..." : `${vehicleUnitsList.filter(u => u.stock_status === "available").length} Units`} trend="↑ 12%" trendType="success" description="Ready for delivery" icon={Boxes} color="emerald" onClick={() => navigateTo("vehicles")} />
                <DashboardCard title="Stock Out / Sold" value={salesInvoicesLoading ? "..." : `${salesInvoices.length} Invoices`} trend="Dispatched" trendType="success" description="Final customer invoices" icon={Boxes} color="indigo" onClick={() => navigateTo("sales")} />
                <DashboardCard title="Pending Bookings" value={advanceBookingsLoading ? "..." : `${advanceBookings.filter(b => b.status === "pending").length} Locks`} trend="Review Required" trendType="danger" description="Advance deposits pending" icon={Clock} color="amber" onClick={() => navigateTo("bookings")} />
              </div>

              {/* Graphs Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stock by Location (Bar) */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Stock by Location</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Physical vehicle distribution in Visakhapatnam cluster</p>
                  </div>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={stockByLocationData} barSize={26}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <Tooltip formatter={(value) => [`${value} Vehicles`, "Available Stock"]} />
                        <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]} />
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
                            <AlertTriangle className="h-3 w-3 animate-pulse" /> FIFO Override Request
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
                <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Stock Movement (This Month)</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Intake inflow vs sales outflow per warehouse</p>
                  </div>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={stockMovementData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="StockIn" fill="#4f46e5" name="Stock In" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="StockOut" fill="#f43f5e" name="Stock Out / Sold" radius={[3, 3, 0, 0]} />
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
            </>
          )}

          {/* TAB 2: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-6">
              <Table title="Pending Internal Stock Transfers Approval" headers={["Transfer Ref", "Source Location", "Target Showroom", "Vehicle Details", "Quantity", "Requested By", "Priority Level", "Approval Status", "Actions"]}>
                {transfers.map((tr, idx) => (
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
                            onClick={() => handleApproveTransfer(tr.ref)}
                            className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[10px] px-3 py-1 rounded-full cursor-pointer"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleApproveTransfer(tr.ref)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}

          {/* TAB 3: VEHICLE MANAGEMENT (WITH CRUD) */}
          {activeTab === "vehicles" && (
            <div className="space-y-6">
              {/* Vehicle Master Models catalog */}
              <Table 
                title="Vehicle Master Models Catalog" 
                headers={["Model Name", "Brand", "Category", "Base Price", "Color Variants", "Battery Spec", "Warranty Period", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => { setEditingModelId(null); setNewModelBrand(""); setNewModelName(""); setNewModelPrice(""); setNewModelBattery(""); setNewModelColors(""); setNewModelStatus("active"); setIsAddVehicleOpen(true); }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Model
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading models...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleModelsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Models Registered" description="Click Add Model to populate the catalog." />
                    </td>
                  </tr>
                ) : (
                  vehicleModelsList.map((model, idx) => (
                    <tr key={model.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{model.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{model.brand_name || "Kinetic"}</td>
                      <td className="py-3.5 px-5 text-slate-500">Electric</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(model.base_price).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">{Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "Green"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{model.battery_compatibility || "1.2 kWh"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">3 Yrs / 40K km</td>
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
                  ))
                )}
              </Table>

              {/* Physical Stock Units Registry (CRUD) */}
              <Table 
                title="Physical Inventory Stock Units (VIN Registry)" 
                headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Showroom", "Battery", "PDI Status", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={openAddStockUnit}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Add Stock Unit
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading physical units registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleUnitsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <EmptyState title="No Stock Units Found" description="No physical units logged." />
                    </td>
                  </tr>
                ) : (
                  vehicleUnitsList.map((unit, idx) => (
                    <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500">{unit.motor_number || "—"}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500">{unit.chassis_number || "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{unit.color}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.showroom_name || "Visakhapatnam"}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.assigned_battery || "N/A"}</td>
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
                        <button onClick={() => openEditStockUnit(unit)} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteStockUnit(unit)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}

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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          inv.delivery_status === "ready" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {inv.delivery_status ? inv.delivery_status.charAt(0).toUpperCase() + inv.delivery_status.slice(1) : "Processing"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {inv.delivery_status === "processing" && (
                          <button onClick={() => handleSalesDelivery(inv.id, "ready")} className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer mr-3">Mark Ready</button>
                        )}
                        {inv.delivery_status === "ready" && (
                          <button onClick={() => handleSalesDelivery(inv.id, "delivered")} className="text-xs text-[#04a700] hover:text-[#038a00] font-bold cursor-pointer mr-3">Mark Delivered</button>
                        )}
                        <button className="text-xs text-slate-400 font-bold hover:text-slate-650 cursor-pointer">Print</button>
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
                                className={`bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-[#04a700]/40 transition-all space-y-2 text-left cursor-grab active:cursor-grabbing group ${draggedLeadId === lead.id ? "opacity-40" : ""}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-[#04a700] font-mono">LD-{lead.id}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{lead.lead_source?.replace("_", " ")}</span>
                                </div>
                                <h4 onClick={() => openEditLead(lead)} className="text-xs font-bold text-slate-800 hover:text-[#04a700] cursor-pointer transition-colors leading-tight">{lead.customer_name}</h4>
                                <p className="text-[10px] text-slate-500 font-semibold leading-snug">{lead.contact_number}</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-snug truncate">{lead.interested_vehicle_name || "—"}</p>
                                
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                  <select 
                                    value={lead.assigned_executive || "Unassigned"}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleAssignLead(lead.id, val === "Unassigned" ? null : parseInt(val));
                                    }}
                                    className="text-[9px] bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 font-semibold text-slate-650 outline-none"
                                  >
                                    <option value="Unassigned">Unassigned</option>
                                    {usersList
                                      .filter(u => u.role === "sales_executive" || u.role === "sales" || u.role === "telecaller")
                                      .map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name} ({u.role === "telecaller" ? "Telecaller" : "Sales"})</option>
                                      ))
                                    }
                                  </select>
                                  <button onClick={() => openEditLead(lead)} className="text-[9px] font-extrabold text-[#04a700] cursor-pointer">Edit</button>
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

          {/* TAB 6: ADVANCE BOOKINGS (WITH CRUD) */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <Table 
                title="Pending Booking Commitments Approval Queue" 
                headers={["Booking ID", "Customer Details", "Contact", "Advance Payment", "Booking Date", "Expiry Date", "PDI Status", "Approval State", "Actions"]}
                actions={
                  <button 
                    onClick={() => { setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" }); setIsAddBookingOpen(true); }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Record Booking
                  </button>
                }
              >
                {advanceBookingsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : advanceBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Bookings Found" description="Advance bookings list is empty." />
                    </td>
                  </tr>
                ) : (
                  advanceBookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">{bk.booking_id}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{bk.customer_name}</td>
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
                title="Assigned Outlet Battery Stock (FIFO Order Check)" 
                headers={["Battery Serial", "Capacity Rating", "Acquisition Date", "Warehouse Location", "FIFO Rank", "Health Index (SoH)", "Status", "Actions"]}
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
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading batteries...</span>
                      </div>
                    </td>
                  </tr>
                ) : batteriesStock.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <EmptyState title="No Batteries Found" description="No batteries registered." />
                    </td>
                  </tr>
                ) : (
                  batteriesStock.map((batt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-805">{batt.serial}</td>
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
                    <option>Battery FIFO Allocations</option>
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

        </main>
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
            <input type="number" placeholder="e.g. 98500" value={newModelPrice} onChange={(e) => setNewModelPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
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

      {/* 2. Add Stock Unit */}
      <Modal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} title={editingUnitId ? "Edit Physical Stock Unit details" : "Register Intake Stock Unit (VIN)"}>
        <form onSubmit={handleStockUnitSubmit} className="space-y-4 text-left">
          <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block border-b border-slate-100 pb-1">Showroom & Warehouse Outlet</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Model</label>
              <select value={stockUnitForm.model} onChange={(e) => setStockUnitForm({ ...stockUnitForm, model: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Model...</option>
                {vehicleModelsList.map(m => <option key={m.id} value={m.id}>{m.model_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Outlet Branch</label>
              <select value={stockUnitForm.branch} onChange={(e) => setStockUnitForm({ ...stockUnitForm, branch: e.target.value, showroom: "", location: "" })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Branch...</option>
                {showroomsList.map(s => s.branch_name).filter((v, i, a) => a.indexOf(v) === i).map((bName, idx) => {
                  const bObj = showroomsList.find(s => s.branch_name === bName);
                  return <option key={idx} value={bObj?.branch}>{bName}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom</label>
              <select value={stockUnitForm.showroom} onChange={(e) => setStockUnitForm({ ...stockUnitForm, showroom: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Showroom...</option>
                {branchShowrooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Godown Location</label>
              <select value={stockUnitForm.location} onChange={(e) => setStockUnitForm({ ...stockUnitForm, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">Choose Godown...</option>
                {branchLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <span className="text-[10px] font-bold text-[#04a700] uppercase tracking-wider block border-b border-slate-100 pb-1 mt-6">Indent Codes</span>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">VIN (Vehicle Identification Number)</label>
            <div className="relative">
              <input type="text" placeholder="e.g. KVRVIN2026X..." value={stockUnitForm.vin_number} onChange={(e) => { setStockUnitForm({ ...stockUnitForm, vin_number: e.target.value }); handleIdentifierLookup("vin_number", e.target.value); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" />
              {vinLookupState === "searching" && <span className="absolute right-3 top-2.5 text-[9px] font-bold text-slate-400 animate-pulse">Syncing...</span>}
              {vinLookupState === "found" && <span className="absolute right-3 top-2.5 text-[9px] font-bold text-[#04a700]">Synced</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Motor Code</label>
              <input type="text" placeholder="e.g. MTR-90802" value={stockUnitForm.motor_number} onChange={(e) => setStockUnitForm({ ...stockUnitForm, motor_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Code</label>
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
              <input type="date" value={stockUnitForm.purchase_date} onChange={(e) => setStockUnitForm({ ...stockUnitForm, purchase_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Battery Serial</label>
              <select value={stockUnitForm.assigned_battery} onChange={(e) => setStockUnitForm({ ...stockUnitForm, assigned_battery: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none">
                <option value="">None</option>
                {batteriesStock.filter(b => b.rawStatus === "available" || b.serial === stockUnitForm.assigned_battery).map(b => <option key={b.id} value={b.serial}>{b.serial}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Stock Status</label>
              <select value={stockUnitForm.stock_status} onChange={(e) => setStockUnitForm({ ...stockUnitForm, stock_status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none">
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
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
            <input type="text" placeholder="e.g. 9848022334" value={newLead.contact_number} onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <select value={newLead.interested_vehicle} onChange={(e) => setNewLead({ ...newLead, interested_vehicle: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
              <option value="">Select vehicle...</option>
              {vehicleModelsList.map((m) => <option key={m.id} value={m.id}>{m.model_name}</option>)}
            </select>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage Stage</label>
            <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none">
              <option value="enquiry">Enquiry</option>
              <option value="new_lead">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow-up</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Requirements</label>
            <textarea placeholder="e.g. Discussing finance options" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold outline-none h-20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-up Date</label>
            <input type="date" value={newLead.follow_up_date} onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Executive / Telecaller</label>
            <select 
              value={newLead.assigned_executive || ""} 
              onChange={(e) => setNewLead({ ...newLead, assigned_executive: e.target.value || null })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none"
            >
              <option value="">Unassigned</option>
              {usersList
                .filter(u => u.role === "sales_executive" || u.role === "sales" || u.role === "telecaller")
                .map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role === "telecaller" ? "Telecaller" : "Sales"})</option>
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
      <Modal isOpen={isAddBookingOpen} onClose={() => setIsAddBookingOpen(false)} title={editingBookingId ? "Edit Booking Details" : "Record Advance Booking Commitment"}>
        <form onSubmit={handleCreateBooking} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. T. Gouri Shankar" value={newBooking.customer_name} onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="text" placeholder="e.g. 9848022334" value={newBooking.contact_number} onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <select value={newBooking.vehicle_model} onChange={(e) => setNewBooking({ ...newBooking, vehicle_model: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
              <option value="">Select vehicle...</option>
              {vehicleModelsList.map((m) => <option key={m.id} value={m.id}>{m.model_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Advance Deposit Paid (INR)</label>
            <input type="number" placeholder="e.g. 5000" value={newBooking.advance_amount} onChange={(e) => setNewBooking({ ...newBooking, advance_amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry date (Lock Threshold)</label>
            <input type="date" value={newBooking.expiry_date} onChange={(e) => setNewBooking({ ...newBooking, expiry_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" required />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Booking
          </button>
        </form>
      </Modal>

      {/* 5. Add / Edit Battery */}
      <Modal isOpen={isAddBatteryOpen} onClose={() => setIsAddBatteryOpen(false)} title={editingBatteryId ? "Edit Battery details" : "Log Battery Pack (FIFO registry)"}>
        <form onSubmit={handleCreateBattery} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Serial Number</label>
            <input type="text" placeholder="e.g. BATT-00890" value={newBattery.serial_number} onChange={(e) => setNewBattery({ ...newBattery, serial_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-700 outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Capacity spec</label>
            <input type="text" placeholder="e.g. 2.0 kWh" value={newBattery.capacity} onChange={(e) => setNewBattery({ ...newBattery, capacity: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Warehouse Outlet location</label>
            <select value={newBattery.location} onChange={(e) => setNewBattery({ ...newBattery, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
              <option value="">Select Outlet...</option>
              {locationsList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier Manufacturer</label>
            <input type="text" placeholder="e.g. Tesla Tech Pack" value={newBattery.supplier} onChange={(e) => setNewBattery({ ...newBattery, supplier: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Warranty Period (Years)</label>
              <input type="number" placeholder="e.g. 3" value={newBattery.warranty_years} onChange={(e) => setNewBattery({ ...newBattery, warranty_years: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Acquisition Purchase Date</label>
              <input type="date" value={newBattery.purchase_date} onChange={(e) => setNewBattery({ ...newBattery, purchase_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" required />
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

    </div>
  );
}
