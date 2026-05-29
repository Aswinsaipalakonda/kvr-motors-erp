"use client";

import React, { useState } from "react";
import { lookupVehicleUnit, getVehicleModels } from "../services/vehicles";
import { getBatteries, checkFifo, createFifoOverride, getFifoOverrides } from "../services/batteries";
import { getLeads, createLead, updateLead } from "../services/leads";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
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
  Target
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
  const activeTab = lastSegment === "sales" ? "dashboard" : lastSegment;

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Local Modals
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

  // AUTO-FILL SEARCH STATE
  const [vinQuery, setVinQuery] = useState("");
  const [autoFillResult, setAutoFillResult] = useState<any>(null);
  const [vinSearchError, setVinSearchError] = useState("");
  const [vinSearchLoading, setVinSearchLoading] = useState(false);

  // FIFO WARNING STATE
  const [selectedBattery, setSelectedBattery] = useState("");
  const [fifoWarning, setFifoWarning] = useState(false);
  const [overrideRequested, setOverrideRequested] = useState(false);
  const [batteriesList, setBatteriesList] = useState<any[]>([]);
  const [activeOverrideRequest, setActiveOverrideRequest] = useState<any>(null);
  const [oldestBatteryInStock, setOldestBatteryInStock] = useState<string>("BATT-00874");

  // Real database leads states
  const [liveLeadsList, setLiveLeadsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Add Lead form bindings
  const [leadCustomerName, setLeadCustomerName] = useState("");
  const [leadContactNumber, setLeadContactNumber] = useState("");
  const [leadVehicleModel, setLeadVehicleModel] = useState<string>("");
  const [leadSource, setLeadSource] = useState("walk_in");

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

  React.useEffect(() => {
    setIsMounted(true);
    loadBatteries();
    loadLeadsData();
  }, []);

  React.useEffect(() => {
    if (!overrideRequested || !activeOverrideRequest) return;
    
    const interval = setInterval(async () => {
      try {
        const overrides = await getFifoOverrides();
        const activeReq = overrides.find((o: any) => o.id === activeOverrideRequest.id);
        if (activeReq && activeReq.status === "approved") {
          setFifoWarning(false);
          setOverrideRequested(false);
          setActiveOverrideRequest(null);
          alert("FIFO Override Request APPROVED by Supervisor! Form unlocked.");
          clearInterval(interval);
        } else if (activeReq && activeReq.status === "rejected") {
          setActiveOverrideRequest(null);
          setOverrideRequested(false);
          alert("FIFO Override Request REJECTED by Supervisor. Please select a FIFO-compliant battery pack.");
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Failed to poll override request status:", e);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [overrideRequested, activeOverrideRequest]);

  // MOCK INVENTORY UNIT REGISTER (FOR AUTO-FILL SIMULATION)
  const mockVehiclesDb = [
    { vin: "KVRVIN2026X101", motor: "MTR-90802", chassis: "CHS-88902", model: "Kinetic Green E-Luna", color: "Green", price: "₹ 74,999", branch: "Vizag Showroom", status: "Available", battery: "BATT-00982 (Oldest)" },
    { vin: "KVRVIN2026X104", motor: "MTR-90812", chassis: "CHS-88915", model: "Watts 100", color: "Red", price: "₹ 1,45,000", branch: "Vizag Showroom", status: "Available", battery: "BATT-00511" },
    { vin: "KVRVIN2026X115", motor: "MTR-90820", chassis: "CHS-88930", model: "Dynamo Pro", color: "Gray", price: "₹ 98,500", branch: "Vizag Showroom", status: "Available", battery: "BATT-00890 (Newer Stock)" }
  ];

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadCustomerName.trim() || !leadContactNumber.trim() || !leadVehicleModel) return;
    try {
      await createLead({
        customer_name: leadCustomerName.trim(),
        contact_number: leadContactNumber.trim(),
        interested_vehicle: parseInt(leadVehicleModel),
        lead_source: leadSource,
        status: "new_lead"
      });
      setLeadCustomerName("");
      setLeadContactNumber("");
      setLeadVehicleModel("");
      setLeadSource("walk_in");
      setIsAddLeadOpen(false);
      loadLeadsData();
    } catch (err) {
      console.error("Failed to register lead enquiry:", err);
    }
  };

  const handleAdvanceLeadStage = async (leadId: number, currentStatus: string) => {
    const statusCycle: Record<string, string> = {
      "new_lead": "contacted",
      "contacted": "follow_up",
      "follow_up": "negotiation",
      "negotiation": "won",
      "won": "won",
      "lost": "lost"
    };
    const nextStatus = statusCycle[currentStatus] || "new_lead";
    try {
      await updateLead(leadId, { status: nextStatus });
      loadLeadsData();
    } catch (e) {
      console.error("Failed to update lead status:", e);
    }
  };

  // Lead Status donut data
  const leadStatusData = [
    { name: "New", value: 12, color: "#3b82f6" },
    { name: "Contacted", value: 10, color: "#10b981" },
    { name: "Follow-up", value: 10, color: "#f59e0b" },
    { name: "Negotiation", value: 5, color: "#8b5cf6" },
    { name: "Won", value: 1, color: "#22c55e" }
  ];

  const myFollowups = [
    { name: "Ramesh Kumar", date: "13 May 2024", model: "Kinetic Green E-Luna", contact: "98855 12345", purpose: "Test Drive Booking", priority: "High" },
    { name: "Vijayalakshmi", date: "12 May 2024", model: "Dynamo Pro", contact: "91234 56789", purpose: "Finance Doc collection", priority: "Medium" },
    { name: "Sridhar", date: "15 May 2024", model: "Watts 100", contact: "99001 11223", purpose: "Exchange evaluation", priority: "High" },
    { name: "Kiran", date: "16 May 2024", model: "Frankly 79", contact: "88887 66554", purpose: "Color confirmation", priority: "Medium" }
  ];

  const recentLeads = [
    { id: "LD-2024-0501", name: "Ramesh Kumar", mobile: "98855 12345", source: "Walk-in", model: "Kinetic Green E-Luna", status: "New", date: "13 May 2024", nextFollowup: "15 May 2024", lastNote: "Discussing moped range spec" },
    { id: "LD-2024-0502", name: "Vijayalakshmi", mobile: "91234 56789", source: "Website", model: "Dynamo Pro", status: "Contacted", date: "12 May 2024", nextFollowup: "14 May 2024", lastNote: "Requested catalog PDF" },
    { id: "LD-2024-0503", name: "Sridhar", mobile: "99001 11223", source: "Reference", model: "Watts 100", status: "Follow-up", date: "12 May 2024", nextFollowup: "16 May 2024", lastNote: "Looking for loan details" },
    { id: "LD-2024-0504", name: "Kiran", mobile: "88887 66554", source: "Facebook", model: "Frankly 79", status: "Negotiation", date: "11 May 2024", nextFollowup: "13 May 2024", lastNote: "Wants yellow color" }
  ];

  const customersList = [
    { name: "T. Gouri Shankar", contact: "98480 22334", model: "Dynamo Pro", invDate: "05 May 2024", delStatus: "Delivered", notes: "First servicing schedule pending", pdiDoneBy: "Suresh Babu", nextService: "05 Jun 2024" },
    { name: "M. Appalaraju", contact: "94901 88776", model: "Kinetic Green E-Luna", invDate: "09 May 2024", delStatus: "Delivered", notes: "Requested accessories kit", pdiDoneBy: "Suresh Babu", nextService: "09 Jun 2024" },
    { name: "V. Satyavathi", contact: "88970 55443", model: "Watts 100", invDate: "12 May 2024", delStatus: "Processing", notes: "Insurance copy generated", pdiDoneBy: "Ravi Varma", nextService: "12 Jun 2024" }
  ];

  // Executing VIN auto-fill query
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
      
      // Map Django REST keys to frontend UI visual keys
      setAutoFillResult({
        vin: data.vin_number,
        motor: data.motor_number,
        chassis: data.chassis_number,
        model: data.model_name || "Kinetic Green E-Luna",
        color: data.color || "Green",
        price: data.base_price ? `₹ ${parseFloat(data.base_price).toLocaleString('en-IN')}` : "₹ 74,999",
        branch: data.branch_name || "Vizag Showroom",
        status: data.stock_status.charAt(0).toUpperCase() + data.stock_status.slice(1),
        battery: data.assigned_battery || "BATT-00874 (Oldest)"
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "No matching vehicle unit found.";
      setVinSearchError(errorMsg);
    } finally {
      setVinSearchLoading(false);
    }
  };

  // Battery Selection and FIFO Validation check
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
      console.error("Failed to validate battery FIFO status:", e);
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
    } catch (e) {
      console.error("Failed to submit supervisor override request:", e);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden">
      
      {/* Sidebar */}
      <DashboardSidebar role="sales" activeTab={activeTab} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar role="sales" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />

        {/* Dashboard Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Grid Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="My Active Leads" value="38 Leads" description="Assigned leads pipeline" icon={Compass} color="blue" />
                <DashboardCard title="Follow-ups Due" value="12 Tasks" description="Due for interaction today" icon={CalendarDays} color="amber" />
                <DashboardCard title="Personal Bookings" value="7 Reserved" description="Active stock lock reservations" icon={CreditCard} color="emerald" />
                <DashboardCard title="Sales Volume" value="₹ 18,75,000" description="Completed invoice billing" icon={FileCheck} color="indigo" />
              </div>

              {/* Middle Section Dashboard Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Lead Status Chart */}
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between">
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Lead Status Ratio</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Summary of my 38 active lead targets</p>
                  </div>

                  <div className="h-[180px] w-full flex flex-col justify-center items-center relative">
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-extrabold text-slate-800">38</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leads</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          innerRadius={50}
                          outerRadius={70}
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

                  {/* Legend Grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                    {leadStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Follow-ups Agenda list */}
                <div className="lg:col-span-2 bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-800">My Follow-ups Due</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Awaiting outbound calls or customer updates</p>
                  </div>

                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto space-y-0.5 pr-1">
                    {myFollowups.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {item.name}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              item.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-405 font-semibold mt-0.5">
                            Model: {item.model} • Contact: {item.contact}
                            <span className="block text-emerald-805 mt-0.5">Purpose: {item.purpose}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-150 px-2 py-0.5 rounded border border-slate-200">{item.date}</span>
                          <button className="p-1.5 rounded-lg bg-emerald-55 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 cursor-pointer">
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Lower Section Lead Table */}
              <div className="space-y-6">
                <Table title="My Recent Leads Registry" headers={["Lead ID", "Customer Name", "Mobile Contact", "Lead Source", "Interested Model", "Creation Date", "Next Follow-up", "Last Note", "Status"]}>
                  {recentLeads.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{row.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-850">{row.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{row.mobile}</td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{row.source}</td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{row.model}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{row.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{row.nextFollowup}</td>
                      <td className="py-3 px-4 text-slate-500">{row.lastNote}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          row.status === "New" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          row.status === "Contacted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </>
          )}

          {/* TAB 2: LEADS / ENQUIRIES */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              
              <Table 
                title="My Total Leads Directory" 
                headers={["Lead ID", "Customer Name", "Contact Number", "Inflow Source", "Interest Model", "Date Created", "Next Follow-up", "Last Action Note", "Stage Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddLeadOpen(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Lead Enquiry
                  </button>
                }
              >
                {leadsLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                        <span>Loading leads registry from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveLeadsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <EmptyState title="No Leads Found" description="Click Add Lead Enquiry to register a customer lead." />
                    </td>
                  </tr>
                ) : (
                  liveLeadsList.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-blue-600">LD-{row.id}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{row.customer_name}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-500">{row.contact_number}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{row.lead_source.replace("_", " ")}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{row.model_name || "Kinetic Green E-Luna"}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-semibold">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-500">{row.follow_up_date || "Awaiting call"}</td>
                      <td className="py-3.5 px-5 text-slate-500">{row.notes || "No log notes added"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          row.status === "new_lead" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          row.status === "contacted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {row.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button 
                          onClick={() => handleAdvanceLeadStage(row.id, row.status)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-bold mr-3 cursor-pointer"
                        >
                          Update Stage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>

            </div>
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              
              <Table title="Showroom Customer Profiles Directory" headers={["Customer Name", "Contact Mobile", "Purchased EV Model", "Invoice Date", "PDI Verified By", "Next Service Date", "Delivery Status", "Log Notes"]}>
                {customersList.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{cust.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{cust.contact}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">{cust.model}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-semibold">{cust.invDate}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-bold">{cust.pdiDoneBy}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-bold text-emerald-700">{cust.nextService}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        cust.delStatus === "Delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {cust.delStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{cust.notes}</td>
                  </tr>
                ))}
              </Table>

            </div>
          )}

          {/* TAB 4: SALES & BOOKINGS (WITH AUTO-FILL VIN & FIFO ALERT) */}
          {activeTab === "sales_bookings" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Form panel Column - Span 2 */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Generate Booking / Delivery Invoice</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Use the auto-fill tool on the right to instantly query and populate vehicle details</p>
                  </div>
                  <button 
                    onClick={() => {
                      setAutoFillResult(null);
                      setVinQuery("");
                      setSelectedBattery("");
                      setFifoWarning(false);
                      setOverrideRequested(false);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    Clear Form
                  </button>
                </div>

                <form className="space-y-4 text-xs font-semibold text-slate-600" onSubmit={(e) => { e.preventDefault(); alert("Sale Booking Registered Successfully!"); }}>
                  
                  {/* Customer details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                      <input type="text" placeholder="e.g. Ramesh Naidu" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
                      <input type="text" placeholder="e.g. 9876543210" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" required />
                    </div>
                  </div>

                  {/* Financier & Insurance Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Financier Partner</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500">
                        <option>SBI Finance</option>
                        <option>HDFC Bank Loan</option>
                        <option>L&T Finance</option>
                        <option>Self-Finance (Cash/Cheque)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Insurance Partner Scheme</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-750 font-bold outline-none focus:border-emerald-500">
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
                        <input type="text" value={autoFillResult ? `${autoFillResult.branch} - Vizag Showroom` : ""} placeholder="Awaiting Auto-fill..." className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" readOnly />
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-650 font-bold outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">-- Choose Battery pack --</option>
                      {batteriesList.filter(b => b.status === "available").map((b) => (
                        <option key={b.id} value={b.serial_number}>
                          {b.serial_number} ({b.capacity} - Pur Date: {b.purchase_date}) {b.serial_number === "BATT-00874" ? "[Oldest Stock]" : ""}
                        </option>
                      ))}
                      {batteriesList.length === 0 && (
                        <>
                          <option value="BATT-00874">BATT-00874 (2.0 kWh - Purchase Date: 10 Jan 2024) [Oldest Stock]</option>
                          <option value="BATT-00982">BATT-00982 (1.2 kWh - Purchase Date: 02 Mar 2024)</option>
                          <option value="BATT-00890">BATT-00890 (2.0 kWh - Purchase Date: 12 May 2026) [Newer Stock]</option>
                        </>
                      )}
                    </select>

                    {/* FIFO Warning Indicator */}
                    {fifoWarning && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-amber-800">FIFO Stock Restriction Triggered</h4>
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
                              Override Request Transmitted to Supervisor Panel...
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestOverride}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm shadow-amber-600/10"
                            >
                              Request Supervisor Override
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={fifoWarning && !overrideRequested}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Confirm Sale & Dispatch
                  </button>

                </form>
              </div>

              {/* Auto-fill Helper Column */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Vehicle Auto-fill Query</h3>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5 font-sans leading-normal">
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
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:bg-slate-400 flex items-center justify-center gap-1.5"
                  >
                    {vinSearchLoading ? "Fetching..." : "Fetch Vehicle Details"}
                  </button>
                </div>

                {vinSearchError && (
                  <p className="text-[10px] font-bold text-rose-600">{vinSearchError}</p>
                )}

                {autoFillResult && (
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Vehicle Record Found!
                    </div>
                    <div className="pt-2 border-t border-emerald-100 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model:</span>
                        <span className="text-slate-700 font-bold">{autoFillResult.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Color:</span>
                        <span className="text-slate-700 font-bold">{autoFillResult.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Price:</span>
                        <span className="text-slate-700 font-bold">{autoFillResult.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Branch Outlet:</span>
                        <span className="text-slate-700 font-bold">{autoFillResult.branch}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Example helper block */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 leading-normal">
                  <span className="text-indigo-600 block mb-1">MOCK DATABASE CODES TO TRY:</span>
                  <div className="space-y-1 font-mono font-semibold">
                    <div>• VIN: <span className="text-slate-600">KVRVIN2026X101</span> (Moped)</div>
                    <div>• VIN: <span className="text-slate-600">KVRVIN2026X104</span> (Motorcycle)</div>
                    <div>• Motor: <span className="text-slate-600">MTR-90820</span> (Scooter)</div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: FOLLOW-UPS SCHEDULE */}
          {activeTab === "followups" && (
            <div className="space-y-6 text-left">
              
              <Table title="My Active Follow-up Appointments Agenda" headers={["Customer", "Contact Mobile", "Reserved Model", "Scheduled Date", "Latest Progress Status"]}>
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
              </Table>

            </div>
          )}

          {/* TAB 6: REPORTS & targets */}
          {activeTab === "reports" && (
            <div className="space-y-6 text-left">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Commission Summary */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800">My Sales & Commissions Overview</h3>
                  </div>

                  <div className="space-y-3.5 font-semibold text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cars/Bikes Sold (This Month):</span>
                      <span className="text-slate-800 font-bold">11 Deliveries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Commission Rate Per Unit:</span>
                      <span className="text-slate-800 font-bold">₹ 2,000 / EV unit</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                      <span className="text-slate-600 font-bold">Accumulated Commission Earned:</span>
                      <span className="text-emerald-600 font-extrabold">₹ 22,000</span>
                    </div>
                  </div>
                </div>

                {/* Targets completions card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Monthly Targets Completion</h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>EV Units Delivery Target</span>
                      <span>11 of 15 (73% Achieved)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                      <div className="h-full bg-blue-600 rounded-lg" style={{ width: "73%" }} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-2">
                      Need 4 more vehicle deliveries by 31st May to qualify for performance bonus incentive.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODALS */}
      {/* 1. Add Lead Form */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title="Register Customer Lead Enquiry">
        <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input 
              type="text" 
              placeholder="e.g. S. Sita Kumari" 
              value={leadCustomerName}
              onChange={(e) => setLeadCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-emerald-500" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Mobile</label>
            <input 
              type="text" 
              placeholder="e.g. 9900112233" 
              value={leadContactNumber}
              onChange={(e) => setLeadContactNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-emerald-500" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <select 
              value={leadVehicleModel}
              onChange={(e) => setLeadVehicleModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold" 
              required
            >
              <option value="">Select vehicle...</option>
              {vehicleModelsList.map((model) => (
                <option key={model.id} value={model.id}>{model.model_name}</option>
              ))}
              {vehicleModelsList.length === 0 && (
                <>
                  <option value="1">Kinetic Green E-Luna</option>
                  <option value="2">Dynamo Pro</option>
                  <option value="3">Watts 100</option>
                </>
              )}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Source</label>
            <select 
              value={leadSource}
              onChange={(e) => setLeadSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold" 
              required
            >
              <option value="walk_in">Walk-in Inquiry</option>
              <option value="website">Website Portal</option>
              <option value="reference">Customer Reference</option>
              <option value="social">Social Media Ads</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer">
            Create Lead Entry
          </button>
        </form>
      </Modal>

    </div>
  );
}
