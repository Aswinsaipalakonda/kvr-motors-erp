"use client";

import React, { useState, useEffect } from "react";
import { 
  getIssueReports, 
  createIssueReport, 
  updateIssueReport,
  IssueReport 
} from "../services/issues";
import { getBranches, Branch } from "../services/branches";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import Table from "./Table";
import Toast from "./Toast";
import { 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  Building,
  FileText,
  HelpCircle
} from "lucide-react";

interface IssueReportViewProps {
  role: "owner" | "supervisor" | "admin";
}

export default function IssueReportView({ role }: IssueReportViewProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"in_progress" | "resolved">("in_progress");

  // Form State
  const [issueForm, setIssueForm] = useState({
    branch: "",
    category: "vehicle_damage",
    priority: "medium",
    title: "",
    description: "",
    asset_reference: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [issueData, branchData] = await Promise.all([
        getIssueReports(),
        getBranches(),
      ]);
      const mappedIssues = issueData.length > 0 ? issueData : [
        {
          id: 301,
          issue_id: "ISS-2026-001",
          branch: 1,
          branch_name: "Visakhapatnam Showroom",
          category: "vehicle_damage",
          category_display: "Vehicle Transport Scratch / Damage",
          priority: "high",
          priority_display: "High",
          title: "Transport Minor Scratch on Side Panel",
          description: "Lima model unit VIN-9901 arrived from warehouse with minor paint scratch on right side panel during unloading.",
          asset_reference: "VIN-9901 / Model Lima",
          status: "in_progress",
          resolution_notes: "Body shop technician assigned for buffing & paint touchup.",
          reported_by_name: "Suresh Babu",
          created_at: "2026-07-27T10:30:00Z",
          updated_at: "2026-07-28T11:00:00Z"
        },
        {
          id: 302,
          issue_id: "ISS-2026-002",
          branch: 2,
          branch_name: "Srikakulam Showroom",
          category: "battery_malfunction",
          category_display: "Battery Voltage / Controller Issue",
          priority: "urgent",
          priority_display: "Urgent",
          title: "BMS Controller Voltage Fluctuation",
          description: "Battery serial BAT-2026-0412 showed BMS voltage cutoff error during initial pre-delivery inspection.",
          asset_reference: "BAT-2026-0412",
          status: "reported",
          reported_by_name: "Ramesh K",
          created_at: "2026-07-28T09:15:00Z",
          updated_at: "2026-07-28T09:15:00Z"
        }
      ];
      setIssues(mappedIssues as any);
      setBranches(branchData);
    } catch (e) {
      console.error("Failed to load issue reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds so owner sees new supervisor reports in real-time
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);


  // Backend already scopes issues per role (owner sees all; supervisors see their branch + own reports).
  // No need for client-side double-filtering which was hiding newly submitted reports.
  const filteredIssues = issues;

  const pendingIssuesCount = filteredIssues.filter(i => i.status !== "resolved").length;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userBranch = branches.find(b => b.name === user?.branch || b.name === user?.showroom);
      const branchId = issueForm.branch ? Number(issueForm.branch) : (userBranch ? userBranch.id : branches[0]?.id);
      if (!branchId) {
        setToast({ msg: "Could not determine branch. Please select a branch.", type: "error" });
        return;
      }
      await createIssueReport({
        branch: Number(branchId),
        category: issueForm.category,
        priority: issueForm.priority,
        title: issueForm.title,
        description: issueForm.description,
        asset_reference: issueForm.asset_reference,
      });
      setToast({ msg: "Problem / Issue reported to Owner successfully!", type: "success" });
      setIsReportModalOpen(false);
      setIssueForm({ branch: "", category: "vehicle_damage", priority: "medium", title: "", description: "", asset_reference: "" });
      loadData();
    } catch (err) {
      setToast({ msg: "Failed to submit issue report.", type: "error" });
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      await updateIssueReport(selectedIssue.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes,
      });
      setToast({ msg: `Issue status updated to ${resolutionStatus.replace('_', ' ')}!`, type: "success" });
      setSelectedIssue(null);
      setResolutionNotes("");
      loadData();
    } catch (err: any) {
      console.error("Issue update error:", err?.response?.data || err?.message || err);
      const detail = err?.response?.data?.detail
        || err?.response?.data?.status?.[0]
        || (typeof err?.response?.data === 'string' ? err.response.data : null)
        || JSON.stringify(err?.response?.data)
        || err?.message
        || "Failed to update issue status.";
      setToast({ msg: `Update failed: ${detail}`, type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Operational Issue & Defect Tracker
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {role === "owner" 
              ? "Inspect reported vehicle damages, battery defects, or equipment failures and update resolution status." 
              : "Report operational problems regarding vehicles, batteries, chargers, or showroom equipment directly to management."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Report Operational Problem
          </button>
        </div>
      </div>

      {/* Main Issue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" /> Issue Reports Log
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {pendingIssuesCount} pending resolution
          </span>
        </div>

        <Table headers={["Issue ID", "Branch", "Category", "Priority", "Title & Description", "Asset Ref", "Status", "Actions"]}>
          {filteredIssues.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-semibold">
                No operational issues logged. Everything is running smoothly!
              </td>
            </tr>
          ) : (
            filteredIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">{issue.issue_id}</td>
                <td className="py-3 px-4 font-bold text-slate-700 text-xs">{issue.branch_name || "Branch"}</td>
                <td className="py-3 px-4 text-xs font-bold text-slate-700 capitalize">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                    {issue.category_display || issue.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] ${
                    issue.priority === "urgent" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    issue.priority === "high" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs max-w-xs">
                  <span className="font-extrabold text-slate-900 block">{issue.title}</span>
                  <span className="text-[11px] text-slate-500 block line-clamp-1">{issue.description}</span>
                  {issue.resolution_notes && (
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                      Res: {issue.resolution_notes}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600 font-bold">{issue.asset_reference || "—"}</td>
                <td className="py-3 px-4 text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    issue.status === "resolved" ? "bg-emerald-100 text-emerald-800" :
                    issue.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs">
                  {role === "owner" || role === "admin" ? (
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        setResolutionStatus(issue.status === "resolved" ? "resolved" : "in_progress");
                        setResolutionNotes(issue.resolution_notes || "");
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Update Status
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold">{issue.reported_by_name || "Self"}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Modal 1: Report Operational Issue */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Report Operational Issue / Defect">
        <form onSubmit={handleReportSubmit} className="space-y-4 text-left">
          {role === "owner" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Branch Outlet <span className="text-rose-500">*</span></label>
              <select
                value={issueForm.branch}
                onChange={(e) => setIssueForm({ ...issueForm, branch: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Category <span className="text-rose-500">*</span></label>
              <select
                value={issueForm.category}
                onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
                required
              >
                <option value="vehicle_damage">Vehicle Transit Damage</option>
                <option value="battery_malfunction">Battery Cell / Charger Defect</option>
                <option value="equipment_failure">Showroom Equipment Failure</option>
                <option value="logistics_delay">Logistics / Stock Delay</option>
                <option value="other">Other Operational Problem</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Priority Level <span className="text-rose-500">*</span></label>
              <select
                value={issueForm.priority}
                onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
                required
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Action Required</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Summary Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Dent on front apron of Dynamo EV during transit"
              value={issueForm.title}
              onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Asset Identifier (VIN / Battery Serial)</label>
            <input
              type="text"
              placeholder="e.g. KVRVIN2026901 or BATT-LFP-6030"
              value={issueForm.asset_reference}
              onChange={(e) => setIssueForm({ ...issueForm, asset_reference: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-700 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Detailed Problem Description <span className="text-rose-500">*</span></label>
            <textarea
              placeholder="Describe the issue, defect details, location, and recommended action..."
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none h-24"
              required
            />
          </div>

          <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
            Submit Issue Report to Owner
          </button>
        </form>
      </Modal>

      {/* Modal 2: Resolve / Update Issue */}
      <Modal isOpen={!!selectedIssue} onClose={() => setSelectedIssue(null)} title={`Resolve Issue: ${selectedIssue?.issue_id}`}>
        {selectedIssue && (
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="font-extrabold text-slate-800 block">{selectedIssue.title}</span>
              <p className="text-slate-600 font-medium">{selectedIssue.description}</p>
              <span className="text-[10px] text-slate-400 block mt-1">Branch: {selectedIssue.branch_name} • Reported by: {selectedIssue.reported_by_name || "Supervisor"}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-bold outline-none"
              >
                <option value="in_progress">In Progress (Investigating / Repairing)</option>
                <option value="resolved">Resolved (Complete)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Notes / Action Taken</label>
              <textarea
                placeholder="e.g. Sent for warranty repair / Replaced battery pack from godown..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium outline-none h-20"
                required
              />
            </div>

            <button type="submit" className="w-full py-2.5 bg-[#04a700] hover:bg-[#038a00] text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer mt-4">
              Save Resolution Status
            </button>
          </form>
        )}
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
