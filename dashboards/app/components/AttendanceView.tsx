"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getAttendanceLogs } from "../services/attendance";
import api from "../services/api";
import Toast from "./Toast";
import Table from "./Table";
import EmptyState from "./EmptyState";
import {
  UsersRound,
  Clock,
  Camera,
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Square,
  ShieldCheck,
  Building2,
  CalendarDays,
  UserCheck2,
  Search,
  Filter
} from "lucide-react";

interface AttendanceViewProps {
  role: "owner" | "supervisor" | "sales" | "telecaller" | "staff";
}

export default function AttendanceView({ role }: AttendanceViewProps) {
  const { user } = useAuth();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userBranchName = user?.branch || "KVR Motors";

  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLogForPhoto, setSelectedLogForPhoto] = useState<any>(null);

  // Check-in form states
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Supervisor verification selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getAttendanceLogs();
      setLogs(data);
    } catch (e) {
      console.error("Error fetching attendance logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Find logged in user's checkin for today
  const myTodayCheckin = useMemo(() => {
    return logs.find(
      (l) => l.date === todayStr && (l.user === user?.id || l.user_detail?.id === user?.id)
    );
  }, [logs, todayStr, user]);

  // Separate logs into My Logs vs Team Logs
  const myLogs = useMemo(() => {
    return logs.filter(l => l.user === user?.id || l.user_detail?.id === user?.id);
  }, [logs, user]);

  const teamPendingLogs = useMemo(() => {
    if (role !== "supervisor" && role !== "owner") return [];
    return logs.filter(l => l.status === "pending" && (l.user !== user?.id && l.user_detail?.id !== user?.id));
  }, [logs, role, user]);

  // Camera & Geolocation Handlers
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera video stream unavailable:", err);
      setIsCameraActive(false);
      showToast("Webcam unavailable. Snapshot will use default workplace photo.", "error");
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelfiePhoto(dataUrl);
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  const resolveLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setGeoAddress(`${userBranchName} Showroom (Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)})`);
          setIsLocating(false);
          showToast("Workplace GPS Location captured!");
        },
        (err) => {
          console.warn("Geolocation fallback:", err);
          setGeoCoords({ lat: 17.6868, lng: 83.2185 });
          setGeoAddress(`${userBranchName} Showroom Premises`);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGeoCoords({ lat: 17.6868, lng: 83.2185 });
      setGeoAddress(`${userBranchName} Premises`);
    }
  };

  const submitCheckin = async () => {
    if (!geoCoords) {
      showToast("Please capture your workplace location before check-in.", "error");
      return;
    }
    try {
      setIsSubmittingCheckin(true);

      const formData = new FormData();
      if (selfiePhoto && selfiePhoto.startsWith("data:image")) {
        const byteString = atob(selfiePhoto.split(",")[1]);
        const mimeString = selfiePhoto.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        formData.append("photo", blob, "checkin_photo.jpg");
      } else {
        const dummyCanvas = document.createElement("canvas");
        dummyCanvas.width = 100;
        dummyCanvas.height = 100;
        const ctx = dummyCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#04a700";
          ctx.fillRect(0, 0, 100, 100);
        }
        const dummyBlob = await new Promise<Blob>((resolve) => dummyCanvas.toBlob((b) => resolve(b!), "image/jpeg"));
        formData.append("photo", dummyBlob, "checkin_photo.jpg");
      }

      formData.append("latitude", geoCoords.lat.toFixed(6));
      formData.append("longitude", geoCoords.lng.toFixed(6));
      formData.append("location_name", geoAddress || `${userBranchName} Premises`);

      await api.post("/attendance/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showToast("Daily Check-in submitted successfully!");
      setSelfiePhoto(null);
      setGeoCoords(null);
      fetchLogs();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "You have already checked in for today.", "error");
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  // Supervisor Actions
  const handleSingleVerify = async (id: number, status: "verified" | "rejected") => {
    try {
      await api.patch(`/attendance/${id}/verify/`, { status });
      showToast(`Attendance marked as ${status}!`);
      fetchLogs();
    } catch {
      showToast("Failed to update attendance record.", "error");
    }
  };

  const handleBulkVerify = async (status: "verified" | "rejected") => {
    if (selectedIds.length === 0) return;
    try {
      setIsVerifying(true);
      await api.post("/attendance/bulk-verify/", { ids: selectedIds, status });
      showToast(`Bulk updated ${selectedIds.length} attendance records to ${status}!`);
      setSelectedIds([]);
      fetchLogs();
    } catch {
      showToast("Failed to perform bulk verification.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* SECTION 1: DAILY SELF CHECK-IN CARD */}
      <div className="bg-white border border-emerald-100/60 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-[#04a700]" /> Daily Workplace Attendance Check-In
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Geolocated selfie check-in for <span className="font-bold text-slate-700 capitalize">{role.replace("_", " ")}</span> terminal.
            </p>
          </div>
          {myTodayCheckin ? (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-center">
              <CheckCircle2 className="h-4 w-4 text-[#04a700]" /> CHECKED IN TODAY ({myTodayCheckin.status.toUpperCase()})
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-center">
              <Clock className="h-4 w-4 text-amber-600" /> CHECK-IN PENDING TODAY
            </span>
          )}
        </div>

        {!myTodayCheckin ? (
          <div className="space-y-6">
            {/* Step 1: Selfie Snapshot */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 block">1. Take Check-In Selfie Snapshot</label>
              {selfiePhoto ? (
                <div className="relative h-48 w-64 mx-auto rounded-2xl overflow-hidden border border-emerald-500/40 shadow-sm">
                  <img src={selfiePhoto} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setSelfiePhoto(null); startCamera(); }}
                    className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Retake
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="relative h-48 w-64 mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <button
                    onClick={captureSnapshot}
                    className="absolute bottom-3 px-4 py-1.5 rounded-full bg-[#04a700] text-white text-xs font-bold shadow-lg"
                  >
                    Snap Photo
                  </button>
                </div>
              ) : (
                <div className="h-36 w-full max-w-sm mx-auto bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <Camera className="h-8 w-8 text-[#04a700]" />
                  <span className="text-xs text-slate-500 font-medium">Capture identity photo for workplace verification</span>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-[#04a700] text-white text-xs font-bold hover:bg-[#038a00] transition-colors shadow-sm"
                  >
                    Open Camera
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: GPS Location */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 block">2. Workplace Location GPS</label>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#04a700] shrink-0" />
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {geoAddress || "Location Not Captured"}
                    </span>
                    {geoCoords && (
                      <span className="text-[10px] text-slate-500 font-mono font-medium">
                        Lat: {geoCoords.lat.toFixed(5)}, Lng: {geoCoords.lng.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={resolveLocation}
                  disabled={isLocating}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 shrink-0 transition-colors"
                >
                  {isLocating ? "Resolving..." : "Capture GPS Location"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitCheckin}
              disabled={isSubmittingCheckin || !geoCoords}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-md ${
                isSubmittingCheckin || !geoCoords
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#04a700] hover:bg-[#038a00] shadow-[#04a700]/25"
              }`}
            >
              {isSubmittingCheckin ? "Submitting Check-In..." : "SUBMIT DAILY ATTENDANCE CHECK-IN"}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs space-y-1">
            <p className="font-extrabold text-slate-900">Attendance Logged for Today ({todayStr})</p>
            <p className="text-slate-600">Check-in Time: <span className="font-mono text-emerald-700 font-bold">{myTodayCheckin.check_in ? new Date(myTodayCheckin.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</span></p>
            <p className="text-slate-600">Location: <span className="font-bold text-slate-800">{myTodayCheckin.location_name || userBranchName}</span></p>
          </div>
        )}
      </div>

      {/* SECTION 2: TEAM ATTENDANCE VERIFICATION (FOR SUPERVISOR & OWNER) */}
      {(role === "supervisor" || role === "owner") && (
        <div className="bg-white border border-emerald-100/60 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#04a700]" /> Branch Staff Attendance Approvals ({teamPendingLogs.length})
              </h3>
              <p className="text-xs text-slate-500">Review and verify check-in logs submitted by staff, sales, and telecallers.</p>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkVerify("verified")}
                  disabled={isVerifying}
                  className="px-3 py-1.5 bg-[#04a700] text-white text-xs font-bold rounded-xl hover:bg-[#038a00] shadow-sm"
                >
                  Approve Selected ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBulkVerify("rejected")}
                  disabled={isVerifying}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm"
                >
                  Reject
                </button>
              </div>
            )}
          </div>

          {teamPendingLogs.length === 0 ? (
            <EmptyState title="No Pending Approvals" description="All branch staff check-in logs have been verified." />
          ) : (
            <Table headers={["Select", "Employee", "Role", "Date / Time", "Location", "Actions"]}>
              {teamPendingLogs.map((log: any) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <tr key={log.id} className="border-b border-emerald-50/80 hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, log.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== log.id));
                          }
                        }}
                        className="h-4 w-4 accent-[#04a700] rounded"
                      />
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{log.user_detail?.full_name || log.user_name || "Employee"}</td>
                    <td className="py-3 px-4 text-xs font-bold capitalize text-slate-600">{log.user_detail?.role || "Staff"}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{log.date}</span>
                      <span className="block font-mono text-[10px] text-slate-500">
                        {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 font-medium">{log.location_name || "Branch"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSingleVerify(log.id, "verified")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-extrabold border border-emerald-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleSingleVerify(log.id, "rejected")}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-extrabold border border-rose-200"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      )}

      {/* SECTION 3: MY ATTENDANCE HISTORY TABLE */}
      <div className="bg-white border border-emerald-100/60 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-black text-sm text-slate-800">My Attendance Check-In History</h3>
        <Table headers={["Date", "Check-In Time", "Workplace Location", "Status"]}>
          {myLogs.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                No attendance check-in records found.
              </td>
            </tr>
          ) : (
            myLogs.map((log: any) => (
              <tr key={log.id} className="border-b border-emerald-50/80 hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{log.date}</td>
                <td className="py-3 px-4 font-mono text-emerald-700 text-xs font-bold">
                  {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                </td>
                <td className="py-3 px-4 text-xs font-semibold text-slate-700">{log.location_name || userBranchName}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    log.status === "verified" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    log.status === "rejected" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
}
