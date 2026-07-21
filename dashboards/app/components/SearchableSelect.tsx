"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  required = false,
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchLabel = opt.label.toLowerCase().includes(term);
    const matchSub = opt.sublabel ? opt.sublabel.toLowerCase().includes(term) : false;
    return matchLabel || matchSub;
  });

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-slate-50 border ${
          isOpen ? "border-[#04a700] ring-2 ring-[#04a700]/20 bg-white" : "border-slate-200 hover:border-slate-300"
        } rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold transition-all shadow-xs outline-none cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""
        }`}
      >
        <span className={selectedOption ? "text-slate-800 font-extrabold truncate" : "text-slate-400 font-medium truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedOption && (
            <div className="h-4 w-4 rounded-full bg-emerald-100 text-[#04a700] flex items-center justify-center">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#04a700]" : ""}`} />
        </div>
      </button>

      {/* Dropdown Floating Card */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2 bg-slate-50/80 border-b border-slate-150">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-8 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#04a700] focus:ring-1 focus:ring-[#04a700]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching EV models found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50/90 text-[#04a700] font-extrabold"
                        : "hover:bg-slate-50 text-slate-700 font-semibold"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && <span className="text-[10px] text-slate-400 font-normal truncate">{opt.sublabel}</span>}
                    </div>
                    {isSelected && (
                      <div className="h-4 w-4 rounded-full bg-[#04a700] text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
