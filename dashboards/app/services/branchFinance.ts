import api from "./api";

export interface BranchCashDeposit {
  id: number;
  deposit_id: string;
  branch: number;
  branch_name?: string;
  deposited_by?: number;
  deposited_by_name?: string;
  supervisor?: number;
  supervisor_name?: string;
  amount: string | number;
  notes?: string;
  deposit_date: string;
  created_at: string;
}

export interface BranchExpense {
  id: number;
  expense_id: string;
  branch: number;
  branch_name?: string;
  submitted_by?: number;
  submitted_by_name?: string;
  category: "electricity" | "transport" | "maintenance" | "refreshments" | "misc";
  category_display?: string;
  amount: string | number;
  description?: string;
  receipt_number?: string;
  expense_date: string;
  created_at: string;
}

export async function getBranchCashDeposits(): Promise<BranchCashDeposit[]> {
  try {
    const res = await api.get("/branch-cash-deposits/");
    return res.data.results || res.data;
  } catch (error) {
    console.error("Error fetching branch cash deposits:", error);
    return [];
  }
}

export async function createBranchCashDeposit(data: {
  branch: number;
  supervisor?: number;
  amount: number;
  notes?: string;
  deposit_date?: string;
}): Promise<BranchCashDeposit> {
  const res = await api.post("/branch-cash-deposits/", data);
  return res.data;
}

export async function getBranchExpenses(): Promise<BranchExpense[]> {
  try {
    const res = await api.get("/branch-expenses/");
    return res.data.results || res.data;
  } catch (error) {
    console.error("Error fetching branch expenses:", error);
    return [];
  }
}

export async function createBranchExpense(data: {
  branch: number;
  category: string;
  amount: number;
  description?: string;
  receipt_number?: string;
  expense_date?: string;
}): Promise<BranchExpense> {
  const res = await api.post("/branch-expenses/", data);
  return res.data;
}

export async function updateBranchExpense(
  id: number,
  data: Partial<{
    branch: number;
    category: string;
    amount: number;
    description: string;
    receipt_number: string;
  }>
): Promise<BranchExpense> {
  const res = await api.patch(`/branch-expenses/${id}/`, data);
  return res.data;
}

export async function deleteBranchExpense(id: number): Promise<any> {
  const res = await api.delete(`/branch-expenses/${id}/`);
  return res.data;
}
