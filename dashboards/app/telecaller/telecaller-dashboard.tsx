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
import AttendanceView from "../components/AttendanceView";
import DashboardSmoothScroll from "../components/DashboardSmoothScroll";
import Toast from "../components/Toast";
import { getLeads, createLead, updateLead } from "../services/leads";
import { getVehicleModels } from "../services/vehicles";
import { useAuth } from "../context/AuthContext";

import {
  Compass,
  Phone,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Briefcase,
  Sparkles,
  CalendarDays,
  Target,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";


export default function TelecallerDashboard({ initialTab: initialTabProp }: { initialTab?: string } = {}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const derivedTab = lastSegment === "telecaller" ? "dashboard" : lastSegment;
  const initialTab = initialTabProp || derivedTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with browser back/forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "telecaller" ? "dashboard" : segment;
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadModelSearch, setLeadModelSearch] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);

  // Live database states
  const [liveLeadsList, setLiveLeadsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Form states
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "" };
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Follow-up notes update state
  const [followupLead, setFollowupLead] = useState<any>(null);
  const [followupNotes, setFollowupNotes] = useState("");
  const [followupNextDate, setFollowupNextDate] = useState("");
  const [followupStatus, setFollowupStatus] = useState("new_lead");

  // Loaders (isSilent prevents auto-blinking during background refresh)
  const loadLeadsData = async (isSilent = false) => {
    try {
      if (!isSilent) setLeadsLoading(true);
      const data = await getLeads();
      // Filter leads belonging to logged-in user's branch or assigned to telecaller
      if (user) {
        const myBranch = (user.branch || user.showroom || "").toLowerCase();
        const filtered = data.filter((lead: any) => {
          if (lead.assigned_executive === user.id) return true;
          if (!myBranch) return true;
          const leadBranch = (lead.branch_name || lead.showroom_name || "").toLowerCase();
          return !leadBranch || leadBranch.includes(myBranch) || myBranch.includes(leadBranch);
        });
        setLiveLeadsList(filtered);
      } else {
        setLiveLeadsList(data);
      }
    } catch (e) {
      console.error("Failed to load leads:", e);
    } finally {
      if (!isSilent) setLeadsLoading(false);
    }
  };

  const loadVehicleModelsData = async () => {
    try {
      const data = await getVehicleModels();
      setVehicleModelsList(data);
    } catch (e) {
      console.error("Failed to load vehicle models:", e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadLeadsData(false);
    loadVehicleModelsData();

    const interval = setInterval(() => {
      loadLeadsData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Lead Modal handlers
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
    if (!newLead.customer_name.trim() || !newLead.contact_number.trim() || !newLead.interested_vehicle) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    const cleanPhone = newLead.contact_number.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Contact number must contain exactly 10 digits.", "error");
      return;
    }

    const vId = parseInt(String(newLead.interested_vehicle), 10);
    const payload: any = {
      customer_name: newLead.customer_name.trim(),
      contact_number: cleanPhone,
      lead_source: newLead.lead_source || "walk_in",
      status: newLead.status || "new_lead",
      notes: newLead.notes?.trim() || undefined,
      follow_up_date: newLead.follow_up_date || undefined,
    };
    if (!isNaN(vId) && vId > 0) {
      payload.interested_vehicle = vId;
    }
    if (user?.id) {
      payload.assigned_executive = user.id;
    }

    try {
      if (editingLeadId) {
        await updateLead(editingLeadId, payload);
        showToast("Lead updated successfully.");
      } else {
        await createLead(payload);
        showToast("Lead registered successfully.");
      }
      setNewLead({ ...emptyLead });
      setEditingLeadId(null);
      setIsAddLeadOpen(false);
      loadLeadsData();
    } catch (err: any) {
      console.error("Save lead error:", err);
      const msg = err.response?.data?.detail || (typeof err.response?.data === "object" ? Object.values(err.response.data).flat().join(" ") : null) || "Failed to save lead.";
      showToast(msg, "error");
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

  // Follow-up Agenda handlers
  const openFollowupDialog = (lead: any) => {
    setFollowupLead(lead);
    setFollowupNotes(lead.notes || "");
    setFollowupNextDate(lead.follow_up_date || "");
    setFollowupStatus(lead.status || "new_lead");
    setIsFollowupOpen(true);
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupLead) return;

    try {
      await updateLead(followupLead.id, {
        notes: followupNotes.trim() || undefined,
        follow_up_date: followupNextDate || undefined,
        status: followupStatus
      });
      showToast("Follow-up logs updated successfully.");
      setIsFollowupOpen(false);
      setFollowupLead(null);
      loadLeadsData();
    } catch {
      showToast("Failed to record follow-up.", "error");
    }
  };

  // Computed properties
  const metrics = useMemo(() => {
    const total = liveLeadsList.length;
    const contacted = liveLeadsList.filter(l => l.status === "contacted" || l.status === "follow_up").length;
    const won = liveLeadsList.filter(l => l.status === "won").length;
    const pending = liveLeadsList.filter(l => l.status === "new_lead" || l.status === "enquiry").length;

    return { total, contacted, won, pending };
  }, [liveLeadsList]);

  // Today's Follow-up agenda
  const todayAgenda = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return liveLeadsList.filter(l => l.follow_up_date === todayStr && l.status !== "won" && l.status !== "lost");
  }, [liveLeadsList]);

  // Recharts Pie distribution data
  const pieChartData = useMemo(() => {
    const stages: Record<string, number> = {};
    liveLeadsList.forEach((lead) => {
      const st = lead.status_display || lead.status;
      stages[st] = (stages[st] || 0) + 1;
    });
    const colors = ["#64748b", "#2563eb", "#ea580c", "#04a700", "#dc2626", "#8b5cf6", "#ec4899"];
    return Object.entries(stages).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [liveLeadsList]);

  // Filtered Leads list based on query search
  const filteredLeadsTable = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return liveLeadsList;
    return liveLeadsList.filter((lead) => 
      lead.customer_name?.toLowerCase().includes(q) ||
      lead.contact_number?.includes(q) ||
      lead.interested_vehicle_name?.toLowerCase().includes(q) ||
      lead.notes?.toLowerCase().includes(q)
    );
  }, [liveLeadsList, searchQuery]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
      <DashboardSidebar role="telecaller" activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        <Navbar 
          role="telecaller" 
          title={
            activeTab === "dashboard"
              ? "Telecaller Desk"
              : activeTab === "notifications"
              ? "Notifications"
              : activeTab === "profile"
              ? "Telecaller Profile"
              : activeTab === "attendance"
              ? "Daily Check-in"
              : "Leads Management"
          } 
        />
        <DashboardSmoothScroll className="p-4 pb-28 lg:pb-6 space-y-6">
          
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* Premium Welcome Hero Card */}
              <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#04a700]/[0.05] to-transparent" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#04a700]/10 blur-3xl" />
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-600" />

                <div className="relative flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-500" />
                        </span>
                        Telecaller Desk Live
                      </span>
                    </div>
                    <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                      Welcome back, {user?.full_name || "Lakshmi Narayana"}
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    </h2>
                    <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-500">
                      Manage call schedules, update lead stages, and drive dealership sales conversions through proactive followups.
                    </p>
                  </div>
                  
                  <div className="flex shrink-0 gap-2">
                    <button 
                      onClick={openAddLead}
                      className="flex items-center gap-1.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2.5 px-5 rounded-full cursor-pointer shadow-md shadow-[#04a700]/15"
                    >
                      <Plus className="h-4.5 w-4.5" /> Register Lead
                    </button>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard title="My Total Leads" value={leadsLoading ? "..." : `${metrics.total} Leads`} description="Total assigned catalog" icon={Compass} color="blue" onClick={() => setActiveTab("leads")} />
                <DashboardCard title="Pending Review" value={leadsLoading ? "..." : `${metrics.pending} Leads`} description="Requires primary call" icon={Phone} color="amber" onClick={() => setActiveTab("leads")} />
                <DashboardCard title="Active Follow-ups" value={leadsLoading ? "..." : `${metrics.contacted} Leads`} description="Contacted pipeline" icon={UserCheck} color="indigo" onClick={() => setActiveTab("leads")} />
                <DashboardCard title="Converted Wins" value={leadsLoading ? "..." : `${metrics.won} Won`} description="Dealer sales achieved" icon={CheckCircle2} color="emerald" onClick={() => setActiveTab("leads")} />
              </div>

              {/* Today's Agenda & Stats row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Today's Agenda list */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[340px] hover:shadow-md transition-shadow">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-purple-600" />
                        Today&apos;s Follow-up Agenda
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Contact clients scheduled for followups today</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-extrabold">{todayAgenda.length} Pending</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left slim-scrollbar">
                    {todayAgenda.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <EmptyState title="No followups today" description="Relax! You have cleared all of today's followups." />
                      </div>
                    ) : (
                      todayAgenda.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl hover:border-purple-300 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800">{lead.customer_name}</h4>
                              <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 px-1 py-0.5 rounded">{lead.lead_source?.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold flex-wrap">
                              <span>{lead.contact_number}</span>
                              <a href={`tel:${lead.contact_number}`} className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer shadow-sm transition-colors" title="Call Customer">
                                <Phone className="h-2.5 w-2.5" />
                              </a>
                              <span>• {lead.interested_vehicle_name || "EV Vehicle"}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1 italic">{lead.notes || "No call notes."}</p>
                          </div>
                          <button 
                            onClick={() => openFollowupDialog(lead)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Call & Update
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pipeline Stats Pie Chart */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col h-[340px] hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-emerald-600" />
                      Pipeline Distribution
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Visual representation of stages</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center">
                    {pieChartData.length === 0 ? (
                      <span className="text-xs text-slate-400">No leads registered.</span>
                    ) : (
                      <>
                        <div className="h-[140px] w-full relative">
                          <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={60}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieChartData.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} Leads`]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Legends */}
                        <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                          {pieChartData.slice(0, 4).map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 truncate">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                              <span className="truncate">{entry.name} ({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}


          {activeTab === "leads" && (
            <div className="space-y-6 text-left">
              
              {/* Kanban Drag-and-Drop Pipeline */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leads Pipeline (Kanban)</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Drag & drop cards to change lead stages. Click cards to view details.</p>
                </div>

                {leadsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-[#04a700]" />
                    <span className="text-xs font-semibold text-slate-500">Loading conversion pipeline...</span>
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
                          className={`rounded-2xl border flex flex-col min-h-[360px] transition-all duration-200 ${col.soft} ${isDragTarget ? "border-[#04a700] ring-2 ring-[#04a700]/30 scale-[1.01]" : "border-slate-200/70"}`}
                        >
                          <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/70">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.accent }} />
                              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">{col.label}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-extrabold">{filteredLeads.length}</span>
                          </div>

                          <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto slim-scrollbar max-h-[50vh]">
                            {filteredLeads.length === 0 ? (
                              <div className={`text-[9px] font-semibold text-slate-450 text-center py-8 rounded-xl border-2 border-dashed ${isDragTarget ? "border-[#04a700]/40 text-[#04a700]" : "border-slate-200/70"}`}>
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
                                  <h4 onClick={() => openFollowupDialog(lead)} className="text-xs font-bold text-slate-800 hover:text-purple-600 cursor-pointer transition-colors leading-tight">{lead.customer_name}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-semibold leading-snug">{lead.contact_number}</span>
                                    <a href={`tel:${lead.contact_number}`} className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer shadow-sm transition-colors" title="Call Customer">
                                      <Phone className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium leading-snug truncate">{lead.interested_vehicle_name || "—"}</p>
                                  
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                                    <select
                                      value={lead.status}
                                      onChange={(e) => moveLeadToStage(lead.id, e.target.value)}
                                      className="text-[9px] font-extrabold text-slate-700 bg-slate-100/90 border border-slate-200/80 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer hover:border-[#04a700]"
                                    >
                                      <option value="enquiry">Enquiry</option>
                                      <option value="new_lead">New Lead</option>
                                      <option value="negotiation">Negotiation</option>
                                      <option value="won">Won</option>
                                      <option value="lost">Lost</option>
                                    </select>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-semibold text-slate-450 italic">
                                        {lead.follow_up_date ? `Next: ${new Date(lead.follow_up_date).toLocaleDateString()}` : ""}
                                      </span>
                                      <button onClick={() => openEditLead(lead)} className="text-[9px] font-extrabold text-[#04a700] cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Edit</button>
                                    </div>
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

              {/* Leads Data Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leads Listing Catalog</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Filter, search and call logs lookup for assigned pipeline</p>
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

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <Table headers={["Lead ID", "Customer Details", "Contact No", "Vehicle Model", "Source", "Followup Date", "Stage State", "Actions"]}>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                            <span>Loading leads registry...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredLeadsTable.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <EmptyState title="No leads logged" description="Start registering or get assigned leads from supervisor." />
                        </td>
                      </tr>
                    ) : (
                      filteredLeadsTable.map((lead) => (
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
                          <td className="py-3.5 px-5 text-[10px] font-bold text-slate-500 uppercase">{lead.lead_source?.replace("_", " ")}</td>
                          <td className="py-3.5 px-5 text-slate-500 font-semibold">{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "—"}</td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              lead.status === "won" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              lead.status === "lost" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              lead.status === "negotiation" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-slate-50 text-slate-650 border border-slate-200"
                            }`}>
                              {lead.status_display || lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 flex items-center gap-3">
                            <button onClick={() => openFollowupDialog(lead)} className="text-xs font-bold text-purple-600 hover:text-purple-800 cursor-pointer">Follow Up</button>
                            <button onClick={() => openEditLead(lead)} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Edit</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Table>
                </div>
              </div>

            </div>
          )}
          {activeTab === "attendance" && (
            <AttendanceView role="telecaller" />
          )}
          {activeTab === "profile" && (
            <ProfileView />
          )}


        </DashboardSmoothScroll>
      </div>

      {/* Bottom navbar for mobile layouts */}
      <BottomNav role="telecaller" activeTab={activeTab} />

      {/* Floating toast alerts */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modals */}
      {/* 1. Register / Edit Lead */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title={editingLeadId ? "Update Pipeline Lead details" : "Register Pipeline Lead Enquiry"}>
        <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. Sita Kumari" value={newLead.customer_name} onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="tel" placeholder="e.g. 9876543210" value={newLead.contact_number} onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
              {leadModelSearch && (
                <button 
                  type="button" 
                  onClick={() => setLeadModelSearch("")}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer lowercase"
                >
                  Clear search
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search EV models by name or brand..."
                  value={leadModelSearch}
                  onChange={(e) => setLeadModelSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold outline-none focus:border-[#04a700]"
                />
              </div>
              <select value={newLead.interested_vehicle} onChange={(e) => setNewLead({ ...newLead, interested_vehicle: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none" required>
                <option value="">
                  {vehicleModelsList.filter((m) => {
                    if (!leadModelSearch.trim()) return true;
                    const q = leadModelSearch.toLowerCase();
                    return `${m.brand_name || ""} ${m.model_name}`.toLowerCase().includes(q);
                  }).length === 0 ? "No matching models found" : "Select vehicle..."}
                </option>
                {vehicleModelsList
                  .filter((m) => {
                    if (!leadModelSearch.trim()) return true;
                    const q = leadModelSearch.toLowerCase();
                    return `${m.brand_name || ""} ${m.model_name}`.toLowerCase().includes(q);
                  })
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.brand_name ? `${m.brand_name} - ` : ""}{m.model_name}</option>
                  ))
                }
              </select>
            </div>
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
            <textarea placeholder="e.g. Discussing battery finance packages..." value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold outline-none h-20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-up Date (Future Date Only)</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} value={newLead.follow_up_date} onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Lead
          </button>
        </form>
      </Modal>

      {/* 2. Call Logs & Followup Update Modal */}
      <Modal isOpen={isFollowupOpen} onClose={() => setIsFollowupOpen(false)} title="Record Lead Call Follow-up">
        {followupLead && (
          <form onSubmit={handleFollowupSubmit} className="space-y-4 text-left">
            <div className="p-3 bg-slate-55 bg-slate-50 rounded-2xl border border-slate-150 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Client Details</span>
              <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{followupLead.customer_name}</span>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                {followupLead.contact_number} • {followupLead.interested_vehicle_name}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Follow-up Notes / Call Details</label>
              <textarea 
                placeholder="Write summary of the conversation, objections, details discussed..." 
                value={followupNotes} 
                onChange={(e) => setFollowupNotes(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-semibold outline-none h-24"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status / Pipeline Stage</label>
              <select 
                value={followupStatus} 
                onChange={(e) => setFollowupStatus(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Next Scheduled Call / Follow-up Date (Future Date Only)</label>
              <input 
                type="date" 
                min={new Date().toISOString().split("T")[0]}
                value={followupNextDate} 
                onChange={(e) => setFollowupNextDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none" 
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
              Submit Call log & Reschedule
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
}
