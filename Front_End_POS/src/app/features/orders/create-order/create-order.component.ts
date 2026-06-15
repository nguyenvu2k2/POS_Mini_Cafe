import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { CheckoutPaymentMethod } from '../../../core/models/payment.model';
import { Category, Product, ProductVariant } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { OnlyNumberDirective } from '../../../shared/directives/only-number.directive';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { CustomerService } from '../../customers/services/customer.service';
import { ProductService } from '../../products/services/product.service';
import { InvoicePrintData, InvoicePrinterService } from '../services/invoice-printer.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    ModalComponent,
    OnlyNumberDirective,
    CurrencyVnPipe
  ],
  templateUrl: './create-order.component.html'
})
export class CreateOrderComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  cartItems: CartItem[] = [];
  selectedCategoryId: number | 'all' = 'all';
  searchTerm = '';
  customerPhone = '';
  selectedCustomer: Customer | null = null;
  selectedVariantIds: Record<number, number> = {};

  isLoading = false;
  isSearchingCustomer = false;
  isPaymentModalOpen = false;
  isPrintInvoiceModalOpen = false;
  isPaying = false;
  paymentMethod: CheckoutPaymentMethod = 'cash';
  receivedAmount = 0;
  printInvoiceForm = new FormGroup({});
  pendingInvoiceData: InvoicePrintData | null = null;
  paidOrderId: number | null = null;

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

  constructor(
    private readonly productService: ProductService,
    private readonly customerService: CustomerService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly invoicePrinter: InvoicePrinterService,
    private readonly authService: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
  }

  get filteredProducts(): Product[] {
    const keyword = this.searchTerm.trim().toLowerCase();
    return this.products.filter((product) => {
      const matchesCategory = this.selectedCategoryId === 'all' || product.category_id === this.selectedCategoryId;
      const matchesKeyword = !keyword || product.name.toLowerCase().includes(keyword);
      return matchesCategory && matchesKeyword;
    });
  }

  get totalAmount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  }

  get changeAmount(): number {
    return Math.max(this.receivedAmount - this.totalAmount, 0);
  }

  get momoPaymentNote(): string {
    return 'POS MINI CAFE';
  }

  get paymentConfirmButtonLabel(): string {
    return this.paymentMethod === 'momo' ? 'Đã nhận tiền MoMo' : 'Xác nhận thanh toán';
  }

  get printInvoicePrompt(): string {
    return this.paymentMethod === 'momo'
      ? 'Thanh toán MoMo đã được xác nhận thành công. In hóa đơn?'
      : 'Thanh toán thành công. In hóa đơn?';
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const [categories, products] = await Promise.all([
        this.productService.getCategories(),
        this.productService.getAll({ isActive: true, includeRecipes: true })
      ]);

      this.categories = categories;
      this.products = products;
      products.forEach((product) => {
        const firstAvailable = product.variants.find((variant) => variant.is_available && this.variantHasRecipe(variant));
        if (firstAvailable) {
          this.selectedVariantIds[product.id] = firstAvailable.id;
        }
      });
    } finally {
      this.isLoading = false;
    }
  }

  getSelectedVariant(product: Product): ProductVariant | null {
    const selectedId = this.selectedVariantIds[product.id];
    return product.variants.find((variant) => variant.id === selectedId) ?? product.variants[0] ?? null;
  }

  variantHasHiddenIngredients(variant: ProductVariant | null | undefined): boolean {
    return Boolean(variant?.recipes?.some((recipe) => recipe.ingredient && !recipe.ingredient.is_active));
  }

  variantHasRecipe(variant: ProductVariant | null | undefined): boolean {
    return Boolean(variant?.recipes?.length);
  }

  selectedVariantMissingRecipe(product: Product): boolean {
    return !this.variantHasRecipe(this.getSelectedVariant(product));
  }

  productHasHiddenIngredients(product: Product): boolean {
    return product.variants.some((variant) => this.variantHasHiddenIngredients(variant));
  }

  hiddenIngredientNames(product: Product): string {
    const names = product.variants.flatMap((variant) =>
      (variant.recipes ?? [])
        .filter((recipe) => recipe.ingredient && !recipe.ingredient.is_active)
        .map((recipe) => recipe.ingredient?.name ?? '')
    );

    return [...new Set(names.filter(Boolean))].join(', ');
  }

  canAddProduct(product: Product): boolean {
    const variant = this.getSelectedVariant(product);
    return Boolean(
      variant &&
      !product.is_out_of_stock &&
      variant.is_available &&
      this.variantHasRecipe(variant) &&
      !this.productHasHiddenIngredients(product)
    );
  }

  addToCart(product: Product): void {
    const variant = this.getSelectedVariant(product);
    if (!this.variantHasRecipe(variant)) {
      this.toast.warning('Sản phẩm chưa có công thức nguyên liệu, không thể bán.');
      return;
    }

    if (this.productHasHiddenIngredients(product)) {
      this.toast.warning('Sản phẩm có nguyên liệu đã ẩn, vui lòng điều chỉnh công thức trước.');
      return;
    }

    if (!variant || product.is_out_of_stock || !variant.is_available) {
      return;
    }

    const existingItem = this.cartItems.find((item) => item.variant.id === variant.id);
    if (existingItem) {
      existingItem.quantity += 1;
      this.cartItems = [...this.cartItems];
      return;
    }

    this.cartItems = [...this.cartItems, { product, variant, quantity: 1 }];
  }

  onProductImageError(event: Event, product: Product): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = this.productService.getDefaultImageForName(product.name);

    if (image.getAttribute('src') === fallbackUrl) {
      return;
    }

    image.src = fallbackUrl;
  }

  increase(item: CartItem): void {
    item.quantity += 1;
    this.cartItems = [...this.cartItems];
  }

  decrease(item: CartItem): void {
    if (item.quantity <= 1) {
      this.remove(item);
      return;
    }

    item.quantity -= 1;
    this.cartItems = [...this.cartItems];
  }

  remove(item: CartItem): void {
    this.cartItems = this.cartItems.filter((cartItem) => cartItem.variant.id !== item.variant.id);
  }

  async searchCustomer(): Promise<void> {
    if (!this.customerPhone.trim()) {
      this.selectedCustomer = null;
      return;
    }

    this.isSearchingCustomer = true;
    try {
      this.selectedCustomer = await this.customerService.searchByPhone(this.customerPhone);
      if (!this.selectedCustomer) {
        this.toast.warning('Khong tim thay khach hang theo so dien thoai nay.');
      }
    } finally {
      this.isSearchingCustomer = false;
    }
  }

  openPaymentModal(): void {
    if (!this.cartItems.length) {
      this.toast.warning('Vui long chon it nhat mot mon.');
      return;
    }

    this.paymentMethod = 'cash';
    this.receivedAmount = this.totalAmount;
    this.isPaymentModalOpen = true;
  }

  selectPaymentMethod(method: CheckoutPaymentMethod): void {
    this.paymentMethod = method;
    this.receivedAmount = method === 'cash' ? this.totalAmount : 0;
  }

  async confirmPayment(): Promise<void> {
    if (this.isPaying) {
      return;
    }

    if (this.paymentMethod === 'cash' && this.receivedAmount < this.totalAmount) {
      this.toast.warning('Tien khach dua chua du.');
      return;
    }

    if (!this.authService.currentUser()) {
      this.toast.error('Phien dang nhap da het han.');
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.toast.error('Phien dang nhap da het han.');
      return;
    }

    const invoiceItems = this.cartItems.map((item) => ({
      productName: item.product.name,
      variantName: item.variant.name,
      quantity: item.quantity,
      unitPrice: item.variant.price,
      subtotal: item.quantity * item.variant.price
    }));
    const customerName = this.selectedCustomer?.name;
    const totalAmount = this.totalAmount;

    this.isPaying = true;
    try {
      const order = await this.orderService.create({
        customer_id: this.selectedCustomer?.id ?? null,
        user_id: currentUser.id,
        items: this.cartItems.map((item) => ({
          product_variant_id: item.variant.id,
          quantity: item.quantity
        }))
      });

      await this.paymentService.create({
        order_id: order.id,
        method: this.paymentMethod,
        amount: totalAmount,
        received_amount: this.paymentMethod === 'cash' ? this.receivedAmount : totalAmount
      });

      this.pendingInvoiceData = {
        storeName: this.storeName,
        printedAt: new Date(),
        orderCode: order.code,
        customerName,
        items: invoiceItems,
        totalAmount
      };
      this.paidOrderId = order.id;
      this.toast.success(
        this.paymentMethod === 'momo'
          ? `Da xac nhan thanh toan MoMo ${order.code}.`
          : `Da thanh toan ${order.code}. Don da chuyen sang pha che.`
      );
      this.cartItems = [];
      this.customerPhone = '';
      this.selectedCustomer = null;
      this.isPaymentModalOpen = false;
      this.isPrintInvoiceModalOpen = true;
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể tạo hóa đơn.');
    } finally {
      this.isPaying = false;
    }
  }

  async cancelPrintInvoice(): Promise<void> {
    this.isPrintInvoiceModalOpen = false;
    await this.navigateToPaidOrder();
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

    this.isPrintInvoiceModalOpen = false;
    await this.navigateToPaidOrder();
  }

  private async navigateToPaidOrder(): Promise<void> {
    const orderId = this.paidOrderId;
    this.pendingInvoiceData = null;
    this.paidOrderId = null;

    if (orderId) {
      await this.router.navigate(['/orders', orderId]);
    }
  }
}
