"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  CalendarDays, 
  HelpCircle,
  LogOut,
  Building,
  UserCheck,
  Settings
} from "lucide-react";

interface NavbarProps {
  title: string;
  role: "owner" | "supervisor" | "sales";
}

export default function Navbar({ title, role }: NavbarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeBranch, setActiveBranch] = useState("All Branches");

  const notifications = [
    { id: 1, title: "New Stock Alert", message: "Low stock on Kinetic E-Luna at Vizag", time: "3m ago" },
    { id: 2, title: "Booking Confirmed", message: "Booking BK-8021 has been approved", time: "12m ago" },
    { id: 3, title: "GPS Transfer", message: "Stock transfer TR-2026-904 completed", time: "1h ago" },
  ];

  const branches = [
    "All Branches",
    "KVR Motors - Vizag Showroom",
    "Future Ride - Vizag Showroom",
    "KVR Motors - Srikakulam Showroom",
    "KVR Motors - Kakinada Showroom",
    "Pendurthi Godown (Inventory)",
    "Pineapple Colony Godown (Inventory)"
  ];

  const profileActions = [
    { id: "profile", label: "View Profile", icon: UserCheck },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut }
  ];

  return (
    <header className="h-20 bg-[#E8F1EC] border-b border-emerald-100/50 px-6 flex items-center justify-between shrink-0 select-none z-30 relative">
      {/* Title & Section Label */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800 hidden sm:block">{title}</h1>
      </div>

      {/* Utilities Container */}
      <div className="flex items-center gap-4 lg:gap-6 ml-auto sm:ml-0">
        
        {/* Search Bar matching mockup with rounded pill design */}
        <div className="relative w-40 sm:w-60 md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search details..."
            className="w-full bg-white border border-emerald-150 rounded-full pl-10 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none placeholder-slate-400 transition-all text-slate-750"
          />
        </div>

        {/* Date Selector Display */}
        <div className="hidden lg:flex items-center gap-2 border border-emerald-100 bg-white rounded-lg px-3 py-1.5 text-xs text-slate-650 font-semibold">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span>01 May 2024 - 31 May 2024</span>
        </div>

        {/* Branch Selector Dropdown (owner only) */}
        {role === "owner" && (
          <div className="relative">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center gap-2 border border-emerald-100 bg-white hover:bg-emerald-50/50 rounded-lg px-3 py-1.5 text-xs text-slate-750 font-semibold cursor-pointer transition-colors"
            >
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-30 truncate">{activeBranch}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showBranchDropdown && (
              <div className="absolute right-0 mt-2 z-50 w-64 rounded-lg border border-emerald-100 bg-white p-1.5 shadow-xl">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Branch
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {branches.map((branch, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveBranch(branch);
                        setShowBranchDropdown(false);
                      }}
                      className={`flex w-full items-center rounded-md px-2.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                        activeBranch === branch
                          ? "bg-slate-50 text-emerald-600 font-bold"
                          : "text-slate-600"
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="p-2 rounded-full hover:bg-emerald-50/50 text-slate-650 transition-colors border border-emerald-100 bg-white relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button className="hidden sm:flex p-2 rounded-full hover:bg-emerald-50/50 text-slate-650 transition-colors border border-emerald-100 bg-white">
            <HelpCircle className="h-4 w-4" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-emerald-100 bg-white shadow-xl p-3">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2">
                {notifications.map((note) => (
                  <div key={note.id} className="rounded-2xl border border-emerald-50 bg-emerald-50/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">{note.title}</span>
                      <span className="text-[10px] font-bold text-slate-500">{note.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{note.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Quick Switcher Profile Box */}
        <div className="relative">
          <div 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-4 border-l border-emerald-250/60 cursor-pointer group select-none"
          >
            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center font-bold text-xs text-emerald-800 border border-emerald-100 uppercase">
              {role === "owner" ? "RV" : role === "supervisor" ? "SB" : "AK"}
            </div>
            <div className="hidden md:flex flex-col text-left shrink-0">
              <span className="text-xs font-bold leading-none text-slate-800 group-hover:text-slate-900 transition-colors">
                {role === "owner" ? "Ravi Varma" : role === "supervisor" ? "Suresh Babu" : "Anil Kumar"}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">
                {role === "owner" ? "Owner" : role === "supervisor" ? "Supervisor" : "Sales Exec"}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="px-2.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-sm font-bold text-slate-900">{role === "owner" ? "Ravi Varma" : role === "supervisor" ? "Suresh Babu" : "Anil Kumar"}</div>
                <div className="text-[11px] text-slate-500 mt-1">{role === "owner" ? "Owner, KVR Motors" : role === "supervisor" ? "Supervisor, Vizag" : "Sales Executive, Vizag"}</div>
              </div>
              <div className="mt-3 space-y-1">
                {profileActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "logout") {
                          logout();
                        } else {
                          setShowProfileDropdown(false);
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-emerald-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
