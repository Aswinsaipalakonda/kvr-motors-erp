import api from "./api";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "owner" | "supervisor" | "sales_executive" | "sales" | "telecaller" | "staff";
  branch: string | null;
  showroom: string | null;
  phone_number: string | null;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

export const getUsers = async (): Promise<UserProfile[]> => {
  const response = await api.get("/users/");
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await api.post("/users/", data);
  return response.data;
};

export const updateUser = async (id: number, data: any) => {
  const response = await api.patch(`/users/${id}/`, data);
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}/`);
  return response.data;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get("/auth/me/");
  return response.data;
};

export const updateCurrentUser = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch("/auth/me/", data);
  return response.data;
};
