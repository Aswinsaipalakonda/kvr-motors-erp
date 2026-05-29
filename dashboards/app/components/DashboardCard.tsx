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
}

export default function DashboardCard({
  title,
  value,
  trend,
  trendType = "neutral",
  description,
  icon: Icon,
  color = "blue"
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
    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`h-8 w-8 rounded-lg border border-slate-100 flex items-center justify-center bg-slate-50 ${scheme.text} group-hover:scale-110 transition-transform`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-800 tracking-tight">{value}</span>
        {trend && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
            trendType === "success" 
              ? "text-emerald-700 bg-emerald-50 border border-emerald-100" 
              : trendType === "danger" 
              ? "text-rose-700 bg-rose-50 border border-rose-100" 
              : "text-slate-700 bg-slate-50 border border-slate-100"
          }`}>
            {trend}
          </span>
        )}
      </div>

      {description && (
        <span className="text-[10px] font-medium text-slate-400 mt-2 block">{description}</span>
      )}
    </div>
  );
}
