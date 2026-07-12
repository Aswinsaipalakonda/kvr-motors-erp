"use client";
import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "success", duration = 3500, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 350);
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [duration, onClose]);

  const iconMap = {
    success: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colorMap = {
    success: "bg-emerald-600 text-white shadow-emerald-500/30",
    error: "bg-rose-600 text-white shadow-rose-500/30",
    warning: "bg-amber-500 text-white shadow-amber-400/30",
    info: "bg-blue-600 text-white shadow-blue-500/30",
  };

  return (
    <div
      className="fixed top-6 right-6 z-[99999] pointer-events-auto"
      style={{
        transform: isVisible && !isExiting ? "translateX(0)" : "translateX(120%)",
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl ${colorMap[type]} min-w-[280px] max-w-[420px]`}
        style={{ backdropFilter: "blur(12px)" }}
      >
        {iconMap[type]}
        <span className="text-[13px] font-bold leading-snug flex-1">{message}</span>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 350);
          }}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
