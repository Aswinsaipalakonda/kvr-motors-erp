"use client";

import React, { useState, useEffect } from "react";
import { getBranches, Branch } from "../services/branches";
import { getVehicleUnits, VehicleUnit } from "../services/vehicles";
import { getBatteries, Battery } from "../services/batteries";
import { getSalesInvoices, SalesInvoice } from "../services/sales";
import Table from "./Table";
import Toast from "./Toast";
import { 
  FileSpreadsheet, 
  Download, 
  Car, 
  Battery as BatteryIcon, 
  CreditCard, 
  Building,
  CheckCircle2,
  Calendar,
  Filter
} from "lucide-react";

export default function OwnerReportsView() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [branchData, vehicleData, batteryData, salesData] = await Promise.all([
        getBranches().catch(() => []),
        getVehicleUnits().catch(() => []),
        getBatteries().catch(() => []),
        getSalesInvoices().catch(() => []),
      ]);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
      setBatteries(Array.isArray(batteryData) ? batteryData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
    } catch (err) {
      console.error("Failed to load reporting telemetry:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAllData();
  }, []);

  // Helper to trigger CSV file download
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    setToast({ msg: `Report '${filename}' downloaded successfully!`, type: "success" });
  };

  // 1. Export Physical Stock Vehicles Report
  const exportVehicleStockReport = () => {
    const filtered = selectedBranch === "all" 
      ? vehicles 
      : vehicles.filter(v => v.branch_name === selectedBranch || String(v.branch) === selectedBranch);

    const headers = ["Branch Name", "Showroom/Location", "Model Name", "VIN Number", "Motor Number", "Chassis Number", "Color", "Purchase Date", "Stock Status"];
    const rows = filtered.map(v => [
      v.branch_name || "Branch",
      v.showroom_name || v.location_name || "Godown",
      v.model_name || "EV Model",
      v.vin_number || "—",
      v.motor_number || "—",
      v.chassis_number || "—",
      v.color || "—",
      v.purchase_date || "—",
      v.status || "available"
    ]);

    downloadCSV("Branch_Wise_Physical_Stock_Vehicles", headers, rows);
  };

  // 2. Export Physical Stock Batteries Report
  const exportBatteryStockReport = () => {
    const filtered = selectedBranch === "all"
      ? batteries
      : batteries.filter(b => b.branch_name === selectedBranch || String(b.location) === selectedBranch);

    const headers = ["Branch Name", "Location", "Serial Number", "Battery Code", "Capacity Spec", "Supplier", "Warranty Years", "Purchase Date", "Status"];
    const rows = filtered.map(b => [
      b.branch_name || b.location_name || "Branch",
      b.location_name || "Godown",
      b.serial_number || "—",
      b.battery_code || "—",
      b.capacity || "—",
      b.supplier || "—",
      b.warranty_years || 3,
      b.purchase_date || "—",
      b.status || "available"
    ]);

    downloadCSV("Branch_Wise_Physical_Stock_Batteries", headers, rows);
  };

  // 3. Export Sales Data Report (VIN & Battery Serial Breakdown)
  const exportSalesDataReport = () => {
    const filtered = selectedBranch === "all"
      ? sales
      : sales.filter(s => s.branch_name === selectedBranch || String(s.branch) === selectedBranch);

    const headers = ["Invoice Number", "Date", "Customer Name", "Contact Mobile", "Branch Name", "Vehicle Model", "VIN Number", "Motor Number", "Assigned Battery Serial", "Sale Price (INR)", "Payment Mode", "Split Breakdown", "Delivery Status"];
    const rows = filtered.map(s => {
      let splitStr = "—";
      if (s.payment_split_details) {
        try {
          const sp = typeof s.payment_split_details === "string" ? JSON.parse(s.payment_split_details) : s.payment_split_details;
          splitStr = Object.entries(sp).map(([k, v]) => `${k.toUpperCase()}: ₹${v}`).join(" | ");
        } catch (e) {
          splitStr = String(s.payment_split_details);
        }
      }
      return [
        s.invoice_number || `INV-${s.id}`,
        s.sale_date || "—",
        s.customer_name || "—",
        s.customer_contact || "—",
        s.branch_name || "Branch",
        s.model_name || "EV Model",
        s.vin_number || "—",
        s.motor_number || "—",
        s.battery_serial || "—",
        s.sale_price || 0,
        s.payment_mode || "Cash",
        splitStr,
        s.delivery_status || "processing"
      ];
    });

    downloadCSV("Branch_Wise_Sales_Data_Report", headers, rows);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#04a700]" /> Enterprise Reports & Inventory Export Hub
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Download branch-wise CSV/Excel reports for physical vehicle units, battery inventory, and sales transactions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Filter Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer"
            >
              <option value="all">All Enterprise Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3 Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Vehicles */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Branch-wise Physical Stock Vehicles</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Complete inventory list of physical vehicle units with VIN numbers, motor codes, chassis codes, color specs, and branch locations.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
              <span>Total Units in Filter:</span>
              <span className="text-blue-600 font-extrabold">
                {selectedBranch === "all" ? vehicles.length : vehicles.filter(v => v.branch_name === selectedBranch || String(v.branch) === selectedBranch).length} Units
              </span>
            </div>
          </div>
          <button
            onClick={exportVehicleStockReport}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" /> Download Vehicles CSV
          </button>
        </div>

        {/* Card 2: Batteries */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#04a700] w-fit">
              <BatteryIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Branch-wise Physical Stock Batteries</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Comprehensive battery inventory detailing serial numbers, battery codes, capacity specs, warranty years, and warehouse availability.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
              <span>Total Battery Packs:</span>
              <span className="text-[#04a700] font-extrabold">
                {selectedBranch === "all" ? batteries.length : batteries.filter(b => b.branch_name === selectedBranch || String(b.location) === selectedBranch).length} Packs
              </span>
            </div>
          </div>
          <button
            onClick={exportBatteryStockReport}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" /> Download Batteries CSV
          </button>
        </div>

        {/* Card 3: Sales */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Branch-wise Sales & Invoicing Data</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Full sales record report containing invoice numbers, customer contact details, allocated VINs, assigned battery serials, sale amounts, and payment mode breakdowns.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl">
              <span>Total Invoices Logged:</span>
              <span className="text-purple-600 font-extrabold">
                {selectedBranch === "all" ? sales.length : sales.filter(s => s.branch_name === selectedBranch || String(s.branch) === selectedBranch).length} Invoices
              </span>
            </div>
          </div>
          <button
            onClick={exportSalesDataReport}
            className="w-full py-2.5 rounded-xl bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs shadow-md shadow-[#04a700]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" /> Download Sales Data CSV
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
