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
  Database,
  Smartphone,
  Cpu
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
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-between font-sans antialiased text-slate-300 selection:bg-emerald-500/20 selection:text-white relative overflow-hidden">
      
      {/* Background Soft Glow Spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-25%] left-[-10%] w-[70%] h-[70%] bg-[#04a700]/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[65%] h-[65%] bg-teal-500/8 rounded-full blur-[160px]" />
      </div>

      {/* Header (Opulea Style) */}
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
        
        {/* Navigation center links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#portals" className="hover:text-white transition-colors">Portals</a>
          <a href="#statistics" className="hover:text-white transition-colors">Statistics</a>
          <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white transition-all">
            Login
          </Link>
          <Link href="/login" className="text-xs font-black text-white bg-gradient-to-r from-[#04a700] to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 px-5 py-2.5 rounded-full shadow-lg shadow-[#04a700]/20 hover:scale-[1.03] transition-all duration-200">
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* Main Content containing Hero */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col justify-center relative z-10">
        
        {/* 1. Hero Section (Opulea Layout replica) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-28">
          
          {/* Hero Left Column */}
          <div className="lg:col-span-7 text-left space-y-6">
            <span className="inline-block text-[10px] font-extrabold tracking-widest text-[#04a700] uppercase bg-[#04a700]/10 px-3 py-1.5 rounded-full">
              ALL-IN-ONE AUTOMOTIVE ERP PLATFORM
            </span>
            
            <h1 className="text-5xl sm:text-7xl font-serif font-normal text-white tracking-tight leading-tight">
              Run Dealerships.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">Brilliantly.</span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-medium">
              KVR Motors is the ultimate operating system for modern automotive enterprises. Effortlessly manage stock, streamline inter-branch transfers, automate battery registries, and coordinate sales workflows—all from one beautifully intuitive platform engineered for growth.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link href="/login" className="py-3 px-8 bg-gradient-to-r from-[#04a700] to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-bold text-xs rounded-full shadow-lg shadow-[#04a700]/25 transition-all cursor-pointer hover:scale-[1.02]">
                Start Free Trial
              </Link>
              <Link href="/login" className="py-3 px-8 border border-white/10 hover:border-[#04a700]/40 text-white hover:bg-white/5 font-bold text-xs rounded-full transition-all cursor-pointer">
                Book a Demo
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-semibold select-none">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#04a700]" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#04a700]" /> Free 14-Day Trial
              </span>
            </div>
          </div>

          {/* Hero Right Column (Scooter + Stats Card Overlap) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Ambient Circular Glow behind the bike */}
            <div className="absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] bg-emerald-500/10 rounded-full blur-2xl z-0" />
            <div className="absolute w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] bg-slate-900 border border-emerald-500/20 rounded-full z-0" />

            {/* Scooter Image */}
            <div className="relative z-10 w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] hover:scale-[1.02] transition-transform duration-500">
              <Image
                src="/hero-scooter.png"
                alt="Premium Scooter Hero"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Opulea style Overview Stats Card Overlap */}
            <div className="absolute -bottom-6 right-0 sm:right-[-20px] z-25 bg-[#090d16]/80 border border-white/10 backdrop-blur-md p-5 rounded-2xl w-64 shadow-xl select-none">
              <h4 className="text-xs font-black text-white mb-3 tracking-wide border-b border-white/5 pb-2">Today&apos;s Overview</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Active Bookings</span>
                    <span className="text-sm font-black text-white font-mono">142</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#04a700]">+18%</span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">Total Revenue</span>
                    <span className="text-sm font-black text-white font-mono">₹48,92,000</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#04a700]">+25%</span>
                </div>

                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase">New Leads</span>
                    <span className="text-sm font-black text-white font-mono">36</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-extrabold text-[#04a700]">+14%</span>
                    {/* Wavy line mini graph */}
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-1 h-1 bg-[#04a700] rounded-full" />
                      <div className="w-1 h-1.5 bg-[#04a700] rounded-full" />
                      <div className="w-1 h-2 bg-[#04a700] rounded-full" />
                      <div className="w-1 h-1 bg-[#04a700] rounded-full" />
                      <div className="w-1 h-2.5 bg-[#04a700] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 2. Portal Hub Section */}
        <div id="portals" className="mb-28 scroll-mt-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">Access Your ERP Hub</h2>
            <p className="text-sm text-slate-400 font-semibold max-w-xl mx-auto leading-relaxed">
              Authenticate via your specific business terminal deck below to manage operational workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portals.map((portal, idx) => {
              const PortalIcon = portal.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-white/[0.01] border ${portal.borderColor} rounded-3xl p-7 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:${portal.glowColor} hover:scale-[1.01] transition-all duration-300 group h-124`}
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
        </div>

        {/* 3. Bento Features Section */}
        <div id="features" className="mb-28 scroll-mt-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">Engineered for Performance</h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Designed with enterprise business logic to handle bulk distribution pipelines with zero latency.
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

        {/* 4. Statistics Panel */}
        <div id="statistics" className="scroll-mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/[0.01] border border-white/5 rounded-3xl max-w-5xl mx-auto text-center backdrop-blur-sm">
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
