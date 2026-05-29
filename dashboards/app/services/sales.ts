import api from "./api";

export interface SalesInvoiceInput {
  invoice_number?: string;
  customer_name: string;
  customer_contact: string;
  vehicle_unit: number; // VehicleUnit ID
  assigned_battery?: number | null; // Battery ID
  sale_price: number;
  payment_mode: string;
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
