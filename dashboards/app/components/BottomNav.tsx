"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Car,
  Compass,
  CreditCard,
  CalendarDays,
  UsersRound,
  UserCheck2,
  Battery,
  FileText,
  LucideIcon,
} from "lucide-react";

interface BottomNavProps {
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
  activeTab?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Top-priority screens surfaced in the mobile bottom bar for each role.
const navConfig: Record<BottomNavProps["role"], NavItem[]> = {
  owner: [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: CreditCard },
    { id: "leads", label: "Leads", icon: Compass },
    { id: "stock", label: "Stock", icon: Boxes },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
  ],
  supervisor: [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "stock", label: "Stock", icon: Boxes },
    { id: "leads", label: "Leads", icon: Compass },
    { id: "attendance", label: "Attendance", icon: UsersRound },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
  ],
  sales: [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "leads", label: "Leads", icon: Compass },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
    { id: "attendance", label: "Check-in", icon: UsersRound },
  ],
  telecaller: [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "leads", label: "Leads", icon: Compass },
    { id: "attendance", label: "Check-in", icon: UsersRound },
  ],
  staff: [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "batteries", label: "Batteries", icon: Battery },
    { id: "pdi", label: "PDI", icon: FileText },
    { id: "attendance", label: "Check-in", icon: UsersRound },
  ],
};

export default function BottomNav({ role, activeTab }: BottomNavProps) {
  const pathname = usePathname();
  const items = navConfig[role] || navConfig.owner;

  const getPath = (itemId: string) => (itemId === "dashboard" ? `/${role}` : `/${role}/${itemId}`);

  const isItemActive = (itemId: string) => {
    if (activeTab) return activeTab === itemId;
    const path = getPath(itemId);
    return itemId === "dashboard" ? pathname === path : pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-emerald-100 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(2,44,34,0.08)] lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item.id);
        return (
          <Link
            key={item.id}
            href={getPath(item.id)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 select-none"
          >
            {/* Active top indicator */}
            <span
              className={`absolute top-0 h-0.5 w-10 rounded-full transition-all duration-200 ${
                active ? "bg-emerald-600" : "bg-transparent"
              }`}
            />
            <Icon
              className={`h-5 w-5 transition-colors ${
                active ? "text-emerald-600" : "text-slate-400"
              }`}
              strokeWidth={active ? 2.4 : 1.9}
            />
            <span
              className={`text-[10px] font-bold leading-none transition-colors ${
                active ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
