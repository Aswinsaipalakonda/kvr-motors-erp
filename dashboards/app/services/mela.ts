import api from "./api";

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

export interface MelaBookingInput {
  customer_name: string;
  customer_phone: string;
  vehicle_model: number;
  color: string;
  battery_type: string;
}

export interface MelaBooking {
  id: number;
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  sales_executive: number;
  executive_serial_number: number;
  vehicle_model: number;
  color: string;
  battery_type: string;
  price: number;
  status: 'unconfirmed' | 'completed' | 'cancelled';
  status_display: string;
  cash_collected: number;
  created_at: string;
  completed_at: string | null;
  model_name?: string;
  brand_name?: string;
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

export const getMelaInventory = async (params?: any) => {
  const response = await api.get<MelaInventoryInput[]>("/mela-inventory/", { params });
  return response.data;
};

export const createMelaInventory = async (data: MelaInventoryInput) => {
  const response = await api.post<MelaInventoryInput>("/mela-inventory/", data);
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

export const getMelaBookings = async (params?: any) => {
  const response = await api.get<MelaBooking[]>("/mela-bookings/", { params });
  return response.data;
};

export const createMelaBooking = async (data: MelaBookingInput) => {
  const response = await api.post<MelaBooking>("/mela-bookings/", data);
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
  const response = await api.get<MelaReports>("/mela-reports/");
  return response.data;
};
