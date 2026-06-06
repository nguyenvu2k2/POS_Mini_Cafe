import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, FormsModule, BadgeComponent, EmptyStateComponent, LoadingSpinnerComponent, CurrencyVnPipe],
  templateUrl: './order-list.component.html'
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  status: OrderStatus | 'all' = 'all';
  fromDate = this.formatDate(new Date());
  toDate = this.formatDate(new Date());
  page = 1;
  readonly pageSize = 6;
  isLoading = false;

  readonly statuses: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'preparing', label: 'Đang pha chế' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Hủy đơn' }
  ];

  constructor(
    private readonly orderService: OrderService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadOrders();
  }

  get pagedOrders(): Order[] {
    const start = (this.page - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.orders.length / this.pageSize), 1);
  }

  async loadOrders(): Promise<void> {
    this.isLoading = true;
    try {
      this.orders = await this.orderService.getAll({
        status: this.status,
        fromDate: this.fromDate,
        toDate: this.toDate
      });
      this.page = Math.min(this.page, this.totalPages);
    } finally {
      this.isLoading = false;
    }
  }

  async applyFilter(): Promise<void> {
    this.page = 1;
    await this.loadOrders();
  }

  goToDetail(order: Order): void {
    void this.router.navigate(['/orders', order.id]);
  }

  canCancel(order: Order): boolean {
    const role = this.authService.currentRole();
    return (role === 'admin' || role === 'cashier') && (order.status === 'pending' || order.status === 'preparing');
  }

  async cancel(order: Order, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!window.confirm(`Huy don ${order.code}?`)) {
      return;
    }

    await this.orderService.cancel(order.id);
    this.toast.success(`Da huy ${order.code}.`);
    await this.loadOrders();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
