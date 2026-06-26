"use client";

import React, { useState, useEffect } from "react";
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
  Cpu,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Lock,
  Download
} from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      tagline: "ALL-IN-ONE AUTOMOTIVE ERP PLATFORM",
      headline: "Run Dealerships. Brilliantly.",
      desc: "KVR Motors is the ultimate operating system for modern automotive enterprises. Effortlessly manage stock, streamline inter-branch transfers, automate battery registries, and coordinate sales workflows—all from one beautifully intuitive platform engineered for growth.",
      image: "/hero-scooter.png",
      accentText: "text-[#04a700]",
      accentBg: "bg-[#04a700]/10",
      accentBgHover: "hover:bg-[#04a700]",
      bgColor: "from-[#021805]/95 via-[#070b13]/98 to-[#070b13]",
      overlayColor: "from-[#021805] via-[#021805]/90 to-transparent",
      glowSphere: "bg-emerald-500/10",
      activeDotBg: "bg-[#04a700]",
      widgetTitle: "Today's Overview",
      widgetData: [
        { label: "Active Bookings", val: "142", change: "+18%" },
        { label: "Total Revenue", val: "₹48,92,000", change: "+25%" },
        { label: "New Leads", val: "36", change: "+14%", graph: true }
      ]
    },
    {
      tagline: "FIFO BATTERY REGISTRY",
      headline: "Allocate Stock. Precision.",
      desc: "Intelligent auto-matching algorithms align fresh battery units to sold vehicles on a strict FIFO sequence, protecting battery lifespans, optimizing warranties, and preventing manual allocation override delays.",
      image: "/hero-battery.png",
      accentText: "text-blue-400",
      accentBg: "bg-blue-500/10",
      accentBgHover: "hover:bg-blue-600",
      bgColor: "from-[#03153c]/95 via-[#070b13]/98 to-[#070b13]",
      overlayColor: "from-[#03153c] via-[#03153c]/90 to-transparent",
      glowSphere: "bg-blue-500/10",
      activeDotBg: "bg-blue-400",
      widgetTitle: "FIFO Allocation Stats",
      widgetData: [
        { label: "Queue Match Rate", val: "98.4%", change: "+2.1%" },
        { label: "Pending Deliveries", val: "12 Units", change: "Queued" },
        { label: "Active Overrides", val: "4 Orders", change: "Secure", graph: true }
      ]
    },
    {
      tagline: "MULTI-BRANCH SYNCHRONIZATION",
      headline: "Manage Networks. Instantly.",
      desc: "Consolidated transaction ledger records sales invoices, Supplier POs, cash inflows, and inter-branch vehicles transfer requests across Visakhapatnam, Srikakulam & Kakinada branches in real time.",
      image: "/hero-showroom.png",
      accentText: "text-teal-400",
      accentBg: "bg-teal-500/10",
      accentBgHover: "hover:bg-teal-600",
      bgColor: "from-[#081e24]/95 via-[#070b13]/98 to-[#070b13]",
      overlayColor: "from-[#081e24] via-[#081e24]/90 to-transparent",
      glowSphere: "bg-teal-500/10",
      activeDotBg: "bg-teal-400",
      widgetTitle: "Live Branch Ledger",
      widgetData: [
        { label: "Visakhapatnam", val: "₹14,20,000", change: "+16%" },
        { label: "Srikakulam", val: "₹8,90,000", change: "+12%" },
        { label: "Kakinada", val: "₹11,50,000", change: "+20%", graph: true }
      ]
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

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

      {/* Header */}
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
          <a href="#mobile-app" className="hover:text-white transition-colors">Mobile App</a>
          <a href="#branches" className="hover:text-white transition-colors">Showrooms</a>
          <a href="#statistics" className="hover:text-white transition-colors">Statistics</a>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs font-black text-white bg-gradient-to-r from-[#04a700] to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 px-6 py-3 rounded-full shadow-lg shadow-[#04a700]/25 hover:scale-[1.03] transition-all duration-200">
            Sign In to ERP
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center relative z-10">
        
        {/* 1. Slideshow Hero Section */}
        <div className="relative h-[650px] sm:h-[580px] lg:h-[520px] w-full mb-16 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-[#070b13] select-none group">
          
          {/* Active background gradient wrapper that transitions */}
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={`bg-${idx}`}
                className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-0" : "opacity-0 z-0"
                }`}
              />
            );
          })}

          {/* Active slide content */}
          {slides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div 
                key={idx}
                className={`absolute inset-0 flex items-center transition-all duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                
                {/* Large Background Image on the Right */}
                <div 
                  className={`absolute right-0 top-0 bottom-0 h-full w-full lg:w-[55%] transition-all duration-1000 ease-out transform ${
                    isActive ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-105 translate-x-4"
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={slide.headline}
                    fill
                    className="object-cover object-center lg:object-right-top"
                    priority
                  />
                  
                  {/* Gradient mask to blend image into the slide's custom gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r ${slide.overlayColor} z-10`} />
                </div>

                {/* Ambient glow sphere behind the text (changes per slide) */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${slide.glowSphere} ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} />

                {/* Left Column (Text & CTAs) */}
                <div className="relative z-20 w-full lg:w-[55%] px-6 sm:px-12 py-10 lg:p-14 flex flex-col justify-center text-left space-y-6">
                  
                  {/* Tagline */}
                  <div className={`transition-all duration-700 ease-out transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                    <span className={`inline-block text-[10px] font-extrabold tracking-widest ${slide.accentText} ${slide.accentBg} px-3.5 py-1.5 rounded-full border border-white/5`}>
                      {slide.tagline}
                    </span>
                  </div>
                  
                  {/* Headline */}
                  <div className={`transition-all duration-750 ease-out delay-100 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-serif font-normal text-white tracking-tight leading-tight">
                      {slide.headline.split(".")[0]}.<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                        {slide.headline.split(".")[1]}.
                      </span>
                    </h1>
                  </div>
                  
                  {/* Description */}
                  <div className={`transition-all duration-750 ease-out delay-200 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg font-medium">
                      {slide.desc}
                    </p>
                  </div>

                  {/* CTAs */}
                  <div className={`pt-2 flex flex-wrap gap-4 transition-all duration-750 ease-out delay-300 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <Link href="/login" className="py-3 px-8 bg-gradient-to-r from-[#04a700] to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-full shadow-lg shadow-[#04a700]/25 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-[#04a700]/35">
                      Enter Platform
                    </Link>
                  </div>

                  {/* Checklist */}
                  <div className={`pt-2 flex items-center gap-6 text-[10px] text-slate-500 font-semibold select-none transition-all duration-750 ease-out delay-300 transform ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#04a700]" /> Secure Enterprise Gateway
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#04a700]" /> Multi-Branch Sync
                    </span>
                  </div>
                </div>

                {/* Overlaid stats card widget (floats on the right, overlaid on top of image) */}
                <div 
                  className={`absolute bottom-8 right-8 lg:bottom-12 lg:right-12 z-20 transition-all duration-700 ease-out delay-500 transform hidden sm:block ${
                    isActive ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-8 scale-95"
                  }`}
                >
                  <div className="bg-[#090d16]/75 border border-white/10 backdrop-blur-xl p-5 rounded-2xl w-64 shadow-2xl shadow-black/60">
                    <h4 className="text-xs font-black text-white mb-3 tracking-wide border-b border-white/5 pb-2">
                      {slide.widgetTitle}
                    </h4>
                    
                    <div className="space-y-4">
                      {slide.widgetData.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-end">
                          <div className="text-left">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase">{item.label}</span>
                            <span className="text-sm font-black text-white font-mono">{item.val}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-extrabold ${item.change.startsWith("+") ? "text-[#04a700]" : "text-blue-400"}`}>
                              {item.change}
                            </span>
                            {item.graph && (
                              <div className="flex items-end gap-0.5 h-3">
                                <div className="w-1 h-1 bg-[#04a700] rounded-full" />
                                <div className="w-1 h-1.5 bg-[#04a700] rounded-full" />
                                <div className="w-1 h-2 bg-[#04a700] rounded-full" />
                                <div className="w-1 h-1 bg-[#04a700] rounded-full" />
                                <div className="w-1 h-2.5 bg-[#04a700] rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

          {/* Left/Right manual arrow buttons overlaid on the slide edges */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#090d16]/60 backdrop-blur-md text-white hover:bg-[#04a700] hover:border-transparent transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#090d16]/60 backdrop-blur-md text-white hover:bg-[#04a700] hover:border-transparent transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

        </div>

        {/* Manual Slideshow navigation indicators */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-28 select-none relative z-20">
          <button 
            onClick={handlePrev}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 ${slides[currentSlide].accentBgHover} hover:border-transparent text-white transition-all cursor-pointer`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? `w-6 ${slides[currentSlide].activeDotBg}` : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 ${slides[currentSlide].accentBgHover} hover:border-transparent text-white transition-all cursor-pointer`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Bento Features Section */}
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

        {/* 3. Mobile App Showcase Section (Mirrors Image 2 Layout) */}
        <div id="mobile-app" className="mb-28 scroll-mt-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] py-16 px-8 sm:px-12 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-[#04a700]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">
              Delight your team with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-450 to-teal-400 font-bold">premium app</span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold max-w-2xl mx-auto leading-relaxed">
              Empower your field workforce with our beautiful mobile app. Track attendance with GPS verification, verify vehicles, perform Pre-Delivery Inspections, and manage leads all in one place.
            </p>
          </div>

          {/* Mobile phone mockups side-by-side (iPhone 15 dynamic island style) */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20 max-w-4xl mx-auto mb-16">
            
            {/* Phone Mockup 1 */}
            <div className="flex flex-col items-center">
              {/* Phone Outer Shell */}
              <div className="relative border-slate-800 bg-slate-900 border-[12px] rounded-[3rem] h-[520px] w-[256px] shadow-2xl shadow-[#04a700]/10 overflow-hidden ring-1 ring-white/10">
                {/* Speaker Ear Piece */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-900 rounded-full" />
                </div>
                {/* Screen Content Wrapper */}
                <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-[#090d16] relative">
                  <Image 
                    src="/app-images/1.png" 
                    fill 
                    className="object-cover" 
                    alt="KVR Mobile App Showroom Screen" 
                  />
                </div>
              </div>
              
              {/* Overlaid Pill Button */}
              <div className="mt-6 bg-white text-slate-900 font-extrabold text-xs px-6 py-2.5 rounded-full shadow-lg border border-slate-100 hover:scale-105 transition-all select-none">
                Showroom Operations
              </div>
            </div>

            {/* Phone Mockup 2 */}
            <div className="flex flex-col items-center">
              {/* Phone Outer Shell */}
              <div className="relative border-slate-800 bg-slate-900 border-[12px] rounded-[3rem] h-[520px] w-[256px] shadow-2xl shadow-teal-500/10 overflow-hidden ring-1 ring-white/10">
                {/* Speaker Ear Piece */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-900 rounded-full" />
                </div>
                {/* Screen Content Wrapper */}
                <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-[#090d16] relative">
                  <Image 
                    src="/app-images/3.png" 
                    fill 
                    className="object-cover" 
                    alt="KVR Mobile App Attendance Screen" 
                  />
                </div>
              </div>
              
              {/* Overlaid Pill Button */}
              <div className="mt-6 bg-white text-slate-900 font-extrabold text-xs px-6 py-2.5 rounded-full shadow-lg border border-slate-100 hover:scale-105 transition-all select-none">
                Attendance & GPS
              </div>
            </div>

          </div>

          {/* Three Feature Highlights below phone mockups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <MapPin className="h-5 w-5 text-emerald-450" />
              </div>
              <h4 className="font-bold text-white text-sm">GPS Clock-in Verification</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Geofenced location checks and front-camera verification ensure authentic staff attendance.</p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Smartphone className="h-5 w-5 text-emerald-450" />
              </div>
              <h4 className="font-bold text-white text-sm">PDI Stock Checkups</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Instantly verify chassis VIN barcodes and log vehicle health before dealer dispatch.</p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Compass className="h-5 w-5 text-emerald-450" />
              </div>
              <h4 className="font-bold text-white text-sm">Direct Field CRM</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Track customer conversations, log advance booking payments, and follow up instantly.</p>
            </div>
          </div>
        </div>

        {/* 4. Showroom Branch Outlets Section */}
        <div id="branches" className="mb-28 scroll-mt-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight">Our Showroom Branches</h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Serving our customers across multiple modern state-of-the-art showrooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-slate-900/60 to-slate-950 border border-white/5 rounded-3xl p-6 hover:border-[#04a700]/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#04a700]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Visakhapatnam</h3>
                  <span className="text-[10px] text-emerald-450 font-bold">Main Headquarters</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Our central operational branch managing administrative actions, master procurement, and wholesale dispatches.
              </p>
            </div>

            <div className="bg-gradient-to-b from-slate-900/60 to-slate-950 border border-white/5 rounded-3xl p-6 hover:border-[#04a700]/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#04a700]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Srikakulam</h3>
                  <span className="text-[10px] text-emerald-450 font-bold">Showroom & Warehouse</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Srikakulam outlet managing retail registrations, local stock, and battery allocations under strict supervisor audit.
              </p>
            </div>

            <div className="bg-gradient-to-b from-slate-900/60 to-slate-950 border border-white/5 rounded-3xl p-6 hover:border-[#04a700]/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#04a700]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Kakinada</h3>
                  <span className="text-[10px] text-emerald-450 font-bold">Distribution Point</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Our regional outlet streamlining dealership transfers and logistics operations across neighboring regions.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Statistics Panel */}
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
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-300 transition-colors">System Support</a>
        </div>
      </footer>

    </div>
  );
}
