import api from "./api";

export interface BranchInput {
  name: string;
  address?: string;
  phone_number?: string;
  is_active?: boolean;
}

export const getBranches = async () => {
  const response = await api.get("/branches/");
  return response.data;
};

export const createBranch = async (data: BranchInput) => {
  const response = await api.post("/branches/", data);
  return response.data;
};

export const updateBranch = async (id: number, data: Partial<BranchInput>) => {
  const response = await api.put(`/branches/${id}/`, data);
  return response.data;
};
