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

export interface VehicleUnit {
  id: number;
  model: number;
  model_name?: string;
  brand_name?: string;
  branch: number;
  branch_name?: string;
  showroom?: number;
  showroom_name?: string;
  location?: number;
  location_name?: string;
  vin_number?: string | null;
  motor_number?: string | null;
  chassis_number?: string | null;
  color?: string | null;
  purchase_date?: string;
  status?: string;
  stock_status?: string;
  booking_status?: boolean;
  assigned_battery?: string;
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
  try {
    const response = await api.get("/vehicle-brands/");
    return response.data.results || response.data || [];
  } catch (error) {
    console.error("Error fetching vehicle brands:", error);
    return [];
  }
};

export const createVehicleBrand = async (data: VehicleBrandInput) => {
  const response = await api.post("/vehicle-brands/", data);
  return response.data;
};

export const updateVehicleBrand = async (id: number, data: Partial<VehicleBrandInput>) => {
  const response = await api.patch(`/vehicle-brands/${id}/`, data);
  return response.data;
};

export const deleteVehicleBrand = async (id: number) => {
  const response = await api.delete(`/vehicle-brands/${id}/`);
  return response.data;
};

export const getVehicleModels = async () => {
  try {
    const response = await api.get("/vehicle-models/");
    return response.data.results || response.data || [];
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    return [];
  }
};

export const getVehicleUnits = async () => {
  try {
    const response = await api.get("/vehicle-units/");
    return response.data.results || response.data || [];
  } catch (error) {
    console.error("Error fetching vehicle units:", error);
    return [];
  }
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

export const deleteVehicleModel = async (id: number) => {
  const response = await api.delete(`/vehicle-models/${id}/`);
  return response.data;
};
