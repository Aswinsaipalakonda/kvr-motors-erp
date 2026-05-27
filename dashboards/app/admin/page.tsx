"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  Car,
  Database,
  Settings,
  History,
  Plus,
  Menu
} from "lucide-react";

export default function AdminUsersDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarLinks = [
    { name: "Dashboard", icon: LayoutDashboard, active: false },
    { name: "Users & Roles", icon: Users, active: true },
    { name: "Branch & Showrooms", icon: Building2, active: false },
    { name: "Inventory Locations", icon: MapPin, active: false },
    { name: "Vehicle Brands & Models", icon: Car, active: false },
    { name: "Master Data", icon: Database, active: false },
    { name: "System Settings", icon: Settings, active: false },
    { name: "Activity Log", icon: History, active: false },
  ];

  const stats = [
    { label: "Total Users", count: 24 },
    { label: "Owners", count: 4 },
    { label: "Supervisors", count: 6 },
    { label: "Sales Executives", count: 8 },
    { label: "Sales Staff", count: 6 },
  ];

  const usersData = [
    { name: "Ravi Varma", role: "Owner", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 09:30 AM" },
    { name: "Suresh Babu", role: "Supervisor", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 08:15 AM" },
    { name: "Anil Kumar", role: "Sales Executive", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 09:10 AM" },
    { name: "Venkatesh", role: "Sales Staff", location: "Future Ride - Vizag", status: "Active", lastLogin: "13 May 2024 07:45 AM" },
    { name: "Prasad", role: "Sales Executive", location: "KVR Motors - Srikakulam", status: "Active", lastLogin: "12 May 2024 06:20 AM" },
    { name: "Mahesh", role: "Sales Staff", location: "KVR Motors - Kakinada", status: "Inactive", lastLogin: "10 May 2024 04:35 PM" },
    { name: "Rajesh", role: "Supervisor", location: "Future Ride - Vizag", status: "Active", lastLogin: "13 May 2024 08:40 AM" },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0c1e35] text-white flex flex-col justify-between border-r border-[#1e293b]">
        <div>
          {/* Brand Header */}
          <div className="p-5 flex items-center gap-3 border-b border-[#1e293b]/50">
            <Image
              src="/logo.png"
              alt="KVR Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-lg tracking-wider text-[#fafafa] uppercase">KVR Motors</span>
          </div>

          {/* Section Header */}
          <div className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]/60">
            Admin
          </div>

          {/* Sidebar Menu Links */}
          <nav className="px-3 space-y-1">
            {sidebarLinks.map((link, idx) => (
              <button
                key={idx}
                className={`flex w-full items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition-all duration-200 group ${
                  link.active
                    ? "bg-[#0284c7] text-white font-semibold shadow-md shadow-[#0284c7]/20"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white"
                }`}
              >
                <link.icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${link.active ? "text-white" : "text-[#64748b]"}`} />
                <span>{link.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User profile footer info */}
        <div className="p-4 border-t border-[#1e293b]/50 flex items-center justify-between hover:bg-[#1e293b]/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#38bdf8] flex items-center justify-center font-bold text-sm text-white">
              AU
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-[#fafafa]">Admin User</span>
              <span className="text-[10px] text-[#94a3b8] leading-tight">Administrator</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-[#64748b]" />
        </div>
      </aside>

      {/* Main content pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-[70px] bg-white border-b border-[#e2e8f0] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Menu className="h-5 w-5 text-[#64748b] cursor-pointer lg:hidden" />
            <h1 className="text-xl font-bold text-[#0f172a]">Users & Roles</h1>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Input Bar */}
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f1f5f9] border-0 rounded-full pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#0284c7] outline-none placeholder-[#94a3b8] transition-all"
              />
            </div>

            {/* Icons */}
            <button className="p-2 rounded-full hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
              <Calendar className="h-4.5 w-4.5" />
            </button>
            <button className="relative p-2 rounded-full hover:bg-[#f1f5f9] text-[#64748b] transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile Avatar Trigger */}
            <div className="flex items-center gap-2 border-l border-[#e2e8f0] pl-5 cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-[#f1f5f9] flex items-center justify-center font-bold text-xs text-[#0284c7] border border-[#cbd5e1]">
                AU
              </div>
              <ChevronDown className="h-4 w-4 text-[#64748b] group-hover:text-[#0f172a] transition-colors" />
            </div>
          </div>
        </header>

        {/* Scrolling Panel Content */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-5 gap-5">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white border border-[#e2e8f0] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs font-semibold text-[#64748b] mb-2">{stat.label}</div>
                <div className="text-3xl font-extrabold text-[#0f172a]">{stat.count}</div>
              </div>
            ))}
          </div>

          {/* Main User table card */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
              <h2 className="text-md font-bold text-[#0f172a]">Users List</h2>
              <button className="flex items-center gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md shadow-[#0284c7]/15 transition-all">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-xs font-bold text-[#64748b]">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Branch / Showroom</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] text-sm text-[#334155]">
                  {usersData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f8fafc]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0f172a]">{row.name}</td>
                      <td className="py-4 px-6">{row.role}</td>
                      <td className="py-4 px-6 text-[#64748b]">{row.location}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.status === "Active"
                              ? "text-emerald-600 bg-emerald-50"
                              : "text-rose-600 bg-rose-50"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-[#64748b]">{row.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
