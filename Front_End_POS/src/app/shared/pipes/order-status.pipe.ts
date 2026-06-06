import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '../../core/models/order.model';

@Pipe({
  name: 'orderStatus',
  standalone: true
})
export class OrderStatusPipe implements PipeTransform {
  transform(status: OrderStatus | string | null | undefined): string {
    const map: Record<string, string> = {
      pending: 'Chờ xử lý',
      preparing: 'Đang pha chế',
      ready: 'Sẵn sàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };

    return status ? map[status] ?? status : '';
  }
}
