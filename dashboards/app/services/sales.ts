import api from "./api";

export interface SalesInvoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_contact: string;
  vehicle_unit: number;
  model_name?: string;
  vin_number?: string;
  motor_number?: string;
  assigned_battery?: number | null;
  battery_serial?: string;
  sale_price: string | number;
  payment_mode: string;
  payment_split_details?: any;
  insurance_partner?: string;
  sale_date?: string;
  delivery_status?: string;
  branch: number;
  branch_name?: string;
}

export interface SalesInvoiceInput {
  invoice_number?: string;
  customer_name: string;
  customer_contact: string;
  vehicle_unit: number; // VehicleUnit ID
  assigned_battery?: number | null; // Battery ID
  sale_price: number;
  payment_mode: string;
  payment_split_details?: any;
  insurance_partner?: string;
  delivery_status?: string;
  branch: number; // Branch ID
}

export const getSalesInvoices = async () => {
  const response = await api.get("/sales-invoices/");
  return response.data;
};

export const createSalesInvoice = async (data: SalesInvoiceInput) => {
  const response = await api.post("/sales-invoices/", data);
  return response.data;
};

export const updateSalesInvoice = async (id: number, data: Partial<SalesInvoiceInput>) => {
  const response = await api.patch(`/sales-invoices/${id}/`, data);
  return response.data;
};
