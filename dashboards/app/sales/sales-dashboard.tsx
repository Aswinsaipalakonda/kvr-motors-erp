"use client";

import React, { useState, useEffect, useMemo } from "react";
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

import { lookupVehicleUnit, getVehicleModels } from "../services/vehicles";
import { getBatteries, checkFifo, createFifoOverride, getFifoOverrides } from "../services/batteries";
import { getLeads, createLead, updateLead } from "../services/leads";
import { createBooking, getBookings, updateBooking } from "../services/bookings";
import { createSalesInvoice, getSalesInvoices } from "../services/sales";
import MelaSubSidebar from "../components/MelaSubSidebar";
import {
  getMelaInventory,
  createMelaBooking,
  getMelaBookings,
  updateMelaBooking
} from "../services/mela";

import {
  Compass,
  CreditCard,
  Phone,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Briefcase,
  UsersRound,
  FileCheck,
  CalendarDays,
  Target,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  FileSpreadsheet
} from "lucide-react";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";

export default function SalesDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const initialTab = lastSegment === "sales" ? "dashboard" : lastSegment;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with browser back/forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "sales" ? "dashboard" : segment;
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
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

  // Auto-fill sales checkout VIN search
  const [vinQuery, setVinQuery] = useState("");
  const [autoFillResult, setAutoFillResult] = useState<any>(null);
  const [vinSearchError, setVinSearchError] = useState("");
  const [vinSearchLoading, setVinSearchLoading] = useState(false);

  // FIFO validation states
  const [selectedBattery, setSelectedBattery] = useState("");
  const [fifoWarning, setFifoWarning] = useState(false);
  const [overrideRequested, setOverrideRequested] = useState(false);
  const [batteriesList, setBatteriesList] = useState<any[]>([]);
  const [activeOverrideRequest, setActiveOverrideRequest] = useState<any>(null);
  const [oldestBatteryInStock, setOldestBatteryInStock] = useState<string>("BATT-00874");

  // Live database states
  const [liveLeadsList, setLiveLeadsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [liveBookingsList, setLiveBookingsList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [liveSalesList, setLiveSalesList] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  // Forms state bindings
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "" };
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Advance Booking form bindings
  const [newBooking, setNewBooking] = useState({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);

  // Sales Checkout form bindings
  const [checkoutCustomerName, setCheckoutCustomerName] = useState("");
  const [checkoutContactNumber, setCheckoutContactNumber] = useState("");
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState("SBI Finance");
  const [checkoutInsurancePartner, setCheckoutInsurancePartner] = useState("Chola MS - Comprehensive 1+5 Yr");

  // Tab navigation
  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/sales" : `/sales/${tab}`;
    window.history.pushState({ path }, "", path);
  };

  const loadLeadsData = async () => {
    try {
      setLeadsLoading(true);
      const [leadsData, modelsData] = await Promise.all([
        getLeads(),
        getVehicleModels()
      ]);
      setLiveLeadsList(leadsData);
      setVehicleModelsList(modelsData);
    } catch (e) {
      console.error("Failed to load leads or models:", e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadBatteries = async () => {
    try {
      const data = await getBatteries();
      setBatteriesList(data);
    } catch (e) {
      console.error("Failed to load batteries:", e);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await getBookings();
      setLiveBookingsList(data);
    } catch (e) {
      console.error("Failed to load bookings:", e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const data = await getSalesInvoices();
      setLiveSalesList(data);
    } catch (e) {
      console.error("Failed to load sales invoices:", e);
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadBatteries();
    loadLeadsData();
    loadBookings();
    loadSales();
  }, []);

  // Polling for FIFO Override approvals
  useEffect(() => {
    if (!overrideRequested || !activeOverrideRequest) return;
    
    const interval = setInterval(async () => {
      try {
        const overrides = await getFifoOverrides();
        const activeReq = overrides.find((o: any) => o.id === activeOverrideRequest.id);
        if (activeReq && activeReq.status === "approved") {
          setFifoWarning(false);
          setOverrideRequested(false);
          setActiveOverrideRequest(null);
          showToast("Battery Override APPROVED by Supervisor! Form unlocked.");
          clearInterval(interval);
        } else if (activeReq && activeReq.status === "rejected") {
          setActiveOverrideRequest(null);
          setOverrideRequested(false);
          showToast("Battery Override REJECTED. Select the recommended battery pack.", "error");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Failed to poll override request status:", e);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [overrideRequested, activeOverrideRequest]);

  // VIN Search Auto-fill
  const handleVinSearch = async () => {
    setVinSearchError("");
    setAutoFillResult(null);
    const query = vinQuery.trim();
    if (!query) {
      setVinSearchError("Please enter a VIN, Motor, or Chassis number.");
      return;
    }
    
    try {
      setVinSearchLoading(true);
      const data = await lookupVehicleUnit(query);
      setAutoFillResult({
        id: data.id,
        branchId: data.branch,
        vin: data.vin_number,
        motor: data.motor_number,
        chassis: data.chassis_number,
        model: data.model_name || "Kinetic Green E-Luna",
        color: data.color || "Green",
        price: data.base_price ? `₹ ${parseFloat(data.base_price).toLocaleString('en-IN')}` : "₹ 74,999",
        branch: data.branch_name || "Visakhapatnam Showroom",
        status: data.stock_status.charAt(0).toUpperCase() + data.stock_status.slice(1),
        battery: data.assigned_battery || "BATT-00874"
      });
      showToast("Vehicle details auto-filled.");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "No matching vehicle unit found.";
      setVinSearchError(errorMsg);
      showToast("No vehicle unit found.", "error");
    } finally {
      setVinSearchLoading(false);
    }
  };

  // Battery validation check
  const handleBatterySelect = async (serial: string) => {
    setSelectedBattery(serial);
    if (!serial) {
      setFifoWarning(false);
      setOverrideRequested(false);
      return;
    }
    
    try {
      const checkRes = await checkFifo(serial);
      if (checkRes.is_oldest === false && checkRes.warning) {
        setFifoWarning(true);
        setOldestBatteryInStock(checkRes.oldest_serial_number || "BATT-00874");
      } else {
        setFifoWarning(false);
        setOverrideRequested(false);
      }
    } catch (e) {
      console.error("Failed to validate FIFO status:", e);
      setFifoWarning(false);
    }
  };

  const handleRequestOverride = async () => {
    if (!selectedBattery) return;
    try {
      const targetBattery = batteriesList.find(b => b.serial_number === selectedBattery);
      if (!targetBattery) return;
      
      const newOverride = await createFifoOverride({
        battery: targetBattery.id,
        sales_executive: "Anil Kumar",
        invoice_reference: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setActiveOverrideRequest(newOverride);
      setOverrideRequested(true);
      showToast("Override request sent to Supervisor.");
    } catch (e) {
      showToast("Failed to request override.", "error");
    }
  };

  // Leads CRUD
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

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
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
      assigned_executive: 3 // Assinged to Anil Kumar (Sales Exec)
    };
    try {
      if (editingLeadId) {
        await updateLead(editingLeadId, payload);
        showToast("Lead details updated.");
      } else {
        await createLead(payload);
        showToast("Lead registered successfully.");
      }
      setNewLead({ ...emptyLead });
      setEditingLeadId(null);
      setIsAddLeadOpen(false);
      loadLeadsData();
    } catch (err) {
      showToast("Failed to save lead.", "error");
    }
  };

  const moveLeadToStage = async (leadId: number, newStatus: string) => {
    const lead = liveLeadsList.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    const prevStatus = lead.status;
    setLiveLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await updateLead(leadId, { status: newStatus });
      showToast(`Lead stage updated to ${newStatus.replace("_", " ")}.`);
    } catch {
      setLiveLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: prevStatus } : l)));
      showToast("Failed to update lead stage.", "error");
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
    setIsCreateBookingOpen(true);
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
        showToast("Booking registered successfully.");
      }
      setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" });
      setEditingBookingId(null);
      setIsCreateBookingOpen(false);
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

  // Sales Checkout submission
  const handleSalesCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoFillResult?.id) { showToast("Fetch vehicle details first.", "error"); return; }
    const batteryObj = batteriesList.find(b => b.serial_number === selectedBattery);
    try {
      await createSalesInvoice({
        customer_name: checkoutCustomerName.trim(),
        customer_contact: checkoutContactNumber.trim(),
        vehicle_unit: autoFillResult.id,
        assigned_battery: batteryObj?.id || null,
        sale_price: autoFillResult.price ? parseFloat(autoFillResult.price.replace(/[₹,\s]/g, '')) : 0,
        payment_mode: checkoutPaymentMode,
        insurance_partner: checkoutInsurancePartner,
        delivery_status: "processing",
        branch: autoFillResult.branchId || 1
      });
      showToast("Sale Invoice Created Successfully!");
      setCheckoutCustomerName(""); 
      setCheckoutContactNumber("");
      setAutoFillResult(null); 
      setVinQuery(""); 
      setSelectedBattery("");
      loadSales();
    } catch (err) { 
      showToast("Failed to create sale invoice.", "error"); 
    }
  };

  // Aggregates & Charts
  const leadStatusData = useMemo(() => {
    const fresh = liveLeadsList.filter(l => l.status === "new_lead").length;
    const contacted = liveLeadsList.filter(l => l.status === "contacted").length;
    const followUp = liveLeadsList.filter(l => l.status === "follow_up").length;
    const nego = liveLeadsList.filter(l => l.status === "negotiation").length;
    const won = liveLeadsList.filter(l => l.status === "won").length;
    return [
      { name: "New", value: fresh || 8, color: "#3b82f6" },
      { name: "Contacted", value: contacted || 6, color: "#10b981" },
      { name: "Follow-up", value: followUp || 5, color: "#f59e0b" },
      { name: "Negotiation", value: nego || 3, color: "#8b5cf6" },
      { name: "Won", value: won || 2, color: "#22c55e" }
    ];
  }, [liveLeadsList]);

  const myFollowups = useMemo(() => {
    return liveLeadsList
      .filter(l => l.status === "follow_up" || l.follow_up_date)
      .map((l) => ({
        name: l.customer_name,
        date: l.follow_up_date || "Today",
        model: l.model_name || "Kinetic Green E-Luna",
        contact: l.contact_number,
        purpose: "Outbound Callback",
        priority: "High"
      }));
  }, [liveLeadsList]);

  const customersList = useMemo(() => {
    return liveSalesList.map((s) => ({
      name: s.customer_name,
      contact: s.customer_contact,
      model: s.model_name || "Kinetic Green E-Luna",
      invDate: s.sale_date || "May 2024",
      delStatus: s.delivery_status || "Delivered",
      notes: s.insurance_partner || "Comprehensive package",
      pdiDoneBy: "Suresh Babu",
      nextService: "Next Month"
    }));
  }, [liveSalesList]);

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
      
      {/* Unified Sidebar */}
      <DashboardSidebar role="sales" activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar role="sales" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />

        {/* Dashboard Views */}
        <main className={`flex-1 p-4 pb-24 lg:pb-4 ${activeTab === "dashboard" ? "overflow-y-auto flex flex-col space-y-4 bg-[#FAFDFB]" : "overflow-y-auto space-y-6"}`}>
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Quick Actions Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Add Lead", icon: Plus, onClick: openAddLead },
                  { label: "Record Booking", icon: CalendarDays, onClick: () => { setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" }); setIsCreateBookingOpen(true); } },
                  { label: "Sales Checkout", icon: CreditCard, onClick: () => navigateTo("sales_bookings") },
                  { label: "My Follow-ups", icon: Phone, onClick: () => navigateTo("followups") },
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
                <DashboardCard title="My Active Leads" value={leadsLoading ? "..." : `${liveLeadsList.length} Leads`} trend="Pipeline" trendType="success" description="Assigned leads status" icon={Compass} color="blue" onClick={() => navigateTo("leads")} />
                <DashboardCard title="Follow-ups Due" value={leadsLoading ? "..." : `${liveLeadsList.filter(l => l.status === "follow_up").length} Tasks`} trend="Pending Calls" trendType="neutral" description="Awaiting customer callback" icon={CalendarDays} color="amber" onClick={() => navigateTo("followups")} />
                <DashboardCard title="Personal Bookings" value={bookingsLoading ? "..." : `${liveBookingsList.filter(b => b.status === "confirmed").length} Reserved`} trend="Active lock" trendType="success" description="Stock locked allocations" icon={CreditCard} color="emerald" onClick={() => navigateTo("sales_bookings")} />
                <DashboardCard title="My Units Sold" value={salesLoading ? "..." : `${liveSalesList.length} Units`} trend="MTD Billing" trendType="success" description="Total vehicles invoiced" icon={FileCheck} color="indigo" onClick={() => navigateTo("sales_bookings")} />
              </div>

              {/* Charts agenda Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Lead Status Chart */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-2">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Lead Status Distribution</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ratio of active leads stages</p>
                  </div>
                  <div className="h-[180px] w-full flex flex-col justify-center items-center relative">
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 font-mono">{leadsLoading ? "..." : liveLeadsList.length}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Leads</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-500">
                    {leadStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agenda list */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-3">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">My Follow-ups Agenda</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-sans leading-normal">Outstanding client calls scheduled for today</p>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto space-y-0.5 slim-scrollbar">
                    {myFollowups.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div>
                          <div className="font-extrabold text-slate-800 flex items-center gap-2">
                            {item.name}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              item.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Model: {item.model} • Contact: {item.contact}
                            <span className="block text-emerald-700 mt-0.5">Purpose: {item.purpose}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.date}</span>
                          <a href={`tel:${item.contact}`} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {myFollowups.length === 0 && (
                      <EmptyState title="No followups due!" description="You are all caught up." />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LEADS KANBAN PIPELINE */}
          {activeTab === "leads" && (
            <div className="space-y-5 text-left">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Leads Pipeline Board</h3>
                  <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Drag cards to advance sales stages, or click edit details.</p>
                </div>
                <button 
                  onClick={openAddLead}
                  className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20 shrink-0 animate-pulse"
                >
                  <Plus className="h-4 w-4" /> Add Lead
                </button>
              </div>

              {leadsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#04a700]" />
                  <span className="text-xs font-semibold text-slate-500">Loading pipeline...</span>
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
                    const filteredLeads = liveLeadsList.filter((lead) => col.statuses.includes(lead.status));
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
                                  <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">{lead.lead_source?.replace("_", " ")}</span>
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
                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                  <span className="text-[9px] text-slate-400 font-bold">Anil Kumar</span>
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

          {/* TAB 3: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6 text-left">
              <Table title="Showroom Customer Profiles Directory" headers={["Customer Name", "Contact Mobile", "Purchased EV Model", "Invoice Date", "PDI Verified By", "Next Service Date", "Delivery Status", "Insurance"]}>
                {customersList.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{cust.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{cust.contact}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">{cust.model}</td>
                    <td className="py-3.5 px-5 text-slate-450 font-semibold">{cust.invDate}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-bold">{cust.pdiDoneBy}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-bold text-emerald-700">{cust.nextService}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        cust.delStatus === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {cust.delStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{cust.notes}</td>
                  </tr>
                ))}
                {customersList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center"><EmptyState title="No Customers Found" description="Customers will populate here once sales invoices are checked out." /></td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {/* TAB 4: SALES & BOOKINGS (WITH AUTO-FILL VIN & FIFO ALERT) */}
          {activeTab === "sales_bookings" && (
            <div className="space-y-6">
              
              {/* Sales Checkout & Auto-fill blocks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                {/* Form panel Column */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Generate Booking / Delivery Invoice</h3>
                      <p className="text-[10px] font-semibold text-slate-450 mt-0.5">Use the auto-fill helper on the right to populate vehicle specs.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setAutoFillResult(null);
                        setVinQuery("");
                        setSelectedBattery("");
                        setFifoWarning(false);
                        setOverrideRequested(false);
                        setCheckoutCustomerName("");
                        setCheckoutContactNumber("");
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Clear Form
                    </button>
                  </div>

                  <form className="space-y-4 text-xs font-semibold text-slate-650" onSubmit={handleSalesCheckoutSubmit}>
                    {/* Customer details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                        <input type="text" placeholder="e.g. Ramesh Naidu" value={checkoutCustomerName} onChange={(e) => setCheckoutCustomerName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
                        <input type="text" placeholder="e.g. 9876543210" value={checkoutContactNumber} onChange={(e) => setCheckoutContactNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
                      </div>
                    </div>

                    {/* Financier & Insurance Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Financier Partner</label>
                        <select value={checkoutPaymentMode} onChange={(e) => setCheckoutPaymentMode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500">
                          <option>SBI Finance</option>
                          <option>HDFC Bank Loan</option>
                          <option>L&T Finance</option>
                          <option>Self-Finance (Cash/Cheque)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Insurance Partner Scheme</label>
                        <select value={checkoutInsurancePartner} onChange={(e) => setCheckoutInsurancePartner(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500">
                          <option>Chola MS - Comprehensive 1+5 Yr</option>
                          <option>ICICI Lombard - Zero Dep</option>
                          <option>Digit Insurance - Third Party Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Vehicle details populated by Auto-fill */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Vehicle Unit Allocation Details</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Model</label>
                          <input type="text" value={autoFillResult?.model || ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variant</label>
                          <input type="text" value={autoFillResult?.color || ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Base Price</label>
                          <input type="text" value={autoFillResult?.price || ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Allocated Location</label>
                          <input type="text" value={autoFillResult ? `${autoFillResult.branch}` : ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">VIN / Motor Number</label>
                          <input type="text" value={autoFillResult ? `${autoFillResult.vin} (${autoFillResult.motor})` : ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
                        </div>
                      </div>
                    </div>

                    {/* Battery Assignment & FIFO Validation Alerts */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Assign Battery Serial Number</label>
                      <select 
                        value={selectedBattery}
                        onChange={(e) => handleBatterySelect(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500"
                        required
                      >
                        <option value="">-- Choose Battery pack --</option>
                        {batteriesList.filter(b => b.status === "available").map((b) => (
                          <option key={b.id} value={b.serial_number}>
                            {b.serial_number} ({b.capacity} - Pur Date: {b.purchase_date}) {b.serial_number === "BATT-00874" ? "[Oldest Stock]" : ""}
                          </option>
                        ))}
                      </select>

                      {/* FIFO Warning Indicator */}
                      {fifoWarning && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                          <div className="flex gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                            <div>
                              <h4 className="text-xs font-bold text-amber-800">Stock Sequence Warning Triggered</h4>
                              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                                Selected battery pack ({selectedBattery}) is newer than the oldest available battery in stock ({oldestBatteryInStock}). 
                                Delivery requires an overriding approval code from a Branch Supervisor.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                            {overrideRequested ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                Bypass Request Transmitted to Supervisor Panel...
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleRequestOverride}
                                className="bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full cursor-pointer transition-colors shadow-sm"
                              >
                                Request Supervisor Battery Bypass
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      disabled={fifoWarning && !overrideRequested}
                      className="w-full py-3 bg-[#04a700] hover:bg-[#038a00] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
                    >
                      Confirm Sale & Dispatch
                    </button>
                  </form>
                </div>

                {/* Auto-fill Helper Column */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Vehicle Auto-fill Query</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-normal">
                      Enter a physical vehicle code (VIN, Motor Code, or Chassis) below to automatically populate the sale entry form.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. KVRVIN2026X101 or MTR-90812"
                        value={vinQuery}
                        onChange={(e) => setVinQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-bold font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button 
                      onClick={handleVinSearch}
                      disabled={vinSearchLoading}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:bg-slate-405 flex items-center justify-center gap-1.5"
                    >
                      {vinSearchLoading ? "Fetching..." : "Fetch Vehicle Details"}
                    </button>
                  </div>

                  {vinSearchError && (
                    <p className="text-[10px] font-bold text-rose-600">{vinSearchError}</p>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 leading-normal">
                    <span className="text-[#04a700] block mb-1">MOCK DATABASE CODES TO TRY:</span>
                    <div className="space-y-1 font-mono font-semibold">
                      <div>• VIN: <span className="text-slate-600">KVRVIN2026X101</span> (Moped)</div>
                      <div>• VIN: <span className="text-slate-600">KVRVIN2026X104</span> (Motorcycle)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger (Bookings & Sales Tables) */}
              <div className="grid grid-cols-1 gap-6">
                {/* Bookings table */}
                <Table 
                  title="My Active Booking Commitments" 
                  headers={["Booking ID", "Customer Details", "Contact", "Advance Payment", "Booking Date", "Expiry Threshold", "Approval State", "Actions"]}
                  actions={
                    <button 
                      onClick={() => { setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "" }); setIsCreateBookingOpen(true); }}
                      className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                    >
                      <Plus className="h-4 w-4" /> Record Booking
                    </button>
                  }
                >
                  {bookingsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading bookings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : liveBookingsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <EmptyState title="No Bookings Recorded" description="Advance deposits will display here." />
                      </td>
                    </tr>
                  ) : (
                    liveBookingsList.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3 px-4 font-mono font-bold text-[#04a700]">{bk.booking_id}</td>
                        <td className="py-3 px-4 font-bold text-slate-805">{bk.customer_name}</td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{bk.contact_number}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹ {parseFloat(bk.advance_amount).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-slate-400">{bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{bk.expiry_date ? new Date(bk.expiry_date).toLocaleDateString() : "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            bk.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            bk.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {bk.status === "pending" ? "Pending Approval" : bk.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {bk.status === "pending" ? (
                            <button onClick={() => handleCancelBooking(bk)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Cancel</button>
                          ) : (
                            <span className="text-[10px] text-slate-450 font-bold">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </Table>

                {/* Sales Ledger table */}
                <Table title="My Completed Sales Billing Ledger" headers={["Invoice Ref", "Customer Name", "Contact", "Sale Price", "Payment Mode", "Insurance Partner", "Delivery Status"]}>
                  {salesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-405 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading sales...</span>
                        </div>
                      </td>
                    </tr>
                  ) : liveSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center"><EmptyState title="No Sales Billing Records" description="No sales records checked out." /></td>
                    </tr>
                  ) : (
                    liveSalesList.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#04a700]">{inv.invoice_number || `INV-${inv.id}`}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{inv.customer_name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{inv.customer_contact}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹ {parseFloat(inv.sale_price).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-slate-550 font-bold">{inv.payment_mode}</td>
                        <td className="py-3 px-4 text-slate-500 font-semibold">{inv.insurance_partner || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            inv.delivery_status === "ready" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {inv.delivery_status ? inv.delivery_status.charAt(0).toUpperCase() + inv.delivery_status.slice(1) : "Processing"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>

            </div>
          )}

          {/* TAB 5: FOLLOW-UPS SCHEDULE */}
          {activeTab === "followups" && (
            <div className="space-y-6 text-left">
              <Table title="My Active Follow-up Appointments Agenda" headers={["Customer Name", "Contact Mobile", "Reserved Model", "Scheduled Date", "Latest Progress Status"]}>
                {myFollowups.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{f.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{f.contact}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">{f.model}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-semibold">{f.date}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Follow-up Scheduled
                      </span>
                    </td>
                  </tr>
                ))}
                {myFollowups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center"><EmptyState title="No Followups" description="No follow-up dates registered." /></td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {/* TAB 6: REPORTS & TARGETS */}
          {activeTab === "reports" && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Commission Summary */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800">My Sales & Commissions Overview</h3>
                  </div>

                  <div className="space-y-3.5 font-semibold text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cars/Bikes Sold (This Month):</span>
                      <span className="text-slate-800 font-bold">{liveSalesList.length} Deliveries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Commission Rate Per Unit:</span>
                      <span className="text-slate-800 font-bold">₹ 2,000 / EV unit</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                      <span className="text-slate-650 font-bold">Accumulated Commission Earned:</span>
                      <span className="text-emerald-650 font-extrabold">₹ {(liveSalesList.length * 2000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Targets completions card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-550 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Monthly Targets Completion</h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>EV Units Delivery Target</span>
                      <span>{liveSalesList.length} of 15 ({Math.min(100, Math.round((liveSalesList.length / 15) * 100))}% Achieved)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                      <div className="h-full bg-blue-600 rounded-lg" style={{ width: `${Math.min(100, (liveSalesList.length / 15) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-2">
                      Reach 15 deliveries this month to qualify for target completion commissions and performance bonus.
                    </p>
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
      <BottomNav role="sales" activeTab={activeTab} />

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
      {/* 1. Register / Edit Lead */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title={editingLeadId ? "Update Pipeline Lead details" : "Register Pipeline Lead Enquiry"}>
        <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. S. Sita Kumari" value={newLead.customer_name} onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Mobile</label>
            <input type="text" placeholder="e.g. 9900112233" value={newLead.contact_number} onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <select value={newLead.interested_vehicle} onChange={(e) => setNewLead({ ...newLead, interested_vehicle: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-blue-500 font-bold" required>
              <option value="">Select vehicle...</option>
              {vehicleModelsList.map((model) => (
                <option key={model.id} value={model.id}>{model.model_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Inflow Source</label>
            <select value={newLead.lead_source} onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold">
              <option value="walk_in">Walk-in Inquiry</option>
              <option value="website">Website Portal</option>
              <option value="reference">Customer Reference</option>
              <option value="social">Social Media Ads</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage</label>
            <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold">
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
            <textarea placeholder="e.g. Inquired about monthly battery financing options" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold outline-none h-20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-up Date</label>
            <input type="date" value={newLead.follow_up_date} onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Lead
          </button>
        </form>
      </Modal>

      {/* 2. Register / Edit Booking */}
      <Modal isOpen={isCreateBookingOpen} onClose={() => setIsCreateBookingOpen(false)} title={editingBookingId ? "Edit Booking Details" : "Record Advance Booking Commitment"}>
        <form onSubmit={handleCreateBooking} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. Ramesh Naidu" value={newBooking.customer_name} onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="text" placeholder="e.g. 9876543210" value={newBooking.contact_number} onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
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
            <input type="number" placeholder="e.g. 5000" value={newBooking.advance_amount} onChange={(e) => setNewBooking({ ...newBooking, advance_amount: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
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

    </div>
  );
}
