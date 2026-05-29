import api from "./api";

export interface LeadInput {
  customer_name: string;
  contact_number: string;
  interested_vehicle: number; // VehicleModel ID
  lead_source: string;
  assigned_executive?: number | null;
  status?: string;
  notes?: string;
}

export const getLeads = async () => {
  const response = await api.get("/leads/");
  return response.data;
};

export const createLead = async (data: LeadInput) => {
  const response = await api.post("/leads/", data);
  return response.data;
};

export const updateLead = async (id: number, data: Partial<LeadInput>) => {
  const response = await api.patch(`/leads/${id}/`, data);
  return response.data;
};
