"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Trash2, Filter, AlertCircle, Clock, ShieldCheck, ArrowRight, Tag } from "lucide-react";
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

  const markSingleRead = (id: number, route: string) => {
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
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#054E35]" />
            <h2 className="text-xl font-bold text-[#054E35] tracking-wide">Notifications & Alerts Hub</h2>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Real-time operational alerts, stock updates, and system notifications for your role.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/70 p-1 rounded-2xl w-fit border border-slate-200/60">
        <button
          onClick={() => setFilterTab("all")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterTab === "all" ? "bg-white text-[#054E35] shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilterTab("unread")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterTab === "unread" ? "bg-white text-[#054E35] shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilterTab("high")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            filterTab === "high" ? "bg-white text-rose-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          High Priority ({notifications.filter(n => n.priority === "high").length})
        </button>
      </div>

      {/* Notifications List Catalog */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                item.read
                  ? "bg-white border-slate-150 text-slate-700"
                  : "bg-emerald-50/40 border-emerald-200 text-slate-900"
              }`}
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    item.priority === "high"
                      ? "bg-rose-100 text-rose-700 border-rose-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}>
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {item.details}
                </p>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {item.time}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Verified System Event
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => markSingleRead(item.id, item.actionRoute)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#054E35] hover:bg-[#033B27] rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Open Screen</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
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
