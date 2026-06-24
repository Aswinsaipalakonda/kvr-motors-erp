import api from './api';

export interface MelaVehicleStockInput {
  id?: number;
  vehicle_model: number;
  color: string;
  price: number;
  initial_quantity: number;
  remaining_quantity: number;
  restock_date: string | null;
  is_active?: boolean;
  model_name?: string;
  brand_name?: string;
  color_options?: string[];
}

export interface MelaBatteryStockInput {
  id?: number;
  battery_name: string;
  price: number;
  initial_quantity: number;
  remaining_quantity: number;
  restock_date: string | null;
  is_active?: boolean;
}

export interface MelaVehicleBatteryCompatibilityInput {
  id?: number;
  vehicle_stock: number;
  battery_stock: number;
  vehicle_model_name?: string;
  vehicle_color?: string;
  battery_name?: string;
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

export interface MelaBookingInput {
  customer_name: string;
  customer_phone: string;
  mela_vehicle: number;
  mela_battery: number;
}

export interface MelaBooking {
  id: number;
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  sales_executive: number;
  executive_serial_number: number;
  mela_vehicle: number;
  mela_battery: number;
  vehicle_model: number;
  color: string;
  battery_type: string;
  price: string;
  status: 'unconfirmed' | 'completed' | 'cancelled';
  status_display: string;
  cash_collected: string;
  created_at: string;
  completed_at: string | null;
  vehicle_model_name?: string;
  vehicle_color?: string;
  battery_name?: string;
  executive_name?: string;
}

export interface MelaReports {
  summary: {
    total_bookings: number;
    unconfirmed_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_sales_revenue: number;
    daily_sales_revenue: number;
    daily_completed_count: number;
  };
  executive_performance: Array<{
    id: number;
    full_name: string;
    username: string;
    total_bookings: number;
    completed_bookings: number;
    total_revenue: number;
  }>;
}

// Mela Vehicle Stock APIs
export const getMelaVehicles = async (params?: any) => {
  const response = await api.get<MelaVehicleStockInput[]>('/mela-vehicles/', { params });
  return response.data;
};

export const createMelaVehicle = async (data: MelaVehicleStockInput) => {
  const response = await api.post<MelaVehicleStockInput>('/mela-vehicles/', data);
  return response.data;
};

export const updateMelaVehicle = async (id: number, data: Partial<MelaVehicleStockInput>) => {
  const response = await api.patch<MelaVehicleStockInput>(`/mela-vehicles/${id}/`, data);
  return response.data;
};

export const deleteMelaVehicle = async (id: number) => {
  const response = await api.delete(`/mela-vehicles/${id}/`);
  return response.data;
};

// Mela Battery Stock APIs
export const getMelaBatteries = async (params?: any) => {
  const response = await api.get<MelaBatteryStockInput[]>('/mela-batteries/', { params });
  return response.data;
};

export const createMelaBattery = async (data: MelaBatteryStockInput) => {
  const response = await api.post<MelaBatteryStockInput>('/mela-batteries/', data);
  return response.data;
};

export const updateMelaBattery = async (id: number, data: Partial<MelaBatteryStockInput>) => {
  const response = await api.patch<MelaBatteryStockInput>(`/mela-batteries/${id}/`, data);
  return response.data;
};

export const deleteMelaBattery = async (id: number) => {
  const response = await api.delete(`/mela-batteries/${id}/`);
  return response.data;
};

// Mela Vehicle-Battery Compatibilities APIs
export const getMelaCompatibilities = async (params?: any) => {
  const response = await api.get<MelaVehicleBatteryCompatibilityInput[]>('/mela-compatibilities/', { params });
  return response.data;
};

export const createMelaCompatibility = async (data: MelaVehicleBatteryCompatibilityInput) => {
  const response = await api.post<MelaVehicleBatteryCompatibilityInput>('/mela-compatibilities/', data);
  return response.data;
};

export const deleteMelaCompatibility = async (id: number) => {
  const response = await api.delete(`/mela-compatibilities/${id}/`);
  return response.data;
};

// Legacy support
export const getMelaInventory = async (params?: any) => {
  const response = await api.get<any[]>('/mela-inventory/', { params });
  return response.data;
};

export const createMelaInventory = async (data: any) => {
  const response = await api.post<any>('/mela-inventory/', data);
  return response.data;
};

export const updateMelaInventory = async (id: number, data: Partial<any>) => {
  const response = await api.patch<any>(`/mela-inventory/${id}/`, data);
  return response.data;
};

export const deleteMelaInventory = async (id: number) => {
  const response = await api.delete(`/mela-inventory/${id}/`);
  return response.data;
};

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

export const getMelaBookings = async (params?: any) => {
  const response = await api.get<MelaBooking[]>('/mela-bookings/', { params });
  return response.data;
};

export const createMelaBooking = async (data: MelaBookingInput) => {
  const response = await api.post<MelaBooking>('/mela-bookings/', data);
  return response.data;
};

export const updateMelaBooking = async (id: number, data: Partial<MelaBooking>) => {
  const response = await api.patch<MelaBooking>(`/mela-bookings/${id}/`, data);
  return response.data;
};

export const completeMelaBooking = async (id: number) => {
  const response = await api.post<MelaBooking>(`/mela-bookings/${id}/complete/`);
  return response.data;
};

export const getMelaReports = async () => {
  const response = await api.get<MelaReports>('/mela-reports/');
  return response.data;
};
