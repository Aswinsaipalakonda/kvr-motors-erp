"use client";

import React from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface TableProps {
  title?: string;
  headers: React.ReactNode[];
  children: React.ReactNode;
  searchPlaceholder?: string;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  actions?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function Table({
  title,
  headers,
  children,
  searchPlaceholder = "Filter records...",
  searchQuery = "",
  setSearchQuery,
  actions,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: TableProps) {
  return (
    <div className="bg-white border border-emerald-100/60 rounded-2xl shadow-sm shadow-emerald-950/4 overflow-hidden flex flex-col">
      {/* Table Header Utilities */}
      {(title || setSearchQuery || actions) && (
        <div className="p-5 border-b border-emerald-100/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#E8F1EC]/20">
          <div className="flex flex-wrap items-center gap-3">
            {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
            
            {setSearchQuery && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-emerald-100 rounded-lg pl-9 pr-3 py-1.5 text-xs font-semibold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 w-44 sm:w-56"
                />
              </div>
            )}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-[#E8F1EC] border-b border-emerald-100/50 text-[10px] font-bold text-emerald-950 uppercase tracking-wider">
              {headers.map((header, idx) => (
                <th key={idx} className="py-3.5 px-5">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50 text-xs text-slate-650 font-medium">
            {children}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="p-4 border-t border-emerald-100/40 flex items-center justify-between bg-[#E8F1EC]/10 text-xs select-none">
          <span className="text-slate-500 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-emerald-100/60 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-650 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-emerald-100/60 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-650 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
