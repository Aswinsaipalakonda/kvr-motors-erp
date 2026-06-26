"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";

function LoginForm() {
  const { login, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fromPath = searchParams.get("from");
    if (fromPath) {
      setErrorMsg("Please authenticate to access the requested system portal.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both your username and password.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-650 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 pl-2">
          Username or Email
        </label>
        <div className="relative rounded-full shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            name="username"
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full pl-12 pr-5 py-4 border border-slate-200 rounded-full text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50 transition-all duration-200 text-slate-800"
            placeholder="Enter your username"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex justify-between items-center mb-2 pl-2">
          <label htmlFor="password" className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Password
          </label>
        </div>
        <div className="relative rounded-full shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-full text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-650 bg-slate-50/50 transition-all duration-200 text-slate-800"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold px-2">
        <label className="flex items-center text-slate-500 cursor-pointer">
          <input type="checkbox" className="mr-2 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
          Remember me
        </label>
      </div>

      {/* CTA Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-full shadow-lg shadow-emerald-700/10 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-705 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 transition-all duration-300 group cursor-pointer"
        >
          {(isSubmitting || authLoading) ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-900 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans antialiased bg-slate-950 overflow-x-hidden">
      
      {/* Left Section - Hero banner (visible on desktop) */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-8/12 text-white p-16 flex-col justify-between relative overflow-hidden bg-slate-950">
        
        {/* Background Image Layer with low opacity for high contrast */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/ev_showroom_login_hero.png"
            alt="EV Showroom background"
            fill
            priority
            className="object-cover opacity-45 mix-blend-lighten"
          />
          {/* Subtle gradient overlay to match image 3 layout feel but in brand colors */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-emerald-950/40" />
        </div>

        {/* Top Header - Logo and Brand Name */}
        <div className="relative z-10 flex items-center gap-4 select-none">
          <div className="h-16 w-16 bg-white rounded-2xl p-2.5 flex items-center justify-center shadow-lg border border-slate-100">
            <Image
              src="/logo.png"
              alt="KVR Motors Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-wider uppercase text-white">KVR Motors</span>
        </div>

        {/* Marketing copy mimicking structure of 3rd image */}
        <div className="relative z-10 my-auto max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-light tracking-tight text-white leading-tight">
            Manage your <span className="font-extrabold text-emerald-450">EV Business</span> Brilliantly.
          </h1>
          <p className="text-slate-300 text-base mt-6 leading-relaxed">
            All-in-one platform to manage showroom operations, warehouse stock movements, sales leads pipeline, staff performance, and scale your dealership network.
          </p>

          {/* Bullet points mirroring Opulea screen styling */}
          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Smart Showrooms</h3>
                <p className="text-slate-400 text-xs mt-1">Real-time tracking of vehicle inventory, statuses, and battery allocations.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Lead Conversion</h3>
                <p className="text-slate-400 text-xs mt-1">Nurture sales leads, monitor pipeline velocity, and view performance logs.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Secure Operations</h3>
                <p className="text-slate-400 text-xs mt-1">Role-based access control, supervisor verification, and automated audits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="relative z-10 text-xs font-semibold text-slate-500">
          © {new Date().getFullYear()} KVR Motors ERP. All rights reserved.
        </div>
      </div>

      {/* Right Section - Login form container */}
      <div className="w-full lg:w-5/12 xl:w-4/12 bg-white flex flex-col justify-between p-8 sm:p-16 lg:rounded-l-[40px] shadow-2xl relative z-10">
        
        {/* Mobile top bar (only shown on mobile/tablet) */}
        <div className="flex items-center gap-4 lg:hidden mb-12 select-none justify-center">
          <div className="h-16 w-16 bg-white rounded-2xl p-2.5 flex items-center justify-center border border-slate-100 shadow-md">
            <Image
              src="/logo.png"
              alt="KVR Motors Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-wider uppercase text-slate-900">KVR Motors</span>
        </div>

        {/* Inner centered form wrapper */}
        <div className="my-auto w-full max-w-sm mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-2 font-semibold">Sign in to continue managing your business.</p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-100 border-t-emerald-600" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        {/* Mobile footer */}
        <div className="text-center text-xs font-semibold text-slate-400 mt-12 lg:hidden">
          © {new Date().getFullYear()} KVR Motors ERP.
        </div>
      </div>

    </div>
  );
}
