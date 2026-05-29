"use client";

import React, { useState } from "react";
import { getFifoOverrides, updateFifoOverride } from "../services/batteries";
import { getLeads, updateLead } from "../services/leads";
import { getBookings, updateBooking } from "../services/bookings";
import { getSalesInvoices } from "../services/sales";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import {
  Boxes,
  ShoppingBag,
  CreditCard,
  Compass,
  Battery,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  UserCheck,
  UserX,
  Truck,
  Plus
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export default function SupervisorDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const activeTab = lastSegment === "supervisor" ? "dashboard" : lastSegment;

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Local state alerts
  const [alerts, setAlerts] = useState([
    { id: 2, type: "Expiring Insurance Soon", details: "Vehicle KVRVIN2026X112 insurance expires in 8 days (Vizag Showroom)", active: true },
    { id: 3, type: "RC Expiring Soon", details: "Vehicle KVRVIN2026X105 registration certificate expires in 5 days", active: true },
    { id: 4, type: "Pending PDI", details: "Pre-delivery inspection pending for booking BK-8012 (Customer: A. Srinivas)", active: true }
  ]);

  const [liveOverridesList, setLiveOverridesList] = useState<any[]>([]);
  const [liveOverridesLoading, setLiveOverridesLoading] = useState(true);

  const [liveLeadsList, setLiveLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [liveBookingsList, setLiveBookingsList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [liveSalesList, setLiveSalesList] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  const loadLeadsData = async () => {
    try {
      setLeadsLoading(true);
      const data = await getLeads();
      setLiveLeadsList(data);
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadOverrides = async () => {
    try {
      const data = await getFifoOverrides();
      setLiveOverridesList(data);
    } catch (e) {
      console.error("Failed to load FIFO overrides:", e);
    } finally {
      setLiveOverridesLoading(false);
    }
  };

  const handleApproveOverrideRequest = async (id: number, status: "approved" | "rejected") => {
    try {
      await updateFifoOverride(id, {
        status: status,
        reviewed_by: "Suresh Babu"
      });
      loadOverrides();
    } catch (e) {
      console.error("Failed to process override request:", e);
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

  const loadSalesInvoices = async () => {
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

  const handleApproveBookingLive = async (id: number, action: "confirmed" | "cancelled") => {
    try {
      await updateBooking(id, { status: action });
      loadBookings();
    } catch (e) {
      console.error("Failed to update booking:", e);
    }
  };

  const handleAssignLead = async (leadId: number, execName: string) => {
    try {
      // Anil Kumar is sandbox executive (ID 3 in DB seeder setup)
      const assignedId = execName === "Unassigned" ? null : 3; 
      await updateLead(leadId, {
        assigned_executive: assignedId,
        status: assignedId ? "new_lead" : "enquiry"
      });
      loadLeadsData();
    } catch (e) {
      console.error("Failed to assign lead:", e);
    }
  };

  React.useEffect(() => {
    setIsMounted(true);
    loadOverrides();
    loadLeadsData();
    loadBookings();
    loadSalesInvoices();
    const interval = setInterval(() => {
      loadOverrides();
      loadLeadsData();
      loadBookings();
      loadSalesInvoices();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const [transfers, setTransfers] = useState([
    { ref: "TR-2026-902", from: "Pendurthi Godown", to: "Vizag Showroom", model: "Kinetic Green E-Luna", qty: 8, status: "Pending Approval", requestedBy: "Anil Kumar", priority: "High" },
    { ref: "TR-2026-903", from: "Pineapple Colony Godown", to: "Future Ride Showroom", model: "Watts 100", qty: 3, status: "Approved", requestedBy: "Venkatesh", priority: "Medium" },
    { ref: "TR-2026-904", from: "Vizag Showroom", to: "Srikakulam Showroom", model: "Dynamo Pro", qty: 2, status: "Pending Approval", requestedBy: "Prasad", priority: "Urgent" }
  ]);



  const [leadAssignments, setLeadAssignments] = useState([
    { id: "LD-9901", customer: "Ramana Reddy", vehicle: "Dynamo Pro", source: "Website", exec: "Unassigned", enquiryDate: "12 May 2024", contactStatus: "Awaiting Callback" },
    { id: "LD-9902", customer: "Sita Kumari", vehicle: "Frankly 79", source: "Walk-in", exec: "Anil Kumar", enquiryDate: "11 May 2024", contactStatus: "Connected" },
    { id: "LD-9903", customer: "N. Chandru", vehicle: "Watts 100", source: "Reference", exec: "Unassigned", enquiryDate: "13 May 2024", contactStatus: "Awaiting Callback" }
  ]);

  // Static Mock Data for Charts
  const stockByLocationData = [
    { location: "Pendurthi Godown", Available: 88 },
    { location: "Pineapple Colony", Available: 74 },
    { location: "Isakapallem Showroom", Available: 62 },
    { location: "Vizag Showroom", Available: 48 },
    { location: "Srikakulam", Available: 24 },
    { location: "Kakinada", Available: 16 },
  ];

  const stockMovementData = [
    { name: "Pendurthi Godown", StockIn: 45, StockOut: 32 },
    { name: "Pineapple Colony", StockIn: 38, StockOut: 18 },
    { name: "Vizag Showroom", StockIn: 29, StockOut: 24 },
    { name: "Srikakulam", StockIn: 20, StockOut: 15 },
  ];

  const recentActivities = [
    { activity: "Stock In", ref: "GRN-2024-0512", location: "Pendurthi Godown", user: "Ramesh", time: "2 mins ago" },
    { activity: "Stock Out/Sale", ref: "INV-2024-0789", location: "Pendurthi Godown", user: "Suresh", time: "15 mins ago" },
    { activity: "Stock Transfer", ref: "SF-2024-0097", location: "Isakapallem Showroom", user: "Ramesh", time: "1 hour ago" },
    { activity: "Battery Added", ref: "BAT-2024-0445", location: "Pineapple Colony Godown", user: "Ramesh", time: "2 hours ago" },
  ];

  const vehicleInventory = [
    { vin: "KVRVIN2026X101", model: "Kinetic Green E-Luna", color: "Green", battery: "BATT-00982", status: "Available", pdi: "Passed", age: "5 days", soc: "98%" },
    { vin: "KVRVIN2026X102", model: "Dynamo Pro", color: "Blue", battery: "BATT-00874", status: "Booked", pdi: "Passed", age: "14 days", soc: "100%" },
    { vin: "KVRVIN2026X104", model: "Watts 100", color: "Red", battery: "BATT-00511", status: "Reserved", pdi: "Pending", age: "26 days", soc: "92%" },
    { vin: "KVRVIN2026X115", model: "Frankly 79", color: "Yellow", battery: "BATT-00621", status: "Damaged", pdi: "Failed", age: "42 days", soc: "45%" },
  ];

  const batteriesStock = [
    { serial: "BATT-00982", capacity: "1.2 kWh", purDate: "02 Mar 2024", status: "Assigned", location: "Pendurthi Godown", fifoRank: "Rank 2", soh: "98%" },
    { serial: "BATT-00874", capacity: "2.0 kWh", purDate: "10 Jan 2024", status: "Sold", location: "Vizag Showroom", fifoRank: "Rank 1 (Oldest)", soh: "96%" },
    { serial: "BATT-00621", capacity: "2.4 kWh", purDate: "15 Apr 2024", status: "Available", location: "Srikakulam Showroom", fifoRank: "Rank 3", soh: "100%" },
    { serial: "BATT-00511", capacity: "3.2 kWh", purDate: "01 May 2024", status: "Assigned", location: "Pendurthi Godown", fifoRank: "Rank 4", soh: "97%" },
    { serial: "BATT-00890", capacity: "2.0 kWh", purDate: "12 May 2024", status: "Available (New Stock)", location: "Pendurthi Godown", fifoRank: "Rank 5 (Newest)", soh: "100%" }
  ];

  const handleApproveAlert = (id: number) => {
    setAlerts(alerts.map(alert => alert.id === id ? { ...alert, active: false } : alert));
  };

  const handleApproveTransfer = (ref: string) => {
    setTransfers(transfers.map(tr => tr.ref === ref ? { ...tr, status: "Approved" } : tr));
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
      <DashboardSidebar role="supervisor" activeTab={activeTab} />

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar role="supervisor" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />

        {/* Dashboard Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Grid Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Total Stock" value="312 Units" description="Vizag branch physical units" icon={Boxes} color="blue" />
                <DashboardCard title="Stock In (This Month)" value="132 Units" description="Intake received at Vizag" icon={Boxes} color="emerald" />
                <DashboardCard title="Stock Out / Sold" value="89 Units" description="Sales dispatch completed" icon={Boxes} color="indigo" />
                <DashboardCard title="Pending Bookings" value="26 Bookings" description="Awaiting supervisor lock approval" icon={Clock} color="amber" />
              </div>

              {/* Middle Section Dashboard Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stock by Location */}
                <div className="lg:col-span-2 bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Stock by Location</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Physical vehicle distribution in Vizag cluster</p>
                    </div>
                  </div>

                  <div className="h-[220px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
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
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Recent Alerts</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Critical notifications requiring attention</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left">
                    {/* Render live pending override requests */}
                    {liveOverridesList.filter(o => o.status === "pending").map((override) => (
                      <div key={`live-${override.id}`} className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-105 text-rose-705 border border-rose-205">
                            <AlertTriangle className="h-3 w-3 animate-pulse" /> FIFO Override Request
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-snug">
                          Executive {override.sales_executive} requests battery {override.battery_serial} ({override.battery_capacity}) for invoice ref {override.invoice_reference}
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-rose-200/50 mt-1">
                          <button 
                            onClick={() => handleApproveOverrideRequest(override.id, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3 py-1 rounded cursor-pointer transition-colors shadow-sm"
                          >
                            Approve Override
                          </button>
                          <button 
                            onClick={() => handleApproveOverrideRequest(override.id, "rejected")}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Render other static supervisor alerts */}
                    {alerts.filter(a => a.active).map((alert) => (
                      <div key={alert.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" /> {alert.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 leading-snug">{alert.details}</p>
                        
                        {alert.type === "FIFO Override Request" && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
                            <button 
                              onClick={() => handleApproveAlert(alert.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3 py-1 rounded cursor-pointer transition-colors"
                            >
                              Approve Override
                            </button>
                            <button 
                              onClick={() => handleApproveAlert(alert.id)}
                              className="bg-slate-200 hover:bg-slate-350 text-slate-600 font-bold text-[9px] px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {alert.type === "Pending PDI" && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 mt-1">
                            <button 
                              onClick={() => handleApproveAlert(alert.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3 py-1 rounded cursor-pointer transition-colors"
                            >
                              Mark PDI Passed
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {liveOverridesList.filter(o => o.status === "pending").length === 0 && alerts.filter(a => a.active).length === 0 && (
                      <EmptyState title="All clear!" description="No pending alerts or override approvals at this time." />
                    )}
                  </div>
                </div>

              </div>

              {/* Lower Section Charts & Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Stock Movement */}
                <div className="lg:col-span-2 bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Stock Movement (This Month)</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Intake inflow vs sales outflow per warehouse</p>
                    </div>
                  </div>

                  <div className="h-[220px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
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
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-80">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Branch operational events logs</p>
                  </div>

                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {recentActivities.map((act, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{act.activity}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{act.ref} • {act.location}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-bold">
                          <span className="text-slate-600">{act.user}</span>
                          <span className="text-slate-400 mt-0.5">{act.time}</span>
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
                      {tr.status === "Pending Approval" && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleApproveTransfer(tr.ref)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1 rounded cursor-pointer"
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
                      )}
                      {tr.status === "Approved" && (
                        <span className="text-[10px] font-bold text-slate-400">Ready to Dispatch</span>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>

            </div>
          )}

          {/* TAB 3: VEHICLE MANAGEMENT */}
          {activeTab === "vehicles" && (
            <div className="space-y-6">
              
              <Table title="Assigned Outlet Vehicle Stock Units" headers={["VIN Code", "Model", "Color", "Assigned Battery Pack", "PDI Testing", "Stock Age", "Battery SoC", "Stock Status", "Actions"]}>
                {vehicleInventory.map((unit, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.color}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.battery}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        unit.pdi === "Passed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        unit.pdi === "Failed" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {unit.pdi}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.age}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-bold text-emerald-700">{unit.soc}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        unit.status === "Available" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        unit.status === "Booked" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        unit.status === "Reserved" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {unit.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button className="text-xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer">Modify Status</button>
                    </td>
                  </tr>
                ))}
              </Table>

            </div>
          )}

          {/* TAB 4: SALES MANAGEMENT */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              
              <Table title="Showroom Daily Sales Monitoring Ledger" headers={["Invoice Ref", "Customer Name", "Contact", "Sale Price", "Payment Mode", "Insurance", "Delivery Status", "Actions"]}>
                {salesLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                        <span>Loading sales invoices from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveSalesList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <EmptyState title="No Sales Invoices" description="No invoices have been created yet." />
                    </td>
                  </tr>
                ) : (
                  liveSalesList.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">{inv.invoice_number || `INV-${inv.id}`}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{inv.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{inv.customer_contact}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">₹ {parseFloat(inv.sale_price).toLocaleString("en-IN")}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{inv.payment_mode}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{inv.insurance_partner || "—"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          inv.delivery_status === "dispatched" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {inv.delivery_status ? inv.delivery_status.charAt(0).toUpperCase() + inv.delivery_status.slice(1) : "Processing"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5"><button className="text-xs text-emerald-600 font-bold cursor-pointer">Print PDF</button></td>
                    </tr>
                  ))
                )}
              </Table>

            </div>
          )}

          {/* TAB 5: LEAD MANAGEMENT */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              
              <Table title="Inquiry Lead Assignment Directory" headers={["Lead ID", "Customer Name", "Model Interest", "Inflow Source", "Enquiry Date", "Contact Status", "Executive Assigned", "Actions"]}>
                {leadsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                        <span>Loading assignments from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveLeadsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <EmptyState title="No Leads Found" description="Enquiries pipeline is empty at this time." />
                    </td>
                  </tr>
                ) : (
                  liveLeadsList.map((ld, idx) => (
                    <tr key={ld.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">LD-{ld.id}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{ld.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{ld.model_name || "Kinetic Green E-Luna"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">{ld.lead_source.replace("_", " ")}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{new Date(ld.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ld.status !== "enquiry" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {ld.status !== "enquiry" ? "Connected" : "Awaiting Call"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 font-bold">
                        {!ld.assigned_executive ? (
                          <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full text-[9px]">Unassigned</span>
                        ) : (
                          <span>Anil Kumar</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {!ld.assigned_executive ? (
                          <button 
                            onClick={() => handleAssignLead(ld.id, "Anil Kumar")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer shadow-sm transition-colors"
                          >
                            Assign to Anil
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAssignLead(ld.id, "Unassigned")}
                            className="text-xs text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                          >
                            Deassign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>

            </div>
          )}

          {/* TAB 6: ADVANCE BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              
              <Table title="Pending Booking Commitments Approval Queue" headers={["Booking ID", "Customer Details", "Contact", "Advance Payment", "Booking Date", "Expiry Date", "PDI Status", "Approval State", "Actions"]}>
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                        <span>Loading bookings from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveBookingsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Bookings Found" description="No advance bookings have been recorded yet." />
                    </td>
                  </tr>
                ) : (
                  liveBookingsList.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">{bk.booking_id}</td>
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
                      <td className="py-3.5 px-5">
                        {bk.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleApproveBookingLive(bk.id, "confirmed")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1 rounded cursor-pointer"
                            >
                              Approve Lock
                            </button>
                            <button 
                              onClick={() => handleApproveBookingLive(bk.id, "cancelled")}
                              className="text-xs text-rose-600 font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {bk.status === "confirmed" ? "Locked & Active" : bk.status === "cancelled" ? "Cancelled" : bk.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>

            </div>
          )}

          {/* TAB 7: BATTERIES MANAGEMENT */}
          {activeTab === "batteries" && (
            <div className="space-y-6">
              
              <Table title="Assigned Outlet Battery Stock (FIFO Order Check)" headers={["Battery Serial", "Capacity Rating", "Acquisition Date", "Warehouse Location", "FIFO Rank", "Health Index (SoH)", "Status"]}>
                {batteriesStock.map((batt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-805">{batt.serial}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-bold">{batt.capacity}</td>
                    <td className="py-3.5 px-5 text-slate-505 font-semibold">{batt.purDate}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{batt.location}</td>
                    <td className="py-3.5 px-5 text-slate-550 font-bold">{batt.fifoRank}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-700">{batt.soh}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        batt.status.startsWith("Available") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        batt.status === "Sold" ? "bg-slate-100 text-slate-500" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {batt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </Table>

            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-emerald-100 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Assigned Branch Performance Report</h3>
                <p className="text-xs text-slate-400 font-semibold mb-6">Select report parameters for Vizag branch metrics extraction.</p>
                
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md cursor-pointer transition-colors">
                    Download Monthly Sales Performance (PDF)
                  </button>
                  <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 px-6 rounded-xl border border-emerald-100 cursor-pointer transition-colors">
                    Download Inventory In-Out Spreadsheet (CSV)
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
