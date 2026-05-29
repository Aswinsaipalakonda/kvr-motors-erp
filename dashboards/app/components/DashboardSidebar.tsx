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
  const [isOpen, setIsOpen] = useState(true);

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
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-600 text-white lg:hidden hover:bg-emerald-500 focus:outline-none shadow-md"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#E2EFE7] border-r border-emerald-150/40 text-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className={`flex flex-col border-b border-emerald-150/40 bg-[#D6E6DC]/20 ${role === "owner" ? "p-4" : "p-6"}`}>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center border border-emerald-100/50">
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
              <span className="font-extrabold text-lg tracking-tight text-emerald-950 uppercase">KVR Motors</span>
              <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-widest -mt-1">
                {role === "owner" ? "Owner Portal" : role === "supervisor" ? "Supervisor Panel" : "Sales Terminal"}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable menu items */}
        <div className={`flex-1 overflow-y-auto px-4 space-y-1 ${role === "owner" ? "py-3" : "py-6"}`}>
          <span className="px-3 text-[10px] font-bold text-emerald-900/60 uppercase tracking-wider block mb-2 text-left">
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

              return (
                <Link
                  key={item.id}
                  href={itemPath}
                  onClick={handleClick}
                  className={`flex w-full items-center gap-3 px-3 ${role === "owner" ? "py-2" : "py-2.5"} rounded-lg text-sm font-semibold transition-all duration-200 group text-left ${
                    isTabActive
                      ? activeColorClass
                      : "text-emerald-900/80 hover:bg-emerald-500/5 hover:text-emerald-950"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${iconColorClass(item.id)}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer matching the image */}
        <div className="p-4 border-t border-emerald-150/40 bg-[#D6E6DC]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/60 border border-white/80 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-emerald-600 border border-emerald-500 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {currentConfig.profile.initials}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-sm font-bold leading-tight text-emerald-950 truncate">
                {currentConfig.profile.name}
              </span>
              <span className="text-xs text-emerald-800/70 leading-tight">
                {currentConfig.profile.roleName}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-800/60 px-2 select-none">
            <span>ERP Platform v1.2.0</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
