import api from "./api";

export interface AttendanceRecord {
  id: number;
  date: string;
  check_in: string;
  check_in_time?: string;
  timestamp?: string;
  check_out: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  photo: string;
  status: "pending" | "verified" | "rejected";
  verified_by: number | null;
  verified_at: string | null;
  remarks: string;
  user_details?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    branch: string;
    showroom: string;
    phone_number: string;
  };
  verified_by_details?: {
    full_name: string;
    username: string;
  };
}

export const getAttendanceLogs = async (): Promise<AttendanceRecord[]> => {
  const res = await api.get("/attendance/");
  return res.data || [];
};

export const verifyAttendance = async (
  id: number,
  status: "verified" | "rejected",
  remarks: string = ""
): Promise<AttendanceRecord> => {
  const res = await api.post(`/attendance/${id}/verify/`, { status, remarks });
  return res.data;
};

export const bulkVerifyAttendance = async (
  ids: number[],
  status: "verified" | "rejected",
  remarks: string = ""
): Promise<{ detail: string }> => {
  const res = await api.post("/attendance/bulk-verify/", { ids, status, remarks });
  return res.data;
};

