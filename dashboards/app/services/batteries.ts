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
