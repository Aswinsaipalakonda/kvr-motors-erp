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
