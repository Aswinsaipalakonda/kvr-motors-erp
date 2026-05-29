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
  vin_number: string;
  motor_number: string;
  chassis_number: string;
  color: string;
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

export const lookupVehicleUnit = async (query: string) => {
  const response = await api.get(`/vehicle-units/lookup/?q=${encodeURIComponent(query)}`);
  return response.data;
};
