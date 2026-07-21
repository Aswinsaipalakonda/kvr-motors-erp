"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Clock, ShieldCheck, Tag, Sparkles, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { 
  getStoredNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification, 
  clearAllNotifications,
  AppNotification 
} from "../services/notifications";

interface NotificationsViewProps {
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
}

export default function NotificationsView({ role }: NotificationsViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(getStoredNotifications(role));

    const handleUpdate = () => {
      setNotifications(getStoredNotifications(role));
    };

    window.addEventListener("notifications:updated", handleUpdate);
    return () => window.removeEventListener("notifications:updated", handleUpdate);
  }, [role]);

  const [filterTab, setFilterTab] = useState<"all" | "unread" | "high">("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = markAllNotificationsRead(role);
    setNotifications(updated);
  };

  const clearAll = () => {
    const updated = clearAllNotifications(role);
    setNotifications(updated);
  };

  const handleCardClick = (id: string, route: string) => {
    const updated = markNotificationRead(role, id);
    setNotifications(updated);
    if (route) router.push(route);
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
              onClick={() => handleCardClick(item.id, item.actionRoute || item.route || "")}
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
