import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { CheckoutPaymentMethod } from '../../../core/models/payment.model';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { OrderStatusPipe } from '../../../shared/pipes/order-status.pipe';
import { InvoicePrintData, InvoicePrinterService } from '../services/invoice-printer.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    NgFor,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    BadgeComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    CurrencyVnPipe,
    OrderStatusPipe
  ],
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  isLoading = false;
  isPaymentModalOpen = false;
  isPrintInvoiceModalOpen = false;
  isStatusConfirmModalOpen = false;
  isCancelConfirmModalOpen = false;
  isPaying = false;
  isUpdatingStatus = false;
  isCancelling = false;
  paymentMethod: CheckoutPaymentMethod = 'cash';
  receivedAmount = 0;
  printInvoiceForm = new FormGroup({});
  statusConfirmForm = new FormGroup({});
  cancelOrderForm = new FormGroup({});
  pendingInvoiceData: InvoicePrintData | null = null;

  readonly storeName = 'POS Mini Cafe';
  readonly paymentMethods: { value: CheckoutPaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'momo', label: 'MoMo' }
  ];

  readonly momoReceiverName = 'POS Mini Cafe';
  readonly momoReceiverPhone = '032931195';
  readonly momoQrPattern = [
    [true, true, true, true, true, true, true, false, true, false, true, true, true, true, true],
    [true, false, false, false, false, false, true, false, false, true, true, false, false, false, true],
    [true, false, true, true, true, false, true, true, true, false, true, false, true, false, true],
    [true, false, true, true, true, false, true, false, true, true, false, false, true, false, true],
    [true, false, true, true, true, false, true, true, false, false, true, false, true, false, true],
    [true, false, false, false, false, false, true, false, true, true, false, false, false, false, true],
    [true, true, true, true, true, true, true, false, true, false, true, true, true, true, true],
    [false, false, true, false, true, false, false, true, false, true, false, true, false, true, false],
    [true, true, false, true, false, true, true, false, true, false, true, false, true, false, true],
    [false, true, true, false, true, false, true, true, false, true, false, true, true, false, false],
    [true, false, true, true, false, true, false, false, true, false, true, true, false, true, true],
    [false, true, false, false, true, true, false, true, false, true, true, false, true, false, true],
    [true, true, true, false, true, false, true, false, true, true, false, true, true, true, false],
    [true, false, false, true, false, true, false, true, true, false, true, false, false, true, true],
    [true, true, false, true, true, false, true, false, true, true, false, true, false, true, false]
  ];

  private readonly nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
    preparing: 'completed'
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly invoicePrinter: InvoicePrinterService,
    private readonly authService: AuthService,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadOrder();
  }

  get nextStatus(): OrderStatus | null {
    return this.order ? this.nextStatusMap[this.order.status] ?? null : null;
  }

  get paidAmount(): number {
    return this.order?.payments?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  }

  get remainingAmount(): number {
    return Math.max((this.order?.total_amount ?? 0) - this.paidAmount, 0);
  }

  get changeAmount(): number {
    return Math.max(this.receivedAmount - this.remainingAmount, 0);
  }

  get momoPaymentNote(): string {
    return this.order?.code ?? 'POS MINI CAFE';
  }

  get paymentConfirmButtonLabel(): string {
    return this.paymentMethod === 'momo' ? 'Đã nhận tiền MoMo' : 'Xác nhận thanh toán';
  }

  get printInvoicePrompt(): string {
    return this.paymentMethod === 'momo'
      ? 'Thanh toán MoMo đã được xác nhận thành công. In hóa đơn?'
      : 'Thanh toán thành công. In hóa đơn?';
  }

  canCancel(): boolean {
    const role = this.authService.currentRole();
    return (
      (role === 'admin' || role === 'cashier') &&
      (this.order?.status === 'pending' || this.order?.status === 'preparing')
    );
  }

  canPay(): boolean {
    return this.order?.status === 'pending' && this.remainingAmount > 0;
  }

  async loadOrder(): Promise<void> {
    this.isLoading = true;
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.order = await this.orderService.getById(id);
    } finally {
      this.isLoading = false;
    }
  }

  openCancelConfirmModal(): void {
    if (!this.order || !this.canCancel()) {
      return;
    }

    this.isCancelConfirmModalOpen = true;
  }

  closeCancelConfirmModal(): void {
    if (this.isCancelling) {
      return;
    }

    this.isCancelConfirmModalOpen = false;
  }

  async confirmCancelOrder(): Promise<void> {
    if (!this.order || !this.canCancel() || this.isCancelling) {
      return;
    }

    this.isCancelling = true;
    try {
      this.order = await this.orderService.cancel(this.order.id);
      this.isCancelConfirmModalOpen = false;
      this.toast.success('Đã hủy đơn hàng.');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể hủy đơn hàng.');
    } finally {
      this.isCancelling = false;
    }
  }

  openStatusConfirmModal(): void {
    if (!this.order || !this.nextStatus) {
      return;
    }

    this.isStatusConfirmModalOpen = true;
  }

  closeStatusConfirmModal(): void {
    if (this.isUpdatingStatus) {
      return;
    }

    this.isStatusConfirmModalOpen = false;
  }

  async confirmMoveNext(): Promise<void> {
    if (!this.order || !this.nextStatus || this.isUpdatingStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    try {
      this.order = await this.orderService.updateStatus(this.order.id, this.nextStatus);
      this.isStatusConfirmModalOpen = false;
      this.toast.success('Đã cập nhật trạng thái đơn hàng.');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  openPaymentModal(): void {
    if (!this.order || !this.canPay()) {
      return;
    }

    this.paymentMethod = 'cash';
    this.receivedAmount = this.remainingAmount;
    this.isPaymentModalOpen = true;
  }

  selectPaymentMethod(method: CheckoutPaymentMethod): void {
    this.paymentMethod = method;
    this.receivedAmount = method === 'cash' ? this.remainingAmount : 0;
  }

  async confirmPayment(): Promise<void> {
    if (!this.order) {
      return;
    }

    if (this.isPaying) {
      return;
    }

    if (this.paymentMethod === 'cash' && this.receivedAmount < this.remainingAmount) {
      this.toast.warning('Tien khach dua chua du.');
      return;
    }

    const order = this.order;
    const amountToPay = this.remainingAmount;
    const invoiceItems = order.order_items.map((item) => ({
      productName: item.product_name,
      variantName: item.variant_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal
    }));

    this.isPaying = true;
    try {
      await this.paymentService.create({
        order_id: order.id,
        method: this.paymentMethod,
        amount: amountToPay,
        received_amount: this.paymentMethod === 'cash' ? this.receivedAmount : amountToPay
      });

      this.pendingInvoiceData = {
        storeName: this.storeName,
        printedAt: new Date(),
        orderCode: order.code,
        customerName: order.customer?.name,
        items: invoiceItems,
        totalAmount: order.total_amount
      };
      this.isPaymentModalOpen = false;
      await this.loadOrder();
      this.isPrintInvoiceModalOpen = true;
      this.toast.success(
        this.paymentMethod === 'momo' ? 'Da xac nhan thanh toan MoMo.' : 'Da thanh toan don hang.'
      );
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Khong the thanh toan don hang.');
    } finally {
      this.isPaying = false;
    }
  }

  cancelPrintInvoice(): void {
    this.isPrintInvoiceModalOpen = false;
    this.pendingInvoiceData = null;
  }

  async payAndPrintInvoice(): Promise<void> {
    if (!this.pendingInvoiceData) {
      this.toast.error('Khong tim thay du lieu hoa don.');
      return;
    }

    const printWindow = this.invoicePrinter.openPrintWindow();
    const printed = this.invoicePrinter.print(
      {
        ...this.pendingInvoiceData,
        printedAt: new Date()
      },
      printWindow
    );

    if (!printed) {
      this.toast.warning('Trinh duyet da chan cua so in hoa don.');
    }

    this.pendingInvoiceData = null;
    this.isPrintInvoiceModalOpen = false;
  }
}
