"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  Bell,
  HelpCircle,
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
  HelpCircle as HelpIcon,
  LogOut,
  ShoppingBag,
  TrendingUp,
  Percent
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminUsersDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarLinks = [
    { name: "Dashboard", icon: LayoutDashboard, active: false, badge: null },
    { name: "Users & Roles", icon: Users, active: true, badge: "20" },
    { name: "Branch & Showrooms", icon: Building2, active: false, badge: null },
    { name: "Inventory Locations", icon: MapPin, active: false, badge: null },
    { name: "Vehicle Brands & Models", icon: Car, active: false, badge: "99+" },
    { name: "Master Data", icon: Database, active: false, badge: null },
    { name: "System Settings", icon: Settings, active: false, badge: null },
    { name: "Activity Log", icon: History, active: false, badge: null },
  ];

  const stats = [
    { label: "Total Users", count: 24, trend: "↑ 4.9%", trendType: "success", icon: Users, lastMonth: "Last month: 22" },
    { label: "Owners", count: 4, trend: "↑ 7.5%", trendType: "success", icon: Users, lastMonth: "Last month: 3" },
    { label: "Supervisors", count: 6, trend: "↓ 6.0%", trendType: "danger", icon: Users, lastMonth: "Last month: 7" },
    { label: "Sales Executives", count: 8, trend: "↑ 12.5%", trendType: "success", icon: Users, lastMonth: "Last month: 7" },
    { label: "Sales Staff", count: 6, trend: "On target", trendType: "neutral", icon: Users, lastMonth: "Last month: 6" },
  ];

  const usersData = [
    { id: "#USR878909", name: "Ravi Varma", role: "Owner", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024" },
    { id: "#USR878910", name: "Suresh Babu", role: "Supervisor", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024" },
    { id: "#USR878911", name: "Anil Kumar", role: "Sales Executive", location: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024" },
    { id: "#USR878912", name: "Venkatesh", role: "Sales Staff", location: "Future Ride - Vizag", status: "Active", lastLogin: "13 May 2024" },
    { id: "#USR878913", name: "Prasad", role: "Sales Executive", location: "KVR Motors - Srikakulam", status: "Active", lastLogin: "12 May 2024" },
    { id: "#USR878914", name: "Mahesh", role: "Sales Staff", location: "KVR Motors - Kakinada", status: "Inactive", lastLogin: "10 May 2024" },
    { id: "#USR878915", name: "Rajesh", role: "Supervisor", location: "Future Ride - Vizag", status: "Active", lastLogin: "13 May 2024" },
  ];

  // Daily user logins data matching mockup layout style
  const activityData = [
    { day: "Fri", logins: 15 },
    { day: "Sat", logins: 11 },
    { day: "Sun", logins: 22 },
    { day: "Mon", logins: 13 },
    { day: "Thu", logins: 17 },
    { day: "Wen", logins: 24 },
    { day: "Thus", logins: 16 },
  ];

  // Stacked active hours matching the mockup grouped chart
  const roleComparisonData = [
    { month: "Jan", active: 30, idle: 15 },
    { month: "Feb", active: 34, idle: 18 },
    { month: "Mar", active: 36, idle: 14 },
    { month: "Apr", active: 29, idle: 12 },
    { month: "May", active: 32, idle: 16 },
    { month: "Jun", active: 40, idle: 22 },
    { month: "Jul", active: 38, idle: 18 },
    { month: "Aug", active: 30, idle: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#eaedf1] p-6 flex items-center justify-center font-sans antialiased">
      {/* Curved outer bezel frame matching mockup */}
      <div className="w-full max-w-[1440px] bg-white rounded-[24px] shadow-2xl overflow-hidden flex h-[900px] border border-gray-200">
        
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r border-[#f1f5f9] flex flex-col justify-between p-6 shrink-0 select-none">
          <div>
            {/* Logo and Brand Title Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="h-10 w-10 rounded-xl bg-[#fa541c] flex items-center justify-center text-white shadow-md shadow-[#fa541c]/30">
                <Image
                  src="/logo.png"
                  alt="KVR Logo"
                  width={24}
                  height={24}
                  className="brightness-0 invert object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-md tracking-tight text-[#1e293b]">KVR Motors</span>
                <span className="text-[10px] font-semibold text-[#94a3b8] -mt-1">ERP System</span>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-6">
              <div>
                <span className="px-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-3">Menu</span>
                <nav className="space-y-1">
                  {sidebarLinks.slice(0, 5).map((link, idx) => (
                    <button
                      key={idx}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        link.active
                          ? "bg-[#fa541c] text-white shadow-lg shadow-[#fa541c]/25"
                          : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className={`h-4.5 w-4.5 ${link.active ? "text-white" : "text-[#94a3b8]"}`} />
                        <span>{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${link.active ? "bg-white/20 text-white" : "bg-[#fee2e2] text-[#ef4444]"}`}>
                          {link.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <span className="px-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block mb-3">Modules</span>
                <nav className="space-y-1">
                  {sidebarLinks.slice(5).map((link, idx) => (
                    <button
                      key={idx}
                      className="flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-all"
                    >
                      <link.icon className="h-4.5 w-4.5 text-[#94a3b8]" />
                      <span>{link.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Log out */}
          <div className="pt-4 border-t border-[#f1f5f9]">
            <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-[#ef4444] bg-[#fef2f2] hover:bg-[#fee2e2] transition-colors">
              <LogOut className="h-4.5 w-4.5" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Dashboard Panels Frame */}
        <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
          {/* Top Bar Utilities Header */}
          <header className="h-[80px] border-b border-[#f1f5f9] bg-white px-8 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-extrabold text-[#1e293b]">Users & Roles</h1>
            </div>

            <div className="flex items-center gap-6">
              {/* Search Bar matching mockup with rounded pill design */}
              <div className="relative w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search user, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f1f5f9] border-0 rounded-full pl-10 pr-10 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#fa541c]/20 outline-none placeholder-[#94a3b8] transition-all text-[#1e293b]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded text-[#94a3b8] shadow-sm">K ⌘</span>
              </div>

              {/* Top Icons */}
              <button className="p-2.5 rounded-full hover:bg-[#f1f5f9] text-[#64748b] transition-colors border border-[#f1f5f9]">
                <Bell className="h-4 w-4" />
              </button>
              <button className="p-2.5 rounded-full hover:bg-[#f1f5f9] text-[#64748b] transition-colors border border-[#f1f5f9]">
                <HelpCircle className="h-4 w-4" />
              </button>

              {/* Profile Card Box */}
              <div className="flex items-center gap-3 pl-4 border-l border-[#f1f5f9] cursor-pointer group">
                <div className="h-9 w-9 rounded-full bg-[#ffedd5] flex items-center justify-center font-bold text-xs text-[#fa541c] border border-[#ffdbb5]">
                  AU
                </div>
                <div className="flex flex-col text-left shrink-0">
                  <span className="text-xs font-bold leading-none text-[#1e293b] group-hover:text-[#fa541c] transition-colors">Admin Studio</span>
                  <span className="text-[9px] font-semibold text-[#94a3b8] mt-0.5">Admin</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8]" />
              </div>
            </div>
          </header>

          {/* Central Scrollable Dashboard View */}
          <main className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Top Grid Stat Cards (5 Cards) */}
            <div className="grid grid-cols-5 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white border border-[#f1f5f9] p-5 rounded-[16px] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-tight">{stat.label}</span>
                    <div className="h-7 w-7 rounded-lg bg-[#f8fafc] border border-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
                      <stat.icon className="h-3.5 w-3.5 group-hover:text-[#fa541c] transition-colors" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-[#1e293b] tracking-tight">{stat.count}</span>
                    {stat.trendType !== "neutral" && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        stat.trendType === "success" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                      }`}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  
                  <span className="text-[10px] font-semibold text-[#94a3b8] mt-3 block">{stat.lastMonth}</span>
                </div>
              ))}
            </div>

            {/* Middle Section Dashboard Graphs */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* Daily User Login Activity (Bar Chart) - Column Span 2 */}
              <div className="col-span-2 bg-white border border-[#f1f5f9] p-6 rounded-[20px] shadow-sm relative overflow-hidden flex flex-col justify-between h-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1e293b]">User Logins Activity</h3>
                  <span className="text-xs font-bold text-[#64748b] border border-[#e2e8f0] px-2.5 py-1 rounded-lg bg-[#f8fafc] cursor-pointer hover:bg-gray-50">This Week</span>
                </div>

                <div className="flex-1 relative">
                  {/* Floating tooltip pin card exactly like mockup over Sunday */}
                  <div className="absolute left-[31.5%] top-[10%] z-30 bg-[#fa541c] text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg shadow-[#fa541c]/35 flex flex-col items-center">
                    <span>14 Logins</span>
                    <div className="w-2 h-2 bg-[#fa541c] rotate-45 mt-1 -mb-1"></div>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} barSize={26}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Bar dataKey="logins" fill="#fa541c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Executive Performance Won vs Lost (Grouped Chart) - Column Span 1 */}
              <div className="col-span-1 bg-white border border-[#f1f5f9] p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-[320px]">
                <div className="flex flex-col mb-4">
                  <h3 className="text-sm font-bold text-[#1e293b]">Active Hours Tracker</h3>
                  <span className="text-[10px] font-semibold text-[#94a3b8] mt-0.5">Tracking average role sessions</span>
                </div>

                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleComparisonData} barGap={4}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                      <Bar dataKey="active" fill="#fa541c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="idle" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Section - Core Data Table */}
            <div className="bg-white border border-[#f1f5f9] rounded-[20px] shadow-sm overflow-hidden">
              {/* Card Header Utilities */}
              <div className="p-6 border-b border-[#f1f5f9] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-[#1e293b]">Active User Listings</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-medium outline-none focus:border-[#fa541c]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 border border-[#e2e8f0] px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#64748b] bg-[#f8fafc] hover:bg-gray-50 transition-colors">
                    Sort by
                  </button>
                  <button className="flex items-center gap-1.5 bg-[#fa541c] hover:bg-[#e03e10] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-[#fa541c]/15 transition-all">
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#f1f5f9] text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                      <th className="py-4 px-6 w-12">
                        <input type="checkbox" className="rounded border-gray-300 text-[#fa541c] focus:ring-[#fa541c]" />
                      </th>
                      <th className="py-4 px-6">User ID</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Showroom Location</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-xs text-[#475569] font-medium">
                    {usersData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#f8fafc]/50 transition-colors">
                        <td className="py-4 px-6">
                          <input type="checkbox" className="rounded border-gray-300 text-[#fa541c] focus:ring-[#fa541c]" />
                        </td>
                        <td className="py-4 px-6 text-[#94a3b8] font-semibold">{row.id}</td>
                        <td className="py-4 px-6 text-[#1e293b] font-bold">{row.name}</td>
                        <td className="py-4 px-6 text-[#64748b]">{row.role}</td>
                        <td className="py-4 px-6 text-[#64748b]">{row.location}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === "Active"
                                ? "text-emerald-600 bg-emerald-50/80"
                                : "text-rose-600 bg-rose-50/80"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#94a3b8]">{row.lastLogin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
