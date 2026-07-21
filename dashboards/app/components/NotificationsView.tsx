"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Trash2, Clock, ShieldCheck, Tag, Sparkles, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationsViewProps {
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
}

export default function NotificationsView({ role }: NotificationsViewProps) {
  const router = useRouter();

  const getInitialList = () => {
    switch (role) {
      case "owner":
        return [
          { id: 1, category: "Stock", title: "Low Stock Valuation Warning", details: "Visakhapatnam godown total inventory dropped below target 100 units.", time: "10m ago", read: false, priority: "high", actionRoute: "/owner" },
          { id: 2, category: "Sales", title: "Monthly Sales Target 74% Achieved", details: "KVR Motors group total monthly sales volume reached ₹1.12 Crore.", time: "1h ago", read: false, priority: "normal", actionRoute: "/owner" },
          { id: 3, category: "Booking", title: "New Advance Booking BK-8012", details: "Customer G. Apparao booked Kinetic Green Zoom (₹85,000).", time: "2h ago", read: true, priority: "normal", actionRoute: "/owner" },
          { id: 4, category: "Ledger", title: "Daily Expense Audit Submitted", details: "Supervisor Suresh Babu uploaded ₹14,500 showroom maintenance expense.", time: "3h ago", read: true, priority: "normal", actionRoute: "/owner" },
        ];
      case "supervisor":
        return [
          { id: 1, category: "Transfers", title: "Stock Transfer TR-904 Required", details: "Sales requested 2 units of Kinetic Green E-Luna for Visakhapatnam Showroom.", time: "5m ago", read: false, priority: "high", actionRoute: "/supervisor" },
          { id: 2, category: "Inspection", title: "PDI Quality Inspection Pending", details: "Staff completed PDI checklist for VIN KVRVIN2026X102; awaiting final sign-off.", time: "25m ago", read: false, priority: "normal", actionRoute: "/supervisor" },
          { id: 3, category: "Attendance", title: "Team Attendance Summary", details: "5 out of 6 staff members recorded geolocated check-in for today.", time: "2h ago", read: true, priority: "normal", actionRoute: "/supervisor" },
        ];
      case "sales":
        return [
          { id: 1, category: "Booking", title: "Booking Confirmation BK-8014", details: "Advance payment of ₹15,000 received for Kinetic Green Flex (Blue).", time: "15m ago", read: false, priority: "high", actionRoute: "/sales" },
          { id: 2, category: "Lead", title: "Hot Lead Follow-up Due", details: "Schedule call with Customer Rajesh Kumar for battery finance options.", time: "40m ago", read: false, priority: "normal", actionRoute: "/sales" },
          { id: 3, category: "Delivery", title: "Vehicle Handover Completed", details: "Staff marked invoice INV-2026-0801 as Delivered to customer.", time: "3h ago", read: true, priority: "normal", actionRoute: "/sales" },
        ];
      case "telecaller":
        return [
          { id: 1, category: "Lead", title: "New Walk-in Enquiry Lead", details: "Sita Kumari submitted inquiry for Kinetic Green E-Luna (contact: 9876543210).", time: "10m ago", read: false, priority: "high", actionRoute: "/telecaller" },
          { id: 2, category: "Followup", title: "Scheduled Follow-up Call", details: "Call due with Customer T. Apparao regarding test ride confirmation.", time: "1h ago", read: false, priority: "normal", actionRoute: "/telecaller" },
          { id: 3, category: "Pipeline", title: "Pipeline Stage Converted", details: "Lead Rajesh Varma moved to Negotiation stage.", time: "4h ago", read: true, priority: "normal", actionRoute: "/telecaller" },
        ];
      case "staff":
        return [
          { id: 1, category: "Shipment", title: "New Shipment Unit Received", details: "VIN KVRVIN2026X405 registered into Vizag Central Godown.", time: "12m ago", read: false, priority: "high", actionRoute: "/staff" },
          { id: 2, category: "Battery", title: "FIFO Battery Storage Updated", details: "3 new 60V 30Ah LFP battery packs logged into inventory.", time: "1h ago", read: false, priority: "normal", actionRoute: "/staff" },
          { id: 3, category: "PDI", title: "PDI Verification Completed", details: "Vehicle KVRVIN2026X101 passed pre-delivery quality checks.", time: "2h ago", read: true, priority: "normal", actionRoute: "/staff" },
        ];
    }
  };

  const [notifications, setNotifications] = useState(getInitialList());
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "high">("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleCardClick = (id: number, route: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    router.push(route);
  };

  const filtered = notifications.filter(n => {
    if (filterTab === "unread") return !n.read;
    if (filterTab === "high") return n.priority === "high";
    return true;
  });

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto p-4 md:p-6">
      {/* Title Header Banner */}
      <div className="bg-gradient-to-r from-[#044e35] via-[#056042] to-[#047752] p-6 rounded-3xl text-white shadow-xl shadow-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Bell className="h-5 w-5 text-emerald-300" />
            </div>
            <h2 className="text-xl font-extrabold tracking-wide">Notifications & Operational Alerts</h2>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/80 font-medium mt-2 max-w-xl leading-relaxed">
            Real-time activity feeds, system alerts, stock transfers, and workflow updates for {role.toUpperCase()} role.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-emerald-900 bg-emerald-300 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white/80 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/60 shadow-inner">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            filterTab === "all" ? "bg-white text-[#044e35] shadow-md border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab("unread")}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            filterTab === "unread" ? "bg-white text-[#044e35] shadow-md border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilterTab("high")}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            filterTab === "high" ? "bg-white text-rose-700 shadow-md border border-rose-200/50" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          High Priority ({notifications.filter(n => n.priority === "high").length})
        </button>
      </div>

      {/* Notifications Cards Feed */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.id, item.actionRoute)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                item.read
                  ? "bg-white border-slate-200/70 text-slate-700 hover:border-emerald-300"
                  : "bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-sm hover:border-emerald-400"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                      item.priority === "high"
                        ? "bg-rose-100 text-rose-700 border-rose-200/80"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200/80"
                    }`}>
                      {item.category}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-[#044e35] transition-colors">
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {item.details}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {item.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Verified System Alert
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {item.read ? (
                    <CheckCircle2 className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <Bell className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Notifications Available</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! New operational alerts will automatically appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
