"use client";

import React, { useState, useEffect } from "react";
import { 
  getBranchCashDeposits, 
  createBranchCashDeposit, 
  updateBranchCashDeposit,
  deleteBranchCashDeposit,
  getBranchExpenses, 
  createBranchExpense,
  updateBranchExpense,
  deleteBranchExpense,
  BranchCashDeposit,
  BranchExpense
} from "../services/branchFinance";
import { getBranches, Branch } from "../services/branches";
import { getUsers, User } from "../services/users";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import Table from "./Table";
import Toast from "./Toast";
import { 
  Wallet, 
  Plus, 
  DollarSign, 
  Receipt, 
  TrendingDown, 
  Building,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Edit,
  Trash2
} from "lucide-react";

interface BranchExpenseViewProps {
  role: "owner" | "supervisor" | "admin";
}

export default function BranchExpenseView({ role }: BranchExpenseViewProps) {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<BranchCashDeposit[]>([]);
  const [expenses, setExpenses] = useState<BranchExpense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDepositEditModalOpen, setIsDepositEditModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<BranchCashDeposit | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  // Form States
  const [depositForm, setDepositForm] = useState({
    branch: "",
    supervisor: "",
    amount: "",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    branch: "",
    category: "electricity",
    amount: "",
    description: "",
    receipt_number: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [depData, expData, branchData, userData] = await Promise.all([
        getBranchCashDeposits(),
        getBranchExpenses(),
        getBranches(),
        getUsers(),
      ]);
      setDeposits(depData);
      setExpenses(expData);
      setBranches(branchData);
      setSupervisors(userData.filter(u => u.role === "supervisor"));
    } catch (e) {
      console.error("Failed to load finance data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on user's branch if supervisor
  const myBranch = branches.find(b => b.name === user?.showroom || b.name === user?.branch);
  
  const filteredDeposits = (role === "owner" 
    ? deposits 
    : deposits.filter(d => !myBranch || d.branch === myBranch.id || d.branch_name === user?.showroom || d.branch_name === user?.branch)
  ).slice().sort((a, b) => b.id - a.id);

  const filteredExpenses = (role === "owner" 
    ? expenses 
    : expenses.filter(e => !myBranch || e.branch === myBranch.id || e.branch_name === user?.showroom || e.branch_name === user?.branch)
  ).slice().sort((a, b) => b.id - a.id);

  // Aggregations
  const totalDeposited = filteredDeposits.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const netBalance = totalDeposited - totalExpenses;

  // Filter supervisors based on selected deposit branch (only show when a branch is selected)
  const selectedDepositBranch = branches.find(b => b.id === Number(depositForm.branch));
  const filteredSupervisors = depositForm.branch
    ? supervisors.filter(s => {
        if (!selectedDepositBranch) return false;
        const bName = selectedDepositBranch.name.toLowerCase();
        const sBranch = (s.branch || "").toLowerCase();
        const sShowroom = (s.showroom || "").toLowerCase();
        const sBranchId = (s as any).branch_id;
        const sShowroomId = (s as any).showroom_id;
        return (
          (sBranch && (sBranch.includes(bName) || bName.includes(sBranch))) ||
          (sShowroom && (sShowroom.includes(bName) || bName.includes(sShowroom))) ||
          sBranchId === selectedDepositBranch.id ||
          sShowroomId === selectedDepositBranch.id
        );
      })
    : [];

  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const openAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseForm({ branch: "", category: "electricity", amount: "", description: "", receipt_number: "" });
    setIsExpenseModalOpen(true);
  };

  const openEditExpense = (eItem: BranchExpense) => {
    setEditingExpenseId(eItem.id);
    setExpenseForm({
      branch: String(eItem.branch || ""),
      category: eItem.category || "electricity",
      amount: String(eItem.amount || ""),
      description: eItem.description || "",
      receipt_number: eItem.receipt_number || "",
    });
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpenseItem = async (eItem: BranchExpense) => {
    if (!window.confirm(`Are you sure you want to delete expense ${eItem.expense_id}?`)) return;
    try {
      await deleteBranchExpense(eItem.id);
      setToast({ msg: "Branch expense deleted successfully.", type: "success" });
      loadData();
    } catch (err) {
      console.error("Failed deleting expense:", err);
      setToast({ msg: "Failed to delete expense record.", type: "error" });
    }
  };

  const openEditDeposit = (d: BranchCashDeposit) => {
    setEditingDeposit(d);
    setDepositForm({
      branch: String(d.branch || ""),
      supervisor: String(d.supervisor || ""),
      amount: String(d.amount || ""),
      notes: d.notes || "",
    });
    setIsDepositEditModalOpen(true);
  };

  const handleDeleteDeposit = async (d: BranchCashDeposit) => {
    if (!window.confirm(`Delete deposit ${d.deposit_id} of ₹${Number(d.amount).toLocaleString('en-IN')}?`)) return;
    try {
      await deleteBranchCashDeposit(d.id);
      setToast({ msg: "Deposit deleted successfully.", type: "success" });
      loadData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.detail || "Failed to delete deposit.", type: "error" });
    }
  };

  const handleDepositEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeposit) return;
    try {
      await updateBranchCashDeposit(editingDeposit.id, {
        branch: Number(depositForm.branch),
        supervisor: depositForm.supervisor ? Number(depositForm.supervisor) : undefined,
        amount: Number(depositForm.amount),
        notes: depositForm.notes,
      });
      setToast({ msg: "Deposit updated successfully!", type: "success" });
      setIsDepositEditModalOpen(false);
      setEditingDeposit(null);
      setDepositForm({ branch: "", supervisor: "", amount: "", notes: "" });
      loadData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.detail || "Failed to update deposit.", type: "error" });
    }
  };


  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingDeposit) return;

    if (!depositForm.branch) {
      setToast({ msg: "Please select a target branch.", type: "error" });
      return;
    }
    if (!depositForm.amount || Number(depositForm.amount) <= 0) {
      setToast({ msg: "Please enter a valid deposit amount.", type: "error" });
      return;
    }
    try {
      setIsSubmittingDeposit(true);
      await createBranchCashDeposit({
        branch: Number(depositForm.branch),
        supervisor: depositForm.supervisor ? Number(depositForm.supervisor) : undefined,
        amount: Number(depositForm.amount),
        notes: depositForm.notes || "",
      });
      setToast({ msg: "Cash deposited to branch supervisor successfully!", type: "success" });
      setIsDepositModalOpen(false);
      setDepositForm({ branch: "", supervisor: "", amount: "", notes: "" });
      loadData();
    } catch (err: any) {
      console.error("Deposit error:", err.response?.data || err);
      let errMsg = "Failed to deposit cash. Check inputs.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") errMsg = err.response.data;
        else if (err.response.data.detail) errMsg = err.response.data.detail;
        else errMsg = Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(", ");
      }
      setToast({ msg: errMsg, type: "error" });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingExpense) return;

    try {
      setIsSubmittingExpense(true);
      const defaultBranchId = myBranch ? myBranch.id : branches[0]?.id;
      const targetBranchId = expenseForm.branch ? Number(expenseForm.branch) : defaultBranchId;
      if (!targetBranchId) {
        setToast({ msg: "Select a branch for the expense.", type: "error" });
        return;
      }
      const payload = {
        branch: targetBranchId,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        receipt_number: expenseForm.receipt_number,
      };

      if (editingExpenseId) {
        await updateBranchExpense(editingExpenseId, payload);
        setToast({ msg: "Branch expense updated successfully!", type: "success" });
      } else {
        await createBranchExpense(payload);
        setToast({ msg: "Branch expense recorded successfully!", type: "success" });
      }
      
      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
      setExpenseForm({ branch: "", category: "electricity", amount: "", description: "", receipt_number: "" });
      loadData();
    } catch (err: any) {
      console.error("Expense error:", err.response?.data || err);
      let errMsg = "Failed to record expense.";
      if (err.response?.data) {
        if (typeof err.response.data === "string") errMsg = err.response.data;
        else if (err.response.data.detail) errMsg = err.response.data.detail;
        else errMsg = Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(", ");
      }
      setToast({ msg: errMsg, type: "error" });
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Cash Deposited</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#04a700]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{totalDeposited.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Branch float allocated by owner</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Branch Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">₹{totalExpenses.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Utilities, maintenance & operations</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Net Petty Cash Balance</span>
            <div className={`p-2 rounded-xl ${netBalance >= 0 ? "bg-emerald-50 text-[#04a700]" : "bg-rose-50 text-rose-600"}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${netBalance >= 0 ? "text-[#04a700]" : "text-rose-600"}`}>
            ₹{netBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Available unspent float balance</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#04a700]" /> Branch Petty Cash & Operational Expenses
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {role === "owner" ? "Manage cash deposits to branch supervisors and inspect operational expenses." : "Log branch operational expenses and track petty cash balance."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {role === "owner" && (
            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs shadow-md shadow-[#04a700]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Deposit Cash to Supervisor
            </button>
          )}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Record Branch Expense
          </button>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Deposits Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Recent Cash Deposits
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filteredDeposits.length} records
            </span>
          </div>

          <Table headers={role === "owner"
            ? ["Deposit ID", "Branch", "Amount", "Recipient Supervisor", "Deposited By", "Date", "Actions"]
            : ["Branch", "Amount", "Deposited By", "Date"]
          }>
            {filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan={role === "owner" ? 7 : 4} className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No cash deposits logged yet.
                </td>
              </tr>
            ) : (
              filteredDeposits.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  {role === "owner" && <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">{d.deposit_id}</td>}
                  <td className="py-3 px-4 font-bold text-slate-700 text-xs">{d.branch_name || "Branch"}</td>
                  <td className="py-3 px-4 font-extrabold text-[#04a700] text-xs">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                  {role === "owner" && <td className="py-3 px-4 font-semibold text-slate-600 text-xs">{d.supervisor_name || "—"}</td>}
                  <td className="py-3 px-4 font-semibold text-blue-700 text-xs">{d.deposited_by_name || "Owner"}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{d.deposit_date}</td>
                  {role === "owner" && (
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => openEditDeposit(d)}
                        className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDeposit(d)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </Table>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-600" /> Branch Expenses Logged
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {filteredExpenses.length} records
            </span>
          </div>

          <Table headers={["Expense ID", "Category", "Amount", "Description", "Submitted By", "Actions"]}>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">{e.expense_id}</td>
                  <td className="py-3 px-4 text-xs font-bold text-slate-700 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {e.category_display || e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-rose-600 text-xs">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-medium text-slate-600 text-xs max-w-[150px] truncate">{e.description || "—"}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{e.submitted_by_name || "Staff"}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button 
                      onClick={() => openEditExpense(e)}
                      className="text-xs text-[#04a700] hover:text-[#038a00] font-bold mr-3 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteExpenseItem(e)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </div>
      </div>

      {/* Modal 1: Deposit Cash to Supervisor */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Deposit Petty Cash to Branch Supervisor">
        <form onSubmit={handleDepositSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Branch <span className="text-rose-500">*</span></label>
            <select
              value={depositForm.branch}
              onChange={(e) => {
                const newBranchId = e.target.value;
                const targetB = branches.find(b => b.id === Number(newBranchId));
                let matchingSup = "";
                if (targetB) {
                  const bName = targetB.name.toLowerCase();
                  const match = supervisors.find(s => {
                    const sBranch = (s.branch || "").toLowerCase();
                    const sShowroom = (s.showroom || "").toLowerCase();
                    return (sBranch && (sBranch.includes(bName) || bName.includes(sBranch))) ||
                           (sShowroom && (sShowroom.includes(bName) || bName.includes(sShowroom)));
                  });
                  if (match) matchingSup = String(match.id);
                }
                setDepositForm({ ...depositForm, branch: newBranchId, supervisor: matchingSup });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
              required
            >
              <option value="">Select Branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Recipient Supervisor {!depositForm.branch ? "(Select a branch first)" : filteredSupervisors.length === 0 ? "(No Supervisor Found for Branch)" : ""}
            </label>
            <select
              value={depositForm.supervisor}
              onChange={(e) => setDepositForm({ ...depositForm, supervisor: e.target.value })}
              disabled={!depositForm.branch}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">{!depositForm.branch ? "Select Branch First..." : "Select Supervisor..."}</option>
              {filteredSupervisors.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.showroom || s.branch || "Supervisor"})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount (INR) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              placeholder="e.g. 25000"
              value={depositForm.amount}
              onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Allocation Purpose</label>
            <textarea
              placeholder="e.g. Weekly petty cash float for showroom electricity and customer refreshments..."
              value={depositForm.notes}
              onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none h-20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingDeposit}
            className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4"
          >
            {isSubmittingDeposit ? "Transferring Cash..." : "Transfer Cash Deposit"}
          </button>
        </form>
      </Modal>

      {/* Modal 2: Record Branch Expense */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Branch Operational Expense">
        <form onSubmit={handleExpenseSubmit} className="space-y-4 text-left">
          {role === "owner" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Outlet <span className="text-rose-500">*</span></label>
              <select
                value={expenseForm.branch}
                onChange={(e) => setExpenseForm({ ...expenseForm, branch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
                required
              >
                <option value="">Select Branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expense Category <span className="text-rose-500">*</span></label>
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
              required
            >
              <option value="electricity">Electricity / Power Bill</option>
              <option value="transport">Vehicle Transport & Delivery</option>
              <option value="maintenance">Showroom Repair & Maintenance</option>
              <option value="refreshments">Staff Refreshments & Water</option>
              <option value="misc">Other Daily Expenses</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Expense Amount (INR) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              placeholder="e.g. 4500"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Receipt / Bill Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. INV-90812"
              value={expenseForm.receipt_number}
              onChange={(e) => setExpenseForm({ ...expenseForm, receipt_number: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Details</label>
            <textarea
              placeholder="e.g. Paid monthly electricity bill for main showroom..."
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none h-20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingExpense}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4"
          >
            {isSubmittingExpense ? "Saving Expense..." : "Save Branch Expense"}
          </button>
        </form>
      </Modal>


      {/* Modal 3: Edit Deposit (Owner only) */}
      <Modal isOpen={isDepositEditModalOpen} onClose={() => { setIsDepositEditModalOpen(false); setEditingDeposit(null); }} title={`Edit Deposit: ${editingDeposit?.deposit_id || ""}`}>
        <form onSubmit={handleDepositEditSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Target Branch <span className="text-rose-500">*</span></label>
            <select
              value={depositForm.branch}
              onChange={(e) => setDepositForm({ ...depositForm, branch: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
              required
            >
              <option value="">Select Branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient Supervisor</label>
            <select
              value={depositForm.supervisor}
              onChange={(e) => setDepositForm({ ...depositForm, supervisor: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
            >
              <option value="">Select Supervisor...</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.showroom || s.branch || "Supervisor"})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount (INR) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              placeholder="e.g. 25000"
              value={depositForm.amount}
              onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Allocation Purpose</label>
            <textarea
              placeholder="e.g. Weekly petty cash float..."
              value={depositForm.notes}
              onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none h-20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4"
          >
            Save Changes
          </button>
        </form>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    </div>
  );
}
