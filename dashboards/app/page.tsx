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
  Layers,
  CheckCircle2,
  Workflow,
  Cpu,
  Database,
  Smartphone,
  Gauge
} from "lucide-react";

export default function Home() {
  const portals = [
    {
      title: "Owner Analytics Portal",
      role: "owner",
      path: "/owner",
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
      glowColor: "shadow-emerald-500/10",
      accentText: "text-[#04a700]",
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
      gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
      borderColor: "border-blue-500/30 hover:border-blue-500/60",
      glowColor: "shadow-blue-500/10",
      accentText: "text-blue-400",
      icon: Activity,
      description: "Live warehouse allocations, stock management, and lock overrides.",
      features: [
        { label: "Real-time stock inflows & dispatches", icon: Boxes },
        { label: "Pre-Delivery Inspection (PDI) passes", icon: Car },
        { label: "Battery lock authorization overrides", icon: Battery },
        { label: "Inter-branch transfer requests queue", icon: ArrowRight }
      ],
      actionText: "Launch Panel"
    },
    {
      title: "Sales Executive Terminal",
      role: "sales",
      path: "/sales",
      gradient: "from-teal-500/20 via-cyan-500/10 to-transparent",
      borderColor: "border-teal-500/30 hover:border-teal-500/60",
      glowColor: "shadow-teal-500/10",
      accentText: "text-teal-400",
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

  const bentoFeatures = [
    {
      title: "FIFO Battery Stock Allocation",
      desc: "Intelligent auto-matching algorithms align fresh battery units to sold vehicles on a strict FIFO sequence.",
      icon: Battery,
      visual: (
        <div className="flex flex-col gap-2 p-3 bg-slate-900/50 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400">
          <div className="flex justify-between items-center border-b border-white/5 pb-1 text-emerald-400">
            <span>UNIT REF</span>
            <span>AGE (DAYS)</span>
            <span>STATUS</span>
          </div>
          <div className="flex justify-between">
            <span>BT-9821</span>
            <span>4 Days</span>
            <span className="text-emerald-500 bg-emerald-500/10 px-1 rounded">MATCHED</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>BT-9833</span>
            <span>12 Days</span>
            <span className="text-amber-500 bg-amber-500/10 px-1 rounded">QUEUED</span>
          </div>
        </div>
      )
    },
    {
      title: "Multi-Branch Ledger Sync",
      desc: "Consolidated transaction ledger records sales invoices, Supplier POs, and cash inflows in real time.",
      icon: Database,
      visual: (
        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/50 rounded-xl border border-white/5 text-center">
          <div className="p-1.5 rounded bg-emerald-500/5 border border-emerald-500/20">
            <span className="block text-[8px] text-slate-500">VIZAG</span>
            <span className="text-xs font-bold text-white">₹14.2L</span>
          </div>
          <div className="p-1.5 rounded bg-blue-500/5 border border-blue-500/20">
            <span className="block text-[8px] text-slate-500">SRIKAKULAM</span>
            <span className="text-xs font-bold text-white">₹8.9L</span>
          </div>
          <div className="p-1.5 rounded bg-teal-500/5 border border-teal-500/20">
            <span className="block text-[8px] text-slate-500">KAKINADA</span>
            <span className="text-xs font-bold text-white">₹11.5L</span>
          </div>
        </div>
      )
    },
    {
      title: "Universal Mobile Companion",
      desc: "Cross-platform mobile application for ground executives to track vehicle delivery & inspections.",
      icon: Smartphone,
      visual: (
        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="h-10 w-6 bg-slate-950 rounded border border-white/10 flex flex-col justify-between p-1 shrink-0">
            <div className="w-full h-0.5 bg-slate-800 rounded-full" />
            <div className="w-full h-4 bg-emerald-500/20 rounded-sm" />
            <div className="h-1 w-1 bg-white rounded-full mx-auto" />
          </div>
          <div className="text-left">
            <span className="block text-[10px] text-white font-bold">PDI Inspection Mode</span>
            <span className="block text-[8px] text-slate-500">Scan VIN Code barcode to verify units</span>
          </div>
        </div>
      )
    },
    {
      title: "Direct API Overrides",
      desc: "Immediate supervisor authorization overrides for battery locks and emergency manual allocations.",
      icon: Cpu,
      visual: (
        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-white/5">
          <span className="text-[10px] font-mono text-[#04a700]">override_lock()</span>
          <span className="text-[9px] font-bold bg-[#04a700]/10 text-[#04a700] border border-[#04a700]/20 px-2 py-0.5 rounded-full">SECURE</span>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-between font-sans antialiased text-slate-300 selection:bg-emerald-500/20 selection:text-white relative overflow-hidden">
      
      {/* SaaS mesh gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-[#04a700]/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Header Container */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 bg-white rounded-xl p-1.5 flex items-center justify-center border border-white/10 shadow-lg">
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
            <span className="font-black text-base tracking-tight text-white uppercase leading-none">KVR Motors</span>
            <span className="text-[9px] font-bold text-[#04a700] uppercase tracking-widest mt-1">Enterprise Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#04a700] animate-ping" />
            <span>ALL SYSTEMS ACTIVE</span>
          </div>
          <Link href="/login" className="text-xs font-bold text-white hover:text-[#04a700] px-4 py-2 rounded-full border border-white/10 hover:border-[#04a700]/30 bg-white/5 transition-all">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col justify-center relative z-10">
        
        {/* Intro and Headline */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-[#04a700]">
            <Sparkles className="h-3.5 w-3.5 text-[#04a700] animate-pulse" /> Unified Dealership Command Center
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Automate and Scale Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#04a700] to-teal-400">Automotive Enterprise</span>
          </h1>
          
          <p className="text-sm sm:text-base font-medium text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The multi-branch operational control deck for inventory tracking, CRM lead pipelines, sales receipts ledger, and automated battery allocation.
          </p>

          <div className="pt-4 flex justify-center gap-4">
            <Link href="/login" className="py-3 px-6 rounded-full bg-gradient-to-r from-[#04a700] to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-[#04a700]/20 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 group">
              <span>Launch Cloud Hub</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Portals Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {portals.map((portal, idx) => {
            const PortalIcon = portal.icon;
            return (
              <div 
                key={idx} 
                className={`bg-white/[0.02] backdrop-blur-md border ${portal.borderColor} rounded-3xl p-7 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:${portal.glowColor} hover:scale-[1.01] transition-all duration-300 group h-124`}
              >
                <div>
                  {/* Top Header inside Card */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Terminal 0{idx + 1}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <PortalIcon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-[#04a700] transition-colors">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {portal.description}
                    </p>
                  </div>

                  {/* Feature Bullets */}
                  <div className="space-y-3.5 pt-5 border-t border-white/5">
                    <span className="text-[9px] font-extrabold text-[#04a700] uppercase tracking-wider block text-left">
                      Core Modules
                    </span>
                    <ul className="space-y-2.5">
                      {portal.features.map((feature, fIdx) => {
                        const FeatIcon = feature.icon;
                        return (
                          <li key={fIdx} className="flex items-center gap-2.5 text-[11px] font-bold text-slate-300">
                            <FeatIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>{feature.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Direct Action Link */}
                <Link href={portal.path} className="block mt-8">
                  <div className={`w-full py-3 rounded-2xl bg-white/5 hover:bg-[#04a700] border border-white/10 hover:border-transparent text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer`}>
                    <span>{portal.actionText}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

              </div>
            );
          })}
        </div>

        {/* Bento SaaS Features Showcase */}
        <div className="mb-24 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Built for Enterprise Performance</h2>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              Engineered with advanced business logic to handle bulk distribution pipelines with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bentoFeatures.map((feat, fIdx) => {
              const Icon = feat.icon;
              return (
                <div key={fIdx} className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all">
                  <div>
                    <div className="h-8 w-8 rounded-lg bg-[#04a700]/10 border border-[#04a700]/20 flex items-center justify-center text-[#04a700] mb-4">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-6 font-medium">{feat.desc}</p>
                  </div>
                  <div>
                    {feat.visual}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Stats Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/[0.01] border border-white/5 rounded-3xl max-w-5xl mx-auto text-center backdrop-blur-sm">
          <div className="space-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-white font-mono">3</span>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Outlets</span>
          </div>
          <div className="space-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-white font-mono">10K+</span>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Units Tracked</span>
          </div>
          <div className="space-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-white font-mono">99.9%</span>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Uptime SLA</span>
          </div>
          <div className="space-y-1">
            <span className="block text-2xl sm:text-3xl font-black text-white font-mono">256-bit</span>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Encryption</span>
          </div>
        </div>

      </main>

      {/* Footer Container */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 text-center text-[10px] font-bold text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
        <span>© 2026 KVR Motors ERP Systems. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-350 transition-colors">System Support overrides</a>
        </div>
      </footer>

    </div>
  );
}
