import api from './api';

export interface MelaInventoryInput {
  id?: number;
  vehicle_model: number;
  color: string;
  battery_type: string;
  initial_quantity: number;
  remaining_quantity: number;
  price: number;
  is_active?: boolean;
  model_name?: string;
  brand_name?: string;
  color_options?: string[];
}

export interface MelaSettingsInput {
  id?: number;
  mela_name: string;
  start_date: string | null;
  end_date: string | null;
  location: string;
  is_active?: boolean;
}

export interface VehicleModelInput {
  brand: number;
  model_name: string;
  base_price: number;
  color_variants: string[];
  battery_compatibility?: string;
  status?: 'active' | 'inactive';
}

export interface VehicleBrand {
  id: number;
  name: string;
  is_active: boolean;
}

export interface VehicleModel {
  id: number;
  brand: number;
  brand_name?: string;
  model_name: string;
  base_price: string;
  color_variants: string[];
  battery_compatibility?: string;
  status: string;
}

export const getMelaSettingsList = async () => {
  const response = await api.get<MelaSettingsInput[]>('/mela-settings/');
  return response.data;
};

export const createMelaSettings = async (data: MelaSettingsInput) => {
  const response = await api.post<MelaSettingsInput>('/mela-settings/', data);
  return response.data;
};

export const updateMelaSettings = async (id: number, data: Partial<MelaSettingsInput>) => {
  const response = await api.patch<MelaSettingsInput>(`/mela-settings/${id}/`, data);
  return response.data;
};

export const getMelaInventory = async (params?: any) => {
  const response = await api.get<MelaInventoryInput[]>('/mela-inventory/', { params });
  return response.data;
};

export const createMelaInventory = async (data: MelaInventoryInput) => {
  const response = await api.post<MelaInventoryInput>('/mela-inventory/', data);
  return response.data;
};

export const updateMelaInventory = async (id: number, data: Partial<MelaInventoryInput>) => {
  const response = await api.patch<MelaInventoryInput>(`/mela-inventory/${id}/`, data);
  return response.data;
};

export const deleteMelaInventory = async (id: number) => {
  const response = await api.delete(`/mela-inventory/${id}/`);
  return response.data;
};

export const getVehicleModels = async () => {
  const response = await api.get<VehicleModel[]>('/vehicle-models/');
  return response.data;
};

export const createVehicleModel = async (data: VehicleModelInput) => {
  const response = await api.post<VehicleModel>('/vehicle-models/', data);
  return response.data;
};

export const getVehicleBrands = async () => {
  const response = await api.get<VehicleBrand[]>('/vehicle-brands/');
  return response.data;
};
