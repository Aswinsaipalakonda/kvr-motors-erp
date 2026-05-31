import api from "./api";

export interface VehicleBrandInput {
  name: string;
  is_active?: boolean;
}

export interface VehicleModelInput {
  brand: number; // Brand ID
  model_name: string;
  base_price: string | number;
  color_variants: string[];
  battery_compatibility?: string;
  status?: "active" | "inactive";
}

export interface VehicleUnitInput {
  model: number; // Model ID
  branch: number; // Branch ID
  showroom: number; // Showroom ID
  location: number; // Location ID
  vin_number?: string | null;
  motor_number?: string | null;
  chassis_number?: string | null;
  color?: string | null;
  purchase_date?: string;
  stock_status?: string;
  booking_status?: boolean;
  assigned_battery?: string;
}

export const getVehicleBrands = async () => {
  const response = await api.get("/vehicle-brands/");
  return response.data;
};

export const getVehicleModels = async () => {
  const response = await api.get("/vehicle-models/");
  return response.data;
};

export const getVehicleUnits = async () => {
  const response = await api.get("/vehicle-units/");
  return response.data;
};

export const createVehicleModel = async (data: VehicleModelInput) => {
  const response = await api.post("/vehicle-models/", data);
  return response.data;
};

export const updateVehicleModel = async (id: number, data: Partial<VehicleModelInput>) => {
  const response = await api.patch(`/vehicle-models/${id}/`, data);
  return response.data;
};

export const createVehicleUnit = async (data: VehicleUnitInput) => {
  const response = await api.post("/vehicle-units/", data);
  return response.data;
};

export const updateVehicleUnit = async (id: number, data: Partial<VehicleUnitInput>) => {
  const response = await api.patch(`/vehicle-units/${id}/`, data);
  return response.data;
};

export const deleteVehicleUnit = async (id: number) => {
  const response = await api.delete(`/vehicle-units/${id}/`);
  return response.data;
};

export const lookupVehicleUnit = async (query: string) => {
  const response = await api.get(`/vehicle-units/lookup/?q=${encodeURIComponent(query)}`);
  return response.data;
};
