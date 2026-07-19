import api from "./api";

export interface FifoOverrideInput {
  battery: number;
  sales_executive: string;
  invoice_reference: string;
}

export const getBatteries = async () => {
  const response = await api.get("/batteries/");
  return response.data;
};

export interface Battery {
  id: number;
  serial_number: string;
  battery_code?: string;
  capacity: string;
  purchase_date: string;
  location: number;
  location_name?: string;
  branch_name?: string;
  supplier: string;
  warranty_years?: number;
  status?: string;
}

export interface BatteryInput {
  serial_number: string;
  battery_code?: string;
  capacity: string;
  purchase_date: string;
  location: number;
  supplier: string;
  warranty_years?: number;
  status?: string;
}

export const createBattery = async (data: BatteryInput) => {
  const response = await api.post("/batteries/", data);
  return response.data;
};

export const updateBattery = async (id: number, data: Partial<BatteryInput>) => {
  const response = await api.patch(`/batteries/${id}/`, data);
  return response.data;
};

export const deleteBattery = async (id: number) => {
  const response = await api.delete(`/batteries/${id}/`);
  return response.data;
};

export const checkFifo = async (serial: string) => {
  const response = await api.get(`/batteries/check-fifo/?serial=${encodeURIComponent(serial)}`);
  return response.data;
};

export const getFifoOverrides = async () => {
  const response = await api.get("/fifo-overrides/");
  return response.data;
};

export const createFifoOverride = async (data: FifoOverrideInput) => {
  const response = await api.post("/fifo-overrides/", data);
  return response.data;
};

export const updateFifoOverride = async (id: number, data: { status: "approved" | "rejected", reviewed_by: string }) => {
  const response = await api.patch(`/fifo-overrides/${id}/`, data);
  return response.data;
};
