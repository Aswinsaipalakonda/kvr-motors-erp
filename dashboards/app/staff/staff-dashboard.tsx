"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import ProfileView from "../components/ProfileView";
import AttendanceView from "../components/AttendanceView";
import DashboardSmoothScroll from "../components/DashboardSmoothScroll";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";

import {
  getVehicleUnits,
  getVehicleModels,
  createVehicleUnit,
  updateVehicleUnit,
  lookupVehicleUnit
} from "../services/vehicles";

import {
  getBatteries,
  createBattery
} from "../services/batteries";

import {
  getBranches,
  getInventoryLocations,
  getShowrooms,
  getStockTransfers,
  createStockTransfer,
  updateStockTransfer
} from "../services/branches";

import {
  getBookings,
  updateBooking
} from "../services/bookings";

import {
  getSalesInvoices,
  updateSalesInvoice
} from "../services/sales";

import {
  getAttendanceLogs
} from "../services/attendance";

import {
  getActivityLogs
} from "../services/activityLogs";

import api from "../services/api";

import {
  Boxes,
  Battery,
  FileText,
  UsersRound,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Truck,
  ScanLine,
  ShieldCheck,
  KeyRound,
  PenLine,
  Camera,
  MapPin,
  Clock,
  Navigation,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Car,
  Package,
  Layers,
  ChevronRight,
  User,
  CheckSquare,
  Square
} from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Tab mapping based on URL segment
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const initialTab = lastSegment === "staff" ? "dashboard" : lastSegment;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "staff" ? "dashboard" : segment;
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Live Database States
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleUnits, setVehicleUnits] = useState<any[]>([]);
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<any[]>([]);
  const [stockTransfers, setStockTransfers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("all");
  const [batteryStatusFilter, setBatteryStatusFilter] = useState("all");
  const [pdiSegment, setPdiSegment] = useState<"pdi" | "handover">("pdi");

  // Modals state
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddBatteryOpen, setIsAddBatteryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPdiModalOpen, setIsPdiModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Modal target selections
  const [selectedBookingForPdi, setSelectedBookingForPdi] = useState<any>(null);
  const [selectedInvoiceForHandover, setSelectedInvoiceForHandover] = useState<any>(null);
  const [selectedUnitForTransfer, setSelectedUnitForTransfer] = useState<any>(null);

  // Forms State
  const [newUnitForm, setNewUnitForm] = useState({
    model: "",
    branch: "",
    showroom: "",
    location: "",
    vin_number: "",
    motor_number: "",
    chassis_number: "",
    color: "Green",
    stock_status: "available"
  });

  const [newBatteryForm, setNewBatteryForm] = useState({
    serial_number: "",
    battery_code: "BAT-LFP-6030",
    capacity: "60V 30Ah LFP",
    purchase_date: new Date().toISOString().slice(0, 10),
    location: "",
    supplier: "Ampere Power Corp",
    warranty_years: 3
  });

  const [transferForm, setTransferForm] = useState({
    to_location: "",
    priority: "normal"
  });

  // PDI Checklist State
  const [pdiChecks, setPdiChecks] = useState({
    bodywork: false,
    electricals: false,
    brakes_tires: false,
    controls: false,
    documents: false
  });

  // Handover Checklist & Signature State
  const [handoverChecks, setHandoverChecks] = useState({
    keys: false,
    charger: false,
    manual: false,
    insurance_docs: false
  });
  const [handoverCustomerName, setHandoverCustomerName] = useState("");

  // Attendance Check-in State
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Local Storage Routine Checklist State
  const [routineTasks, setRoutineTasks] = useState([
    { id: 1, label: "Verify physical yard stock count against system inventory", done: true },
    { id: 2, label: "Check incoming PO shipment dispatches & GRN notes", done: false },
    { id: 3, label: "Conduct 5-step PDI inspection for scheduled customer bookings", done: false },
    { id: 4, label: "Inspect battery FIFO sequence and log newly arrived units", done: true },
    { id: 5, label: "Prepare keys, charger, & warranty docs for ready handovers", done: false },
  ]);

  const toggleRoutineTask = (id: number) => {
    setRoutineTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Data Loader
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [
        unitsRes,
        modelsRes,
        batteriesRes,
        branchesRes,
        locationsRes,
        showroomsRes,
        transfersRes,
        bookingsRes,
        invoicesRes,
        attendanceRes,
        activityRes
      ] = await Promise.all([
        getVehicleUnits().catch(() => []),
        getVehicleModels().catch(() => []),
        getBatteries().catch(() => []),
        getBranches().catch(() => []),
        getInventoryLocations().catch(() => []),
        getShowrooms().catch(() => []),
        getStockTransfers().catch(() => []),
        getBookings().catch(() => []),
        getSalesInvoices().catch(() => []),
        getAttendanceLogs().catch(() => []),
        getActivityLogs().catch(() => [])
      ]);

      setVehicleUnits(unitsRes);
      setVehicleModels(modelsRes);
      setBatteries(batteriesRes);
      setBranches(branchesRes);
      setLocations(locationsRes);
      setShowrooms(showroomsRes);
      setStockTransfers(transfersRes);
      setBookings(bookingsRes);
      setSalesInvoices(invoicesRes);
      setAttendanceLogs(attendanceRes);
      setActivityLogs(activityRes);
    } catch (e) {
      console.error("Failed to load staff dashboard data:", e);
      showToast("Error loading server telemetry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadAllData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Lists Scoped to Staff Branch
  const userBranchName = user?.branch || "KVR Motors - Visakhapatnam";

  const staffUnits = useMemo(() => {
    return vehicleUnits.filter(u => {
      if (u.branch_name && u.branch_name !== userBranchName) return false;
      if (inventoryStatusFilter !== "all" && u.stock_status !== inventoryStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesVin = (u.vin_number || "").toLowerCase().includes(q);
        const matchesModel = (u.model_name || "").toLowerCase().includes(q);
        const matchesMotor = (u.motor_number || "").toLowerCase().includes(q);
        return matchesVin || matchesModel || matchesMotor;
      }
      return true;
    });
  }, [vehicleUnits, userBranchName, inventoryStatusFilter, searchQuery]);

  const staffBatteries = useMemo(() => {
    return batteries.filter(b => {
      if (batteryStatusFilter !== "all" && b.status !== batteryStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSerial = (b.serial_number || "").toLowerCase().includes(q);
        const matchesCode = (b.battery_code || "").toLowerCase().includes(q);
        const matchesLocation = (b.location_name || "").toLowerCase().includes(q);
        return matchesSerial || matchesCode || matchesLocation;
      }
      return true;
    });
  }, [batteries, batteryStatusFilter, searchQuery]);

  const pendingPdiBookings = useMemo(() => {
    return bookings.filter(b => b.pdi_verified !== "yes" && (b.status === "pending" || b.status === "confirmed"));
  }, [bookings]);

  const pendingHandovers = useMemo(() => {
    return salesInvoices.filter(i => i.delivery_status !== "delivered");
  }, [salesInvoices]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const myTodayAttendance = useMemo(() => {
    return attendanceLogs.find(a => a.date === todayStr);
  }, [attendanceLogs, todayStr]);

  // Handlers for Receive Shipment
  const handleOpenAddUnit = () => {
    const defaultBranch = branches.find(b => b.name === userBranchName) || branches[0];
    const defaultShowroom = showrooms.find(s => s.branch === defaultBranch?.id) || showrooms[0];
    const defaultLoc = locations.find(l => l.branch === defaultBranch?.id) || locations[0];

    setNewUnitForm({
      model: vehicleModels[0]?.id ? String(vehicleModels[0].id) : "",
      branch: defaultBranch?.id ? String(defaultBranch.id) : "",
      showroom: defaultShowroom?.id ? String(defaultShowroom.id) : "",
      location: defaultLoc?.id ? String(defaultLoc.id) : "",
      vin_number: `KVR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      motor_number: `MOT-${Math.floor(100000 + Math.random() * 900000)}`,
      chassis_number: `CHS-${Math.floor(100000 + Math.random() * 900000)}`,
      color: "Green",
      stock_status: "available"
    });
    setIsAddUnitOpen(true);
  };

  const handleAddUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitForm.model || !newUnitForm.branch || !newUnitForm.location) {
      showToast("Please select vehicle model, branch, and godown location.", "error");
      return;
    }
    try {
      await createVehicleUnit({
        model: parseInt(newUnitForm.model),
        branch: parseInt(newUnitForm.branch),
        showroom: newUnitForm.showroom ? parseInt(newUnitForm.showroom) : parseInt(newUnitForm.location),
        location: parseInt(newUnitForm.location),
        vin_number: newUnitForm.vin_number.trim(),
        motor_number: newUnitForm.motor_number.trim(),
        chassis_number: newUnitForm.chassis_number.trim(),
        color: newUnitForm.color,
        stock_status: newUnitForm.stock_status
      });
      showToast("Shipment unit successfully logged to godown inventory!");
      setIsAddUnitOpen(false);
      loadAllData();
    } catch {
      showToast("Failed to register vehicle unit.", "error");
    }
  };

  // Handlers for Logging Battery
  const handleOpenAddBattery = () => {
    const defaultBranch = branches.find(b => b.name === userBranchName) || branches[0];
    const defaultLoc = locations.find(l => l.branch === defaultBranch?.id) || locations[0];

    setNewBatteryForm({
      serial_number: `BATT-LFP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`,
      battery_code: "BAT-LFP-6030",
      capacity: "60V 30Ah LFP",
      purchase_date: new Date().toISOString().slice(0, 10),
      location: defaultLoc?.id ? String(defaultLoc.id) : "",
      supplier: "Ampere Power Corp",
      warranty_years: 3
    });
    setIsAddBatteryOpen(true);
  };

  const handleAddBatterySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatteryForm.serial_number || !newBatteryForm.location) {
      showToast("Please enter serial number and choose godown location.", "error");
      return;
    }
    try {
      await createBattery({
        serial_number: newBatteryForm.serial_number.trim(),
        battery_code: newBatteryForm.battery_code,
        capacity: newBatteryForm.capacity,
        purchase_date: newBatteryForm.purchase_date,
        location: parseInt(newBatteryForm.location),
        supplier: newBatteryForm.supplier,
        warranty_years: newBatteryForm.warranty_years,
        status: "available"
      });
      showToast("Battery unit registered into yard stock!");
      setIsAddBatteryOpen(false);
      loadAllData();
    } catch {
      showToast("Failed to register battery unit.", "error");
    }
  };

  // Handlers for Stock Transfer Request
  const openTransferModal = (unit: any) => {
    setSelectedUnitForTransfer(unit);
    const availableLocs = locations.filter(l => l.id !== unit.location);
    setTransferForm({
      to_location: availableLocs[0]?.id ? String(availableLocs[0].id) : "",
      priority: "normal"
    });
    setIsTransferOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitForTransfer || !transferForm.to_location) {
      showToast("Please select a target godown destination.", "error");
      return;
    }
    try {
      await createStockTransfer({
        vehicle_unit: selectedUnitForTransfer.id,
        from_location: selectedUnitForTransfer.location,
        to_location: parseInt(transferForm.to_location),
        status: "pending"
      });
      showToast("Stock transfer request submitted for supervisor approval!");
      setIsTransferOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.from_location?.[0] || "Failed to initiate transfer.", "error");
    }
  };

  const handleUpdateTransferStatus = async (transferId: number, newStatus: string) => {
    try {
      await updateStockTransfer(transferId, { status: newStatus });
      showToast(`Transfer status updated to ${newStatus.replace("_", " ")}!`);
      loadAllData();
    } catch (err: any) {
      showToast("Failed to update transfer status.", "error");
    }
  };

  // Handlers for PDI Checklist
  const openPdiModal = (booking: any) => {
    setSelectedBookingForPdi(booking);
    setPdiChecks({
      bodywork: true,
      electricals: true,
      brakes_tires: true,
      controls: false,
      documents: false
    });
    setIsPdiModalOpen(true);
  };

  const submitPdiCheck = async () => {
    if (!selectedBookingForPdi) return;
    const allChecked = Object.values(pdiChecks).every(Boolean);
    if (!allChecked) {
      showToast("Please complete all 5 inspection checklist points before verifying PDI.", "error");
      return;
    }
    try {
      await updateBooking(selectedBookingForPdi.id, { pdi_verified: "yes" });
      showToast("PDI Inspection Passed! Vehicle marked as verified for customer handover.");
      setIsPdiModalOpen(false);
      setSelectedBookingForPdi(null);
      loadAllData();
    } catch {
      showToast("Failed to verify PDI status.", "error");
    }
  };

  // Handlers for Customer Handover & Signature
  const openHandoverModal = (invoice: any) => {
    setSelectedInvoiceForHandover(invoice);
    setHandoverChecks({
      keys: true,
      charger: true,
      manual: true,
      insurance_docs: true
    });
    setHandoverCustomerName(invoice.customer_name || "");
    setIsHandoverModalOpen(true);
  };

  const submitHandover = async () => {
    if (!selectedInvoiceForHandover) return;
    const allChecked = Object.values(handoverChecks).every(Boolean);
    if (!allChecked) {
      showToast("Please verify all delivery items (keys, charger, manual, docs).", "error");
      return;
    }
    try {
      await updateSalesInvoice(selectedInvoiceForHandover.id, { delivery_status: "delivered" });
      showToast("Customer Handover Completed! Invoice settled as Delivered.");
      setIsHandoverModalOpen(false);
      setSelectedInvoiceForHandover(null);
      loadAllData();
    } catch {
      showToast("Failed to complete customer handover.", "error");
    }
  };

  // Handlers for Geolocated Camera Attendance Check-in
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera permission or video stream unavailable:", err);
      setIsCameraActive(false);
      showToast("Webcam unavailable. You can upload a photo file for check-in.", "error");
    }
  };

  const captureSelfieSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelfiePhoto(dataUrl);
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  const resolveBrowserLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setGeoAddress(`${userBranchName} Yard (Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)})`);
          setIsLocating(false);
          showToast("GPS Workplace location resolved!");
        },
        (err) => {
          console.warn("Geolocation fallback:", err.message);
          setGeoCoords({ lat: 17.6868, lng: 83.2185 }); // Vizag coordinates
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

  const submitAttendanceCheckin = async () => {
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
        formData.append("photo", blob, "web_checkin.jpg");
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
        formData.append("photo", dummyBlob, "staff_checkin.jpg");
      }

      formData.append("latitude", geoCoords.lat.toFixed(6));
      formData.append("longitude", geoCoords.lng.toFixed(6));
      formData.append("location_name", geoAddress || `${userBranchName} Premises`);

      await api.post("/attendance/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showToast("Daily Attendance Check-in Logged! Awaiting supervisor signoff.");
      setSelfiePhoto(null);
      setGeoCoords(null);
      loadAllData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Attendance check-in failed or already recorded for today.", "error");
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  return (
    <DashboardSmoothScroll>
      <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
        {/* Sidebar */}
        <DashboardSidebar role="staff" activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar
            role="staff"
            title={
              activeTab === "dashboard"
                ? "Yard & Operations Command"
                : activeTab === "inventory"
                ? "Inventory & Shipment Receivals"
                : activeTab === "batteries"
                ? "FIFO Battery Registry"
                : activeTab === "pdi"
                ? "Pre-Delivery Inspections & Handovers"
                : activeTab === "attendance"
                ? "Workplace Attendance Check-in"
                : "Staff Profile"
            }
          />

          {/* Dynamic Screen Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 pb-20 lg:pb-6 slim-scrollbar">
            {/* Toast Notification */}
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Top Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#04a700] via-emerald-700 to-slate-900 p-6 text-white shadow-lg shadow-emerald-950/10">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-bold mb-2 border border-white/20">
                        <Sparkles className="h-3.5 w-3.5" /> OPERATIONS YARD TERMINAL
                      </div>
                      <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                        Welcome back, <span className="text-emerald-300">{user?.full_name || "Gopal Rao"}</span>!
                      </h1>
                      <p className="text-xs lg:text-sm text-emerald-100/90 mt-1">
                        Scoped to <span className="text-white font-bold">{userBranchName}</span> yard & godowns.
                      </p>
                    </div>

                    {/* Today's Checkin Badge */}
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${myTodayAttendance ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"}`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Today's Attendance</span>
                        <span className={`text-xs font-extrabold ${myTodayAttendance ? "text-emerald-300" : "text-amber-300"}`}>
                          {myTodayAttendance ? `CHECKED IN (${myTodayAttendance.status.toUpperCase()})` : "CHECK-IN PENDING"}
                        </span>
                      </div>
                      {!myTodayAttendance && (
                        <button
                          onClick={() => setActiveTab("attendance")}
                          className="ml-2 px-3.5 py-1.5 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black hover:bg-emerald-300 transition-colors shadow-sm"
                        >
                          Clock In
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metric Telemetry Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DashboardCard
                    title="Yard Vehicles Available"
                    value={staffUnits.filter(u => u.stock_status === "available").length}
                    trend={`${staffUnits.length} Total Registered`}
                    trendType="neutral"
                    description="Physical warehouse stock"
                    icon={Boxes}
                    color="emerald"
                  />
                  <DashboardCard
                    title="Batteries In Stock"
                    value={staffBatteries.filter(b => b.status === "available").length}
                    trend="FIFO Verified"
                    trendType="success"
                    description="Logged battery units"
                    icon={Battery}
                    color="blue"
                  />
                  <DashboardCard
                    title="Pending PDI Checks"
                    value={pendingPdiBookings.length}
                    trend="Inspection Pending"
                    trendType="danger"
                    description="Vehicle quality audits"
                    icon={FileText}
                    color="amber"
                  />
                  <DashboardCard
                    title="Ready Customer Deliveries"
                    value={pendingHandovers.length}
                    trend="Handover Ready"
                    trendType="neutral"
                    description="Key & document handover"
                    icon={Truck}
                    color="purple"
                  />
                </div>

                {/* Mid Section: Daily Checklist + Pending Transfers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Daily Routine Checklist */}
                  <div className="bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm shadow-emerald-950/4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-[#04a700]" /> Daily Yard Routine Checklist
                      </h3>
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-[#04a700] px-2.5 py-1 rounded-full border border-emerald-200/60">
                        {routineTasks.filter(t => t.done).length} / {routineTasks.length} DONE
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {routineTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => toggleRoutineTask(t.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            t.done
                              ? "bg-emerald-50/60 border-emerald-200/80 text-slate-700 font-semibold"
                              : "bg-slate-50/80 border-slate-200/80 text-slate-600 hover:border-emerald-300 hover:bg-slate-100/50"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {t.done ? (
                              <CheckSquare className="h-4 w-4 text-[#04a700]" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${t.done ? "line-through text-slate-400 font-normal" : ""}`}>
                            {t.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock Transfers Queue Feed */}
                  <div className="lg:col-span-2 bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm shadow-emerald-950/4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[#04a700]" /> Inter-Branch Stock Transfers Queue
                      </h3>
                      <button
                        onClick={() => setActiveTab("inventory")}
                        className="text-xs text-[#04a700] hover:underline font-bold"
                      >
                        View All Transfers →
                      </button>
                    </div>

                    {stockTransfers.length === 0 ? (
                      <EmptyState title="No active stock transfers" description="There are currently no inter-godown transfers pending." />
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto slim-scrollbar pr-1">
                        {stockTransfers.slice(0, 4).map((tr: any) => (
                          <div key={tr.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 gap-3 hover:border-emerald-200 transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-slate-800">{tr.transfer_id}</span>
                                <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                  tr.status === "received" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                  tr.status === "in_transit" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                  tr.status === "approved" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                                  "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}>
                                  {tr.status_display || tr.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                Unit: <span className="text-slate-900 font-extrabold">{tr.model_name || "EV Scooter"} ({tr.vin_number || "VIN"})</span>
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                From: {tr.from_location_name} → To: {tr.to_location_name}
                              </p>
                            </div>

                            {/* Quick Action buttons for Staff */}
                            <div className="flex items-center gap-2 shrink-0">
                              {tr.status === "approved" && (
                                <button
                                  onClick={() => handleUpdateTransferStatus(tr.id, "in_transit")}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                                >
                                  Dispatch
                                </button>
                              )}
                              {tr.status === "in_transit" && (
                                <button
                                  onClick={() => handleUpdateTransferStatus(tr.id, "received")}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold transition-colors shadow-sm"
                                >
                                  Mark Received
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Recent Activity Trail */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm shadow-emerald-950/4 space-y-3">
                  <h3 className="font-black text-sm text-slate-800 border-b border-slate-100 pb-2">
                    Recent Yard Activity Trail
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activityLogs.slice(0, 6).map((log: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between items-center text-slate-500 text-[10px]">
                          <span className="font-extrabold text-[#04a700] uppercase">{log.action_type || "LOG"}</span>
                          <span className="font-semibold">{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                        </div>
                        <p className="text-slate-800 font-semibold line-clamp-2">{log.description || log.message || "Yard stock updated."}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY & SHIPMENTS */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-emerald-100/60 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search VIN, Motor, Model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700] focus:ring-1 focus:ring-[#04a700] w-64 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {["all", "available", "assigned", "in_transit", "sold"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setInventoryStatusFilter(st)}
                          className={`px-3 py-1 text-[11px] font-extrabold rounded-lg capitalize transition-all ${
                            inventoryStatusFilter === st
                              ? "bg-[#04a700] text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {st.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    onClick={handleOpenAddUnit}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold transition-all shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Receive New Shipment Unit
                  </button>
                </div>

                {/* Stock Units Table */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="font-black text-sm text-slate-800">Yard Vehicle Units Inventory</h3>
                  <Table
                    headers={["Model", "VIN Number", "Motor #", "Color", "Location (Godown)", "Status", "Actions"]}
                  >
                    {staffUnits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No vehicle units match the active filters.
                        </td>
                      </tr>
                    ) : (
                      staffUnits.map((u: any) => (
                        <tr key={u.id} className="border-b border-emerald-50/80 hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-black text-slate-900">{u.model_name || "EV Scooter"}</td>
                          <td className="py-3 px-4 font-mono text-[#04a700] text-xs font-bold">{u.vin_number || "--"}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-xs font-medium">{u.motor_number || "--"}</td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-700">{u.color || "Green"}</td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-600">{u.location_name || "Main Godown"}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              u.stock_status === "available" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                              u.stock_status === "in_transit" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                              "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {u.stock_status || "Available"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openTransferModal(u)}
                              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold text-slate-700 border border-slate-200 transition-colors"
                            >
                              Transfer Unit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Table>
                </div>
              </div>
            )}

            {/* TAB 3: BATTERIES REGISTRY */}
            {activeTab === "batteries" && (
              <div className="space-y-6">
                {/* Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-emerald-100/60 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Serial, Code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700] focus:ring-1 focus:ring-[#04a700] w-64 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {["all", "available", "assigned", "sold"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setBatteryStatusFilter(st)}
                          className={`px-3 py-1 text-[11px] font-extrabold rounded-lg capitalize transition-all ${
                            batteryStatusFilter === st
                              ? "bg-[#04a700] text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleOpenAddBattery}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold transition-all shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Log Battery Unit
                  </button>
                </div>

                {/* Battery List Table */}
                <div className="bg-white border border-emerald-100/60 rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="font-black text-sm text-slate-800">FIFO Battery Stock Registry</h3>
                  <Table
                    headers={["Serial Number", "Battery Code", "Capacity", "Purchase Date", "Location", "Supplier", "Status"]}
                  >
                    {staffBatteries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No batteries registered for active filter.
                        </td>
                      </tr>
                    ) : (
                      staffBatteries.map((b: any) => (
                        <tr key={b.id} className="border-b border-emerald-50/80 hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#04a700] text-xs">{b.serial_number}</td>
                          <td className="py-3 px-4 text-xs text-slate-700 font-medium">{b.battery_code || "BAT-LFP-6030"}</td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-900">{b.capacity}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{b.purchase_date}</td>
                          <td className="py-3 px-4 text-xs text-slate-700 font-medium">{b.location_name || "Main Godown"}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{b.supplier}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              b.status === "available" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </Table>
                </div>
              </div>
            )}

            {/* TAB 4: PDI & HANDOVERS */}
            {activeTab === "pdi" && (
              <div className="space-y-6">
                {/* Top Segment Toggle */}
                <div className="flex items-center justify-center p-1.5 bg-white border border-emerald-100/60 shadow-sm rounded-2xl max-w-md mx-auto">
                  <button
                    onClick={() => setPdiSegment("pdi")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      pdiSegment === "pdi" ? "bg-[#04a700] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pre-Delivery Inspections ({pendingPdiBookings.length})
                  </button>
                  <button
                    onClick={() => setPdiSegment("handover")}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                      pdiSegment === "handover" ? "bg-[#04a700] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Customer Handovers ({pendingHandovers.length})
                  </button>
                </div>

                {/* SEGMENT A: PDI INSPECTION CHECKS */}
                {pdiSegment === "pdi" && (
                  <div className="bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#04a700]" /> Scheduled Vehicle PDI Checks
                    </h3>

                    {pendingPdiBookings.length === 0 ? (
                      <EmptyState title="All PDIs Complete" description="No pending pre-delivery inspection checks." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingPdiBookings.map((bk: any) => (
                          <div key={bk.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-black text-sm text-slate-900">{bk.customer_name}</span>
                                <p className="text-xs text-slate-500 font-medium">Phone: {bk.contact_number}</p>
                              </div>
                              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                                PDI PENDING
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 space-y-1">
                              <p>Model: <span className="text-slate-900 font-extrabold">{bk.vehicle_model || "Kinetic Green Zoom"}</span></p>
                              <p>Booking Ref: <span className="font-mono text-[#04a700] font-bold">{bk.booking_id || `BK-${bk.id}`}</span></p>
                            </div>
                            <button
                              onClick={() => openPdiModal(bk)}
                              className="w-full py-2.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold transition-all shadow-md shadow-[#04a700]/20"
                            >
                              Execute 5-Step Inspection Checklist
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SEGMENT B: CUSTOMER HANDOVERS */}
                {pdiSegment === "handover" && (
                  <div className="bg-white border border-emerald-100/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#04a700]" /> Deliveries & Customer Handovers
                    </h3>

                    {pendingHandovers.length === 0 ? (
                      <EmptyState title="No Deliveries Pending" description="All ready customer vehicle handovers are fulfilled." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingHandovers.map((inv: any) => (
                          <div key={inv.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-black text-sm text-slate-900">{inv.customer_name}</span>
                                <p className="text-xs text-slate-500 font-medium">Contact: {inv.customer_contact}</p>
                              </div>
                              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                                {inv.delivery_status || "Ready"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 space-y-1">
                              <p>Invoice #: <span className="font-mono text-[#04a700] font-bold">{inv.invoice_number || `INV-${inv.id}`}</span></p>
                              <p>Amount Settled: <span className="text-slate-900 font-black">₹{inv.sale_price}</span></p>
                            </div>
                            <button
                              onClick={() => openHandoverModal(inv)}
                              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                            >
                              Verify Items & Complete Delivery
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: DAILY GEOLOCATED CHECK-IN */}
            {activeTab === "attendance" && (
              <AttendanceView role="staff" />
            )}

            {/* TAB 6: MY PROFILE */}
            {activeTab === "profile" && (
              <ProfileView />
            )}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav role="staff" activeTab={activeTab} />

        {/* MODAL 1: RECEIVE SHIPMENT (ADD VEHICLE UNIT) */}
        {isAddUnitOpen && (
          <Modal isOpen={isAddUnitOpen} title="Receive New Shipment Unit" onClose={() => setIsAddUnitOpen(false)}>
            <form onSubmit={handleAddUnitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Vehicle Model</label>
                <select
                  value={newUnitForm.model}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, model: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                >
                  {vehicleModels.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.model_name} (₹{m.base_price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Godown Location</label>
                <select
                  value={newUnitForm.location}
                  onChange={(e) => setNewUnitForm({ ...newUnitForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                >
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">VIN Code</label>
                  <input
                    type="text"
                    value={newUnitForm.vin_number}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, vin_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-[#04a700]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Color Variant</label>
                  <select
                    value={newUnitForm.color}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, color: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                  >
                    <option value="Green">Green</option>
                    <option value="Red">Red</option>
                    <option value="Blue">Blue</option>
                    <option value="Orange">Orange</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Motor Serial Number</label>
                  <input
                    type="text"
                    value={newUnitForm.motor_number}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, motor_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-[#04a700]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chassis Number</label>
                  <input
                    type="text"
                    value={newUnitForm.chassis_number}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, chassis_number: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-[#04a700]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#04a700] text-white font-bold hover:bg-[#038a00] shadow-md shadow-[#04a700]/20"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 2: LOG BATTERY UNIT */}
        {isAddBatteryOpen && (
          <Modal isOpen={isAddBatteryOpen} title="Log Battery to Stock Registry" onClose={() => setIsAddBatteryOpen(false)}>
            <form onSubmit={handleAddBatterySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Battery Serial Number</label>
                <input
                  type="text"
                  value={newBatteryForm.serial_number}
                  onChange={(e) => setNewBatteryForm({ ...newBatteryForm, serial_number: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-bold focus:outline-none focus:border-[#04a700]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Battery Code</label>
                  <input
                    type="text"
                    value={newBatteryForm.battery_code}
                    onChange={(e) => setNewBatteryForm({ ...newBatteryForm, battery_code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Capacity</label>
                  <input
                    type="text"
                    value={newBatteryForm.capacity}
                    onChange={(e) => setNewBatteryForm({ ...newBatteryForm, capacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Godown Storage Location</label>
                <select
                  value={newBatteryForm.location}
                  onChange={(e) => setNewBatteryForm({ ...newBatteryForm, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                >
                  {locations.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddBatteryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#04a700] text-white font-bold hover:bg-[#038a00] shadow-md shadow-[#04a700]/20"
                >
                  Log Battery
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 3: STOCK TRANSFER REQUEST */}
        {isTransferOpen && selectedUnitForTransfer && (
          <Modal isOpen={isTransferOpen} title="Request Stock Transfer" onClose={() => setIsTransferOpen(false)}>
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-slate-900 font-bold">Unit: {selectedUnitForTransfer.model_name || "EV Scooter"}</p>
                <p className="text-[#04a700] font-mono font-bold">VIN: {selectedUnitForTransfer.vin_number}</p>
                <p className="text-slate-600 font-medium">Current Godown: {selectedUnitForTransfer.location_name}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Destination Godown</label>
                <select
                  value={transferForm.to_location}
                  onChange={(e) => setTransferForm({ ...transferForm, to_location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-[#04a700]"
                >
                  {locations.filter(l => l.id !== selectedUnitForTransfer.location).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#04a700] text-white font-bold hover:bg-[#038a00] shadow-md shadow-[#04a700]/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* MODAL 4: 5-STEP PDI INSPECTION CHECKLIST */}
        {isPdiModalOpen && selectedBookingForPdi && (
          <Modal isOpen={isPdiModalOpen} title="5-Step Pre-Delivery Inspection (PDI)" onClose={() => setIsPdiModalOpen(false)}>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-900 font-black block">{selectedBookingForPdi.customer_name}</span>
                <span className="text-slate-600 font-medium block">Model: {selectedBookingForPdi.vehicle_model}</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "bodywork", label: "1. Bodywork & Scratch-Free Paint Audit" },
                  { key: "electricals", label: "2. Battery FIFO Connection & Electronics Test" },
                  { key: "brakes_tires", label: "3. Tire Pressure & Dual-Disc Brake Check" },
                  { key: "controls", label: "4. Digital Speedometer & Acceleration Test" },
                  { key: "documents", label: "5. Chassis Code & Warranty Booklet Verification" }
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setPdiChecks({ ...pdiChecks, [item.key]: !pdiChecks[item.key as keyof typeof pdiChecks] })}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      pdiChecks[item.key as keyof typeof pdiChecks]
                        ? "bg-emerald-50 border-emerald-300 text-slate-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {pdiChecks[item.key as keyof typeof pdiChecks] ? (
                      <CheckCircle2 className="h-4 w-4 text-[#04a700]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  onClick={() => setIsPdiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPdiCheck}
                  className="px-4 py-2 rounded-xl bg-[#04a700] text-white font-bold hover:bg-[#038a00] shadow-md shadow-[#04a700]/20"
                >
                  Pass & Verify PDI
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 5: CUSTOMER HANDOVER & DELIVERY */}
        {isHandoverModalOpen && selectedInvoiceForHandover && (
          <Modal isOpen={isHandoverModalOpen} title="Customer Delivery & Key Handover" onClose={() => setIsHandoverModalOpen(false)}>
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-900 font-black block">{selectedInvoiceForHandover.customer_name}</span>
                <span className="text-[#04a700] font-mono font-bold block">{selectedInvoiceForHandover.invoice_number}</span>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Delivery Items Verification</label>
                {[
                  { key: "keys", label: "2x Original Ignition Keys Delivered" },
                  { key: "charger", label: "Portable Fast Charger Included" },
                  { key: "manual", label: "Owner Manual & Service Booklet" },
                  { key: "insurance_docs", label: "Tax Invoice & Insurance Documents Signed" }
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => setHandoverChecks({ ...handoverChecks, [item.key]: !handoverChecks[item.key as keyof typeof handoverChecks] })}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      handoverChecks[item.key as keyof typeof handoverChecks]
                        ? "bg-emerald-50 border-emerald-300 text-slate-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {handoverChecks[item.key as keyof typeof handoverChecks] ? (
                      <CheckCircle2 className="h-4 w-4 text-[#04a700]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitHandover}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Complete Delivery Handover
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardSmoothScroll>
  );
}
