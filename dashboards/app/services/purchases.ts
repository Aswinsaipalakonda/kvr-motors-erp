import api from "./api";

export interface PurchaseOrderInput {
  po_number?: string;
  supplier_name: string;
  vehicle_model: number; // VehicleModel ID
  quantity: number;
  unit_price: number;
  payment_terms: string;
  estimated_delivery?: string; // YYYY-MM-DD
  status?: string;
}

export const getPurchaseOrders = async () => {
  const response = await api.get("/purchase-orders/");
  return response.data;
};

export const createPurchaseOrder = async (data: PurchaseOrderInput) => {
  const response = await api.post("/purchase-orders/", data);
  return response.data;
};

export const updatePurchaseOrderStatus = async (id: number, status: string) => {
  const response = await api.patch(`/purchase-orders/${id}/`, { status });
  return response.data;
};

export const updatePurchaseOrder = async (id: number, data: Partial<PurchaseOrderInput>) => {
  const response = await api.patch(`/purchase-orders/${id}/`, data);
  return response.data;
};

