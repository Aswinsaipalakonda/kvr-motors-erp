"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, Building, Phone, Calendar, BadgeCheck, LogOut } from "lucide-react";

export default function ProfileView() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400">
        No active profile session.
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    owner: "Owner Portal",
    supervisor: "Supervisor Panel",
    sales_executive: "Sales Executive Terminal",
    sales: "Sales Executive Terminal",
    telecaller: "Telecaller Desk Desk",
    admin: "Administrator Portal"
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider">My User Profile</h2>
        <p className="text-xs text-slate-400 font-bold mt-0.5">Manage and inspect your ERP terminal credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center text-3xl font-black uppercase">
            {getInitials(user.full_name || user.username)}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 leading-tight">{user.full_name || "Enterprise User"}</h3>
            <span className="text-[10px] font-extrabold text-[#04a700] bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mt-2 inline-block uppercase tracking-wider">
              {user.role?.replace("_", " ")}
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 leading-normal">
            Terminal status active. Authenticated via secure OAuth token flow.
          </p>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        {/* Right Side: Details Form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-[#04a700]" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Terminal Access Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-600">
            {/* Full Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Full Name
              </span>
              <span className="block font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5">
                {user.full_name || "—"}
              </span>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Username
              </span>
              <span className="block font-mono font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5">
                {user.username}
              </span>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </span>
              <span className="block font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5 truncate">
                {user.email || "N/A"}
              </span>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </span>
              <span className="block font-mono font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5">
                {user.phone_number || "—"}
              </span>
            </div>

            {/* Role Assignment */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Authorization Scope
              </span>
              <span className="block font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5 capitalize">
                {roleLabels[user.role] || user.role}
              </span>
            </div>

            {/* Branch Assignment */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> Assigned Showroom / Branch
              </span>
              <span className="block font-bold text-slate-800 bg-slate-50 border border-slate-150 rounded-xl p-2.5 truncate">
                {user.showroom || user.branch || "Headquarters"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Session Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
