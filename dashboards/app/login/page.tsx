"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  AlertCircle
} from "lucide-react";

function LoginForm() {
  const { login, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show redirect warnings if redirected via route middleware
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

  // Quick Demo credentials loader for high UX testing
  const handleQuickLogin = (role: string) => {
    const credentials: Record<string, { u: string; p: string }> = {
      owner: { u: "owner", p: "owner123" },
      supervisor: { u: "supervisor", p: "super123" },
      sales: { u: "sales", p: "sales123" }
    };
    
    const cred = credentials[role];
    if (cred) {
      setUsername(cred.u);
      setPassword(cred.p);
      setErrorMsg("");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Validation Errors Indicator */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
          Username
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <User className="h-4 w-4" />
          </div>
          <input
            type="text"
            name="username"
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white/60 transition-all duration-200"
            placeholder="Enter username"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
          Password
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type="password"
            name="password"
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white/60 transition-all duration-200"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* CTA Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-300 group cursor-pointer"
        >
          {(isSubmitting || authLoading) ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <span>Enter Platform</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      {/* Quick Demo Helper Section for Seamless UX Validation */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center select-none">
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800/80 uppercase tracking-widest mb-3 bg-emerald-50 border border-emerald-100/50 px-2 py-1 rounded-full">
          <Sparkles className="h-3 w-3" /> Quick Demo Autoloaders
        </span>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <button
            type="button"
            onClick={() => handleQuickLogin("owner")}
            className="py-2 px-1 text-[10px] font-bold bg-emerald-50 border border-emerald-100 hover:bg-emerald-500/10 active:scale-95 text-emerald-950 rounded-lg transition-all duration-150 cursor-pointer"
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("supervisor")}
            className="py-2 px-1 text-[10px] font-bold bg-blue-50 border border-blue-100 hover:bg-blue-500/10 active:scale-95 text-blue-950 rounded-lg transition-all duration-150 cursor-pointer"
          >
            Supervisor
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("sales")}
            className="py-2 px-1 text-[10px] font-bold bg-teal-50 border border-teal-100 hover:bg-teal-500/10 active:scale-95 text-teal-950 rounded-lg transition-all duration-150 cursor-pointer"
          >
            Sales Exec
          </button>
        </div>
        <p className="text-[9px] font-medium text-slate-400 mt-3 italic">
          Click a helper to pre-fill test developer sandbox credentials.
        </p>
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
      <div className="min-h-screen bg-[#FAFDFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFDFB] relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased overflow-hidden text-slate-800">
      
      {/* Background radial gradient glow spheres */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-100/30 rounded-full blur-[140px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 select-none">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative h-14 w-14 bg-white rounded-2xl p-2.5 flex items-center justify-center border border-emerald-100/80 shadow-md shadow-emerald-950/4">
            <Image
              src="/logo.png"
              alt="KVR Motors Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center mt-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">
              KVR Motors
            </h2>
            <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-widest mt-1.5 block">
              Enterprise Resource Portal
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Glassmorphic Form Card */}
        <div className="bg-white/80 backdrop-blur-md py-8 px-6 sm:px-10 border border-emerald-100/60 rounded-3xl shadow-xl shadow-emerald-950/4">
          
          <div className="mb-6 text-center">
            <h3 className="text-lg font-extrabold text-slate-900">Sign in to your account</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Enter your ERP terminal access credentials</p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-100 border-t-emerald-600" />
            </div>
          }>
            <LoginForm />
          </Suspense>

        </div>
      </div>
    </div>
  );
}
