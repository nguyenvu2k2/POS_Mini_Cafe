import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateOrderDto, Order, OrderFilter, OrderItem, OrderStatus } from '../../../core/models/order.model';
import { Payment } from '../../../core/models/payment.model';
import { ProductVariant } from '../../../core/models/product.model';
import { User } from '../../../core/models/user.model';
import { ApiService } from '../../../core/services/api.service';

interface ApiUser {
  id: number;
  name?: string;
  full_name?: string;
  email: string;
}

interface ApiProduct {
  id: number;
  name: string;
}

interface ApiVariant {
  id: number;
  product_id: number;
  name: string;
  price: string | number;
  is_available: boolean;
  product?: ApiProduct;
}

interface ApiOrderItem {
  id: number;
  order_id: number;
  variant_id?: number;
  product_variant_id?: number;
  product_name?: string;
  variant_name?: string;
  quantity: number;
  unit_price: string | number;
  subtotal?: string | number;
  variant?: ApiVariant;
}

interface ApiPayment {
  id: number;
  order_id: number;
  method: Payment['method'] | 'transfer' | 'card';
  amount: string | number;
  paid_at?: string | null;
  created_at?: string;
}

interface ApiOrder {
  id: number;
  code?: string;
  status: OrderStatus;
  total_amount: string | number;
  item_count?: string | number;
  itemCount?: string | number;
  items_count?: string | number;
  itemsCount?: string | number;
  order_items_count?: string | number;
  total_items?: string | number;
  totalItems?: string | number;
  total_quantity?: string | number;
  totalQuantity?: string | number;
  customer_id: number | null;
  customer?: Order['customer'];
  user_id: number;
  user?: ApiUser;
  created_at: string;
  updated_at?: string;
  items?: ApiOrderItem[];
  order_items?: ApiOrderItem[];
  payments?: ApiPayment[];
}

interface GetOrderOptions {
  includeItems?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private readonly api: ApiService) {}

  async getAll(filter: OrderFilter = {}, options: GetOrderOptions = {}): Promise<Order[]> {
    const orders = await this.api.get<ApiOrder[]>(this.apiUrl, {
      status: filter.status && filter.status !== 'all' ? filter.status : undefined,
      limit: 100
    });

    const filteredOrders = orders
      .map((order) => this.toOrder(order))
      .filter((order) => this.matchesDateFilter(order, filter));

    return options.includeItems ? this.loadMissingItems(filteredOrders) : filteredOrders;
  }

  async getById(id: number): Promise<Order | null> {
    try {
      return this.toOrder(await this.api.get<ApiOrder>(`${this.apiUrl}/${id}`));
    } catch {
      return null;
    }
  }

  async create(payload: CreateOrderDto): Promise<Order> {
    const order = await this.api.post<ApiOrder, {
      customer_id?: number | null;
      items: { variant_id: number; quantity: number }[];
    }>(this.apiUrl, {
      customer_id: payload.customer_id ?? null,
      items: payload.items.map((item) => ({
        variant_id: item.product_variant_id,
        quantity: item.quantity
      }))
    });

    return this.toOrder(order);
  }

  async cancel(id: number): Promise<Order> {
    return this.toOrder(await this.api.post<ApiOrder, Record<string, never>>(`${this.apiUrl}/${id}/cancel`, {}));
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    return this.toOrder(await this.api.put<ApiOrder, { status: OrderStatus }>(`${this.apiUrl}/${id}/status`, { status }));
  }

  private matchesDateFilter(order: Order, filter: OrderFilter): boolean {
    const createdAt = new Date(order.created_at).getTime();

    if (filter.fromDate) {
      const from = new Date(filter.fromDate).setHours(0, 0, 0, 0);
      if (createdAt < from) {
        return false;
      }
    }

    if (filter.toDate) {
      const to = new Date(filter.toDate).setHours(23, 59, 59, 999);
      if (createdAt > to) {
        return false;
      }
    }

    return true;
  }

  private toOrder(order: ApiOrder): Order {
    const orderItems = order.order_items ?? order.items ?? [];
    const mappedItems = orderItems.map((item) => this.toOrderItem(item));

    return {
      id: order.id,
      code: order.code ?? `HD-${1000 + order.id}`,
      status: order.status,
      total_amount: Number(order.total_amount),
      customer_id: order.customer_id,
      customer: order.customer,
      user_id: order.user_id,
      user: order.user ? this.toUser(order.user) : undefined,
      created_at: order.created_at,
      updated_at: order.updated_at,
      item_count: this.resolveItemCount(order, mappedItems),
      order_items: mappedItems,
      payments: (order.payments ?? []).map((payment) => this.toPayment(payment))
    };
  }

  private async loadMissingItems(orders: Order[]): Promise<Order[]> {
    return Promise.all(orders.map(async (order) => {
      if (order.order_items.length > 0) {
        return order;
      }

      return await this.getById(order.id) ?? order;
    }));
  }

  private resolveItemCount(order: ApiOrder, orderItems: OrderItem[]): number {
    const apiCount = [
      order.item_count,
      order.itemCount,
      order.items_count,
      order.itemsCount,
      order.order_items_count,
      order.total_items,
      order.totalItems,
      order.total_quantity,
      order.totalQuantity
    ].find((value) => value !== undefined && value !== null);
    const normalizedApiCount = Number(apiCount);

    if (Number.isFinite(normalizedApiCount)) {
      return normalizedApiCount;
    }

    return orderItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  private toOrderItem(item: ApiOrderItem): OrderItem {
    const variantId = item.product_variant_id ?? item.variant_id ?? item.variant?.id ?? 0;
    const unitPrice = Number(item.unit_price);
    const quantity = Number(item.quantity);

    return {
      id: item.id,
      order_id: item.order_id,
      product_variant_id: variantId,
      product_name: item.product_name ?? item.variant?.product?.name ?? '-',
      variant_name: item.variant_name ?? item.variant?.name ?? '-',
      quantity,
      unit_price: unitPrice,
      subtotal: Number(item.subtotal ?? unitPrice * quantity),
      variant: item.variant ? this.toVariant(item.variant) : undefined
    };
  }

  private toVariant(variant: ApiVariant): ProductVariant {
    return {
      id: variant.id,
      product_id: variant.product_id,
      name: variant.name,
      price: Number(variant.price),
      is_available: variant.is_available
    };
  }

  private toPayment(payment: ApiPayment): Payment {
    return {
      id: payment.id,
      order_id: payment.order_id,
      method: payment.method === 'transfer' ? 'bank_transfer' : payment.method,
      amount: Number(payment.amount),
      paid_at: payment.paid_at ?? payment.created_at ?? ''
    };
  }

  private toUser(user: ApiUser): User {
    const fullName = user.full_name ?? user.name ?? user.email;

    return {
      id: user.id,
      full_name: fullName,
      email: user.email,
      role: 'cashier',
      is_active: true,
      avatar_url: this.initials(fullName),
      created_at: ''
    };
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
