import api from "./api";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  branch: string | null;
  showroom: string | null;
  phone_number: string | null;
  is_active: boolean;
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
