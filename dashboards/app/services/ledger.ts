import api from "./api";

export interface LedgerEntryInput {
  branch?: number | null;
  ledger_type: string;
  detail: string;
  income?: string | number;
  expense?: string | number;
  payment_mode?: string;
  notes?: string;
}

export const getLedgerEntries = async () => {
  const response = await api.get("/ledger-entries/");
  return response.data;
};

export const createLedgerEntry = async (data: LedgerEntryInput) => {
  const response = await api.post("/ledger-entries/", data);
  return response.data;
};

export const updateLedgerEntry = async (id: number, data: Partial<LedgerEntryInput>) => {
  const response = await api.patch(`/ledger-entries/${id}/`, data);
  return response.data;
};

export const deleteLedgerEntry = async (id: number) => {
  const response = await api.delete(`/ledger-entries/${id}/`);
  return response.data;
};
