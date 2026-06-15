import { Customer } from './customer.model';
import { Payment } from './payment.model';
import { ProductVariant } from './product.model';
import { User } from './user.model';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  total_amount: number;
  customer_id: number | null;
  customer?: Customer;
  user_id: number;
  user?: User;
  created_at: string;
  updated_at?: string;
  item_count: number;
  order_items: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id: number;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant?: ProductVariant;
}

export interface CreateOrderDto {
  customer_id?: number | null;
  user_id: number;
  items: {
    product_variant_id: number;
    quantity: number;
  }[];
}

export interface OrderFilter {
  status?: OrderStatus | 'all';
  fromDate?: string;
  toDate?: string;
}
