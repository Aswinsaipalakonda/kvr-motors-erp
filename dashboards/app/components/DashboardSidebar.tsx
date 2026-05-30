"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Car,
  Boxes,
  ShoppingBag,
  CreditCard,
  Compass,
  FileText,
  Battery,
  BookOpen,
  BarChart2,
  Users,
  Settings,
  UsersRound,
  CalendarDays,
  Store,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  UserCheck2,
  ActivitySquare
} from "lucide-react";

interface SidebarProps {
  role: "owner" | "supervisor" | "sales";
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function DashboardSidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  // Closed by default so it acts as an overlay drawer on mobile.
  // On desktop (lg+) the aside is always visible via `lg:translate-x-0`.
  const [isOpen, setIsOpen] = useState(false);

  // Define sidebar menu structure for each role based on the PRD & reference image
  const menuConfig = {
    owner: {
      profile: {
        name: "Ravi Varma",
        roleName: "Owner",
        avatar: "/avatar_owner.png", // fallback initials used in UI
        initials: "RV"
      },
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "branches", label: "Branch & Showrooms", icon: Building2 },
        { id: "vehicles", label: "Vehicle Management", icon: Car },
        { id: "stock", label: "Stock (In & Out)", icon: Boxes },
        { id: "purchases", label: "Purchase Management", icon: ShoppingBag },
        { id: "sales", label: "Sales Management", icon: CreditCard },
        { id: "leads", label: "Lead Management", icon: Compass },
        { id: "bookings", label: "Advance Bookings", icon: CalendarDays },
        { id: "batteries", label: "Batteries Management", icon: Battery },
        { id: "ledger", label: "Ledger Management", icon: BookOpen },
        { id: "reports", label: "Reports & Analytics", icon: BarChart2 },
        { id: "users", label: "Users & Roles", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
      ]
    },
    supervisor: {
      profile: {
        name: "Suresh Babu",
        roleName: "Supervisor",
        initials: "SB"
      },
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "stock", label: "Stock (In & Out)", icon: Boxes },
        { id: "vehicles", label: "Vehicle Management", icon: Car },
        { id: "sales", label: "Sales Management", icon: CreditCard },
        { id: "leads", label: "Lead Management", icon: Compass },
        { id: "bookings", label: "Advance Bookings", icon: CalendarDays },
        { id: "batteries", label: "Batteries Management", icon: Battery },
        { id: "reports", label: "Reports", icon: BarChart2 },
      ]
    },
    sales: {
      profile: {
        name: "Anil Kumar",
        roleName: "Sales Executive",
        initials: "AK"
      },
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "leads", label: "Leads / Enquiries", icon: Compass },
        { id: "customers", label: "Customers", icon: UsersRound },
        { id: "sales_bookings", label: "Sales & Bookings", icon: CreditCard },
        { id: "followups", label: "Follow-ups", icon: UserCheck2 },
        { id: "reports", label: "Reports", icon: BarChart2 },
      ]
    }
  };

  const currentConfig = menuConfig[role] || menuConfig.owner;
  const activeColorClass = "bg-emerald-500/10 text-emerald-950 border-l-4 border-emerald-600 font-bold";

  const pathname = usePathname();

  const getPath = (itemId: string) => {
    return itemId === "dashboard" ? `/${role}` : `/${role}/${itemId}`;
  };

  const isItemActive = (itemId: string) => {
    if (activeTab) {
      return activeTab === itemId;
    }
    const path = getPath(itemId);
    return itemId === "dashboard" ? pathname === path : pathname.startsWith(path);
  };

  const iconColorClass = (itemId: string) => {
    if (isItemActive(itemId)) {
      return "text-emerald-700";
    }
    return "text-emerald-800/60 group-hover:text-emerald-950";
  };

  return (
    <>
      {/* Mobile Hamburger Toggle Button (hidden when drawer is open) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-md lg:hidden hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 max-w-[85vw] border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:w-64 lg:shrink-0 ${
          role === "owner"
            ? "bg-[#090d16] border-[#1e293b] text-white"
            : "bg-[#E2EFE7] border-emerald-150/40 text-slate-800"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className={`flex flex-col border-b ${
          role === "owner"
            ? "border-[#1e293b] bg-[#05070c]/50"
            : "border-emerald-150/40 bg-[#D6E6DC]/20"
        } ${role === "owner" ? "p-4" : "p-6"}`}>
          <div className="flex items-center gap-3">
            {/* In-drawer close button (mobile only) */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden transition-colors ${
                role === "owner"
                  ? "bg-[#04a700] text-white hover:bg-[#038a00]"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <X className="h-5 w-5" />
            </button>
            <div className={`relative h-10 w-10 shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center border ${
              role === "owner" ? "border-[#1e293b]" : "border-emerald-100/50"
            }`}>
              {/* If logo.png is loaded correctly, we use it, otherwise text fallback */}
              <Image
                src="/logo.png"
                alt="KVR Motors Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className={`font-extrabold text-lg tracking-tight uppercase ${
                role === "owner" ? "text-white" : "text-emerald-950"
              }`}>KVR Motors</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest -mt-1 ${
                role === "owner" ? "text-[#04a700]" : "text-emerald-800/80"
              }`}>
                {role === "owner" ? "Owner Portal" : role === "supervisor" ? "Supervisor Panel" : "Sales Terminal"}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable menu items */}
        <div className={`flex-1 overflow-y-auto px-4 space-y-1 ${role === "owner" ? "py-3" : "py-6"}`}>
          <span className={`px-3 text-[10px] font-bold uppercase tracking-wider block mb-2 text-left ${
            role === "owner" ? "text-slate-400" : "text-emerald-900/60"
          }`}>
            Modules
          </span>
          <nav className="space-y-1">
            {currentConfig.items.map((item) => {
              const isTabActive = isItemActive(item.id);
              const Icon = item.icon;
              const itemPath = getPath(item.id);

              const handleClick = (e: React.MouseEvent) => {
                if (setActiveTab) {
                  e.preventDefault();
                  setActiveTab(item.id);
                }
                if (window.innerWidth < 1024) {
                  setIsOpen(false);
                }
              };

              const navItemClass = isTabActive
                ? role === "owner"
                  ? "bg-[#04a700]/15 text-[#04a700] border-l-4 border-[#04a700] font-bold"
                  : "bg-emerald-500/10 text-emerald-950 border-l-4 border-emerald-600 font-bold"
                : role === "owner"
                  ? "text-slate-300 hover:bg-[#04a700]/10 hover:text-white"
                  : "text-emerald-900/80 hover:bg-emerald-500/5 hover:text-emerald-950";

              const navIconClass = isTabActive
                ? role === "owner"
                  ? "text-[#04a700]"
                  : "text-emerald-700"
                : role === "owner"
                  ? "text-slate-400 group-hover:text-white"
                  : "text-emerald-800/60 group-hover:text-emerald-950";

              return (
                <Link
                  key={item.id}
                  href={itemPath}
                  onClick={handleClick}
                  className={`flex w-full items-center gap-3 px-3 ${role === "owner" ? "py-2" : "py-2.5"} rounded-lg text-sm font-semibold transition-all duration-200 group text-left ${navItemClass}`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${navIconClass}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer matching the image */}
        <div className={`p-4 border-t ${
          role === "owner"
            ? "border-[#1e293b] bg-[#05070c]"
            : "border-emerald-150/40 bg-[#D6E6DC]"
        }`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl border shadow-sm ${
            role === "owner"
              ? "bg-[#141a29] border-[#1e293b]"
              : "bg-white/60 border-white/80"
          }`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
              role === "owner" ? "bg-[#04a700] border border-[#04a700]/55" : "bg-emerald-600 border border-emerald-500"
            }`}>
              {currentConfig.profile.initials}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className={`text-sm font-bold leading-tight truncate ${
                role === "owner" ? "text-white" : "text-emerald-950"
              }`}>
                {currentConfig.profile.name}
              </span>
              <span className={`text-xs leading-tight ${
                role === "owner" ? "text-[#94a3b8]" : "text-emerald-800/70"
              }`}>
                {currentConfig.profile.roleName}
              </span>
            </div>
          </div>
          <div className={`mt-3 flex items-center justify-between text-[10px] px-2 select-none ${
            role === "owner" ? "text-slate-400" : "text-emerald-800/60"
          }`}>
            <span>ERP Platform v1.2.0</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                role === "owner" ? "bg-[#04a700]" : "bg-emerald-600"
              }`} />
              <span>Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
