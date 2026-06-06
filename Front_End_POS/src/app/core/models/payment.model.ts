export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'bank_transfer' | 'momo' | 'vnpay';
export type CheckoutPaymentMethod = Extract<PaymentMethod, 'cash' | 'momo'>;

export interface Payment {
  id: number;
  order_id: number;
  method: PaymentMethod;
  amount: number;
  received_amount?: number;
  change_amount?: number;
  paid_at: string;
}

export interface CreatePaymentDto {
  order_id: number;
  method: CheckoutPaymentMethod;
  amount: number;
  received_amount?: number;
}
