"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md"
}: ModalProps) {
  // Keep the panel mounted through the slide-out animation before unmounting.
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  // Open/close lifecycle. All state updates run inside rAF / timeout callbacks
  // (never synchronously in the effect body) to avoid cascading renders.
  useEffect(() => {
    if (isOpen) {
      let innerRaf = 0;
      const raf = requestAnimationFrame(() => {
        setIsRendered(true);
        innerRaf = requestAnimationFrame(() => setIsAnimating(true));
      });
      return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(innerRaf);
      };
    }
    // Closing: play the slide-out, then unmount after the transition ends.
    const raf = requestAnimationFrame(() => setIsAnimating(false));
    const timer = setTimeout(() => setIsRendered(false), 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Lock background scroll while the panel is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key for accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const widthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-2xl"
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Right-side Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 h-full w-full ${widthClass} bg-white shadow-2xl shadow-slate-900/20 border-l border-slate-200 flex flex-col sm:rounded-l-3xl overflow-hidden transition-transform duration-300 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with brand accent */}
        <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-gradient-to-b from-[#04a700] to-emerald-600" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#04a700]">KVR Motors</span>
            <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-600 leading-normal slim-scrollbar smooth-scroll">
          {children}
        </div>
      </div>
    </div>
  );
}
