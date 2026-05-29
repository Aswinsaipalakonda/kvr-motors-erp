"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "No data found",
  description = "There are no records matching your query.",
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl select-none">
      <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-normal">{description}</p>
      {action}
    </div>
  );
}
