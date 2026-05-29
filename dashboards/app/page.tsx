"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Building2, 
  Car, 
  Boxes, 
  ShoppingBag, 
  CreditCard, 
  Compass, 
  Battery, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";

export default function Home() {
  const portals = [
    {
      title: "Owner Analytics Portal",
      role: "owner",
      path: "/owner",
      gradient: "from-emerald-500 to-teal-600",
      accentColor: "emerald",
      bgLight: "bg-emerald-50/40",
      borderLight: "border-emerald-100",
      icon: ShieldCheck,
      description: "Complete strategic oversight and high-level branch statistics.",
      features: [
        { label: "Consolidated P&L & targets", icon: TrendingUp },
        { label: "Multi-outlet branches registry", icon: Building2 },
        { label: "Master purchase orders control", icon: ShoppingBag },
        { label: "Comprehensive user access controls", icon: Layers }
      ],
      actionText: "Enter Portal"
    },
    {
      title: "Supervisor Control Panel",
      role: "supervisor",
      path: "/supervisor",
      gradient: "from-blue-500 to-indigo-600",
      accentColor: "indigo",
      bgLight: "bg-indigo-50/40",
      borderLight: "border-indigo-100",
      icon: Activity,
      description: "Live warehouse allocations, stock management, and lock overrides.",
      features: [
        { label: "Real-time stock inflows & dispatches", icon: Boxes },
        { label: "Pre-Delivery Inspection (PDI) passes", icon: Car },
        { label: "Battery FIFO lock authorization overrides", icon: Battery },
        { label: "Inter-branch transfer requests queue", icon: ArrowRight }
      ],
      actionText: "Launch Panel"
    },
    {
      title: "Sales Executive Terminal",
      role: "sales",
      path: "/sales",
      gradient: "from-teal-500 to-cyan-600",
      accentColor: "teal",
      bgLight: "bg-teal-50/40",
      borderLight: "border-teal-100",
      icon: Compass,
      description: "Personalized leads CRM, booking receipt generation, and customer care.",
      features: [
        { label: "Active leads pipeline monitoring", icon: Compass },
        { label: "Instant VIN vehicle auto-fill fetcher", icon: Car },
        { label: "Advance booking receipts generator", icon: CreditCard },
        { label: "Follow-up schedules & calendars", icon: ArrowRight }
      ],
      actionText: "Open Terminal"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFDFB] flex flex-col justify-between font-sans antialiased text-slate-800 selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* Background soft gradients for high-end aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-100/30 rounded-full blur-[120px]" />
      </div>

      {/* Header Container */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-emerald-100/30 relative z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 bg-white rounded-xl p-1.5 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-950/4">
            <Image
              src="/logo.png"
              alt="KVR Motors Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-base tracking-tight text-emerald-950 uppercase leading-none">KVR Motors</span>
            <span className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Enterprise Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All Systems Operational</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-800 animate-bounce">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to KVR Motors ERP Dashboards
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight select-none">
            Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">Dashboard Portal</span> Hub
          </h1>
          
          <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Select your enterprise role below to access dedicated live metrics, automated battery registries, leads CRM pipelines, and operations monitors.
          </p>
        </div>

        {/* Portals Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portals.map((portal, idx) => {
            const PortalIcon = portal.icon;
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group h-120"
              >
                <div>
                  {/* Header part inside card */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Terminal {idx + 1}
                    </span>
                    <div className={`h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-650 group-hover:scale-115 transition-transform`}>
                      <PortalIcon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-950 transition-colors">
                      {portal.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 leading-normal">
                      {portal.description}
                    </p>
                  </div>

                  {/* Features list bullet layout */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block text-left">
                      Included Modules
                    </span>
                    <ul className="space-y-2.5">
                      {portal.features.map((feature, fIdx) => {
                        const FeatIcon = feature.icon;
                        return (
                          <li key={fIdx} className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                            <FeatIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span>{feature.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Card Action Link */}
                <Link href={portal.path} className="block mt-8">
                  <div className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${portal.gradient} text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/5 group-hover:shadow-lg transition-all cursor-pointer`}>
                    <span>{portal.actionText}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>

              </div>
            );
          })}
        </div>

        {/* Quick Help / Bottom Banner */}
        <div className="mt-16 bg-white border border-emerald-100/60 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto select-none">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Secure Live Connection Established</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">All dashboard interfaces utilize direct mock stores simulating branch data registers.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50">
            Node: LIVE_SERVER_VIZAG_MAIN
          </span>
        </div>

      </main>

      {/* Footer Container */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-emerald-100/30 text-center text-[10px] font-bold text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10">
        <span>© 2026 KVR Motors ERP Systems. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-slate-650 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-650 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-650 transition-colors">Supervisor Overrides Support</a>
        </div>
      </footer>

    </div>
  );
}
