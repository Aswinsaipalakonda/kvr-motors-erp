import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  ChevronDown,
  CalendarDays,
  LogOut,
  Building,
  UserCheck,
  Settings,
  X,
  CornerDownLeft,
  Check,
} from "lucide-react";


interface NavbarProps {
  title: string;
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
  activeBranch?: string;
  onBranchChange?: (branch: string) => void;
  activeRange?: string;
  onRangeChange?: (range: string) => void;
  branchesList?: any[];
}

interface SearchModule {
  label: string;
  route: string;
}

// Per-role searchable / navigable modules (mirrors each role's real routes)
const ROLE_MODULES: Record<NavbarProps["role"], SearchModule[]> = {
  owner: [
    { label: "Dashboard", route: "/owner" },
    { label: "Branch & Showrooms", route: "/owner/branches" },
    { label: "Vehicle Management", route: "/owner/vehicles" },
    { label: "Stock (In & Out)", route: "/owner/stock" },
    { label: "Purchase Management", route: "/owner/purchases" },
    { label: "Sales Management", route: "/owner/sales" },
    { label: "Lead Management", route: "/owner/leads" },
    { label: "Advance Bookings", route: "/owner/bookings" },
    { label: "Batteries Management", route: "/owner/batteries" },
    { label: "Ledger Management", route: "/owner/ledger" },
    { label: "Reports & Analytics", route: "/owner/reports" },
    { label: "Users & Roles", route: "/owner/users" },
  ],
  supervisor: [
    { label: "Dashboard", route: "/supervisor" },
    { label: "Vehicle Management", route: "/supervisor/vehicles" },
    { label: "Stock (In & Out)", route: "/supervisor/stock" },
    { label: "Sales", route: "/supervisor/sales" },
    { label: "Leads", route: "/supervisor/leads" },
    { label: "Bookings", route: "/supervisor/bookings" },
    { label: "Batteries", route: "/supervisor/batteries" },
    { label: "Reports", route: "/supervisor/reports" },
  ],
  sales: [
    { label: "Dashboard", route: "/sales" },
    { label: "Leads", route: "/sales/leads" },
    { label: "Follow-ups", route: "/sales/followups" },
    { label: "Customers", route: "/sales/customers" },
    { label: "Bookings", route: "/sales/bookings" },
    { label: "Reports", route: "/sales/reports" },
  ],
  telecaller: [
    { label: "Dashboard", route: "/telecaller" },
    { label: "Leads", route: "/telecaller/leads" },
  ],
  staff: [
    { label: "Dashboard", route: "/staff" },
    { label: "Inventory & Shipments", route: "/staff/inventory" },
    { label: "Battery Registry", route: "/staff/batteries" },
    { label: "PDI & Handovers", route: "/staff/pdi" },
    { label: "Daily Check-in", route: "/staff/attendance" },
    { label: "My Profile", route: "/staff/profile" },
  ],
};

const getDefaultRangeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[now.getMonth()];
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return `01 ${monthName} ${year} - ${String(lastDay).padStart(2, "0")} ${monthName} ${year}`;
};

const DATE_RANGES = [
  getDefaultRangeString(),
  "Today",
  "Last 7 Days",
  "This Month",
  "Last Month",
  "This Quarter",
  "This Year",
];

