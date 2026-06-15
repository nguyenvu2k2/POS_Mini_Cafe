export type Role = 'admin' | 'cashier' | 'barista';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: Role;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface CreateUserDto {
  full_name: string;
  phone: string;
  email?: string | null;
  role?: Role | null;
  password: string;
}

export interface UpdateUserDto {
  full_name: string;
  phone: string;
  email: string;
  role: Role;
  password?: string | null;
}
