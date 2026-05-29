"use client";

import React from "react";

interface LoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ message = "Loading data...", size = "md" }: LoaderProps) {
  const spinnerSizeClass = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4"
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className={`animate-spin rounded-full border-slate-200 border-t-blue-600 ${spinnerSizeClass}`} />
      {message && <p className="text-xs font-semibold text-slate-400">{message}</p>}
    </div>
  );
}
