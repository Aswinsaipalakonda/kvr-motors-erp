import api from "./api";

export const getLedgerEntries = async () => {
  const response = await api.get("/ledger-entries/");
  return response.data;
};
