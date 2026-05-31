"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: "success" | "danger" | "neutral";
  description?: string;
  icon?: LucideIcon;
  color?: "indigo" | "emerald" | "blue" | "amber" | "rose" | "purple";
  onClick?: () => void;
}

export default function DashboardCard({
  title,
  value,
  trend,
  trendType = "neutral",
  description,
  icon: Icon,
  color = "blue",
  onClick
}: DashboardCardProps) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50 border-indigo-100",
      text: "text-indigo-600",
      pill: "text-indigo-700 bg-indigo-50"
    },
    emerald: {
      bg: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-600",
      pill: "text-emerald-700 bg-emerald-50"
    },
    blue: {
      bg: "bg-blue-50 border-blue-100",
      text: "text-blue-600",
      pill: "text-blue-700 bg-blue-50"
    },
    amber: {
      bg: "bg-amber-50 border-amber-100",
      text: "text-amber-600",
      pill: "text-amber-700 bg-amber-50"
    },
    rose: {
      bg: "bg-rose-50 border-rose-100",
      text: "text-rose-600",
      pill: "text-rose-700 bg-rose-50"
    },
    purple: {
      bg: "bg-purple-50 border-purple-100",
      text: "text-purple-600",
      pill: "text-purple-700 bg-purple-50"
    }
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      className={`bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${onClick ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#04a700]/40" : ""}`}
    >
      {/* Absolute top brand accent highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500/10 via-[#04a700]/70 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100/80 ${scheme.text} group-hover:bg-[#04a700]/10 group-hover:border-[#04a700]/25 transition-all duration-300 group-hover:scale-105`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-extrabold text-slate-800 tracking-tight font-sans">{value}</span>
        {trend && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black ${
            trendType === "success" 
              ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20" 
              : trendType === "danger" 
              ? "text-rose-700 bg-rose-500/10 border border-rose-500/20" 
              : "text-slate-700 bg-slate-500/10 border border-slate-500/20"
          }`}>
            {trend}
          </span>
        )}
      </div>

      {description && (
        <span className="text-[10px] font-bold text-slate-400/80 mt-2.5 block">{description}</span>
      )}

      {onClick && (
        <span className="absolute bottom-3 right-4 text-[10px] font-black text-[#04a700] opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
          View →
        </span>
      )}
    </div>
  );
}
