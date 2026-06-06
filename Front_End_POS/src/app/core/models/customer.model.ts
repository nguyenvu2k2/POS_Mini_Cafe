import { Order } from './order.model';

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  loyalty_points: number;
  created_at: string;
  orders?: Order[];
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
}

export interface UpdateCustomerDto {
  phone?: string | null;
  email?: string | null;
}
