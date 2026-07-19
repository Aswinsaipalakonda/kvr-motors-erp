import api from "./api";

export interface ActivityLog {
  id: number;
  user: number | null;
  user_detail: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
  } | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  model_name: string;
  app_label: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, { before: string | null; after: string | null }>;
  ip_address: string | null;
  timestamp: string;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const response = await api.get("/activity-logs/");
    return response.data || [];
  } catch (error) {
    console.warn("Could not fetch activity logs:", error);
    return [];
  }
}
