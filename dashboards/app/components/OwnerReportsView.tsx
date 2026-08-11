"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getBranches, Branch } from "../services/branches";
import { getVehicleUnits, VehicleUnit } from "../services/vehicles";
import { getBatteries, Battery } from "../services/batteries";
import { getSalesInvoices, SalesInvoice } from "../services/sales";
import { getPurchaseOrders, PurchaseOrder } from "../services/purchases";
import { PaginationControls } from "./PaginationControls";
import Toast from "./Toast";
import { 
  FileSpreadsheet, 
  Download, 
  Car, 
  Battery as BatteryIcon, 
  CreditCard, 
  Building,
  Calendar,
  Filter,
  Eye,
  Printer,
  ShoppingBag
} from "lucide-react";

export default function OwnerReportsView() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  
  // Active report configuration
  const [reportType, setReportType] = useState<"sales" | "vehicles" | "batteries" | "purchases">("sales");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [branchData, vehicleData, batteryData, salesData, purchaseData] = await Promise.all([
        getBranches().catch(() => []),
        getVehicleUnits().catch(() => []),
        getBatteries().catch(() => []),
        getSalesInvoices().catch(() => []),
        getPurchaseOrders().catch(() => []),
      ]);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setBatteries(Array.isArray(batteryData) ? batteryData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setPurchases(Array.isArray(purchaseData) ? purchaseData : []);
    } catch (err) {
      console.error("Failed to load reporting telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [reportType, selectedBranch, startDate, endDate, searchQuery]);

  // Compute filtered dataset
  const filteredData = useMemo(() => {
    if (reportType === "sales") {
      return sales.filter(s => {
        const matchesBranch = selectedBranch === "all" || s.branch_name === selectedBranch || String(s.branch) === selectedBranch;
        const d = s.sale_date || (s as any).created_at || "";
        const matchesStart = !startDate || (d && d.slice(0, 10) >= startDate);
        const matchesEnd = !endDate || (d && d.slice(0, 10) <= endDate);
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (s.invoice_number?.toLowerCase().includes(q) || s.customer_name?.toLowerCase().includes(q) || s.model_name?.toLowerCase().includes(q));
        return matchesBranch && matchesStart && matchesEnd && matchesSearch;
      });
    }

    if (reportType === "vehicles") {
      return vehicles.filter(v => {
        const matchesBranch = selectedBranch === "all" || v.branch_name === selectedBranch || String(v.branch) === selectedBranch;
        const d = v.purchase_date || "";
        const matchesStart = !startDate || (d && d.slice(0, 10) >= startDate);
        const matchesEnd = !endDate || (d && d.slice(0, 10) <= endDate);
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (v.vin_number?.toLowerCase().includes(q) || v.model_name?.toLowerCase().includes(q) || v.color?.toLowerCase().includes(q));
        return matchesBranch && matchesStart && matchesEnd && matchesSearch;
      });
    }

    if (reportType === "batteries") {
      return batteries.filter(b => {
        const matchesBranch = selectedBranch === "all" || b.branch_name === selectedBranch || String(b.location) === selectedBranch;
        const d = b.purchase_date || "";
        const matchesStart = !startDate || (d && d.slice(0, 10) >= startDate);
        const matchesEnd = !endDate || (d && d.slice(0, 10) <= endDate);
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (b.serial_number?.toLowerCase().includes(q) || b.supplier?.toLowerCase().includes(q) || b.capacity?.toLowerCase().includes(q));
        return matchesBranch && matchesStart && matchesEnd && matchesSearch;
      });
    }

    if (reportType === "purchases") {
      return purchases.filter(p => {
        const matchesBranch = selectedBranch === "all" || p.branch_name === selectedBranch || String(p.branch) === selectedBranch;
        const d = p.order_date || p.created_at || "";
        const matchesStart = !startDate || (d && d.slice(0, 10) >= startDate);
        const matchesEnd = !endDate || (d && d.slice(0, 10) <= endDate);
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (p.po_number?.toLowerCase().includes(q) || p.supplier_name?.toLowerCase().includes(q) || p.model_name?.toLowerCase().includes(q));
        return matchesBranch && matchesStart && matchesEnd && matchesSearch;
      });
    }

    return [];
  }, [reportType, sales, vehicles, batteries, purchases, selectedBranch, startDate, endDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Export CSV
  const downloadCSV = () => {
    let filename = `Report_${reportType}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === "sales") {
      filename = "Sales_Invoices_Report";
      headers = ["Invoice Number", "Date", "Customer Name", "Contact", "Branch", "Vehicle Model", "VIN", "Battery Serial", "Sale Price (INR)", "Payment Mode", "Status"];
      rows = filteredData.map((s: any) => [
        s.invoice_number || `INV-${s.id}`,
        s.sale_date || "-",
        s.customer_name || "-",
        s.customer_contact || "-",
        s.branch_name || "Main Branch",
        s.model_name || "EV Model",
        s.vin_number || "-",
        s.battery_serial || "-",
        `₹ ${parseFloat(s.sale_price || 0).toLocaleString("en-IN")}`,
        s.payment_mode || "Cash",
        s.delivery_status || "completed"
      ]);
    } else if (reportType === "vehicles") {
      filename = "Vehicle_Stock_Report";
      headers = ["Branch Name", "Location", "Model Name", "VIN Number", "Motor Code", "Chassis Code", "Color", "Purchase Date", "Stock Status"];
      rows = filteredData.map((v: any) => [
        v.branch_name || "Main Branch",
        v.showroom_name || v.location_name || "Godown",
        v.model_name || "EV Model",
        v.vin_number || "-",
        v.motor_number || "-",
        v.chassis_number || "-",
        v.color || "-",
        v.purchase_date || "-",
        v.stock_status || v.status || "available"
      ]);
    } else if (reportType === "batteries") {
      filename = "Battery_Stock_Report";
      headers = ["Branch Name", "Location", "Serial Number", "Capacity", "Supplier", "Warranty Years", "Purchase Date", "Status"];
      rows = filteredData.map((b: any) => [
        b.branch_name || "Main Branch",
        b.location_name || "Godown",
        b.serial_number || "-",
        b.capacity || "-",
        b.supplier || "-",
        b.warranty_years || 3,
        b.purchase_date || "-",
        b.status || "available"
      ]);
    } else if (reportType === "purchases") {
      filename = "Purchase_Orders_Report";
      headers = ["PO Number", "Supplier", "Model Name", "Quantity", "Total Price (INR)", "Order Date", "Est. Delivery", "Status"];
      rows = filteredData.map((p: any) => [
        p.po_number || `PO-${p.id}`,
        p.supplier_name || "-",
        p.model_name || "-",
        p.quantity || 1,
        `₹ ${parseFloat(p.total_price || 0).toLocaleString("en-IN")}`,
        p.order_date || "-",
        p.estimated_delivery_date || "-",
        p.status || "approved"
      ]);
    }

    const sanitize = (val: any) => {
      if (val === null || val === undefined) return "";
      let str = String(val).trim().replace(/[\u2010-\u2015\u2013\u2014]/g, "-");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(sanitize).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) link.parentNode.removeChild(link);

    setToast({ msg: `Report '${filename}' downloaded successfully!`, type: "success" });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#04a700]" /> Dynamic Enterprise Reports & Data Hub
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Filter, inspect live table preview with formatted totals, and download reports for your business.
          </p>
        </div>
        
        <button
          onClick={downloadCSV}
          disabled={filteredData.length === 0}
          className="px-4 py-2.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs shadow-md shadow-[#04a700]/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Download Filtered CSV ({filteredData.length})
        </button>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: "sales", label: "Sales Invoices", icon: CreditCard, count: sales.length, color: "purple" },
          { id: "vehicles", label: "Vehicle Stock", icon: Car, count: vehicles.length, color: "blue" },
          { id: "batteries", label: "Battery Registry", icon: BatteryIcon, count: batteries.length, color: "emerald" },
          { id: "purchases", label: "Purchase Orders", icon: ShoppingBag, count: purchases.length, color: "amber" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-slate-400" : "text-slate-400"}`}>
                  Report Module
                </span>
                <h3 className="text-xs font-black mt-0.5">{tab.label}</h3>
              </div>
              <div className={`p-2 rounded-xl ${isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Branch Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Enterprise Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Search Text
            </label>
            <input
              type="text"
              placeholder="Search VIN, Invoice, Model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Live Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <Eye className="h-4 w-4 text-emerald-600" />
            <span>Live Data Preview ({filteredData.length} Records)</span>
          </div>
          {(startDate || endDate || selectedBranch !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBranch("all");
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
              }}
              className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            Loading report data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No report records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                  {reportType === "sales" && (
                    <>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4 text-right">Sale Price</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}

                  {reportType === "vehicles" && (
                    <>
                      <th className="py-3 px-4">VIN Number</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Color</th>
                      <th className="py-3 px-4">Motor #</th>
                      <th className="py-3 px-4">Purchase Date</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}

                  {reportType === "batteries" && (
                    <>
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Branch/Location</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Warranty</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}

                  {reportType === "purchases" && (
                    <>
                      <th className="py-3 px-4">PO Number</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Qty</th>
                      <th className="py-3 px-4 text-right">Total Price</th>
                      <th className="py-3 px-4">Order Date</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors font-medium text-slate-700">
                    {reportType === "sales" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.invoice_number || `INV-${row.id}`}</td>
                        <td className="py-3 px-4">{row.sale_date || "-"}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.customer_name}</td>
                        <td className="py-3 px-4">{row.branch_name || "Main Branch"}</td>
                        <td className="py-3 px-4">{row.model_name || "EV Model"}</td>
                        <td className="py-3 px-4 font-mono font-black text-right text-emerald-600">
                          ₹ {parseFloat(row.sale_price || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-semibold">{row.payment_mode || "Cash"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.delivery_status === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {row.delivery_status || "Ready"}
                          </span>
                        </td>
                      </>
                    )}

                    {reportType === "vehicles" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.vin_number}</td>
                        <td className="py-3 px-4">{row.branch_name || "Main Branch"}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.model_name}</td>
                        <td className="py-3 px-4">{row.color || "-"}</td>
                        <td className="py-3 px-4 font-mono">{row.motor_number || "-"}</td>
                        <td className="py-3 px-4">{row.purchase_date || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.stock_status === "available" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"
                          }`}>
                            {row.stock_status || "Available"}
                          </span>
                        </td>
                      </>
                    )}

                    {reportType === "batteries" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.serial_number}</td>
                        <td className="py-3 px-4">{row.branch_name || row.location_name || "Godown"}</td>
                        <td className="py-3 px-4 font-bold">{row.capacity || "-"}</td>
                        <td className="py-3 px-4">{row.supplier || "-"}</td>
                        <td className="py-3 px-4">{row.warranty_years || 3} Years</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {row.status || "Available"}
                          </span>
                        </td>
                      </>
                    )}

                    {reportType === "purchases" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.po_number}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.supplier_name}</td>
                        <td className="py-3 px-4">{row.model_name}</td>
                        <td className="py-3 px-4 font-mono font-bold">{row.quantity}</td>
                        <td className="py-3 px-4 font-mono font-black text-right text-rose-600">
                          ₹ {parseFloat(row.total_price || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">{row.order_date || "-"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {row.status || "Approved"}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          itemLabel="report records"
        />
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

