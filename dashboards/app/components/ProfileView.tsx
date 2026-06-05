"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser, updateCurrentUser, UserProfile } from "../services/users";
import { Camera, Mail, Phone, Shield, Calendar, MapPin, Loader2, Check, X } from "lucide-react";

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms states
  const [personalInfoForm, setPersonalInfoForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone_number: "",
  });

  const [addressForm, setAddressForm] = useState({
    country: "",
    city: "",
    postal_code: "",
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await getCurrentUser();
      setProfileData(data);
      
      setPersonalInfoForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        date_of_birth: data.date_of_birth || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
      });

      setAddressForm({
        country: data.country || "",
        city: data.city || "",
        postal_code: data.postal_code || "",
      });
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setErrorMsg("Failed to retrieve profile data from the database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#054E35] animate-spin" />
        <span className="ml-2 text-xs font-semibold text-slate-500">Loading profile details...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400">
        No active profile session found.
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  };

  const formatDateForDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleSavePersonalInfo = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const fullName = `${personalInfoForm.first_name} ${personalInfoForm.last_name}`.trim();
      const updated = await updateCurrentUser({
        ...personalInfoForm,
        full_name: fullName,
      });

      setProfileData(updated);
      updateUser(updated);
      setIsEditingPersonalInfo(false);
      setSuccessMsg("Personal information updated successfully.");
      
      // Clear alert after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to save personal info:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to update personal information.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPersonalInfo = () => {
    if (profileData) {
      setPersonalInfoForm({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        date_of_birth: profileData.date_of_birth || "",
        email: profileData.email || "",
        phone_number: profileData.phone_number || "",
      });
    }
    setIsEditingPersonalInfo(false);
    setErrorMsg(null);
  };

  const handleSaveAddress = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const updated = await updateCurrentUser({
        ...addressForm,
      });

      setProfileData(updated);
      updateUser(updated);
      setIsEditingAddress(false);
      setSuccessMsg("Address details updated successfully.");
      
      // Clear alert after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Failed to save address info:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to update address details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAddress = () => {
    if (profileData) {
      setAddressForm({
        country: profileData.country || "",
        city: profileData.city || "",
        postal_code: profileData.postal_code || "",
      });
    }
    setIsEditingAddress(false);
    setErrorMsg(null);
  };

  const getRoleDisplay = (role?: string) => {
    if (!role) return "User";
    if (role === "sales_executive" || role === "sales") return "Sales Executive";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto p-4 md:p-6">
      
      {/* Title */}
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#054E35] tracking-wide">My Profile</h2>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-2xl shadow-sm transition-all duration-300">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold rounded-2xl shadow-sm transition-all duration-300">
          {errorMsg}
        </div>
      )}

      {/* Top Header Card: Avatar & Overview */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150/60 flex items-center space-x-6">
        <div className="relative flex-shrink-0">
          <div className="h-20 w-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 overflow-hidden flex items-center justify-center text-3xl font-black text-amber-600">
            {getInitials(profileData.full_name || profileData.username)}
          </div>
          {/* Green camera upload icon overlay */}
          <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-[#054E35] border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:bg-[#033B27] transition-all">
            <Camera className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="text-left min-w-0">
          <h3 className="text-xl font-bold text-[#054E35] truncate">
            {profileData.full_name || "Enterprise User"}
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            {getRoleDisplay(profileData.role)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium flex items-center truncate">
            <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400 shrink-0" />
            {profileData.city && profileData.country
              ? `${profileData.city}, ${profileData.country}`
              : (profileData.country || profileData.city || "Location not set")}
          </p>
        </div>
      </div>

      {/* Personal Information Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150/60">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#054E35]">Personal Information</h3>
          
          {isEditingPersonalInfo ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSavePersonalInfo}
                disabled={isSaving}
                className="bg-[#054E35] text-white hover:bg-[#033B27] rounded-lg px-3 py-1.5 font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelPersonalInfo}
                disabled={isSaving}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-3 py-1.5 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingPersonalInfo(true)}
              className="bg-[#E07A2F] text-white hover:bg-[#c6641e] rounded-lg px-4 py-1.5 font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Edit</span>
              <span className="text-[10px]">✎</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* First Name */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">First Name</span>
            {isEditingPersonalInfo ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={personalInfoForm.first_name}
                onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, first_name: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.first_name || "—"}</span>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Last Name</span>
            {isEditingPersonalInfo ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={personalInfoForm.last_name}
                onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, last_name: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.last_name || "—"}</span>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
            {isEditingPersonalInfo ? (
              <input
                type="date"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={personalInfoForm.date_of_birth}
                onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, date_of_birth: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{formatDateForDisplay(profileData.date_of_birth)}</span>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
            {isEditingPersonalInfo ? (
              <input
                type="email"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={personalInfoForm.email}
                onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, email: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1 truncate">{profileData.email || "—"}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
            {isEditingPersonalInfo ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={personalInfoForm.phone_number}
                onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, phone_number: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.phone_number || "—"}</span>
            )}
          </div>

          {/* User Role */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">User Role</span>
            <span className="block text-sm font-bold text-slate-700 p-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 select-none w-fit uppercase text-[10px] tracking-wider text-[#054E35]">
              {getRoleDisplay(profileData.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Address Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150/60">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-[#054E35]">Address</h3>
          
          {isEditingAddress ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveAddress}
                disabled={isSaving}
                className="bg-[#054E35] text-white hover:bg-[#033B27] rounded-lg px-3 py-1.5 font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelAddress}
                disabled={isSaving}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg px-3 py-1.5 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingAddress(true)}
              className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg px-4 py-1.5 font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Edit</span>
              <span className="text-[10px]">✎</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Country */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Country</span>
            {isEditingAddress ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.country || "—"}</span>
            )}
          </div>

          {/* City */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">City</span>
            {isEditingAddress ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.city || "—"}</span>
            )}
          </div>

          {/* Postal Code */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Postal Code</span>
            {isEditingAddress ? (
              <input
                type="text"
                className="w-full px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#054E35]/20 focus:border-[#054E35] transition-all"
                value={addressForm.postal_code}
                onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
              />
            ) : (
              <span className="block text-sm font-bold text-slate-700 p-1">{profileData.postal_code || "—"}</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
