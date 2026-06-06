import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreatePaymentDto, Payment } from '../../../core/models/payment.model';
import { ApiService } from '../../../core/services/api.service';

interface ApiPayment {
  id: number;
  order_id: number;
  method: Payment['method'] | 'transfer' | 'card';
  amount: string | number;
  paid_at?: string | null;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private readonly api: ApiService) {}

  async create(payload: CreatePaymentDto): Promise<Payment> {
    const payment = await this.api.post<ApiPayment, {
      method: string;
      amount: number;
      status: 'completed';
    }>(`${this.apiUrl}/${payload.order_id}/payments`, {
      method: this.toApiMethod(payload.method),
      amount: payload.amount,
      status: 'completed'
    });

    return this.toPayment(payment);
  }

  private toApiMethod(method: Payment['method']): string {
    return method === 'bank_transfer' ? 'transfer' : method;
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
}
