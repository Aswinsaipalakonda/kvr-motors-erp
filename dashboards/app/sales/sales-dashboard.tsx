"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
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
import SearchableSelect from "../components/SearchableSelect";

import { lookupVehicleUnit, getVehicleModels } from "../services/vehicles";
import { getBatteries, checkFifo, createFifoOverride, getFifoOverrides } from "../services/batteries";
import { getLeads, createLead, updateLead } from "../services/leads";
import { createBooking, getBookings, updateBooking } from "../services/bookings";
import { createSalesInvoice, getSalesInvoices } from "../services/sales";
import MelaSubSidebar from "../components/MelaSubSidebar";
import {
  getMelaInventory,
  createMelaBooking,
  getMelaBookings,
  updateMelaBooking,
  getMelaSettingsList
} from "../services/mela";

import {
  TrendingUp,
  ListOrdered,
  PlusCircle,
  Compass,
  CreditCard,
  Phone,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Briefcase,
  UsersRound,
  FileCheck,
  CalendarDays,
  Target,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  FileSpreadsheet,
  Printer,
  MessageSquare,
  Share2
} from "lucide-react";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";


export default function SalesDashboard({ initialTab: initialTabProp }: { initialTab?: string } = {}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const derivedTab = lastSegment === "sales" ? "dashboard" : lastSegment;
  const initialTab = initialTabProp || derivedTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with browser back/forward navigation popstate events
  useEffect(() => {
    const handlePopState = () => {
      const segment = window.location.pathname.split("/").filter(Boolean).pop() || "dashboard";
      const tab = segment === "sales" ? "dashboard" : segment;
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const path = tab === "dashboard" ? "/sales" : `/sales/${tab}`;
    window.history.pushState({ path }, "", path);
  };

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [leadModelSearch, setLeadModelSearch] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

  // Auto-fill sales checkout VIN search
  const [vinQuery, setVinQuery] = useState("");
  const [autoFillResult, setAutoFillResult] = useState<any>(null);
  const [vinSearchError, setVinSearchError] = useState("");
  const [vinSearchLoading, setVinSearchLoading] = useState(false);

  // FIFO validation states
  const [selectedBattery, setSelectedBattery] = useState("");
  const [fifoWarning, setFifoWarning] = useState(false);
  const [overrideRequested, setOverrideRequested] = useState(false);
  const [batteriesList, setBatteriesList] = useState<any[]>([]);
  const [activeOverrideRequest, setActiveOverrideRequest] = useState<any>(null);
  const [oldestBatteryInStock, setOldestBatteryInStock] = useState<string>("BATT-00874");

  // Live database states
  const [liveLeadsList, setLiveLeadsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  const [liveBookingsList, setLiveBookingsList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [liveSalesList, setLiveSalesList] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  // Forms state bindings
  const emptyLead = { customer_name: "", contact_number: "", interested_vehicle: "", lead_source: "walk_in", status: "new_lead", notes: "", follow_up_date: "" };
  const [newLead, setNewLead] = useState({ ...emptyLead });
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Advance Booking form bindings
  const [newBooking, setNewBooking] = useState({
    customer_name: "",
    contact_number: "",
    vehicle_model: "",
    advance_amount: "",
    expiry_date: "",
    payment_mode: "Cash",
    payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" }
  });
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [selectedBookingInvoicePreview, setSelectedBookingInvoicePreview] = useState<any | null>(null);

  // Sales Checkout form bindings
  const [checkoutCustomerName, setCheckoutCustomerName] = useState("");
  const [checkoutContactNumber, setCheckoutContactNumber] = useState("");
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState("SBI Finance");
  const [checkoutSplitDetails, setCheckoutSplitDetails] = useState({ cash: "", card: "", upi: "", bajaj_finance: "" });
  const [checkoutInsurancePartner, setCheckoutInsurancePartner] = useState("Chola MS - Comprehensive 1+5 Yr");

  // Simplified FIFO Popup State
  const [fifoModalOpen, setFifoModalOpen] = useState(false);
  const [fifoModalData, setFifoModalData] = useState<{ recommended: any; selected: any } | null>(null);

  // Mela Campaign States
  const [melaInventoryList, setMelaInventoryList] = useState<any[]>([]);
  const [melaBookingsList, setMelaBookingsList] = useState<any[]>([]);
  const [melaLoading, setMelaLoading] = useState(false);
  const [createdMelaBookingResult, setCreatedMelaBookingResult] = useState<any>(null);
  const [activeMela, setActiveMela] = useState<any>(null);

  // Mela booking form state
  const [melaBookingName, setMelaBookingName] = useState("");
  const [melaBookingPhone, setMelaBookingPhone] = useState("");
  const [melaBookingModel, setMelaBookingModel] = useState("");
  const [melaBookingColor, setMelaBookingColor] = useState("");
  const [melaBookingBattery, setMelaBookingBattery] = useState("graphene");

  const loadLeadsData = async () => {
    try {
      setLeadsLoading(true);
      const leadsData = await getLeads().catch(() => []);
      const modelsData = await getVehicleModels().catch(() => []);
      if (user) {
        const myBranch = (user.branch || user.showroom || "").toLowerCase();
        const filtered = leadsData.filter((lead: any) => {
          if (lead.assigned_executive === user.id) return true;
          if (!myBranch) return true;
          const leadBranch = (lead.branch_name || lead.showroom_name || "").toLowerCase();
          return !leadBranch || leadBranch.includes(myBranch) || myBranch.includes(leadBranch);
        });
        setLiveLeadsList(filtered);
      } else {
        setLiveLeadsList(leadsData);
      }
      setVehicleModelsList(modelsData);
    } catch (e) {
      console.error("Failed to load leads or models:", e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadBatteries = async () => {
    try {
      const data = await getBatteries();
      setBatteriesList(data);
    } catch (e) {
      console.error("Failed to load batteries:", e);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await getBookings();
      setLiveBookingsList(data);
    } catch (e) {
      console.error("Failed to load bookings:", e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setSalesLoading(true);
      const data = await getSalesInvoices();
      setLiveSalesList(data);
    } catch (e) {
      console.error("Failed to load sales invoices:", e);
    } finally {
      setSalesLoading(false);
    }
  };

  const [melaVehiclesList, setMelaVehiclesList] = useState<any[]>([]);
  const [melaBatteriesList, setMelaBatteriesList] = useState<any[]>([]);
  const [melaCompatibilitiesList, setMelaCompatibilitiesList] = useState<any[]>([]);

  // Selection states for booking
  const [selectedMelaVehicleId, setSelectedMelaVehicleId] = useState("");
  const [selectedMelaBatteryId, setSelectedMelaBatteryId] = useState("");

  const loadMelaData = async () => {
    try {
      setMelaLoading(true);
      const [inv, bookings, settings, vehicles, batteries, compatibilities] = await Promise.all([
        getMelaInventory(),
        getMelaBookings(),
        getMelaSettingsList(),
        api.get("/mela-vehicles/").then((r: any) => r.data),
        api.get("/mela-batteries/").then((r: any) => r.data),
        api.get("/mela-compatibilities/").then((r: any) => r.data)
      ]);
      setMelaInventoryList(inv);
      setMelaBookingsList(bookings);
      setMelaVehiclesList(vehicles);
      setMelaBatteriesList(batteries);
      setMelaCompatibilitiesList(compatibilities);
      const active = settings.find((s: any) => s.is_active) || null;
      setActiveMela(active);
    } catch (e) {
      console.error("Failed to load Mela campaign details:", e);
    } finally {
      setMelaLoading(false);
    }
  };

  const handleMelaBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!melaBookingName.trim() || !melaBookingPhone.trim() || !selectedMelaVehicleId || !selectedMelaBatteryId) {
      showToast("Please fill all required booking fields.", "error");
      return;
    }
    const cleanMelaPhone = melaBookingPhone.trim().replace(/\D/g, "");
    if (cleanMelaPhone.length !== 10) {
      showToast("Contact phone must contain exactly 10 digits.", "error");
      return;
    }
    const payload = {
      customer_name: melaBookingName.trim(),
      customer_phone: melaBookingPhone.trim(),
      mela_vehicle: parseInt(selectedMelaVehicleId),
      mela_battery: parseInt(selectedMelaBatteryId)
    };
    try {
      setMelaLoading(true);
      const result = await createMelaBooking(payload);
      setCreatedMelaBookingResult(result);
      showToast("Mela Booking created successfully!");
      setMelaBookingName("");
      setMelaBookingPhone("");
      setSelectedMelaVehicleId("");
      setSelectedMelaBatteryId("");
      loadMelaData();
    } catch (err: any) {
      console.error("Failed to place Mela booking:", err);
      const msg = err.response?.data?.non_field_errors || err.response?.data?.error || "Failed to create booking. Stock might be unavailable.";
      showToast(Array.isArray(msg) ? msg[0] : String(msg), "error");
    } finally {
      setMelaLoading(false);
    }
  };

  const handleCancelMelaBooking = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this campaign booking? This will restore the campaign stock.")) return;
    try {
      await updateMelaBooking(id, { status: "cancelled" });
      showToast("Booking cancelled successfully.");
      loadMelaData();
    } catch {
      showToast("Failed to cancel booking.", "error");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadBatteries();
    loadLeadsData();
    loadBookings();
    loadSales();
    loadMelaData();
  }, []);

  // VIN / Mobile Search Auto-fill
  const handleVinSearch = async () => {
    setVinSearchError("");
    setAutoFillResult(null);
    const query = vinQuery.trim();
    if (!query) {
      setVinSearchError("Please enter a Mobile Number, VIN, Motor, or Chassis number.");
      return;
    }

    const cleanDigits = query.replace(/\D/g, "");
    if (cleanDigits.length === 10) {
      // Search active bookings for this customer phone
      const matchingBooking = liveBookingsList.find(
        (b) => b.contact_number === cleanDigits || b.contact_number?.replace(/\D/g, "") === cleanDigits
      );
      if (matchingBooking) {
        setCheckoutCustomerName(matchingBooking.customer_name || "");
        setCheckoutContactNumber(matchingBooking.contact_number || cleanDigits);
        setAutoFillResult({
          id: matchingBooking.vehicle_unit || 1,
          branchId: matchingBooking.branch || 1,
          vin: matchingBooking.vin_number || "RESERVED-HOLD",
          motor: "MOT-" + cleanDigits.slice(-5),
          chassis: "CHS-" + cleanDigits.slice(-5),
          model: matchingBooking.vehicle_model_name || "Kinetic Green EV",
          color: matchingBooking.color || "Standard",
          price: `₹ ${parseFloat(matchingBooking.advance_amount || 0).toLocaleString("en-IN")} Advance Paid`,
          branch: user?.branch || "Current Branch",
          status: "HOLD (Booked)",
          battery: "BATT-COMPATIBLE-01"
        });
        showToast(`Found booking for ${matchingBooking.customer_name}! Auto-filled.`);
        return;
      }
    }
    
    try {
      setVinSearchLoading(true);
      const data = await lookupVehicleUnit(query);
      setAutoFillResult({
        id: data.id,
        branchId: data.branch,
        vin: data.vin_number,
        motor: data.motor_number,
        chassis: data.chassis_number,
        model: data.model_name || "Kinetic Green E-Luna",
        color: data.color || "Green",
        price: data.base_price ? `₹ ${parseFloat(data.base_price).toLocaleString('en-IN')}` : "₹ 74,999",
        branch: data.branch_name || "Visakhapatnam Showroom",
        status: data.stock_status ? data.stock_status.charAt(0).toUpperCase() + data.stock_status.slice(1) : "Available",
        battery: data.assigned_battery || "BATT-00874"
      });
      showToast("Vehicle details auto-filled.");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "No matching vehicle unit or booking found for mobile number.";
      setVinSearchError(errorMsg);
      showToast("No vehicle unit or booking found.", "error");
    } finally {
      setVinSearchLoading(false);
    }
  };

  // Leads CRUD
  const openAddLead = () => {
    setEditingLeadId(null);
    setNewLead({ ...emptyLead });
    setIsAddLeadOpen(true);
  };

  const openEditLead = (lead: any) => {
    setEditingLeadId(lead.id);
    setNewLead({
      customer_name: lead.customer_name || "",
      contact_number: lead.contact_number || "",
      interested_vehicle: String(lead.interested_vehicle || ""),
      lead_source: lead.lead_source || "walk_in",
      status: lead.status || "new_lead",
      notes: lead.notes || "",
      follow_up_date: lead.follow_up_date || "",
    });
    setIsAddLeadOpen(true);
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.customer_name.trim()) {
      showToast("Please enter customer name.", "error");
      return;
    }
    let cleanPhone = newLead.contact_number.trim().replace(/\D/g, "");
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
    if (cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile contact number.", "error");
      return;
    }
    const vehicleId = newLead.interested_vehicle 
      ? parseInt(newLead.interested_vehicle) 
      : (vehicleModelsList[0]?.id || undefined);

    const payload: any = {
      customer_name: newLead.customer_name.trim(),
      contact_number: cleanPhone,
      interested_vehicle: vehicleId,
      lead_source: newLead.lead_source || "walk_in",
      status: newLead.status || "new_lead",
      notes: newLead.notes.trim() || undefined,
      follow_up_date: newLead.follow_up_date || undefined,
      assigned_executive: user?.id || undefined
    };
    try {
      if (editingLeadId) {
        await updateLead(editingLeadId, payload);
        showToast("Customer lead details updated. ✓");
      } else {
        await createLead(payload);
        showToast("New customer registered successfully. ✓");
      }
      setNewLead({ ...emptyLead });
      setEditingLeadId(null);
      setIsAddLeadOpen(false);
      loadLeadsData();
    } catch (err: any) {
      console.error("Save lead error:", err);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : "Failed to save customer lead.";
      showToast(`Failed to register customer: ${msg}`, "error");
    }
  };


  const moveLeadToStage = async (leadId: number, newStatus: string) => {
    const lead = liveLeadsList.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    const prevStatus = lead.status;
    setLiveLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await updateLead(leadId, { status: newStatus });
      showToast(`Lead stage updated to ${newStatus.replace("_", " ")}.`);
    } catch {
      setLiveLeadsList((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: prevStatus } : l)));
      showToast("Failed to update lead stage.", "error");
    }
  };

  // Booking CRUD
  const openEditBooking = (bk: any) => {
    setEditingBookingId(bk.id);
    setNewBooking({
      customer_name: bk.customer_name || "",
      contact_number: bk.contact_number || "",
      vehicle_model: String(bk.vehicle_model || ""),
      advance_amount: String(bk.advance_amount || ""),
      expiry_date: bk.expiry_date || "",
      payment_mode: bk.payment_mode || "Cash",
      payment_split_details: bk.payment_split_details || { cash: "", card: "", upi: "", bajaj_finance: "" }
    });
    setIsCreateBookingOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customer_name.trim() || !newBooking.vehicle_model || !newBooking.advance_amount || !newBooking.expiry_date) return;
    if (newBooking.contact_number.trim()) {
      const cleanPhone = newBooking.contact_number.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        showToast("Contact number must contain exactly 10 digits.", "error");
        return;
      }
    }

    // Split validation
    if (newBooking.payment_mode === "split") {
      const cashVal = parseFloat(newBooking.payment_split_details.cash || "0");
      const cardVal = parseFloat(newBooking.payment_split_details.card || "0");
      const upiVal = parseFloat(newBooking.payment_split_details.upi || "0");
      const bajajVal = parseFloat(newBooking.payment_split_details.bajaj_finance || "0");
      const totalSplit = cashVal + cardVal + upiVal + bajajVal;
      const targetVal = parseFloat(newBooking.advance_amount || "0");
      if (totalSplit !== targetVal) {
        showToast(`Split total (₹${totalSplit.toLocaleString("en-IN")}) must equal Advance Amount (₹${targetVal.toLocaleString("en-IN")})`, "error");
        return;
      }
    }

    try {
      const payload: any = {
        customer_name: newBooking.customer_name.trim(),
        contact_number: newBooking.contact_number.trim(),
        vehicle_model: parseInt(newBooking.vehicle_model),
        advance_amount: parseFloat(newBooking.advance_amount),
        expiry_date: newBooking.expiry_date,
        payment_mode: newBooking.payment_mode,
        payment_split_details: newBooking.payment_mode === "split" ? {
          cash: parseFloat(newBooking.payment_split_details.cash || "0"),
          card: parseFloat(newBooking.payment_split_details.card || "0"),
          upi: parseFloat(newBooking.payment_split_details.upi || "0"),
          bajaj_finance: parseFloat(newBooking.payment_split_details.bajaj_finance || "0")
        } : null
      };

      if (editingBookingId) {
        await updateBooking(editingBookingId, payload);
        showToast("Booking updated.");
      } else {
        await createBooking({
          ...payload,
          booking_id: `BK-${Date.now().toString().slice(-6)}`,
          status: "pending"
        });
        showToast("Booking registered successfully.");
      }
      setNewBooking({
        customer_name: "",
        contact_number: "",
        vehicle_model: "",
        advance_amount: "",
        expiry_date: "",
        payment_mode: "Cash",
        payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" }
      });
      setEditingBookingId(null);
    } catch { showToast("Failed to save booking.", "error"); }
  };

  const handleCancelBooking = async (bk: any) => {
    try {
      await updateBooking(bk.id, { status: "cancelled" });
      showToast("Booking cancelled.");
      loadBookings();
    } catch { showToast("Failed to cancel booking.", "error"); }
  };

  const formatWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  };

  const numberToWordsIndian = (num: number): string => {
    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    num = Math.floor(num);
    if (num === 0) return "Zero";

    const convertLessThanOneHundred = (n: number): string => {
      if (n < 20) return a[n];
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    };

    const convertLessThanOneThousand = (n: number): string => {
      if (n >= 100) {
        return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanOneHundred(n % 100) : "");
      }
      return convertLessThanOneHundred(n);
    };

    let word = "";
    let crores = Math.floor(num / 10000000);
    num %= 10000000;
    let lakhs = Math.floor(num / 100000);
    num %= 100000;
    let thousands = Math.floor(num / 1000);
    num %= 1000;
    let remaining = num;

    if (crores > 0) {
      word += convertLessThanOneThousand(crores) + " Crore ";
    }
    if (lakhs > 0) {
      word += convertLessThanOneThousand(lakhs) + " Lakh ";
    }
    if (thousands > 0) {
      word += convertLessThanOneThousand(thousands) + " Thousand ";
    }
    if (remaining > 0) {
      word += convertLessThanOneThousand(remaining);
    }

    return word.trim() + " Rupees Only";
  };

  const generateTaxInvoiceHtml = (details: {
    invoiceNo: string;
    date: string;
    placeOfSupply: string;
    poDate: string;
    poNo: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    vehicleModel: string;
    color: string;
    vinNo: string;
    motorNo: string;
    batteryNo: string;
    chargerNo: string;
    totalPrice: number;
    paymentMode: string;
    executiveName: string;
    logoUrl: string;
    signatureUrl: string;
  }) => {
    const totalAmount = details.totalPrice;
    const taxableAmount = totalAmount / 1.05;
    const totalTax = totalAmount - taxableAmount;
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;

    const formattedTaxable = taxableAmount.toFixed(2);
    const formattedTax = totalTax.toFixed(2);
    const formattedCgst = cgstAmount.toFixed(2);
    const formattedSgst = sgstAmount.toFixed(2);
    const formattedTotal = totalAmount.toFixed(2);

    const priceWords = numberToWordsIndian(totalAmount);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${details.invoiceNo}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            margin: 20px;
            background-color: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          
          .invoice-header-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
          }
          .invoice-header-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
          }
          .company-details {
            width: 55%;
          }
          .invoice-meta {
            width: 45%;
            padding: 0 !important;
          }
          .invoice-meta-table {
            width: 100%;
            border-collapse: collapse;
            height: 100%;
          }
          .invoice-meta-table td {
            border: none;
            border-bottom: 1px solid #000;
            padding: 6px 8px;
          }
          .invoice-meta-table tr:last-child td {
            border-bottom: none;
          }
          
          .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          .logo-text {
            font-size: 20px;
            font-weight: 900;
            color: #04a700;
            letter-spacing: 1px;
          }
          
          .bill-to-section {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .bill-to-section td {
            padding: 8px;
            vertical-align: top;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .totals-container-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .totals-container-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
          }
          .description-column {
            width: 55%;
          }
          .amounts-column {
            width: 45%;
            padding: 0 !important;
          }
          .amounts-table {
            width: 100%;
            border-collapse: collapse;
          }
          .amounts-table td {
            border: none;
            border-bottom: 1px solid #000;
            padding: 6px 8px;
          }
          .amounts-table tr:last-child td {
            border-bottom: none;
          }
          
          .tax-breakdown-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .tax-breakdown-table th, .tax-breakdown-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-size: 10px;
          }
          .tax-breakdown-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .bank-terms-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            border-top: none;
          }
          .bank-terms-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
            width: 33.33%;
          }
          
          @media print {
            body {
              margin: 10px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 5px; font-weight: bold; font-size: 14px;" class="text-center">Tax Invoice</div>
        <div style="font-size: 9px; font-weight: bold; margin-bottom: 5px;" class="text-right">ORIGINAL FOR RECIPIENT</div>
        
        <table class="invoice-header-table">
          <tr>
            <td class="company-details">
              <div class="logo-container">
                <img src="${details.logoUrl}" alt="KVR Logo" style="height: 45px; width: auto; object-fit: contain;" />
                <div class="logo-text">KVR MOTORS</div>
              </div>
              <div style="font-size: 10px; line-height: 1.3;">
                GROUND FLOOR, 54-1-13, ISUKATHOTA, MADDILAPALEM, KRANTHINAGAR, VISHAKAPATNAM, ANDHRAPRADESH,<br/>
                Phone no.: 9391099576<br/>
                Email: kvr.kinetic@gmail.com<br/>
                GSTIN: 37GEWPK2874E1ZU<br/>
                State: 37-Andhra Pradesh
              </div>
            </td>
            <td class="invoice-meta">
              <table class="invoice-meta-table">
                <tr>
                  <td class="bold">Invoice No.</td>
                  <td class="text-right bold">${details.invoiceNo}</td>
                </tr>
                <tr>
                  <td class="bold">Date</td>
                  <td class="text-right">${details.date}</td>
                </tr>
                <tr>
                  <td>Place of supply</td>
                  <td class="text-right">${details.placeOfSupply}</td>
                </tr>
                <tr>
                  <td>PO date</td>
                  <td class="text-right">${details.poDate}</td>
                </tr>
                <tr>
                  <td>PO number</td>
                  <td class="text-right">${details.poNo}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table class="bill-to-section">
          <tr>
            <td>
              <div class="bold" style="font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Bill To</div>
              <div class="bold" style="font-size: 12px; color: #000;">${details.customerName}</div>
              <div style="margin-top: 4px; font-weight: 500;">
                ${details.customerAddress}<br/>
                Contact No. : ${details.customerPhone}<br/>
                State: 37-Andhra Pradesh
              </div>
            </td>
          </tr>
        </table>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 25%;" class="text-left">Item name</th>
              <th style="width: 10%;">HSN/ SAC</th>
              <th style="width: 8%;">Colour</th>
              <th style="width: 12%;">VIN No</th>
              <th style="width: 10%;">Motor No</th>
              <th style="width: 10%;">Battery No</th>
              <th style="width: 10%;">Charger No</th>
              <th style="width: 5%;">Qty</th>
              <th style="width: 5%;">Unit</th>
              <th style="width: 10%;" class="text-right">Price/ Unit</th>
              <th style="width: 10%;" class="text-right">GST</th>
              <th style="width: 10%;" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td class="text-left bold">${details.vehicleModel}</td>
              <td>87116020</td>
              <td>${details.color}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.vinNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.motorNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.batteryNo}</td>
              <td style="font-size: 9px; font-weight: bold; word-break: break-all;">${details.chargerNo}</td>
              <td>1</td>
              <td>VH</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (5%)</td>
              <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <table class="totals-container-table">
          <tr>
            <td class="description-column">
              <div style="margin-bottom: 8px;">
                <span class="bold">Invoice Amount in Words:</span><br/>
                <span style="font-style: italic; font-weight: bold; font-size: 11px;">${priceWords}</span>
              </div>
              <div style="font-size: 9px; line-height: 1.3; border-top: 1px solid #eee; pt-6;">
                <span class="bold" style="text-decoration: underline;">Description</span><br/>
                BATTERY WARRANTY - 3YEARS (or) 30,000KM (Whichever comes first)<br/>
                MOTOR WARRANTY - 2YEARS<br/>
                CONTROLLER WARRANTY - 2YEARS<br/>
                CHARGER WARRANTY - 1YEAR<br/>
                <span class="bold">NOTE ; NO FREE SERVICES</span>
              </div>
              <div style="margin-top: 8px; border-top: 1px solid #eee; pt-4;">
                <span class="bold">Payment mode:</span><br/>
                <span>KVR Motors UPI (351828801952 - 590201007448), ${details.paymentMode}</span>
              </div>
            </td>
            <td class="amounts-column">
              <table class="amounts-table">
                <tr>
                  <td class="bold">Amounts</td>
                  <td></td>
                </tr>
                <tr>
                  <td>Sub Total</td>
                  <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td class="bold">Total</td>
                  <td class="text-right bold">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Received</td>
                  <td class="text-right bold" style="color: #04a700;">₹ ${parseFloat(formattedTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td>Balance</td>
                  <td class="text-right bold">₹ 0.00</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <table class="tax-breakdown-table">
          <thead>
            <tr>
              <th rowspan="2">HSN/ SAC</th>
              <th rowspan="2">Taxable amount</th>
              <th colspan="2">CGST</th>
              <th colspan="2">SGST</th>
              <th rowspan="2">Total Tax Amount</th>
            </tr>
            <tr>
              <th>Rate</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="bold">87116020</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td>2.5%</td>
              <td class="text-right">₹ ${parseFloat(formattedCgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td>2.5%</td>
              <td class="text-right">₹ ${parseFloat(formattedSgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right bold">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="bold" style="background-color: #fafafa;">
              <td>Total</td>
              <td class="text-right">₹ ${parseFloat(formattedTaxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td class="text-right">₹ ${parseFloat(formattedCgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td></td>
              <td class="text-right">₹ ${parseFloat(formattedSgst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td class="text-right">₹ ${parseFloat(formattedTax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <table class="bank-terms-table">
          <tr>
            <td>
              <div class="bold" style="text-decoration: underline; margin-bottom: 4px;">Bank Details</div>
              Name : ICICI BANK LIMITED, SRIKAKULAM<br/>
              Account No. : 070005500380<br/>
              IFSC code : ICIC0000700<br/>
              Account holder's name : KVR MOTORS
            </td>
            <td>
              <div class="bold" style="text-decoration: underline; margin-bottom: 4px;">Terms and conditions</div>
              Thanks You!<br/>
              Please Refer to Terms and Conditions in Page 2
            </td>
            <td class="text-center" style="position: relative; vertical-align: top;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">For KVR MOTORS</div>
              <div style="height: 35px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                <img src="${details.signatureUrl}" alt="Proprietor Signature" style="max-height: 35px; width: auto; object-fit: contain;" />
              </div>
              <div style="font-style: italic; font-weight: bold; color: #444; margin-bottom: 5px;">K. V. Raghava Reddy</div>
              <div class="bold" style="border-top: 1px solid #000; padding-top: 4px; font-size: 9px;">Proprietor</div>
            </td>
          </tr>
        </table>
        
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  const handlePrintSalesInvoice = (inv: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      showToast("Popup blocker prevented opening the print invoice.", "error");
      return;
    }

    const formattedDate = inv.sale_date
      ? new Date(inv.sale_date).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const printHtml = generateTaxInvoiceHtml({
      invoiceNo: inv.invoice_number || `INV-${inv.id}`,
      date: formattedDate,
      placeOfSupply: "37-Andhra Pradesh",
      poDate: formattedDate,
      poNo: inv.invoice_number || "—",
      customerName: inv.customer_name,
      customerPhone: inv.customer_contact,
      customerAddress: "2-181, OLD DAIRY FARM, VISAKHAPATNAM - 530040",
      vehicleModel: inv.model_name || "DYNAMO X1 (60V 31.2AH)",
      color: inv.vehicle_color || "BLACK",
      vinNo: inv.vin_number || "—",
      motorNo: inv.motor_number || "R6VA014COMT010820",
      batteryNo: inv.battery_serial || "UESL026F01493",
      chargerNo: "XEVXNCMDZ06AEC30375",
      totalPrice: parseFloat(inv.sale_price || 0),
      paymentMode: inv.payment_mode || "Cash",
      executiveName: inv.executive_name || "Sales Executive",
      logoUrl: `${origin}/icon.png`,
      signatureUrl: `${origin}/signature.png`
    });

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handlePrintBookingInvoice = (bk: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      showToast("Popup blocker prevented opening the print receipt.", "error");
      return;
    }

    const formattedDate = bk.booking_date
      ? new Date(bk.booking_date).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const printHtml = generateTaxInvoiceHtml({
      invoiceNo: bk.booking_id || `BK-${bk.id}`,
      date: formattedDate,
      placeOfSupply: "37-Andhra Pradesh",
      poDate: formattedDate,
      poNo: bk.booking_id || "—",
      customerName: bk.customer_name,
      customerPhone: bk.contact_number,
      customerAddress: "2-181, OLD DAIRY FARM, VISAKHAPATNAM - 530040",
      vehicleModel: bk.vehicle_model_name || "DYNAMO X1 (60V 31.2AH)",
      color: "BLACK",
      vinNo: bk.vin_number || "AWAITING ALLOCATION",
      motorNo: "R6VA014COMT010820",
      batteryNo: "UESL026F01493",
      chargerNo: "XEVXNCMDZ06AEC30375",
      totalPrice: parseFloat(bk.advance_amount || 0),
      paymentMode: bk.payment_mode || "Cash",
      executiveName: bk.executive_name || "Sales Executive",
      logoUrl: `${origin}/icon.png`,
      signatureUrl: `${origin}/signature.png`
    });

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleBatterySelect = (serial: string) => {
    if (!serial) {
      setSelectedBattery("");
      return;
    }
    const available = batteriesList
      .filter(b => b.status === "available" || b.status === "Available")
      .sort((a, b) => new Date(a.purchase_date || 0).getTime() - new Date(b.purchase_date || 0).getTime());
    
    const recommended = available[0];
    const chosen = batteriesList.find(b => b.serial_number === serial);

    if (recommended && recommended.serial_number !== serial) {
      setFifoModalData({ recommended, selected: chosen || { serial_number: serial } });
      setFifoModalOpen(true);
    }
    setSelectedBattery(serial);
  };

  // Sales Checkout submission
  const handleSalesCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutCustomerName.trim()) {
      showToast("Please enter customer name.", "error");
      return;
    }
    const cleanCheckoutPhone = checkoutContactNumber.trim().replace(/\D/g, "");
    if (cleanCheckoutPhone.length !== 10) {
      showToast("Contact number must contain exactly 10 digits.", "error");
      return;
    }
    const batteryObj = batteriesList.find(b => b.serial_number === selectedBattery || String(b.id) === String(selectedBattery));
    const targetBranchId = autoFillResult?.branchId 
      ? (typeof autoFillResult.branchId === "number" ? autoFillResult.branchId : 1) 
      : 1;

    const unitId = autoFillResult?.id || 1;

    try {
      await createSalesInvoice({
        customer_name: checkoutCustomerName.trim(),
        customer_contact: cleanCheckoutPhone,
        vehicle_unit: unitId,
        assigned_battery: batteryObj?.id || null,
        sale_price: 74999,
        payment_mode: "SBI Finance",
        delivery_status: "processing",
        branch: targetBranchId
      });
      // Mark matching lead status as 'won' and booking as 'converted' upon final sale completion
      const matchingLead = liveLeadsList.find(l => l.contact_number === cleanCheckoutPhone || l.customer_name.toLowerCase() === checkoutCustomerName.trim().toLowerCase());
      if (matchingLead) {
        try { await updateLead(matchingLead.id, { status: "won" }); } catch {}
      }
      const matchingBk = liveBookingsList.find(b => b.contact_number === cleanCheckoutPhone || b.customer_name.toLowerCase() === checkoutCustomerName.trim().toLowerCase());
      if (matchingBk) {
        try { await updateBooking(matchingBk.id, { status: "converted" }); } catch {}
      }
      showToast("Sale confirmed! Submitted to Supervisor for payment verification. ✓");
      setCheckoutCustomerName(""); 
      setCheckoutContactNumber("");
      setAutoFillResult(null); 
      setVinQuery(""); 
      setSelectedBattery("");
      loadSales();
      loadBookings();
      loadLeadsData();
    } catch (err: any) { 
      const serverErr = err.response?.data;
      let msg = "Failed to confirm sale.";
      if (serverErr) {
        if (typeof serverErr === "string") msg = serverErr;
        else if (serverErr.assigned_battery) msg = Array.isArray(serverErr.assigned_battery) ? serverErr.assigned_battery[0] : String(serverErr.assigned_battery);
        else if (serverErr.vehicle_unit) msg = Array.isArray(serverErr.vehicle_unit) ? serverErr.vehicle_unit[0] : String(serverErr.vehicle_unit);
        else if (serverErr.non_field_errors) msg = Array.isArray(serverErr.non_field_errors) ? serverErr.non_field_errors[0] : String(serverErr.non_field_errors);
        else if (serverErr.detail) msg = String(serverErr.detail);
      }
      showToast(msg, "error"); 
    }
  };

  // Aggregates & Charts
  const leadStatusData = useMemo(() => {
    const fresh = liveLeadsList.filter(l => l.status === "new_lead").length;
    const contacted = liveLeadsList.filter(l => l.status === "contacted").length;
    const followUp = liveLeadsList.filter(l => l.status === "follow_up").length;
    const nego = liveLeadsList.filter(l => l.status === "negotiation").length;
    const won = liveLeadsList.filter(l => l.status === "won").length;
    return [
      { name: "New", value: fresh || 8, color: "#3b82f6" },
      { name: "Contacted", value: contacted || 6, color: "#10b981" },
      { name: "Follow-up", value: followUp || 5, color: "#f59e0b" },
      { name: "Negotiation", value: nego || 3, color: "#8b5cf6" },
      { name: "Won", value: won || 2, color: "#22c55e" }
    ];
  }, [liveLeadsList]);

  const myFollowups = useMemo(() => {
    return liveLeadsList
      .filter(l => l.status === "follow_up" || l.follow_up_date)
      .map((l) => ({
        id: l.id,
        rawLead: l,
        name: l.customer_name,
        date: l.follow_up_date || "Today",
        model: l.model_name || "Kinetic Green E-Luna",
        contact: l.contact_number,
        status: l.status,
        status_display: l.status_display || l.status,
        purpose: "Outbound Callback",
        priority: "High"
      }));
  }, [liveLeadsList]);

  const customersList = useMemo(() => {
    const list: any[] = [];
    const addedKeys = new Set<string>();

    // 1. Invoiced / Completed Sales
    liveSalesList.forEach((s) => {
      const key = (s.customer_contact || s.customer_name || "").trim();
      if (s.customer_name && !addedKeys.has(key)) {
        if (key) addedKeys.add(key);
        list.push({
          name: s.customer_name,
          contact: s.customer_contact || "N/A",
          model: s.model_name || s.vehicle_name || "EV Model",
          invDate: s.sale_date || "Completed",
          delStatus: s.delivery_status || "delivered",
          notes: s.insurance_partner || "Comprehensive package",
          pdiDoneBy: s.sales_executive_name || "Staff",
          nextService: "Scheduled"
        });
      }
    });

    // 2. Active Bookings
    liveBookingsList.forEach((b) => {
      const key = (b.contact_number || b.customer_name || "").trim();
      if (b.customer_name && !addedKeys.has(key)) {
        if (key) addedKeys.add(key);
        list.push({
          name: b.customer_name,
          contact: b.contact_number || "N/A",
          model: b.model_name || "EV Model",
          invDate: b.booking_date || "Reserved",
          delStatus: "booking_reserved",
          notes: `Advance ₹${Number(b.advance_amount || 0).toLocaleString('en-IN')}`,
          pdiDoneBy: "Sales Exec",
          nextService: "Pending Delivery"
        });
      }
    });

    // 3. Customer Lead Enquiries
    liveLeadsList.forEach((l) => {
      const key = (l.contact_number || l.customer_name || "").trim();
      if (l.customer_name && !addedKeys.has(key)) {
        if (key) addedKeys.add(key);
        list.push({
          name: l.customer_name,
          contact: l.contact_number || "N/A",
          model: l.interested_vehicle_name || l.model_name || "Enquiry Model",
          invDate: l.follow_up_date || "New Lead",
          delStatus: (l.status || "enquiry").replace("_", " "),
          notes: l.notes || "Lead Customer",
          pdiDoneBy: l.executive_name || "Sales Exec",
          nextService: "In Pipeline"
        });
      }
    });

    return list;
  }, [liveSalesList, liveBookingsList, liveLeadsList]);


  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden text-slate-800">
      <DashboardSidebar role="sales" activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab.startsWith("mela_") && (
        <MelaSubSidebar role="sales" activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFDFB]">
        {/* Navbar */}
        <Navbar 
          role="sales" 
          title={
            activeTab === "dashboard"
              ? "Sales Terminal"
              : activeTab === "sales_checkout"
              ? "Sales Checkout & Billing"
              : activeTab === "followups"
              ? "Follow-ups Agenda"
              : activeTab === "customers"
              ? "Showroom Customer Profiles"
              : activeTab === "bookings"
              ? "Advance Bookings"
              : activeTab === "notifications"
              ? "Notifications"
              : activeTab === "profile"
              ? "My Sales Profile"
              : activeTab === "attendance"
              ? "Daily Check-in"
              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")
          } 
        />

        <DashboardSmoothScroll className={`p-4 pb-28 lg:pb-6 ${
          activeTab.startsWith("mela_") 
            ? "pt-0 md:pt-4 flex flex-col space-y-4 bg-[#FAFDFB]" 
            : activeTab === "dashboard" 
              ? "flex flex-col space-y-4 bg-[#FAFDFB]" 
              : "space-y-6"
        }`}>
          
          {/* Mobile Mela Sub-Navigation Tab Bar */}
          {activeTab.startsWith("mela_") && (
            <div className="flex md:hidden overflow-x-auto gap-1.5 py-1.5 border-b border-slate-100 scrollbar-none shrink-0 bg-white -mx-4 px-4 sticky top-0 z-30 shadow-sm">
              {[
                { id: "mela_booking_form", label: "New Booking", icon: PlusCircle },
                { id: "mela_my_bookings", label: "My Bookings", icon: ListOrdered },
                { id: "mela_reports", label: "Performance", icon: TrendingUp },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                const TIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateTo(tab.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-normal transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#04a700] to-emerald-600 text-white shadow-md shadow-emerald-500/10 font-bold"
                        : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-normal"
                    }`}
                  >
                    <TIcon className="h-3 w-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* MELA VIEWS FOR SALES EXECUTIVE */}
          {activeTab === "mela_booking_form" && (
            <div className="space-y-6 text-left">
              {!activeMela || !activeMela.is_active ? (
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center max-w-xl mx-auto space-y-4 my-12">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Mela Campaign Inactive</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    There is currently no active Mela Campaign configured by the owner. Please contact your manager or owner to activate the campaign.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* Catalog Selector Grid */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="mb-2">
                      <h3 className="text-sm font-black text-slate-805 tracking-tight">Active Mela Campaign Catalog</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Configure your selection by choosing a vehicle first, then a supported battery.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                      {/* Vehicle selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">1. Select Campaign Vehicle Model</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {melaVehiclesList?.map((v) => {
                            const isLow = v.remaining_quantity <= 2;
                            const isSelected = selectedMelaVehicleId === String(v.id);
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMelaVehicleId(String(v.id));
                                  setSelectedMelaBatteryId(""); // reset battery choice
                                }}
                                className={`p-4 rounded-xl border text-left transition-all relative ${
                                  isSelected
                                    ? "border-[#04a700] bg-emerald-50/20 ring-2 ring-[#04a700]/15"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-xs font-bold text-slate-800">{v.model_name}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    isLow ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                  }`}>
                                    {v.remaining_quantity} left
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-450 font-semibold mt-1">Color: {v.color}</div>
                                <div className="text-xs font-bold text-emerald-700 mt-2">₹ {parseFloat(v.price).toLocaleString("en-IN")}</div>
                                {isLow && (
                                  <div className="text-[9px] text-rose-600 font-bold mt-1">
                                    ⚠️ Low Stock! {v.restock_date ? `Expected Restock: ${v.restock_date}` : ""}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Battery selection (Filtered by Compatibility) */}
                      {selectedMelaVehicleId && (
                        <div className="space-y-2 pt-4 border-t border-slate-100 animate-fadeIn">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">2. Select Supported Battery Type</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(() => {
                              // Filter compatibility mappings matching the selected vehicle id
                              const compatibleBatteryIds = melaCompatibilitiesList
                                ?.filter(c => String(c.vehicle_stock) === selectedMelaVehicleId)
                                .map(c => c.battery_stock);

                              const filteredBatteries = melaBatteriesList?.filter(b => compatibleBatteryIds?.includes(b.id));

                              if (filteredBatteries?.length === 0) {
                                return <p className="text-[11px] text-slate-400">No compatible batteries registered for this vehicle.</p>;
                              }

                              return filteredBatteries?.map((b) => {
                                const isLow = b.remaining_quantity <= 2;
                                const isSelected = selectedMelaBatteryId === String(b.id);
                                return (
                                  <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setSelectedMelaBatteryId(String(b.id))}
                                    className={`p-4 rounded-xl border text-left transition-all relative ${
                                      isSelected
                                        ? "border-[#04a700] bg-emerald-50/20 ring-2 ring-[#04a700]/15"
                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="text-xs font-bold text-slate-800">{b.battery_name}</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        isLow ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                      }`}>
                                        {b.remaining_quantity} left
                                      </span>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-700 mt-2">₹ {parseFloat(b.price).toLocaleString("en-IN")}</div>
                                    {isLow && (
                                      <div className="text-[9px] text-rose-600 font-bold mt-1">
                                        ⚠️ Low Stock! {b.restock_date ? `Expected Restock: ${b.restock_date}` : ""}
                                      </div>
                                    )}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking form side panel */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Raise Mela Booking</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Enter customer details to reserve the selected EV configuration.</p>
                    </div>

                    <form onSubmit={handleMelaBookingSubmit} className="space-y-4 text-xs font-semibold text-slate-655">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Naidu"
                          value={melaBookingName}
                          onChange={(e) => setMelaBookingName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={melaBookingPhone}
                          onChange={(e) => setMelaBookingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Selected Model:</span>
                          <span className="text-slate-800 font-extrabold">
                            {melaVehiclesList.find(v => String(v.id) === selectedMelaVehicleId)?.model_name || "None Selected"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Color variant:</span>
                          <span className="text-slate-800 font-extrabold capitalize">
                            {melaVehiclesList.find(v => String(v.id) === selectedMelaVehicleId)?.color || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Battery Option:</span>
                          <span className="text-slate-800 font-extrabold capitalize">
                            {melaBatteriesList.find(b => String(b.id) === selectedMelaBatteryId)?.battery_name || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                          <span className="text-slate-600 font-black">Total Price:</span>
                          <span className="text-emerald-700 font-black font-mono">
                            {(() => {
                              const vPrice = parseFloat(melaVehiclesList.find(v => String(v.id) === selectedMelaVehicleId)?.price || "0");
                              const bPrice = parseFloat(melaBatteriesList.find(b => String(b.id) === selectedMelaBatteryId)?.price || "0");
                              return vPrice || bPrice ? `₹ ${(vPrice + bPrice).toLocaleString("en-IN")}` : "—";
                            })()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={melaLoading || !selectedMelaVehicleId || !selectedMelaBatteryId}
                        className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-[#04a700]/25 transition-all text-center flex justify-center items-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {melaLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                            <span>Reserving stock...</span>
                          </>
                        ) : (
                          <span>Confirm Unconfirmed Booking</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              {/* Success booking confirmation details modal */}
              {createdMelaBookingResult && (
                <Modal isOpen={!!createdMelaBookingResult} onClose={() => setCreatedMelaBookingResult(null)} title="Booking Reserved Successfully!">
                  <div className="p-4 space-y-4 text-center max-w-sm mx-auto">
                    <span className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </span>
                    
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Booking Reserved</h4>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">Provide this Booking ID to the customer for cash payment checkout with the Owner.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-655 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Booking ID:</span>
                        <span className="text-emerald-700 font-black font-mono tracking-wider">{createdMelaBookingResult.booking_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Running Serial No:</span>
                        <span className="text-slate-800 font-extrabold">#{createdMelaBookingResult.executive_serial_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer:</span>
                        <span className="text-slate-800 font-bold">{createdMelaBookingResult.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">EV Model:</span>
                        <span className="text-slate-800 font-bold">{createdMelaBookingResult.model_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price:</span>
                        <span className="text-emerald-700 font-black font-mono">₹ {parseFloat(createdMelaBookingResult.price).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreatedMelaBookingResult(null)}
                      className="w-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-[#04a700]/25 transition-all text-center"
                    >
                      Done
                    </button>
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
      )}

          {activeTab === "mela_my_bookings" && (
            <div className="space-y-6 text-left">
              <Table
                title="My Personal Campaign Bookings"
                headers={["Serial", "Booking ID", "Customer Name", "Contact Mobile", "Vehicle Model", "Specs", "Price", "Date", "Status", "Actions"]}
              >
                {melaBookingsList.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                    <td className="py-3.5 px-5 font-extrabold text-slate-400">#{bk.executive_serial_number}</td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-800">{bk.booking_id}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-700">{bk.customer_name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{bk.customer_phone}</td>
                    <td className="py-3.5 px-5 text-slate-800 font-medium">{bk.model_name}</td>
                    <td className="py-3.5 px-5 capitalize text-slate-500 font-bold">{bk.color} / {bk.battery_type}</td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-800">₹ {parseFloat(bk.price).toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{new Date(bk.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                        bk.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : bk.status === "delivered"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : bk.status === "cancelled"
                          ? "bg-rose-50 text-rose-750 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {bk.status_display || bk.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {bk.status === "unconfirmed" && (
                        <button
                          type="button"
                          onClick={() => handleCancelMelaBooking(bk.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {bk.status !== "unconfirmed" && <span className="text-slate-400 font-bold">—</span>}
                    </td>
                  </tr>
                ))}
                {melaBookingsList.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-450 font-semibold">
                      <EmptyState title="No Campaign Bookings" description="You have not created any bookings for this campaign yet." />
                    </td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {activeTab === "mela_reports" && (
            <div className="space-y-6 text-left">
              {/* Sales executive personal performance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DashboardCard
                  title="My Total Bookings"
                  value={`${melaBookingsList.length} Bookings`}
                  description="All statuses included"
                  icon={ShoppingBag}
                  color="blue"
                />
                <DashboardCard
                  title="My Completed Sales"
                  value={`${melaBookingsList.filter(b => b.status === "completed" || b.status === "delivered").length} Deliveries`}
                  description="Checked out by owner"
                  icon={CheckCircle2}
                  color="emerald"
                />
                <DashboardCard
                  title="My Campaign Billing"
                  value={`₹ ${melaBookingsList.filter(b => b.status === "completed" || b.status === "delivered").reduce((sum, b) => sum + parseFloat(b.price), 0).toLocaleString("en-IN")}`}
                  description="Total revenue generated"
                  icon={DollarSign}
                  color="emerald"
                />
              </div>

              {/* Personal bookings listing for reports */}
              <Table
                title="Performance Tracking Details"
                headers={["Serial", "Booking ID", "Customer Name", "Specs", "Price", "Date", "Status"]}
              >
                {melaBookingsList.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                    <td className="py-3 px-5 font-bold text-slate-450">#{bk.executive_serial_number}</td>
                    <td className="py-3 px-5 font-bold font-mono text-slate-800">{bk.booking_id}</td>
                    <td className="py-3 px-5 font-semibold text-slate-700">{bk.customer_name}</td>
                    <td className="py-3 px-5 capitalize text-slate-550">{bk.model_name} ({bk.color} - {bk.battery_type})</td>
                    <td className="py-3 px-5 font-bold font-mono text-slate-800">₹ {parseFloat(bk.price).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-5 text-slate-450 font-semibold">{new Date(bk.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                        bk.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : bk.status === "delivered" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : bk.status === "cancelled" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {bk.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {melaBookingsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-450">No performance details to track.</td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Add Lead", icon: Plus, onClick: openAddLead },
                  { label: "Record Booking", icon: CalendarDays, onClick: () => navigateTo("bookings") },
                  { label: "Sales Checkout", icon: CreditCard, onClick: () => navigateTo("sales_checkout") },
                  { label: "My Follow-ups", icon: Phone, onClick: () => navigateTo("followups") },
                ].map((qa, i) => {
                  const QAIcon = qa.icon;
                  return (
                    <button
                      key={i}
                      onClick={qa.onClick}
                      className="group flex items-center gap-2.5 bg-white border border-emerald-100/70 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-[#04a700]/40 hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                    >
                      <span className="h-9 w-9 shrink-0 rounded-full bg-[#04a700]/10 border border-[#04a700]/20 flex items-center justify-center text-[#04a700] group-hover:bg-[#04a700] group-hover:text-white transition-colors">
                        <QAIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-extrabold text-slate-700 truncate">{qa.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">

                <DashboardCard title="My Active Leads" value={leadsLoading ? "..." : `${liveLeadsList.length} Leads`} trend="Pipeline" trendType="success" description="Assigned leads status" icon={Compass} color="blue" onClick={() => navigateTo("leads")} />
                <DashboardCard title="Follow-ups Due" value={leadsLoading ? "..." : `${liveLeadsList.filter(l => l.status === "follow_up").length} Tasks`} trend="Pending Calls" trendType="neutral" description="Awaiting customer callback" icon={CalendarDays} color="amber" onClick={() => navigateTo("followups")} />
                <DashboardCard title="Personal Bookings" value={bookingsLoading ? "..." : `${liveBookingsList.filter(b => b.status === "confirmed").length} Reserved`} trend="Active lock" trendType="success" description="Stock locked allocations" icon={CreditCard} color="emerald" onClick={() => navigateTo("bookings")} />
                <DashboardCard title="My Units Sold" value={salesLoading ? "..." : `${liveSalesList.length} Units`} trend="MTD Billing" trendType="success" description="Total vehicles invoiced" icon={FileCheck} color="indigo" onClick={() => navigateTo("sales_checkout")} />
              </div>

              {/* Charts agenda Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Lead Status Chart */}
                <div className="bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-2">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Lead Status Distribution</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Ratio of active leads stages</p>
                  </div>
                  <div className="h-[180px] w-full flex flex-col justify-center items-center relative">
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 font-mono">{leadsLoading ? "..." : liveLeadsList.length}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Total Leads</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-500">
                    {leadStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agenda list */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/50 p-5 rounded-2xl shadow-sm flex flex-col h-80 justify-between hover:shadow-md transition-shadow duration-300">
                  <div className="mb-3">
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">My Follow-ups Agenda</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-sans leading-normal">Outstanding client calls scheduled for today</p>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto space-y-0.5 slim-scrollbar">
                    {myFollowups.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div>
                          <div className="font-extrabold text-slate-800 flex items-center gap-2">
                            {item.name}
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              item.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Model: {item.model} • Contact: {item.contact}
                            <span className="block text-emerald-700 mt-0.5">Purpose: {item.purpose}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.date}</span>
                          <a href={`tel:${item.contact}`} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {myFollowups.length === 0 && (
                      <EmptyState title="No followups due!" description="You are all caught up." />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 2: LEADS KANBAN PIPELINE */}
          {activeTab === "leads" && (
            <div className="space-y-5 text-left">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Leads Pipeline Board</h3>
                  <p className="text-[11px] text-slate-450 font-semibold mt-0.5">View assigned leads for your showroom and follow up on customer enquiries.</p>
                </div>
              </div>

              {/* Normal List Type Lead Management */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Lead Management Catalog</h3>
                    <p className="text-xs font-semibold text-slate-500">Filter, search, and manage leads for your branch</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer, vehicle, notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 slim-scrollbar">
                  {[
                    { id: "all", label: "All Leads" },
                    { id: "new_lead", label: "New Lead" },
                    { id: "enquiry", label: "Enquiry" },
                    { id: "contacted", label: "Contacted" },
                    { id: "follow_up", label: "Follow-up" },
                    { id: "negotiation", label: "Negotiation" },
                    { id: "won", label: "Won" },
                    { id: "lost", label: "Lost" },
                  ].map((filter) => {
                    const count = filter.id === "all" ? liveLeadsList.length : liveLeadsList.filter(l => l.status === filter.id).length;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSearchQuery(filter.id === "all" ? "" : filter.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          (searchQuery === filter.id || (filter.id === "all" && !searchQuery))
                            ? "bg-[#04a700] text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {filter.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <Table headers={["Lead ID", "Customer Details", "Contact No", "Vehicle Model", "Source", "Followup Date", "Stage State", "Actions"]}>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-emerald-600" />
                            <span>Loading leads registry...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (liveLeadsList.filter(l => !searchQuery || l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_number.includes(searchQuery) || l.status === searchQuery)).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <EmptyState title="No leads logged" description="Start registering or get assigned leads from supervisor." />
                        </td>
                      </tr>
                    ) : (
                      liveLeadsList.filter(l => !searchQuery || l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || l.contact_number.includes(searchQuery) || l.status === searchQuery).map((lead: any) => (
                        <tr key={lead.id} className="hover:bg-slate-50 border-b border-slate-100">
                          <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">LD-{lead.id}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-800">{lead.customer_name}</td>
                          <td className="py-3.5 px-5 font-semibold text-slate-600">
                            <div className="flex items-center gap-2">
                              <span>{lead.contact_number}</span>
                              <a href={`tel:${lead.contact_number}`} className="inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#04a700] border border-emerald-100 cursor-pointer shadow-sm transition-colors" title="Call Customer">
                                <Phone className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-semibold">{lead.interested_vehicle_name || "—"}</td>
                          <td className="py-3.5 px-5 text-[10px] font-bold text-slate-500 uppercase">{lead.lead_source?.replace("_", " ")}</td>
                          <td className="py-3.5 px-5 text-slate-500 font-semibold">{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "—"}</td>
                          <td className="py-3.5 px-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              lead.status === "won" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              lead.status === "lost" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              lead.status === "negotiation" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-slate-50 text-slate-650 border border-slate-200"
                            }`}>
                              {lead.status_display || lead.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 flex items-center gap-3">
                            <button onClick={() => openEditLead(lead)} className="text-xs font-bold text-[#04a700] hover:text-emerald-800 cursor-pointer">Edit Lead</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === "customers" && (
            <div className="space-y-6 text-left">
              <Table 
                title="Showroom Customer Profiles Directory" 
                headers={["Customer Name", "Contact Mobile", "Purchased EV Model", "Invoice Date", "PDI Verified By", "Next Service Date", "Delivery Status", "Insurance"]}
              >
                {customersList.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{cust.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{cust.contact}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">{cust.model}</td>
                    <td className="py-3.5 px-5 text-slate-450 font-semibold">{cust.invDate}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-bold">{cust.pdiDoneBy}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-bold text-emerald-700">{cust.nextService}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        cust.delStatus === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {cust.delStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{cust.notes}</td>
                  </tr>
                ))}
                {customersList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center"><EmptyState title="No Customers Found" description="Customers will populate here once sales invoices are checked out or lead enquiries are registered." /></td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {/* TAB 4A: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              {/* Bookings table */}
              <Table 
                title="My Active Booking Commitments" 
                headers={["Booking ID", "Customer Details", "Vehicle Model", "Contact", "Advance Payment", "Booking Date", "Expiry Threshold", "Approval State", "Actions"]}
                actions={
                  <button 
                    onClick={() => { setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "", payment_mode: "Cash", payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" } }); setIsCreateBookingOpen(true); }}
                    className="flex items-center gap-1 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs py-2 px-4 rounded-full cursor-pointer shadow-md shadow-[#04a700]/20"
                  >
                    <Plus className="h-4 w-4" /> Record Booking
                  </button>
                }
              >
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                        <span>Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveBookingsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center">
                      <EmptyState title="No Bookings Recorded" description="Advance deposits will display here." />
                    </td>
                  </tr>
                ) : (
                  liveBookingsList.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3 px-4 font-mono font-bold text-[#04a700]">{bk.booking_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{bk.customer_name}</td>
                      <td className="py-3 px-4 text-slate-800 font-bold">{bk.vehicle_model_name || "Kinetic Green EV"}</td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">{bk.contact_number}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹ {parseFloat(bk.advance_amount).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-slate-400">{bk.booking_date ? new Date(bk.booking_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{bk.expiry_date ? new Date(bk.expiry_date).toLocaleDateString() : "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          bk.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.status === "pending" ? "Pending Approval" : bk.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap space-x-2 flex items-center gap-2">
                        {(() => {
                          const isConverted = bk.status === "converted" || liveSalesList.some((s: any) => s.customer_contact === bk.contact_number || s.customer_name === bk.customer_name);
                          if (isConverted) {
                            return (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 font-extrabold px-3 py-1 rounded-full cursor-not-allowed">
                                Converted to Sale
                              </span>
                            );
                          }
                          const isApproved = bk.status === "confirmed";
                          return (
                            <>
                              {isApproved ? (
                                <button
                                  onClick={() => {
                                    setCheckoutCustomerName(bk.customer_name);
                                    setCheckoutContactNumber(bk.contact_number);
                                    setActiveTab("sales_checkout");
                                    if (typeof window !== "undefined") {
                                      window.history.pushState({ path: "/sales/sales_checkout" }, "", "/sales/sales_checkout");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-white font-extrabold cursor-pointer bg-[#04a700] hover:bg-[#038a00] px-3 py-1 rounded-full shadow-sm transition-colors"
                                >
                                  Convert to Sale
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 font-bold px-2.5 py-1 rounded-full" title="Requires Supervisor/Owner Booking Approval before conversion">
                                  Pending Approval
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedBookingInvoicePreview(bk)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors"
                              >
                                <FileCheck className="h-3 w-3" /> Invoice
                              </button>
                            </>
                          );
                        })()}
                        {bk.status === "pending" && (
                          <button onClick={() => handleCancelBooking(bk)} className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Cancel</button>
                        )}
                        {bk.status === "cancelled" && (
                          <span className="text-[10px] text-slate-450 font-bold">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>

              {/* Booking Invoice Preview Modal */}
              {selectedBookingInvoicePreview && (
                <Modal 
                  isOpen={!!selectedBookingInvoicePreview} 
                  onClose={() => setSelectedBookingInvoicePreview(null)} 
                  title="Booking Invoice Receipt Preview"
                >
                  <div className="p-5 space-y-4 text-xs font-semibold text-slate-650 max-w-md mx-auto">
                    <div className="text-center pb-2">
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800">KVR Motors ERP System</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Booking details and advance payment receipt.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-650 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Booking ID:</span>
                        <span className="text-emerald-700 font-black font-mono tracking-wider">{selectedBookingInvoicePreview.booking_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer Name:</span>
                        <span className="text-slate-800 font-extrabold">{selectedBookingInvoicePreview.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact Number:</span>
                        <span className="text-slate-800 font-mono">{selectedBookingInvoicePreview.contact_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">EV Model Interested:</span>
                        <span className="text-slate-800 font-bold">{selectedBookingInvoicePreview.vehicle_model_name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Booking Date:</span>
                        <span className="text-slate-800 font-medium">{selectedBookingInvoicePreview.booking_date ? new Date(selectedBookingInvoicePreview.booking_date).toLocaleDateString("en-IN") : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expiry Threshold:</span>
                        <span className="text-slate-800 font-medium">{selectedBookingInvoicePreview.expiry_date ? new Date(selectedBookingInvoicePreview.expiry_date).toLocaleDateString("en-IN") : "—"}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-2">
                        <span className="text-slate-400">Advance Paid:</span>
                        <span className="text-emerald-700 font-black text-sm font-mono">₹ {parseFloat(selectedBookingInvoicePreview.advance_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment Mode:</span>
                        <span className="text-slate-805 font-bold uppercase">{selectedBookingInvoicePreview.payment_mode || "CASH"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-indigo-650 font-black uppercase text-[10px]">{selectedBookingInvoicePreview.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handlePrintBookingInvoice(selectedBookingInvoicePreview)}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Printer className="h-4 w-4" />
                        Print / Download
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(selectedBookingInvoicePreview.contact_number)}&text=${encodeURIComponent(
                          `*KVR MOTORS - BOOKING RECEIPT*\n` +
                          `=============================\n` +
                          `*Booking ID:* ${selectedBookingInvoicePreview.booking_id}\n` +
                          `*Customer:* ${selectedBookingInvoicePreview.customer_name}\n` +
                          `*Phone:* ${selectedBookingInvoicePreview.contact_number}\n` +
                          `-----------------------------\n` +
                          `*Model:* ${selectedBookingInvoicePreview.vehicle_model_name || ""}\n` +
                          `*Advance Paid:* ₹${parseFloat(selectedBookingInvoicePreview.advance_amount || 0).toLocaleString("en-IN")}\n` +
                          `*Payment Mode:* ${(selectedBookingInvoicePreview.payment_mode || "CASH").toUpperCase()}\n` +
                          `*Status:* ${(selectedBookingInvoicePreview.status || "CONFIRMED").toUpperCase()}\n` +
                          `=============================\n` +
                          `Thank you for booking with KVR Motors!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Share2 className="h-4 w-4" />
                        Share on WhatsApp
                      </a>
                    </div>
                  </div>
                </Modal>
              )}
            </div>
          )}

          {/* TAB 4B: SALES CHECKOUT (WITH AUTO-FILL VIN & FIFO ALERT) */}
          {activeTab === "sales_checkout" && (
            <div className="space-y-6">
              
              {/* Sales Checkout & Confirmation Block */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5 text-left">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Generate Booking / Delivery Invoice</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Review customer details, vehicle allocation, assign battery serial number, and click Confirm Sale.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAutoFillResult(null);
                      setVinQuery("");
                      setSelectedBattery("");
                      setFifoWarning(false);
                      setOverrideRequested(false);
                      setCheckoutCustomerName("");
                      setCheckoutContactNumber("");
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    Clear Form
                  </button>
                </div>

                <form className="space-y-4 text-xs font-semibold text-slate-650" onSubmit={handleSalesCheckoutSubmit}>
                  {/* Customer details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                      <input type="text" placeholder="e.g. Sita" value={checkoutCustomerName} onChange={(e) => setCheckoutCustomerName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
                      <input type="tel" placeholder="e.g. 9874563214" value={checkoutContactNumber} onChange={(e) => setCheckoutContactNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
                    </div>
                  </div>

                  {/* Vehicle details populated by Auto-fill */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Vehicle Unit Allocation Details</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Model</label>
                        <input type="text" value={autoFillResult?.model || "Kinetic Green E-Luna"} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" readOnly />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variant</label>
                        <input type="text" value={autoFillResult?.color || "Standard"} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" readOnly />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Base Price</label>
                        <input type="text" value={autoFillResult?.price ? `₹ ${Number(autoFillResult.price).toLocaleString("en-IN")}` : "₹ 74,999"} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" readOnly />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Allocated Location</label>
                        <input type="text" value={autoFillResult ? `${autoFillResult.branch}` : "KVR Motors - Visakhapatnam"} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" readOnly />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">VIN / Motor Number</label>
                        <input type="text" value={autoFillResult ? `${autoFillResult.vin} (${autoFillResult.motor})` : "RESERVED-HOLD (MOT-63214)"} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" readOnly />
                      </div>
                    </div>
                  </div>

                  {/* Pre-Bound Battery Information */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Pre-Assigned Battery Pack (Paired in Inventory)</label>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Verified Paired Unit</span>
                    </div>
                    <input 
                      type="text" 
                      value={autoFillResult?.battery_serial ? `${autoFillResult.battery_serial} (${autoFillResult.battery_type || "Lithium-Ion"})` : selectedBattery || "BAT-2026-0091 (60V 30Ah Lithium Pack - Inward Locked)"} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-extrabold font-mono outline-none cursor-not-allowed" 
                      readOnly 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
                  >
                    Confirm Sale & Dispatch
                  </button>
                </form>
              </div>

              {/* Sales Billing Ledger */}
              <div className="grid grid-cols-1 gap-6">

                {/* Sales Ledger table */}
                <Table title="My Completed Sales Billing Ledger" headers={["Invoice Ref", "Customer Name", "Contact", "Vehicle Model", "Sale Price", "Delivery Status", "Actions"]}>
                  {salesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-405 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04a700]" />
                          <span>Loading sales...</span>
                        </div>
                      </td>
                    </tr>
                  ) : liveSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center"><EmptyState title="No Sales Billing Records" description="No sales records checked out." /></td>
                    </tr>
                  ) : (
                    liveSalesList.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-[#04a700]">{inv.invoice_number || `INV-${inv.id}`}</td>
                        <td className="py-3 px-4 font-bold text-slate-805">{inv.customer_name}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{inv.customer_contact}</td>
                        <td className="py-3 px-4 text-slate-800 font-bold">{inv.model_name || "Kinetic Green EV"}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹ {parseFloat(inv.sale_price).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            inv.delivery_status === "ready" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {inv.delivery_status ? inv.delivery_status.charAt(0).toUpperCase() + inv.delivery_status.slice(1) : "Processing"}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {inv.delivery_status === "delivered" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePrintSalesInvoice(inv)}
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-650 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                              >
                                <Printer className="h-3 w-3" /> Print Invoice
                              </button>
                              <a
                                href={`https://api.whatsapp.com/send?phone=${formatWhatsAppPhone(inv.customer_contact)}&text=${encodeURIComponent(
                                  `*KVR MOTORS - SALES INVOICE RECEIPT*\n` +
                                  `=============================\n` +
                                  `*Invoice Ref:* ${inv.invoice_number || ('INV-' + inv.id)}\n` +
                                  `*Customer:* ${inv.customer_name}\n` +
                                  `*Phone:* ${inv.customer_contact}\n` +
                                  `-----------------------------\n` +
                                  `*Vehicle:* ${inv.model_name || ""}\n` +
                                  `*Color:* ${inv.vehicle_color || "N/A"}\n` +
                                  `*Battery:* ${inv.battery_type || inv.battery_serial || "N/A"}\n` +
                                  `-----------------------------\n` +
                                  `*Total Paid:* ₹${parseFloat(inv.sale_price).toLocaleString("en-IN")}\n` +
                                  `*Payment Mode:* ${inv.payment_mode || "CASH"}\n` +
                                  `*Status:* Delivered\n` +
                                  `=============================\n` +
                                  `Thank you for purchasing with KVR Motors!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-650 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                              >
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </a>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Awaiting Delivery</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>

            </div>
          )}

          {/* TAB 5: FOLLOW-UPS SCHEDULE */}
          {activeTab === "followups" && (
            <div className="space-y-6 text-left">
              <Table title="My Active Follow-up Appointments Agenda" headers={["Customer Name", "Contact Mobile", "Reserved Model", "Scheduled Date", "Latest Progress Status", "Actions"]}>
                {myFollowups.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{f.name}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{f.contact}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-semibold">{f.model}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-semibold">{f.date}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        f.status === "won" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        f.status === "lost" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        f.status === "negotiation" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {f.status_display?.replace("_", " ").toUpperCase() || "FOLLOW-UP SCHEDULED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 flex items-center gap-2">
                      <button
                        onClick={() => openEditLead(f.rawLead)}
                        className="px-3 py-1 rounded-lg bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Update Status / Notes
                      </button>
                    </td>
                  </tr>
                ))}
                {myFollowups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center"><EmptyState title="No Followups" description="No follow-up dates registered." /></td>
                  </tr>
                )}
              </Table>
            </div>
          )}

          {/* TAB 6: REPORTS & TARGETS */}
          {activeTab === "reports" && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Commission Summary */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-800">My Sales & Commissions Overview</h3>
                  </div>

                  <div className="space-y-3.5 font-semibold text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Cars/Bikes Sold (This Month):</span>
                      <span className="text-slate-800 font-bold">{liveSalesList.length} Deliveries</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Commission Rate Per Unit:</span>
                      <span className="text-slate-800 font-bold">₹ 2,000 / EV unit</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                      <span className="text-slate-650 font-bold">Accumulated Commission Earned:</span>
                      <span className="text-emerald-650 font-extrabold">₹ {(liveSalesList.length * 2000).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Targets completions card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Target className="h-5 w-5 text-indigo-550 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800">Monthly Targets Completion</h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span>EV Units Delivery Target</span>
                      <span>{liveSalesList.length} of 15 ({Math.min(100, Math.round((liveSalesList.length / 15) * 100))}% Achieved)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                      <div className="h-full bg-blue-600 rounded-lg" style={{ width: `${Math.min(100, (liveSalesList.length / 15) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-2">
                      Reach 15 deliveries this month to qualify for target completion commissions and performance bonus.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}
          {activeTab === "stock" && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Branch Stock Inventory</h3>
                  <p className="text-xs font-semibold text-slate-500">Live vehicle stock inventory for your branch</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <Table headers={["Unit ID", "Model & Brand", "VIN / Chassis No", "Motor No", "Color", "Quantity", "Stock Status"]}>
                  {liveSalesList.length === 0 && liveBookingsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        No vehicle stock units listed.
                      </td>
                    </tr>
                  ) : (
                    liveBookingsList.map((bk, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">STK-{bk.vehicle_unit || bk.id}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{bk.vehicle_model_name || "Kinetic Green EV"}</td>
                        <td className="py-3.5 px-5 font-mono text-xs text-slate-600">{bk.vin_number || "RESERVED-HOLD"}</td>
                        <td className="py-3.5 px-5 font-mono text-xs text-slate-600">MOT-10293</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{bk.color || "Standard"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">1 Unit</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            HOLD (BOOKED)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>
            </div>
          )}
          {activeTab === "invoices" && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Sales PDF Invoices</h3>
                  <p className="text-xs font-semibold text-slate-500">View and download completed sales invoices</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <Table headers={["Invoice No", "Customer Name", "Contact", "Vehicle Model", "Sale Amount", "Actions"]}>
                  {liveSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-semibold">
                        No closed sales invoices recorded yet.
                      </td>
                    </tr>
                  ) : (
                    liveSalesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#04a700]">{inv.invoice_number || `INV-${inv.id}`}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">{inv.customer_name}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-600">{inv.customer_contact}</td>
                        <td className="py-3.5 px-5 text-slate-700 font-semibold">{inv.model_name || "EV Vehicle"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-900">₹{Number(inv.sale_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-5">
                          <button 
                            onClick={() => window.open(`/api/v1/sales-invoices/${inv.id}/download/`, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#04a700] hover:bg-[#038a00] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> Download PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>
            </div>
          )}
          {activeTab === "attendance" && (
            <AttendanceView role="sales" />
          )}
          {activeTab === "profile" && (
            <ProfileView />
          )}

        </DashboardSmoothScroll>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav role="sales" activeTab={activeTab} />

      {/* Floated Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 shadow-xl ${
            toast.type === "success" 
              ? "bg-[#04a700] border-[#038a00] text-white" 
              : "bg-rose-600 border-rose-700 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="text-xs font-bold">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Register / Edit Lead */}
      <Modal isOpen={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} title={editingLeadId ? "Update Pipeline Lead details" : "Register Pipeline Lead Enquiry"}>
        <form onSubmit={handleAddLeadSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. S. Sita Kumari" value={newLead.customer_name} onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Mobile</label>
            <input type="tel" placeholder="e.g. 9876543210" value={newLead.contact_number} onChange={(e) => setNewLead({ ...newLead, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <SearchableSelect
              options={vehicleModelsList.map((m) => ({
                value: String(m.id),
                label: m.brand_name ? `${m.brand_name} - ${m.model_name}` : m.model_name,
              }))}
              value={String(newLead.interested_vehicle || "")}
              onChange={(val) => setNewLead({ ...newLead, interested_vehicle: val })}
              placeholder="Select EV Model..."
              searchPlaceholder="Search EV models by name or brand..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lead Inflow Source</label>
            <select value={newLead.lead_source} onChange={(e) => setNewLead({ ...newLead, lead_source: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold">
              <option value="walk_in">Walk-in Inquiry</option>
              <option value="website">Website Portal</option>
              <option value="reference">Customer Reference</option>
              <option value="social">Social Media Ads</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage</label>
            <select value={newLead.status} onChange={(e) => setNewLead({ ...newLead, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 outline-none focus:border-blue-500 font-bold">
              <option value="enquiry">Enquiry</option>
              <option value="new_lead">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow-up</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Requirements</label>
            <textarea placeholder="e.g. Inquired about monthly battery financing options" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold outline-none h-20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Next Follow-up Date (Future Date Only)</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} value={newLead.follow_up_date} onChange={(e) => setNewLead({ ...newLead, follow_up_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Lead
          </button>
        </form>
      </Modal>

      {/* 2. Register / Edit Booking */}
      <Modal isOpen={isCreateBookingOpen} onClose={() => { setIsCreateBookingOpen(false); setEditingBookingId(null); setNewBooking({ customer_name: "", contact_number: "", vehicle_model: "", advance_amount: "", expiry_date: "", payment_mode: "Cash", payment_split_details: { cash: "", card: "", upi: "", bajaj_finance: "" } }); }} title={editingBookingId ? "Edit Booking Details" : "Record Advance Booking Commitment"}>
        <form onSubmit={handleCreateBooking} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input type="text" placeholder="e.g. Ramesh Naidu" value={newBooking.customer_name} onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
            <input type="tel" placeholder="e.g. 9876543210" value={newBooking.contact_number} onChange={(e) => setNewBooking({ ...newBooking, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} inputMode="numeric" pattern="[0-9]*" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interested EV Model</label>
            <SearchableSelect
              options={vehicleModelsList.map((m) => ({
                value: String(m.id),
                label: m.brand_name ? `${m.brand_name} - ${m.model_name}` : m.model_name,
              }))}
              value={String(newBooking.vehicle_model || "")}
              onChange={(val) => setNewBooking({ ...newBooking, vehicle_model: val })}
              placeholder="Select vehicle..."
              searchPlaceholder="Search EV models by name or brand..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Advance Deposit Paid (INR)</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 5000" value={newBooking.advance_amount} onChange={(e) => setNewBooking({ ...newBooking, advance_amount: e.target.value.replace(/\D/g, '') })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-emerald-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry date (Future Date Only)</label>
            <input type="date" min={new Date().toISOString().split("T")[0]} value={newBooking.expiry_date} onChange={(e) => setNewBooking({ ...newBooking, expiry_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
            <select
              value={newBooking.payment_mode}
              onChange={(e) => setNewBooking({ ...newBooking, payment_mode: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Cash">Cash Payment</option>
              <option value="UPI">UPI / Online Transfer</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Bajaj Finance">Bajaj Finance EMI</option>
              <option value="split">Split Payment (Multiple Modes)</option>
            </select>
          </div>

          {newBooking.payment_mode === "split" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Split Details (Target: ₹{parseFloat(newBooking.advance_amount || "0").toLocaleString("en-IN")})</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cash Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.cash}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, cash: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Card Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.card}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, card: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">UPI Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.upi}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, upi: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Bajaj Finance</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    value={newBooking.payment_split_details.bajaj_finance}
                    onChange={(e) => setNewBooking({
                      ...newBooking,
                      payment_split_details: { ...newBooking.payment_split_details, bajaj_finance: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Save Booking
          </button>
        </form>
      </Modal>

      {/* 3. FIFO Recommendation Pop-up Modal */}
      <Modal isOpen={fifoModalOpen} onClose={() => setFifoModalOpen(false)} title="FIFO Battery Stock Recommendation">
        {fifoModalData && (
          <div className="space-y-4 text-left">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Earlier Purchased Battery Stock Available</span>
              </div>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Battery pack <strong className="font-mono text-slate-900">{fifoModalData.recommended.serial_number}</strong> (Purchased: {fifoModalData.recommended.purchase_date || "Earlier"}) is available and recommended under First-In-First-Out stock rules.
              </p>
              <p className="text-xs text-slate-600 font-medium">
                You selected: <strong className="font-mono text-slate-900">{fifoModalData.selected?.serial_number}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBattery(fifoModalData.recommended.serial_number);
                  setFifoModalOpen(false);
                  showToast(`Auto-selected recommended FIFO battery (${fifoModalData.recommended.serial_number})`);
                }}
                className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
              >
                Use Recommended FIFO Battery
              </button>
              <button
                type="button"
                onClick={() => setFifoModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Proceed with Selected Battery
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
