import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OrderStatus } from '../../../core/models/order.model';
import { OrderStatusPipe } from '../../pipes/order-status.pipe';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass, OrderStatusPipe],
  template: `
    <span class="inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold" [ngClass]="classes">
      {{ label || (status | orderStatus) }}
    </span>
  `
})
export class BadgeComponent {
  @Input() status: OrderStatus | 'active' | 'inactive' | 'low' | 'ok' | 'locked' = 'ok';
  @Input() label = '';

  get classes(): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      preparing: 'bg-orange-100 text-orange-700',
      ready: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-slate-100 text-slate-600',
      low: 'bg-red-100 text-red-700',
      ok: 'bg-slate-100 text-slate-700',
      locked: 'bg-red-100 text-red-700'
    };

    return map[this.status] ?? map['ok'];
  }
}