export default function Navbar({ 
  title, 
  role, 
  activeBranch: activeBranchProp, 
  onBranchChange, 
  activeRange: activeRangeProp,
  onRangeChange,
  branchesList = []
}: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [localActiveBranch, setLocalActiveBranch] = useState(user?.branch || "All Branches");
  const activeBranch = activeBranchProp !== undefined ? activeBranchProp : localActiveBranch;
  const handleBranchSelect = (branch: string) => {
    if (onBranchChange) {
      onBranchChange(branch);
    } else {
      setLocalActiveBranch(branch);
    }
    setShowBranchDropdown(false);
  };

  const [localActiveRange, setLocalActiveRange] = useState(DATE_RANGES[0]);
  const activeRange = activeRangeProp !== undefined ? activeRangeProp : localActiveRange;
  const handleRangeSelect = (range: string) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setLocalActiveRange(range);
    }
    setShowDateDropdown(false);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const headerRef = useRef<HTMLElement>(null);

  const branches = useMemo(() => {
    if (branchesList && branchesList.length > 0) {
      return ["All Branches", ...branchesList.map((b) => b.name)];
    }
    return ["All Branches"];
  }, [branchesList]);

  const modules = ROLE_MODULES[role];

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return modules.filter((m) => m.label.toLowerCase().includes(q));
  }, [searchQuery, modules]);

  const closeAll = () => {
    setShowProfileDropdown(false);
    setShowBranchDropdown(false);
    setShowDateDropdown(false);
    setShowSearchResults(false);
  };


  // Close every dropdown when clicking outside the header
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (route: string) => {
    closeAll();
    setSearchQuery("");
    router.push(route);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredModules.length > 0) {
      navigate(filteredModules[0].route);
    }
  };

  const displayName =
    user?.full_name || user?.username || (role === "owner" ? "Ravi Varma" : role === "supervisor" ? "Suresh Babu" : role === "telecaller" ? "Lakshmi Narayana" : "Anil Kumar");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = (user?.role || role).replace(/_/g, " ");

  const goToProfile = () => {
    closeAll();
    router.push(`/${role}/profile`);
  };

  const profileActions = [
    { id: "profile", label: "View Profile", icon: UserCheck, onClick: goToProfile },
    { id: "logout", label: "Logout", icon: LogOut, onClick: () => logout() },
  ];

  return (
    <header
      ref={headerRef}
      className="h-20 bg-[#E8F1EC] border-b border-emerald-100/50 px-4 sm:px-6 flex items-center justify-between gap-2 shrink-0 select-none z-30 relative"
    >
      {/* Title & Section Label (offset on mobile to clear the floating hamburger) */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0 min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
          {role === "owner" ? title : (user?.showroom || "KVR Showroom - Visakhapatnam")}
        </h1>
      </div>

      {/* Utilities Container */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 shrink-0">

        {/* Search Bar — shown ONLY for owner and supervisor */}
        {(role === "owner" || role === "supervisor") && (
          <div className="relative hidden xs:block w-36 sm:w-60 md:w-80">
          <form onSubmit={handleSearchSubmit}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                setShowSearchResults(true);
                setShowProfileDropdown(false);
                setShowBranchDropdown(false);
                setShowDateDropdown(false);
              }}
              placeholder="Search modules..."
              className="w-full bg-white border border-emerald-150 rounded-full pl-10 pr-9 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none placeholder-slate-400 transition-all text-slate-750"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {showSearchResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-emerald-100 bg-white p-1.5 shadow-xl">
              {filteredModules.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Jump to</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <CornerDownLeft className="h-3 w-3" /> enter
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredModules.map((m) => (
                      <button
                        key={m.route}
                        onClick={() => navigate(m.route)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-left text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-700 font-semibold transition-colors"
                      >
                        <Search className="h-3.5 w-3.5 text-slate-300" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-3 py-4 text-center text-xs font-semibold text-slate-400">
                  No module matches &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* Date Range Selector — working preset dropdown */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => {
              setShowDateDropdown(!showDateDropdown);
              setShowBranchDropdown(false);
              setShowProfileDropdown(false);
              setShowSearchResults(false);
            }}
            className="flex items-center gap-2 border border-emerald-100 bg-white hover:bg-emerald-50/50 rounded-lg px-3 py-1.5 text-xs text-slate-650 font-semibold cursor-pointer transition-colors"
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span>{activeRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {showDateDropdown && (
            <div className="absolute right-0 mt-2 z-50 w-56 rounded-lg border border-emerald-100 bg-white p-1.5 shadow-xl">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Reporting Period
              </div>
              {DATE_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    handleRangeSelect(range);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                    activeRange === range ? "bg-slate-50 text-emerald-600 font-bold" : "text-slate-600"
                  }`}
                >
                  {range}
                  {activeRange === range && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch Selector Dropdown (owner only, hidden on small screens) */}
        {role === "owner" && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowBranchDropdown(!showBranchDropdown);
                setShowDateDropdown(false);
                setShowProfileDropdown(false);
                setShowSearchResults(false);
              }}

              className="flex items-center gap-2 border border-emerald-100 bg-white hover:bg-emerald-50/50 rounded-lg px-3 py-1.5 text-xs text-slate-750 font-semibold cursor-pointer transition-colors"
            >
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-30 truncate">{activeBranch}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showBranchDropdown && (
              <div className="absolute right-0 mt-2 z-50 w-64 rounded-lg border border-emerald-100 bg-white p-1.5 shadow-xl">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Branch
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {branches.map((branch, index) => (
                    <button
                      key={index}
                      onClick={() => handleBranchSelect(branch)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs text-left hover:bg-slate-50 transition-colors ${
                        activeBranch === branch ? "bg-slate-50 text-emerald-600 font-bold" : "text-slate-600"
                      }`}
                    >
                      <span className="truncate">{branch}</span>
                      {activeBranch === branch && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile box + dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowBranchDropdown(false);
              setShowDateDropdown(false);
              setShowSearchResults(false);
            }}
            className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-emerald-250/60 cursor-pointer group select-none"
          >

            <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center font-bold text-xs text-emerald-800 border border-emerald-100 uppercase shrink-0 overflow-hidden">
              {user?.avatar_url || (typeof window !== "undefined" && localStorage.getItem("user_avatar")) ? (
                <img src={user?.avatar_url || localStorage.getItem("user_avatar")!} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                initials || "KV"
              )}
            </div>
            <div className="hidden md:flex flex-col text-left shrink-0">
              <span className="text-xs font-bold leading-none text-slate-800 group-hover:text-slate-900 transition-colors">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase">{roleLabel}</span>
            </div>
            <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="px-2.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-sm font-bold text-slate-900">{displayName}</div>
                <div className="text-[11px] text-slate-500 mt-1 capitalize">
                  {roleLabel}
                  {user?.email ? ` • ${user.email}` : ""}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {profileActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
                        item.id === "logout"
                          ? "text-rose-600 hover:bg-rose-50"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${item.id === "logout" ? "text-rose-500" : "text-emerald-600"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
