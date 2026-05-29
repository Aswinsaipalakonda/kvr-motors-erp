import api from "./api";

export interface BookingInput {
  booking_id?: string;
  customer_name: string;
  contact_number: string;
  vehicle_model: number; // VehicleModel ID
  vehicle_unit?: number | null; // VehicleUnit ID
  advance_amount: number;
  expiry_date: string; // YYYY-MM-DD
  status?: string;
  pdi_verified?: string;
}

export const getBookings = async () => {
  const response = await api.get("/bookings/");
  return response.data;
};

export const createBooking = async (data: BookingInput) => {
  const response = await api.post("/bookings/", data);
  return response.data;
};

export const updateBooking = async (id: number, data: Partial<BookingInput>) => {
  const response = await api.patch(`/bookings/${id}/`, data);
  return response.data;
};
