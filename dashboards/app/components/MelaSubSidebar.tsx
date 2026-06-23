"use client";

import React from "react";
import {
  Sparkles,
  LayoutDashboard,
  Boxes,
  CreditCard,
  BarChart2,
  ListOrdered,
  PlusCircle,
  TrendingUp,
  Settings,
} from "lucide-react";

interface MelaSubSidebarProps {
  role: "owner" | "sales";
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MelaSubSidebar({ role, activeTab, setActiveTab }: MelaSubSidebarProps) {
  const ownerItems = [
    { id: "mela_dashboard", label: "Mela Overview", icon: LayoutDashboard },
    { id: "mela_inventory", label: "Campaign Stock", icon: Boxes },
    { id: "mela_checkout", label: "Cash Checkout", icon: CreditCard },
    { id: "mela_reports", label: "Sales & Leaderboard", icon: BarChart2 },
    { id: "mela_settings", label: "About & Settings", icon: Settings },
  ];

  const salesItems = [
    { id: "mela_booking_form", label: "New Booking / Catalog", icon: PlusCircle },
    { id: "mela_my_bookings", label: "My Mela Bookings", icon: ListOrdered },
    { id: "mela_reports", label: "Performance Reports", icon: TrendingUp },
  ];

  const items = role === "owner" ? ownerItems : salesItems;
  const subPathPrefix = role === "owner" ? "/owner/" : "/sales/";

  const handleLinkClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(id);
    const fullPath = subPathPrefix + id;
    window.history.pushState({ path: fullPath }, "", fullPath);
  };

  return (
    <div className="w-56 shrink-0 border-r border-[#1e293b] bg-[#0c1322] text-slate-355 flex flex-col h-full font-sans select-none hidden md:flex">
      <div className="p-4 border-b border-[#1e293b] bg-[#090d16]/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-100">
            Mela Campaign
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <a
              key={item.id}
              href={`${subPathPrefix}${item.id}`}
              onClick={(e) => handleLinkClick(item.id, e)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                isActive
                  ? "bg-[#04a700]/15 text-[#04a700] border-l-2 border-[#04a700]"
                  : "hover:bg-[#1e293b] hover:text-white text-slate-300"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#04a700]" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
