"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building2,
  Car,
  Boxes,
  BatteryCharging,
  Users,
  Compass,
  FileSpreadsheet,
  Settings,
  FolderLock,
  ChevronUp,
  Store,
  Menu,
  X,
  CreditCard,
  ShoppingBag
} from "lucide-react";

interface SubMenuItem {
  title: string;
  path: string;
}

interface MenuItem {
  title: string;
  icon: React.ComponentType<any>;
  path?: string;
  subItems?: SubMenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({
    Dashboard: true,
    "Vehicle Catalog": false,
  });
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [currentBranch, setCurrentBranch] = useState({
    name: "KVR Showroom",
    location: "Vizag Branch",
  });

  const branches = [
    { name: "KVR Showroom", location: "Vizag Branch" },
    { name: "Future Ride", location: "Vizag Branch" },
    { name: "KVR Showroom", location: "Srikakulam Branch" },
    { name: "KVR Showroom", location: "Kakinada Branch" },
  ];

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      subItems: [
        { title: "Admin Overview", path: "/admin" },
        { title: "Owner Analytics", path: "/owner" },
        { title: "Supervisor Panel", path: "/supervisor" },
      ],
    },
    {
      title: "Branches & Locations",
      icon: Building2,
      subItems: [
        { title: "Showrooms", path: "/branches/showrooms" },
        { title: "Inventory Locations", path: "/branches/locations" },
      ],
    },
    {
      title: "Vehicle Catalog",
      icon: Car,
      subItems: [
        { title: "Brands & Categories", path: "/vehicles/categories" },
        { title: "Model Directory", path: "/vehicles/models" },
        { title: "Physical Stock (Units)", path: "/vehicles/units" },
      ],
    },
    {
      title: "Inventory",
      icon: Boxes,
      subItems: [
        { title: "Stock Overview", path: "/inventory" },
        { title: "Internal Transfers", path: "/inventory/transfers" },
        { title: "Adjustments", path: "/inventory/adjustments" },
      ],
    },
    {
      title: "Battery Management",
      icon: BatteryCharging,
      subItems: [
        { title: "Battery Stock", path: "/battery" },
        { title: "FIFO Allocations", path: "/battery/fifo" },
      ],
    },
    {
      title: "Leads & Enquiries",
      icon: Compass,
      subItems: [
        { title: "Enquiry Form", path: "/leads/enquiry" },
        { title: "Active Pipelines", path: "/leads/pipelines" },
        { title: "Follow-up Reminders", path: "/leads/reminders" },
      ],
    },
    {
      title: "Sales & Bookings",
      icon: CreditCard,
      subItems: [
        { title: "Advance Bookings", path: "/booking" },
        { title: "Sales Invoices", path: "/sales" },
      ],
    },
    {
      title: "Purchases",
      icon: ShoppingBag,
      subItems: [
        { title: "Supplier Directory", path: "/purchases/suppliers" },
        { title: "Purchase Orders", path: "/purchases/orders" },
      ],
    },
    {
      title: "Ledger & Finance",
      icon: FileSpreadsheet,
      subItems: [
        { title: "Income & Expenses", path: "/ledger" },
        { title: "Financial Reports", path: "/ledger/reports" },
      ],
    },
    {
      title: "System Logs",
      icon: FolderLock,
      path: "/admin/logs",
    },
  ];

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleBranchChange = (branch: { name: string; location: string }) => {
    setCurrentBranch(branch);
    setShowBranchSelector(false);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased">
      {/* Sidebar Container */}
      <aside
        className={`relative flex flex-col border-r border-[#27272a] bg-[#09090b] h-full transition-all duration-300 ease-in-out ${
          isOpen ? "w-[280px]" : "w-[0px] overflow-hidden border-r-0"
        }`}
      >
        {/* Header / Branch Switcher */}
        <div className="p-4 border-b border-[#27272a]">
          <div
            onClick={() => setShowBranchSelector(!showBranchSelector)}
            className="flex items-center justify-between p-2 rounded-lg cursor-pointer bg-[#18181b] hover:bg-[#27272a] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold leading-tight">{currentBranch.name}</span>
                <span className="text-xs text-[#a1a1aa] leading-tight">{currentBranch.location}</span>
              </div>
            </div>
            <div className="flex flex-col text-[#a1a1aa]">
              <ChevronUp className="h-3 w-3 -mb-1" />
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>

          {/* Branch Selector Dropdown */}
          {showBranchSelector && (
            <div className="absolute left-4 right-4 mt-2 z-50 rounded-lg border border-[#27272a] bg-[#18181b] p-1.5 shadow-xl">
              <div className="px-2 py-1.5 text-xs font-semibold text-[#a1a1aa]">Select Branch</div>
              {branches.map((branch, index) => (
                <button
                  key={index}
                  onClick={() => handleBranchChange(branch)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-[#27272a] transition-colors ${
                    currentBranch.name === branch.name && currentBranch.location === branch.location
                      ? "bg-[#27272a] text-white font-medium"
                      : "text-[#d4d4d8]"
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span>{branch.name}</span>
                    <span className="text-xs text-[#a1a1aa]">{branch.location}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-[#27272a] scrollbar-track-transparent">
          <div>
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-[#71717a] mb-3">
              Platform Modules
            </h2>
            <nav className="space-y-1">
              {menuItems.map((item, index) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isSubMenuOpen = !!openSubMenus[item.title];

                return (
                  <div key={index} className="space-y-1">
                    {hasSubItems ? (
                      // Collapsible Header Button
                      <button
                        onClick={() => toggleSubMenu(item.title)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 group ${
                          isSubMenuOpen ? "text-white" : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isSubMenuOpen ? "text-[#2563eb]" : "text-[#71717a]"}`} />
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {isSubMenuOpen ? (
                          <ChevronDown className="h-4 w-4 text-[#71717a]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#71717a]" />
                        )}
                      </button>
                    ) : (
                      // Direct Link Item
                      item.path && (
                        <Link
                          href={item.path}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 group ${
                            pathname === item.path
                              ? "bg-[#18181b] text-white font-medium border-l-2 border-[#2563eb] pl-2.5"
                              : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-[#71717a] group-hover:scale-110" />
                            <span>{item.title}</span>
                          </div>
                        </Link>
                      )
                    )}

                    {/* Submenu Items with Vertical Connection Line */}
                    {hasSubItems && isSubMenuOpen && item.subItems && (
                      <div className="relative pl-7 space-y-1 mt-1">
                        {/* Vertical Indent Line */}
                        <div className="absolute left-[19px] top-0 bottom-2 w-[1px] bg-[#27272a]" />
                        
                        {item.subItems.map((subItem, sIndex) => {
                          const isSubActive = pathname === subItem.path;
                          return (
                            <Link
                              key={sIndex}
                              href={subItem.path}
                              className={`flex w-full items-center rounded-md py-1.5 px-3 text-xs transition-colors ${
                                isSubActive
                                  ? "bg-[#18181b] text-white font-semibold"
                                  : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                              }`}
                            >
                              {subItem.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#27272a] bg-[#09090b] flex items-center justify-between text-xs text-[#71717a]">
          <span>KVR ERP v1.0.0</span>
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
        </div>
      </aside>

      {/* Floating Toggle Button outside the Sidebar area */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[9999] flex h-9 w-9 items-center justify-center rounded-md border border-[#27272a] bg-[#18181b] hover:bg-[#27272a] transition-all text-[#fafafa]"
        style={{
          marginLeft: isOpen ? "280px" : "0px",
          transition: "margin-left 0.3s ease-in-out",
        }}
      >
        <Menu className="h-4 w-4" />
      </button>
    </div>
  );
}
