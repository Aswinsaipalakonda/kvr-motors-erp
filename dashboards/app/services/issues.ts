import api from "./api";

export interface IssueReport {
  id: number;
  issue_id: string;
  branch: number;
  branch_name?: string;
  reported_by?: number;
  reported_by_name?: string;
  category: "vehicle_damage" | "battery_malfunction" | "equipment_failure" | "logistics_delay" | "other";
  category_display?: string;
  priority: "low" | "medium" | "high" | "urgent";
  priority_display?: string;
  title: string;
  description: string;
  asset_reference?: string;
  status: "reported" | "in_progress" | "resolved";
  resolution_notes?: string;
  resolved_by?: number;
  resolved_by_name?: string;
  created_at: string;
  updated_at: string;
}

export async function getIssueReports(): Promise<IssueReport[]> {
  try {
    const res = await api.get("/issue-reports/");
    return res.data.results || res.data;
  } catch (error) {
    console.error("Error fetching issue reports:", error);
    return [];
  }
}

export async function createIssueReport(data: {
  branch: number;
  category: string;
  priority: string;
  title: string;
  description: string;
  asset_reference?: string;
}): Promise<IssueReport> {
  const res = await api.post("/issue-reports/", data);
  return res.data;
}

export async function updateIssueReport(
  id: number,
  data: {
    status?: "reported" | "in_progress" | "resolved";
    resolution_notes?: string;
  }
): Promise<IssueReport> {
  const res = await api.patch(`/issue-reports/${id}/`, data);
  return res.data;
}
