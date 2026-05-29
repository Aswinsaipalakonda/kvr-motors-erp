"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";
import Table from "../components/Table";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { getBranches, createBranch } from "../services/branches";
import { getVehicleBrands, getVehicleModels, getVehicleUnits, createVehicleModel } from "../services/vehicles";
import { getLeads } from "../services/leads";
import { getBookings } from "../services/bookings";
import { getSalesInvoices } from "../services/sales";
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus } from "../services/purchases";
import { getLedgerEntries } from "../services/ledger";
import {
  TrendingUp,
  Percent,
  Plus,
  ArrowRight,
  TrendingDown,
  Building,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Download,
  Calendar,
  XCircle,
  FileSpreadsheet,
  ShoppingBag,
  Car,
  Compass
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
export default function OwnerDashboard() {
  const pathname = usePathname();
  const lastSegment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const activeTab = lastSegment === "owner" ? "dashboard" : lastSegment;

  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real database branches states
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");

  // Real database vehicles states
  const [vehicleBrandsList, setVehicleBrandsList] = useState<any[]>([]);
  const [vehicleModelsList, setVehicleModelsList] = useState<any[]>([]);
  const [vehicleUnitsList, setVehicleUnitsList] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  // Real database leads states
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Real database bookings, sales, purchases, and ledger states
  const [advanceBookings, setAdvanceBookings] = useState<any[]>([]);
  const [advanceBookingsLoading, setAdvanceBookingsLoading] = useState(true);

  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [salesInvoicesLoading, setSalesInvoicesLoading] = useState(true);

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(true);

  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerEntriesLoading, setLedgerEntriesLoading] = useState(true);

  // New PO form state
  const [newPOSupplier, setNewPOSupplier] = useState("");
  const [newPOModel, setNewPOModel] = useState("");
  const [newPOQty, setNewPOQty] = useState("");
  const [newPOPrice, setNewPOPrice] = useState("");
  const [newPOPaymentTerms, setNewPOPaymentTerms] = useState("");
  const [newPOEstDelivery, setNewPOEstDelivery] = useState("");

  // New Vehicle Model form state
  const [newModelBrand, setNewModelBrand] = useState<string>("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelPrice, setNewModelPrice] = useState("");
  const [newModelBattery, setNewModelBattery] = useState("");
  const [newModelColors, setNewModelColors] = useState("");
  const [newModelStatus, setNewModelStatus] = useState<"active" | "inactive">("active");

  const loadVehicles = async () => {
    try {
      setVehiclesLoading(true);
      const [brands, models, units] = await Promise.all([
        getVehicleBrands(),
        getVehicleModels(),
        getVehicleUnits()
      ]);
      setVehicleBrandsList(brands);
      setVehicleModelsList(models);
      setVehicleUnitsList(units);
    } catch (e) {
      console.error("Failed to load vehicle catalog from Django REST API:", e);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const data = await getBranches();
      setBranchesList(data);
    } catch (e) {
      console.error("Failed to load branches from Django REST API:", e);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    try {
      await createBranch({
        name: branchName.trim(),
        address: branchAddress.trim(),
        phone_number: branchPhone.trim(),
        is_active: true
      });
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      setIsAddBranchOpen(false);
      loadBranches();
    } catch (err) {
      console.error("Failed to register branch showroom in PostgreSQL:", err);
    }
  };

  const handleAddModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelBrand || !newModelName.trim() || !newModelPrice) return;
    try {
      const colorVariants = newModelColors.split(",").map(c => c.trim()).filter(Boolean);
      await createVehicleModel({
        brand: parseInt(newModelBrand),
        model_name: newModelName.trim(),
        base_price: parseFloat(newModelPrice),
        color_variants: colorVariants,
        battery_compatibility: newModelBattery.trim(),
        status: newModelStatus
      });
      setNewModelBrand("");
      setNewModelName("");
      setNewModelPrice("");
      setNewModelBattery("");
      setNewModelColors("");
      setNewModelStatus("active");
      setIsAddVehicleOpen(false);
      loadVehicles();
    } catch (err) {
      console.error("Failed to add vehicle model to Django backend:", err);
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const data = await getLeads();
      setLeadsList(data);
    } catch (e) {
      console.error("Failed to load leads from Django REST API:", e);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setAdvanceBookingsLoading(true);
      const data = await getBookings();
      setAdvanceBookings(data);
    } catch (e) {
      console.error("Failed to load bookings from Django REST API:", e);
    } finally {
      setAdvanceBookingsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      setSalesInvoicesLoading(true);
      const data = await getSalesInvoices();
      setSalesInvoices(data);
    } catch (e) {
      console.error("Failed to load sales from Django REST API:", e);
    } finally {
      setSalesInvoicesLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      setPurchaseOrdersLoading(true);
      const data = await getPurchaseOrders();
      setPurchaseOrders(data);
    } catch (e) {
      console.error("Failed to load purchases from Django REST API:", e);
    } finally {
      setPurchaseOrdersLoading(false);
    }
  };

  const loadLedger = async () => {
    try {
      setLedgerEntriesLoading(true);
      const data = await getLedgerEntries();
      setLedgerEntries(data);
    } catch (e) {
      console.error("Failed to load ledger from Django REST API:", e);
    } finally {
      setLedgerEntriesLoading(false);
    }
  };

  const handleApprovePO = async (id: number) => {
    try {
      await updatePurchaseOrderStatus(id, "approved");
      loadPurchases();
      loadLedger();
    } catch (err) {
      console.error("Failed to approve purchase order:", err);
    }
  };

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPOSupplier.trim() || !newPOModel || !newPOQty || !newPOPrice || !newPOPaymentTerms.trim()) return;
    try {
      await createPurchaseOrder({
        supplier_name: newPOSupplier.trim(),
        vehicle_model: parseInt(newPOModel),
        quantity: parseInt(newPOQty),
        unit_price: parseFloat(newPOPrice),
        payment_terms: newPOPaymentTerms.trim(),
        estimated_delivery: newPOEstDelivery || undefined
      });
      setNewPOSupplier("");
      setNewPOModel("");
      setNewPOQty("");
      setNewPOPrice("");
      setNewPOPaymentTerms("");
      setNewPOEstDelivery("");
      setIsAddPOOpen(false);
      loadPurchases();
      loadLedger();
    } catch (err) {
      console.error("Failed to create purchase order:", err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadBranches();
    loadVehicles();
    loadLeads();
    loadBookings();
    loadSales();
    loadPurchases();
    loadLedger();
  }, []);
  const systemUsers = [
    { name: "Ravi Varma", role: "Owner", userType: "Admin", branch: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 09:30 AM" },
    { name: "Suresh Babu", role: "Supervisor", userType: "Staff", branch: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 08:15 AM" },
    { name: "Anil Kumar", role: "Sales Executive", userType: "Staff", branch: "KVR Motors - Vizag", status: "Active", lastLogin: "13 May 2024 09:10 AM" },
    { name: "Venkatesh", role: "Sales Staff", userType: "Staff", branch: "Future Ride - Vizag", status: "Active", lastLogin: "13 May 2024 07:45 AM" },
    { name: "Prasad", role: "Sales Executive", userType: "Staff", branch: "KVR Motors - Srikakulam", status: "Active", lastLogin: "12 May 2024 05:20 PM" },
    { name: "Mahesh", role: "Sales Staff", userType: "Staff", branch: "KVR Motors - Kakinada", status: "Inactive", lastLogin: "10 May 2024 04:35 PM" },
  ];
  
  // Modals state
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddBatteryOpen, setIsAddBatteryOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userBranchFilter, setUserBranchFilter] = useState("All Branches");
  const [userRoleFilter, setUserRoleFilter] = useState("All Roles");
  const [userTypeFilter, setUserTypeFilter] = useState("All Types");
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    role: "Sales Staff",
    branch: "KVR Motors - Vizag",
    status: "Active",
    userType: "Staff"
  });
  const [users, setUsers] = useState(systemUsers);
  // MOCK DATA
  const salesOverviewData = [
    { name: "01 May", ThisMonth: 4500000, LastMonth: 4000000 },
    { name: "06 May", ThisMonth: 7200000, LastMonth: 6100000 },
    { name: "11 May", ThisMonth: 9500000, LastMonth: 8200000 },
    { name: "16 May", ThisMonth: 14500000, LastMonth: 12100000 },
    { name: "21 May", ThisMonth: 19800000, LastMonth: 17200000 },
    { name: "26 May", ThisMonth: 24580000, LastMonth: 21800000 },
  ];
  const stockStatusData = [
    { name: "Available", value: 186, color: "#2563eb" }, // Blue
    { name: "Booked", value: 45, color: "#10b981" },    // Green
    { name: "In Transit", value: 32, color: "#f59e0b" }, // Amber
    { name: "Sold", value: 49, color: "#64748b" },      // Slate
  ];
  const enquiryCount = leadsList.filter(l => l.status === "enquiry").length;
  const leadCount = leadsList.filter(l => l.status === "new_lead" || l.status === "contacted" || l.status === "follow_up").length;
  const negoCount = leadsList.filter(l => l.status === "negotiation").length;
  const wonCount = leadsList.filter(l => l.status === "won").length;

  const leadsFunnelData = [
    { name: "Enquiries", count: enquiryCount, color: "#3b82f6" },
    { name: "Leads", count: leadCount, color: "#6366f1" },
    { name: "Negotiation", count: negoCount, color: "#f59e0b" },
    { name: "Won", count: wonCount, color: "#10b981" },
  ];
  const recentActivities = [
    { id: 1, action: "Vehicle Stock In", ref: "GRN-2024-0512", location: "Pendurthi Godown", user: "Ramesh", time: "2 mins ago" },
    { id: 2, action: "Sale Invoice Created", ref: "INV-2024-0789", location: "Isakapallem Showroom", user: "Suresh", time: "15 mins ago" },
    { id: 3, action: "Purchase Invoice Created", ref: "PINV-2024-0321", location: "Pineapple Colony Godown", user: "Ramesh", time: "1 hour ago" },
    { id: 4, action: "Lead Converted to Sale", ref: "LD-2024-0156", location: "Kakinada Showroom", user: "Suresh", time: "2 hours ago" },
  ];
  const topSellingModels = [
    { name: "Kinetic Green E-Luna", count: 72 },
    { name: "Dynamo Pro", count: 61 },
    { name: "Frankly 79", count: 48 },
    { name: "Watts 100", count: 38 },
    { name: "Others", count: 23 },
  ];
  // Modules List Data
  const branchData = [
    { name: "KVR Showroom - Vizag", location: "Vizag City", manager: "Suresh Babu", status: "Active", stock: 120, sales: "₹ 1,12,00,000", monthlyTarget: "₹ 1,50,00,000", targetPct: "74%" },
    { name: "Future Ride - Vizag", location: "Vizag Suburban", manager: "Rajesh", status: "Active", stock: 85, sales: "₹ 78,50,000", monthlyTarget: "₹ 1,00,00,000", targetPct: "78%" },
    { name: "KVR Showroom - Srikakulam", location: "Srikakulam Town", manager: "Prasad", status: "Active", stock: 62, sales: "₹ 34,20,000", monthlyTarget: "₹ 60,00,000", targetPct: "57%" },
    { name: "KVR Showroom - Kakinada", location: "Kakinada Port", manager: "Mahesh", status: "Inactive", stock: 45, sales: "₹ 21,10,000", monthlyTarget: "₹ 50,00,000", targetPct: "42%" },
  ];
  const vehicleModels = [
    { name: "Kinetic Green E-Luna", brand: "Kinetic", category: "Moped", price: "₹ 74,999", type: "Electric", colors: "Green, Red, Black", battery: "1.2 kWh Li-ion", status: "Available", warranty: "3 Yrs / 40K km", range: "120 km" },
    { name: "Dynamo Pro", brand: "Dynamo", category: "Scooter", price: "₹ 98,500", type: "Electric", colors: "Blue, White, Gray", battery: "2.0 kWh Swappable", status: "Available", warranty: "3 Yrs / 40K km", range: "140 km" },
    { name: "Frankly 79", brand: "Frankly", category: "Scooter", price: "₹ 1,15,000", type: "Electric", colors: "Yellow, Red, Black", battery: "2.4 kWh Dual", status: "Available", warranty: "5 Yrs / 60K km", range: "160 km" },
    { name: "Watts 100", brand: "Watts", category: "Motorcycle", price: "₹ 1,45,000", type: "Electric", colors: "Matte Black, Red", battery: "3.2 kWh Fixed", status: "Available", warranty: "5 Yrs / 60K km", range: "180 km" },
  ];
  const vehicleStockUnits = [
    { vin: "KVRVIN2026X101", motor: "MTR-90802", chassis: "CHS-88902", model: "Kinetic Green E-Luna", color: "Green", branch: "Vizag", location: "Pendurthi Godown", date: "12 May 2024", status: "Available", battery: "BATT-00982", booking: "N/A", pdi: "Passed", ageInStock: "5 days" },
    { vin: "KVRVIN2026X102", motor: "MTR-90805", chassis: "CHS-88904", model: "Dynamo Pro", color: "Blue", branch: "Vizag", location: "Isakapallem Showroom", date: "10 May 2024", status: "Booked", battery: "BATT-00874", booking: "BK-8021", pdi: "Passed", ageInStock: "14 days" },
    { vin: "KVRVIN2026X103", motor: "MTR-90807", chassis: "CHS-88908", model: "Frankly 79", color: "Yellow", branch: "Srikakulam", location: "Srikakulam Showroom", date: "15 May 2024", status: "Available", battery: "BATT-00621", booking: "N/A", pdi: "Passed", ageInStock: "3 days" },
    { vin: "KVRVIN2026X104", motor: "MTR-90812", chassis: "CHS-88915", model: "Watts 100", color: "Red", branch: "Vizag", location: "Pendurthi Godown", date: "02 May 2024", status: "Reserved", battery: "BATT-00511", booking: "BK-8012", pdi: "Pending", ageInStock: "26 days" },
  ];
  // Loaded dynamically via useEffect hooks and Django REST API endpoints
  const batteriesStock = [
    { serial: "BATT-00982", capacity: "1.2 kWh", purDate: "02 Mar 2024", status: "Assigned", vehicle: "KVRVIN2026X101", location: "Pendurthi Godown", supplier: "Ampere Cells", warrantyYears: "3 Years" },
    { serial: "BATT-00874", capacity: "2.0 kWh", purDate: "10 Jan 2024", status: "Sold", vehicle: "KVRVIN2026X102", location: "Vizag Showroom", supplier: "Future Batteries Ltd", warrantyYears: "3 Years" },
    { serial: "BATT-00621", capacity: "2.4 kWh", purDate: "15 Apr 2024", status: "Available", vehicle: "N/A", location: "Srikakulam Showroom", supplier: "Tesla Tech Pack", warrantyYears: "5 Years" },
    { serial: "BATT-00511", capacity: "3.2 kWh", purDate: "01 May 2024", status: "Assigned", vehicle: "KVRVIN2026X104", location: "Pendurthi Godown", supplier: "Tesla Tech Pack", warrantyYears: "5 Years" },
  ];

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFDFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAFDFB] font-sans antialiased overflow-hidden">
      
      {/* Sidebar - Leaves existing Sidebar.tsx alone, uses DashboardSidebar */}
      <DashboardSidebar role="owner" activeTab={activeTab} />
      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar role="owner" title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("_", " ")} />
        {/* Dashboard Views */}
        <main className={`flex-1 p-4 ${activeTab === "dashboard" ? "overflow-y-auto flex flex-col space-y-3 h-[calc(100vh-80px)]" : "overflow-y-auto space-y-6"}`}>
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="bg-white border border-emerald-100/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm shadow-emerald-950/4 select-none">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Welcome back, Ravi Varma! <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Here&apos;s a quick snapshot of your multi-branch enterprise statistics today.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-505 border border-emerald-100 bg-white rounded-lg px-3 py-1 flex items-center gap-1.5 shadow-sm shadow-emerald-950/4">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    Last Updated: Today, 22:50
                  </span>
                </div>
              </div>
              {/* Grid Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <DashboardCard title="Total Sales" value="₹ 2,45,80,000" trend="↑ 12.8%" trendType="success" description="12.8% vs last month" icon={DollarSign} color="emerald" />
                <DashboardCard title="Total Purchases" value="₹ 1,65,40,000" trend="↓ 6.2%" trendType="danger" description="6.2% vs last month" icon={ShoppingBag} color="rose" />
                <DashboardCard title="Vehicles in Stock" value="312 Units" trend="↑ 8.4%" trendType="success" description="8.4% vs last month" icon={Car} color="blue" />
                <DashboardCard title="Total Leads" value={`${leadsLoading ? "..." : leadsList.length} Leads`} trend="↑ 15.3%" trendType="success" description="15.3% vs last month" icon={Compass} color="amber" />
                <DashboardCard title="Receivables" value="₹ 68,75,000" trend="↓ 3.7%" trendType="danger" description="3.7% vs last month" icon={Briefcase} color="purple" />
              </div>
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[460px]">
                
                {/* Sales Overview Chart (Line) */}
                <div className="lg:col-span-2 bg-white border border-emerald-100/60 p-4 rounded-xl shadow-sm shadow-emerald-950/4 flex flex-col justify-between h-full min-h-[440px]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">Sales Overview</h3>
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Cumulative monthly sales compared to previous cycle</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-500" /> This Month</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-slate-350" /> Last Month</span>
                    </div>
                  </div>
                  
                  <div className="h-[320px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesOverviewData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorThis" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.18}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹ ${(val / 100000).toFixed(0)}L`} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                        <Tooltip formatter={(value: any) => [`₹ ${value.toLocaleString()}`, "Sales"]} />
                        <Area type="monotone" dataKey="ThisMonth" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorThis)" name="This Month" />
                        <Area type="monotone" dataKey="LastMonth" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} name="Last Month" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Stock by Status (Donut) */}
                <div className="bg-white border border-emerald-100/60 p-4 rounded-xl shadow-sm shadow-emerald-950/4 flex flex-col h-full min-h-[440px] justify-between">
                  <div className="mb-2">
                    <h3 className="text-xs font-bold text-slate-800">Vehicle Stock Status</h3>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Distribution of 312 physical units</p>
                  </div>
                  <div className="h-[220px] w-full flex flex-col justify-center items-center relative">
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-extrabold text-slate-800">312</span>
                      <span className="text-[8px] font-bold text-emerald-800/60 uppercase tracking-widest leading-none">Total units</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockStatusData}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stockStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Units`, "Stock"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-emerald-50 text-[10px] font-bold text-slate-500">
                    {stockStatusData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name} ({((item.value / 312) * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Lower Section Charts & Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-80">
                
                {/* Leads Funnel representation */}
                <div className="bg-white border border-emerald-100/60 p-4 rounded-xl shadow-sm shadow-emerald-950/4 flex flex-col h-full justify-between">
                  <div className="mb-2">
                    <h3 className="text-xs font-bold text-slate-800">Leads Funnel</h3>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Pipeline conversion ratios this month</p>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1 min-h-0">
                    {leadsFunnelData.map((stage, index) => {
                      const maxVal = 256;
                      const percentage = (stage.count / maxVal) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-650">
                            <span>{stage.name}</span>
                            <span>{stage.count} ({((stage.count / maxVal) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-4 w-full bg-slate-100 rounded-lg overflow-hidden flex">
                            <div 
                              className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[8px] font-extrabold text-white shadow-sm"
                              style={{ width: `${percentage}%`, backgroundColor: stage.color }}
                            >
                              {percentage > 20 && `${stage.count}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Recent Activities */}
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-full overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Latest logs across all outlets</p>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{act.action}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{act.ref} • {act.location}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-bold">
                          <span className="text-slate-600">{act.user}</span>
                          <span className="text-slate-400 mt-0.5">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Top Selling Models */}
                <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col h-full overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Top Selling EV Models</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Top models sorted by unit delivery volume</p>
                  </div>
                  <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {topSellingModels.map((model, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-left">
                        <div className="flex items-center gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[9px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-750">{model.name}</span>
                        </div>
                        <div className="flex flex-col text-right text-[10px] font-bold">
                          <span className="text-slate-800">{model.count} Units</span>
                          <span className="text-[9px] text-emerald-650 mt-0.5">₹ {((model.count * 85000)).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {/* TAB 2: BRANCH & SHOWROOMS */}
          {activeTab === "branches" && (
            <div className="space-y-6">
              <Table 
                title="Branch Locations Registry" 
                headers={["Showroom Name", "Location City", "Manager Assigned", "Total Stock", "Sales Volume", "Monthly Target", "Target Achieved", "Status", "Actions"]}
                setSearchQuery={setSearchQuery}
                actions={
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddBranchOpen(true)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-md shadow-emerald-600/10 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Branch
                    </button>
                  </div>
                }
              >
                {branchesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading branch outlets from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : branchesList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <EmptyState 
                        title="No Showrooms Found" 
                        description="Register a new showroom or branch outlet using the Add Branch button above." 
                      />
                    </td>
                  </tr>
                ) : (
                  branchesList.map((branch, idx) => {
                    const targetPct = branch.targetPct || "74%";
                    return (
                      <tr key={branch.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                        <td className="py-3.5 px-5 font-bold text-slate-800">{branch.name}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.address || "Vizag City"}</td>
                        <td className="py-3.5 px-5 text-slate-600">{branch.phone_number || "Suresh Babu"}</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.stock || 120} Vehicles</td>
                        <td className="py-3.5 px-5 font-bold text-slate-700">{branch.sales || "₹ 1,12,00,000"}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-500">{branch.monthlyTarget || "₹ 1,50,00,000"}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700 text-[11px]">{targetPct}</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: targetPct }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            branch.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {branch.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-bold mr-3 cursor-pointer">Edit</button>
                          <button className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">Toggle Status</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </Table>
            </div>
          )}
          {/* TAB 3: VEHICLE MANAGEMENT */}
          {activeTab === "vehicles" && (
            <div className="space-y-8">
              
              {/* Vehicle Master Models catalog */}
              <Table 
                title="Vehicle Master Models Catalog" 
                headers={["Model Name", "Brand", "Category", "Base Price", "Color Variants", "Battery Spec", "Warranty Period", "Range (km)", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Model
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-indigo-600" />
                        <span>Loading model catalog from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleModelsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <EmptyState title="No Models Registered" description="Click Add Model to populate the catalog." />
                    </td>
                  </tr>
                ) : (
                  vehicleModelsList.map((model, idx) => (
                    <tr key={model.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{model.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{model.brand_name || "Kinetic"}</td>
                      <td className="py-3.5 px-5 text-slate-605">Electric</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(model.base_price).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-medium">{Array.isArray(model.color_variants) ? model.color_variants.join(", ") : model.color_variants || "Green"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{model.battery_compatibility || "1.2 kWh"}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">3 Yrs / 40K km</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-700">140 km</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          model.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {model.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">Edit Model</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
              {/* Physical Stock Units tracking */}
              <Table 
                title="Physical Inventory Stock Units (VIN Registry)" 
                headers={["VIN Number", "Motor Code", "Chassis Code", "Model", "Color", "Branch Outlet", "Location Area", "Battery Assigned", "PDI Status", "Age in Stock", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddStockOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Stock Unit
                  </button>
                }
              >
                {vehiclesLoading ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-xs text-slate-405 font-semibold">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-205 border-t-indigo-600" />
                        <span>Loading physical units registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : vehicleUnitsList.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center">
                      <EmptyState title="No Stock Units Found" description="No physical stock units registered." />
                    </td>
                  </tr>
                ) : (
                  vehicleUnitsList.map((unit, idx) => (
                    <tr key={unit.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{unit.vin_number}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.motor_number}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-505">{unit.chassis_number}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">{unit.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600">{unit.color}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{unit.branch_name || "Vizag"}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{unit.location_name || "Warehouse"}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono font-bold">{unit.assigned_battery || "N/A"}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Passed
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-650">5 days</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          unit.stock_status === "available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          unit.stock_status === "booked" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          unit.stock_status === "reserved" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-slate-100 text-slate-505 border border-slate-205"
                        }`}>
                          {unit.stock_status.charAt(0).toUpperCase() + unit.stock_status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 4: STOCK (IN & OUT) */}
          {activeTab === "stock" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock In Log */}
                <Table title="Stock Intake Log (Stock-In)" headers={["Date Received", "VIN/Model", "Location", "Purchase Code", "Carrier Transport", "PDI Inspector", "Status"]}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-700">12 May 2024</td>
                    <td className="py-3 px-4 text-slate-800"><div className="font-bold">E-Luna Moped</div><div className="text-[10px] text-slate-400">KVRVIN2026X101</div></td>
                    <td className="py-3 px-4 text-slate-600">Pendurthi Godown</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">GRN-2024-0512</td>
                    <td className="py-3 px-4 text-slate-550 font-medium">KVR Logistics</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">Ramesh (Passed)</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Received</span></td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-700">10 May 2024</td>
                    <td className="py-3 px-4 text-slate-800"><div className="font-bold">Dynamo Pro</div><div className="text-[10px] text-slate-400">KVRVIN2026X102</div></td>
                    <td className="py-3 px-4 text-slate-600">Isakapallem Showroom</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">GRN-2024-0508</td>
                    <td className="py-3 px-4 text-slate-550 font-medium">SafeExpress</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">Suresh (Passed)</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Received</span></td>
                  </tr>
                </Table>
                {/* Stock Out Log */}
                <Table title="Stock Outflow Log (Stock-Out)" headers={["Date Dispatched", "VIN/Model", "Destination", "Sales Ref", "Dispatch Driver", "Status"]}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-700">13 May 2024</td>
                    <td className="py-3 px-4 text-slate-800"><div className="font-bold">Dynamo Pro</div><div className="text-[10px] text-slate-400">KVRVIN2026X102</div></td>
                    <td className="py-3 px-4 text-slate-600">Vizag City Outlet</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">INV-2024-0789</td>
                    <td className="py-3 px-4 text-slate-550 font-medium">Somu Naidu</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Sold Dispatch</span></td>
                  </tr>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-700">11 May 2024</td>
                    <td className="py-3 px-4 text-slate-800"><div className="font-bold">Watts 100</div><div className="text-[10px] text-slate-400">KVRVIN2026X115</div></td>
                    <td className="py-3 px-4 text-slate-600">Kakinada Showroom</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">TRN-2024-0044</td>
                    <td className="py-3 px-4 text-slate-550 font-medium">Appalaraju</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Internal Transfer</span></td>
                  </tr>
                </Table>
              </div>
              {/* Internal transfers list */}
              <Table title="Inter-Location / Inter-Branch Stock Transfers Queue" headers={["Transfer Ref", "Source Location", "Target Outlet", "Model & Qty", "Dispatch Date", "Transit Time", "Est Arrival", "Supervisor Approval", "Status"]}>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-700">TRN-2024-0044</td>
                  <td className="py-3.5 px-5 text-slate-600 font-semibold">Pendurthi Godown</td>
                  <td className="py-3.5 px-5 text-slate-600 font-semibold">KVR Showroom - Vizag</td>
                  <td className="py-3.5 px-5 font-bold text-slate-700">Kinetic E-Luna (10 Units)</td>
                  <td className="py-3.5 px-5 text-slate-500">14 May 2024</td>
                  <td className="py-3.5 px-5 text-slate-500 font-semibold">4 hours</td>
                  <td className="py-3.5 px-5 text-slate-550 font-medium">14 May, 4:00 PM</td>
                  <td className="py-3.5 px-5 text-slate-600 font-bold">Approved (Suresh Babu)</td>
                  <td className="py-3.5 px-5"><span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-700">TRN-2024-0049</td>
                  <td className="py-3.5 px-5 text-slate-600 font-semibold">Pineapple Colony Godown</td>
                  <td className="py-3.5 px-5 text-slate-600 font-semibold">KVR Showroom - Srikakulam</td>
                  <td className="py-3.5 px-5 font-bold text-slate-700">Dynamo Pro (5 Units)</td>
                  <td className="py-3.5 px-5 text-slate-500">18 May 2024</td>
                  <td className="py-3.5 px-5 text-slate-500 font-semibold">1 day</td>
                  <td className="py-3.5 px-5 text-slate-550 font-medium">18 May, 6:00 PM</td>
                  <td className="py-3.5 px-5 text-slate-600 font-bold">Pending Review</td>
                  <td className="py-3.5 px-5"><span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">In Transit</span></td>
                </tr>
              </Table>
            </div>
          )}
          {/* TAB 5: PURCHASE MANAGEMENT */}
          {activeTab === "purchases" && (
            <div className="space-y-6">
              
              <Table 
                title="Purchase Orders Register" 
                headers={["PO Reference", "Supplier Entity", "Items Specified", "Quantity Ordered", "Total Price", "Date Sent", "Payment Terms", "Est Delivery", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddPOOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Purchase Order
                  </button>
                }
              >
                {purchaseOrdersLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading purchase orders from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <EmptyState 
                        title="No Purchase Orders Registered" 
                        description="Stock purchase orders will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po, idx) => (
                    <tr key={po.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">{po.po_number}</td>
                      <td className="py-3.5 px-5 text-slate-700 font-semibold">{po.supplier_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-medium">{po.vehicle_model_name}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-700">{po.quantity} units</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(po.total_price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{po.order_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{po.payment_terms}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{po.estimated_delivery || "N/A"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          po.status === "approved" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          po.status === "received" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          po.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {po.status_display || po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {po.status === "pending" && (
                          <button 
                            onClick={() => handleApprovePO(po.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 6: SALES MANAGEMENT */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              
              <Table title="Invoiced Sales Records" headers={["Invoice Number", "Customer Name", "Contact", "Vehicle Model", "Battery Serial", "Sale Price", "Invoice Date", "Payment Mode", "Insurance Partner", "Sales Person", "Delivery Status"]}>
                {salesInvoicesLoading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading invoiced sales records from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : salesInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center">
                      <EmptyState 
                        title="No Sales Invoices Registered" 
                        description="Finalized customer sales invoices will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  salesInvoices.map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                      <td className="py-3.5 px-5 text-slate-800 font-bold">{inv.customer_name}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono">{inv.customer_contact}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{inv.model_name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-mono">{inv.battery_serial || "N/A"}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">₹ {parseFloat(inv.sale_price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{inv.sale_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{inv.payment_mode}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-semibold">{inv.insurance_partner || "N/A"}</td>
                      <td className="py-3.5 px-5 text-slate-650 font-semibold">{inv.executive_name || "Unassigned"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          inv.delivery_status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {inv.delivery_status_display || inv.delivery_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 7: LEAD MANAGEMENT */}
          {activeTab === "leads" && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Leads Conversion Pipeline</h3>
                <button 
                  onClick={() => setIsAddLeadOpen(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Lead
                </button>
              </div>
              {leadsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                  <span className="text-xs font-semibold text-slate-500">Loading leads conversion pipeline from PostgreSQL...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {["Enquiry", "New Lead", "Negotiation", "Won"].map((colStatus) => {
                    const filteredLeads = leadsList.filter((lead) => {
                      const status = lead.status;
                      if (colStatus === "Enquiry") return status === "enquiry";
                      if (colStatus === "New Lead") return status === "new_lead" || status === "contacted" || status === "follow_up";
                      if (colStatus === "Negotiation") return status === "negotiation";
                      if (colStatus === "Won") return status === "won";
                      return false;
                    });
                    return (
                      <div key={colStatus} className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col min-h-75">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-700 uppercase">{colStatus}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-extrabold">{filteredLeads.length}</span>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          {filteredLeads.length === 0 ? (
                             <div className="text-[10px] font-semibold text-slate-400 text-center py-8">No leads in stage</div>
                          ) : (
                            filteredLeads.map((lead) => (
                              <div key={lead.id} className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm hover:shadow transition-shadow space-y-2 text-left relative group">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-indigo-600 font-mono">LD-{lead.id}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{lead.source_display || lead.lead_source?.replace("_", " ")}</span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800">{lead.customer_name}</h4>
                                <p className="text-[10px] text-slate-500 font-semibold">{lead.contact_number} • {lead.interested_vehicle_name || "Kinetic Green E-Luna"}</p>
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                                  <span>Owner: {lead.executive_name || "Unassigned"}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* TAB 8: ADVANCE BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              
              <Table 
                title="Customer Booking Commitments" 
                headers={["Booking ID", "Customer Details", "Vehicle Reserved", "Advance Payment", "Booking Date", "Expiry Threshold", "Assigned Exec", "PDI Verified", "Approval State", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddBookingOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Record Booking
                  </button>
                }
              >
                {advanceBookingsLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading advance bookings from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : advanceBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <EmptyState 
                        title="No Bookings Registered" 
                        description="Customer bookings recorded by sales executives will display here dynamically." 
                      />
                    </td>
                  </tr>
                ) : (
                  advanceBookings.map((bk, idx) => (
                    <tr key={bk.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{bk.booking_id}</td>
                      <td className="py-3.5 px-5 text-slate-800"><div className="font-bold">{bk.customer_name}</div><div className="text-[10px] text-slate-400">{bk.contact_number}</div></td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{bk.vehicle_model_name}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">₹ {parseFloat(bk.advance_amount).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{bk.booking_date}</td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono font-semibold">{bk.expiry_date}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{bk.executive_name || "Unassigned"}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.pdi_verified === "yes" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.pdi_verified === "yes" ? "Yes" : bk.pdi_verified === "no" ? "No" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          bk.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          bk.status === "converted" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          bk.status === "cancelled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {bk.status_display || bk.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer">Cancel</button>
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 9: BATTERIES MANAGEMENT */}
          {activeTab === "batteries" && (
            <div className="space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">FIFO Stock Enforcement Protocol</h4>
                  <p className="text-xs text-amber-600 font-semibold mt-1">
                    System rules dictate that the oldest batteries purchased must be assigned to customer delivery invoices first.
                    Selecting a battery with a newer purchase date will trigger an override request block requiring Supervisor approval.
                  </p>
                </div>
              </div>
              <Table 
                title="Battery Storage Units (FIFO Registry)" 
                headers={["Battery Serial", "Capacity Rating", "Date Acquired", "Assigned EV", "Location Storage", "Manufacturer Corp", "Warranty Years", "Status", "Actions"]}
                actions={
                  <button 
                    onClick={() => setIsAddBatteryOpen(true)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Log Battery Stock
                  </button>
                }
              >
                {batteriesStock.map((batt, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">{batt.serial}</td>
                    <td className="py-3.5 px-5 text-slate-650 font-bold">{batt.capacity}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-semibold">{batt.purDate}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono">{batt.vehicle}</td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{batt.location}</td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">{batt.supplier}</td>
                    <td className="py-3.5 px-5 text-slate-550 font-bold">{batt.warrantyYears}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        batt.status === "Available" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        batt.status === "Sold" ? "bg-slate-100 text-slate-500" :
                        "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {batt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <button className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">History</button>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
          {/* TAB 10: LEDGER MANAGEMENT */}
          {activeTab === "ledger" && (
            <div className="space-y-6">
              
              {/* Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Ledger Income</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Purchase Cost</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.filter(row => row.ledger_type === "purchase_expense").reduce((acc, curr) => acc + parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Operating Expense</span>
                  <span className="text-xl font-bold text-slate-800">
                    ₹ {ledgerEntries.filter(row => row.ledger_type !== "purchase_expense").reduce((acc, curr) => acc + parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Net Cashflow</span>
                  <span className={`text-xl font-bold ${
                    ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    ₹ {ledgerEntries.reduce((acc, curr) => acc + parseFloat(curr.income || 0) - parseFloat(curr.expense || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <Table title="General Ledger Entries List" headers={["Transaction ID", "Category Type", "Branch Outlet", "Details Memo", "Cash Inward", "Cash Outward", "Payment Mode", "Approved By", "Entry Date"]}>
                {ledgerEntriesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-indigo-600" />
                        <span className="text-xs font-semibold text-slate-400">Loading ledger transaction records from PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <EmptyState 
                        title="No Transactions Logged" 
                        description="Financial activities across branches will register on this ledger automatically." 
                      />
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{row.transaction_id}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{row.ledger_type_display || row.ledger_type}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{row.branch_name}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-medium">{row.detail}</td>
                      <td className="py-3.5 px-5 font-bold text-emerald-600">{parseFloat(row.income) > 0 ? "₹ " + parseFloat(row.income).toLocaleString('en-IN') : "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-rose-600">{parseFloat(row.expense) > 0 ? "₹ " + parseFloat(row.expense).toLocaleString('en-IN') : "—"}</td>
                      <td className="py-3.5 px-5 text-slate-550 font-bold">{row.payment_mode}</td>
                      <td className="py-3.5 px-5 text-slate-500 font-bold">{row.approver_name || "System"}</td>
                      <td className="py-3.5 px-5 text-slate-450 font-medium">{row.created_at}</td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          )}
          {/* TAB 11: REPORTS & ANALYTICS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2">Enterprise Report Generator</h3>
                <p className="text-xs text-slate-400 font-semibold mb-6">Choose filters below to generate and extract spreadsheets/PDFs summaries.</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Report Module</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>Sales Ledger Summary</option>
                      <option>Inventory In-Out Movements</option>
                      <option>Battery FIFO Allocations</option>
                      <option>Executive Sales Commission</option>
                      <option>Lead Conversion Pipeline</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Branch Outlet</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>All Branches</option>
                      <option>Vizag Showroom</option>
                      <option>Srikakulam Showroom</option>
                      <option>Kakinada Showroom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date Range Filter</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500">
                      <option>This Month (May 2026)</option>
                      <option>Last Month (April 2026)</option>
                      <option>Year to Date (2026)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-lg shadow-md shadow-indigo-600/10 transition-all cursor-pointer">
                      <Download className="h-4 w-4" /> Download Excel/PDF
                    </button>
                  </div>
                </div>
                {/* Simulated data table preview */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Report Preview (First 3 entries)</span>
                    <span className="text-indigo-600 font-extrabold cursor-pointer">View full table</span>
                  </div>
                  <div className="p-4 text-xs font-semibold text-slate-500 space-y-2">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>KVR-Vizag Showroom • Delivered (INV-2024-0789)</span>
                      <span className="font-bold text-slate-800">₹ 98,500</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>KVR-Srikakulam Showroom • Delivered (INV-2024-0791)</span>
                      <span className="font-bold text-slate-800">₹ 1,15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>KVR-Vizag Showroom • Booking Confirm (BK-8021)</span>
                      <span className="font-bold text-slate-800">₹ 10,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TAB 12: USERS & ROLES */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Staff Directory & Role Assignments</h2>
                  <p className="text-xs text-slate-400 mt-1">Filter users by branch, user type, or role and add new user accounts for any permitted role.</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md shadow-emerald-600/15 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add New User
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                  <select
                    value={userBranchFilter}
                    onChange={(e) => setUserBranchFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
                  >
                    <option>All Branches</option>
                    <option>KVR Motors - Vizag</option>
                    <option>Future Ride - Vizag</option>
                    <option>KVR Motors - Srikakulam</option>
                    <option>KVR Motors - Kakinada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">User Type</label>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
                  >
                    <option>All Types</option>
                    <option>Admin</option>
                    <option>Staff</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-bold outline-none focus:border-indigo-500"
                  >
                    <option>All Roles</option>
                    <option>Owner</option>
                    <option>Supervisor</option>
                    <option>Sales Executive</option>
                    <option>Sales Staff</option>
                  </select>
                </div>
              </div>
              <Table title="Staff Directory & Role Assignments" headers={["Full Name", "Assigned Role", "User Type", "Branch Outlet", "Account Status", "Last Active Login"]}>
                {users
                  .filter((user) =>
                    (userBranchFilter === "All Branches" || user.branch === userBranchFilter) &&
                    (userTypeFilter === "All Types" || user.userType === userTypeFilter) &&
                    (userRoleFilter === "All Roles" || user.role === userRoleFilter)
                  )
                  .map((user, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                      <td className="py-3.5 px-5 font-bold text-slate-800">{user.name}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.role}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.userType}</td>
                      <td className="py-3.5 px-5 text-slate-600 font-semibold">{user.branch}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          user.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium">{user.lastLogin}</td>
                    </tr>
                  ))}
              </Table>
            </div>
          )}
          {/* TAB 13: SYSTEM SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Portal Configuration Settings</h3>
                <div className="space-y-4 max-w-xl text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Name</label>
                      <input type="text" defaultValue="KVR Motors Group" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Currency</label>
                      <input type="text" defaultValue="INR (₹)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tax Rate Code (GST%)</label>
                    <input type="text" defaultValue="18% SGST/CGST split" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none" />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer">
                      Save Settings
                    </button>
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer">
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* MODALS */}
      <Modal isOpen={isAddBranchOpen} onClose={() => setIsAddBranchOpen(false)} title="Create New Showroom / Branch Outlet">
        <form onSubmit={handleAddBranchSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Showroom Name</label>
            <input 
              type="text" 
              placeholder="e.g. KVR Motors - Gajuwaka" 
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Location City</label>
            <input 
              type="text" 
              placeholder="e.g. Visakhapatnam" 
              value={branchAddress}
              onChange={(e) => setBranchAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Phone / Manager</label>
            <input 
              type="text" 
              placeholder="e.g. 9876543210" 
              value={branchPhone}
              onChange={(e) => setBranchPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer">
            Register Branch
          </button>
        </form>
      </Modal>
      {/* 2. Add User */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Add New User Account">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setUsers([{ name: newUser.fullName, role: newUser.role, userType: newUser.userType, branch: newUser.branch, status: newUser.status, lastLogin: "Not yet logged in" }, ...users]);
            setNewUser({ fullName: "", email: "", role: "Sales Staff", branch: "KVR Motors - Vizag", status: "Active", userType: "Staff" });
            setIsAddUserOpen(false);
          }}
          className="space-y-4 text-left"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
            <input
              type="text"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              placeholder="e.g. Nikhil Rao"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="e.g. nikhil@kvrmotors.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Owner</option>
                <option>Supervisor</option>
                <option>Sales Executive</option>
                <option>Sales Staff</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">User Type</label>
              <select
                value={newUser.userType}
                onChange={(e) => setNewUser({ ...newUser, userType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Admin</option>
                <option>Staff</option>
                <option>Customer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Assignment</label>
              <select
                value={newUser.branch}
                onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>KVR Motors - Vizag</option>
                <option>Future Ride - Vizag</option>
                <option>KVR Motors - Srikakulam</option>
                <option>KVR Motors - Kakinada</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Account Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold outline-none focus:border-indigo-500"
                required
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/15 cursor-pointer">
            Create User
          </button>
        </form>
      </Modal>
      {/* 2. Add Vehicle Model */}
      <Modal isOpen={isAddVehicleOpen} onClose={() => setIsAddVehicleOpen(false)} title="Add Vehicle Model to Catalog">
        <form onSubmit={handleAddModelSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Model Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dynamo Pro" 
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Brand</label>
              <select 
                value={newModelBrand}
                onChange={(e) => setNewModelBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2.5 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required
              >
                <option value="">-- Select Brand --</option>
                {vehicleBrandsList.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
                {vehicleBrandsList.length === 0 && (
                  <option value="1">Kinetic Green</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Base Price (INR)</label>
              <input 
                type="number" 
                placeholder="e.g. 98500" 
                value={newModelPrice}
                onChange={(e) => setNewModelPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Battery Compatibility</label>
              <input 
                type="text" 
                placeholder="e.g. 2.0 kWh Swappable" 
                value={newModelBattery}
                onChange={(e) => setNewModelBattery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Color Variants (comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. Red, Blue, Matte Black" 
              value={newModelColors}
              onChange={(e) => setNewModelColors(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer">
            Add Model
          </button>
        </form>
      </Modal>
      {/* 3. Add Stock Unit */}
      <Modal isOpen={isAddStockOpen} onClose={() => setIsAddStockOpen(false)} title="Log Physical Stock Unit entry">
        <form onSubmit={(e) => { e.preventDefault(); setIsAddStockOpen(false); }} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">VIN Number (17-digit barcode)</label>
            <input type="text" placeholder="e.g. KVRVIN2026X990" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold font-mono outline-none focus:border-indigo-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Motor Number</label>
              <input type="text" placeholder="e.g. MTR-90888" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold font-mono outline-none focus:border-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chassis Number</label>
              <input type="text" placeholder="e.g. CHS-88988" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-bold font-mono outline-none focus:border-indigo-500" required />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer">
            Log Stock Unit
          </button>
        </form>
      </Modal>
      {/* 4. Create Purchase Order */}
      <Modal isOpen={isAddPOOpen} onClose={() => setIsAddPOOpen(false)} title="Create Supplier Purchase Order">
        <form onSubmit={handleCreatePOSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Supplier Entity Name</label>
            <input 
              type="text" 
              placeholder="e.g. Dynamo EV Manufacturers" 
              value={newPOSupplier}
              onChange={(e) => setNewPOSupplier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Model</label>
              <select 
                value={newPOModel}
                onChange={(e) => setNewPOModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2.5 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required
              >
                <option value="">-- Select Model --</option>
                {vehicleModelsList.map((model) => (
                  <option key={model.id} value={model.id}>{model.model_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity</label>
              <input 
                type="number" 
                placeholder="e.g. 30" 
                value={newPOQty}
                onChange={(e) => setNewPOQty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price (INR)</label>
              <input 
                type="number" 
                placeholder="e.g. 78000" 
                value={newPOPrice}
                onChange={(e) => setNewPOPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Terms</label>
              <input 
                type="text" 
                placeholder="e.g. Net 30" 
                value={newPOPaymentTerms}
                onChange={(e) => setNewPOPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
                required 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Estimated Delivery Date</label>
            <input 
              type="date" 
              value={newPOEstDelivery}
              onChange={(e) => setNewPOEstDelivery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs text-slate-705 font-bold outline-none focus:border-indigo-500" 
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer">
            Create Purchase Order
          </button>
        </form>
      </Modal>
    </div>
  );
}
