import api from "./api";

export interface BranchInput {
  name: string;
  address?: string;
  phone_number?: string;
  is_active?: boolean;
  manager_name?: string;
  total_stock?: number;
  sales_volume?: number;
  monthly_target?: number;
  target_achieved_pct?: number;
}

export const getBranches = async () => {
  const response = await api.get("/branches/");
  return response.data;
};

export const getInventoryLocations = async () => {
  const response = await api.get("/inventory-locations/");
  return response.data;
};

export const getShowrooms = async () => {
  const response = await api.get("/showrooms/");
  return response.data;
};

export const createBranch = async (data: BranchInput) => {
  const response = await api.post("/branches/", data);
  return response.data;
};

export const updateBranch = async (id: number, data: Partial<BranchInput>) => {
  const response = await api.patch(`/branches/${id}/`, data);
  return response.data;
};

export const getStockTransfers = async () => {
  const response = await api.get("/stock-transfers/");
  return response.data;
};

export const updateStockTransfer = async (id: number, data: any) => {
  const response = await api.patch(`/stock-transfers/${id}/`, data);
  return response.data;
};

export const createStockTransfer = async (data: any) => {
  const response = await api.post("/stock-transfers/", data);
  return response.data;
};

export const deleteBranch = async (id: number) => {
  const response = await api.delete(`/branches/${id}/`);
  return response.data;
};
