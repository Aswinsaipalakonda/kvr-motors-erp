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
  ActivitySquare,
  User,
  Wallet,
  AlertTriangle,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function DashboardSidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  // Closed by default so it acts as an overlay drawer on mobile.
  // On desktop (lg+) the aside is always visible via `lg:translate-x-0`.
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ label: string; x: number; y: number } | null>(null);

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
        { id: "mela_dashboard", label: "Mela Campaign", icon: Sparkles },
        { id: "branches", label: "Branch & Showrooms", icon: Building2 },
        { id: "vehicles", label: "Vehicle Management", icon: Car },
        { id: "stock", label: "Stock (In & Out)", icon: Boxes },
        { id: "purchases", label: "Purchase Management", icon: ShoppingBag },
        { id: "sales", label: "Sales Management", icon: CreditCard },
        { id: "leads", label: "Lead Management", icon: Compass },
        { id: "bookings", label: "Advance Bookings", icon: CalendarDays },
        { id: "batteries", label: "Batteries Management", icon: Battery },
        { id: "ledger", label: "Ledger Management", icon: BookOpen },
        { id: "expenses", label: "Cash & Expenses", icon: Wallet },
        { id: "issues", label: "Issue Tracker", icon: AlertTriangle },
        { id: "reports", label: "Reports & Analytics", icon: BarChart2 },
        { id: "users", label: "Users & Roles", icon: Users },
        { id: "attendance", label: "Staff Attendance", icon: UsersRound },
        { id: "activity-logs", label: "Activity Logs", icon: ActivitySquare },
        { id: "settings", label: "Settings", icon: Settings },
        { id: "profile", label: "My Profile", icon: User },
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
        { id: "expenses", label: "Petty Cash & Expenses", icon: Wallet },
        { id: "issues", label: "Report Issue", icon: AlertTriangle },
        { id: "reports", label: "Reports", icon: BarChart2 },
        { id: "attendance", label: "Verify Attendance", icon: UsersRound },
        { id: "profile", label: "My Profile", icon: User },
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
        { id: "mela_booking_form", label: "Mela Booking", icon: Sparkles },
        { id: "leads", label: "Leads / Enquiries", icon: Compass },
        { id: "customers", label: "Customers", icon: Users },
        { id: "bookings", label: "Bookings", icon: CalendarDays },
        { id: "followups", label: "Follow-ups", icon: UserCheck2 },
        { id: "reports", label: "Reports", icon: BarChart2 },
        { id: "attendance", label: "Daily Check-in", icon: UsersRound },
        { id: "profile", label: "My Profile", icon: User },
      ]
    },
    telecaller: {
      profile: {
        name: "Lakshmi Narayana",
        roleName: "Telecaller",
        initials: "LN"
      },
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "leads", label: "Leads", icon: Compass },
        { id: "attendance", label: "Daily Check-in", icon: UsersRound },
        { id: "profile", label: "My Profile", icon: User },
      ]
    },
    staff: {
      profile: {
        name: "Gopal Rao",
        roleName: "Operations Staff",
        initials: "GR"
      },
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "inventory", label: "Inventory & Shipments", icon: Boxes },
        { id: "batteries", label: "Battery Registry", icon: Battery },
        { id: "pdi", label: "PDI & Handovers", icon: FileText },
        { id: "attendance", label: "Daily Check-in", icon: UsersRound },
        { id: "profile", label: "My Profile", icon: User },
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

  const isMela = activeTab?.startsWith("mela_");

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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 max-w-[85vw] border-r transition-all duration-300 lg:translate-x-0 lg:static ${
          isMela ? "lg:w-20" : "lg:w-64"
        } lg:shrink-0 rounded-none overflow-hidden bg-[#090d16] border-[#1e293b] text-white ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className={`flex flex-col border-b border-[#1e293b] bg-[#05070c]/50 ${isMela ? "p-4 lg:p-3 lg:items-center lg:justify-center" : "p-4"}`}>
          <div className="flex items-center gap-3">
            {/* In-drawer close button (mobile only) */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden transition-colors bg-[#04a700] text-white hover:bg-[#038a00]"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative h-10 w-10 shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center border border-[#1e293b]">
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
            <div className={`flex flex-col text-left ${isMela ? "lg:hidden" : ""}`}>
              <span className="font-extrabold text-lg tracking-tight uppercase text-white font-sans flex items-center gap-1.5">
                KVR Motors
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest -mt-1 text-[#04a700] font-sans">
                {role === "owner" ? "Owner Portal" : role === "supervisor" ? "Supervisor Panel" : role === "telecaller" ? "Telecaller Desk" : role === "staff" ? "Staff Terminal" : "Sales Terminal"}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable menu items */}
        <div className={`flex-1 overflow-y-auto slim-scrollbar space-y-1.5 py-4 ${isMela ? "px-4 lg:px-2" : "px-4"}`}>
          {!isMela ? (
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider block mb-2 text-left text-slate-400 font-sans">
              Modules
            </span>
          ) : (
            <>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider block mb-2 text-left text-slate-400 font-sans lg:hidden">
                Modules
              </span>
              <div className="hidden lg:block border-b border-[#1e293b] my-2 mx-2" />
            </>
          )}
          <nav className="space-y-1">
            {currentConfig.items.map((item) => {
              const isTabActive = isItemActive(item.id);
              const Icon = item.icon;
              const itemPath = getPath(item.id);

              const handleClick = (e: React.MouseEvent) => {
                if (setActiveTab) {
                  e.preventDefault();
                  setActiveTab(item.id);
                  const itemPath = getPath(item.id);
                  window.history.pushState({ path: itemPath }, "", itemPath);
                }
                if (window.innerWidth < 1024) {
                  setIsOpen(false);
                }
              };

              const navItemClass = isTabActive
                ? "bg-[#04a700] text-white font-bold shadow-md shadow-[#04a700]/25"
                : "text-slate-300 hover:bg-[#04a700]/10 hover:text-white";

              const navIconClass = isTabActive
                ? "text-white scale-110"
                : "text-slate-400 group-hover:text-white";

              return (
                <Link
                  key={item.id}
                  href={itemPath}
                  onClick={handleClick}
                  onMouseMove={(e) => {
                    if (isMela && window.innerWidth >= 1024) {
                      setHoveredItem({
                        label: item.label,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredItem(null);
                  }}
                  className={`flex w-full items-center rounded-full text-sm font-semibold transition-all duration-200 group text-left relative ${
                    isMela 
                      ? "gap-3 px-4 py-2.5 lg:justify-center lg:gap-0 lg:px-0 lg:py-2.5" 
                      : "gap-3 px-4 py-2.5"
                  } ${navItemClass}`}
                >
                  <Icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${navIconClass}`} />
                  <span className={isMela ? "lg:hidden" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {hoveredItem && (
        <div
          style={{
            position: "fixed",
            left: hoveredItem.x + 15,
            top: hoveredItem.y + 10,
            pointerEvents: "none",
            zIndex: 9999,
          }}
          className="bg-slate-950/95 border border-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap"
        >
          {hoveredItem.label}
        </div>
      )}
    </>
  );
}
