import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule, RouterLink, BadgeComponent, EmptyStateComponent, LoadingSpinnerComponent, CurrencyVnPipe],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  searchTerm = '';
  categoryId: number | 'all' = 'all';
  isLoading = false;
  isSavingVisibility = false;
  hidingProduct: Product | null = null;
  showingProduct: Product | null = null;
  hideConfirmForm = new FormGroup({});
  showConfirmForm = new FormGroup({});

  constructor(
    private readonly productService: ProductService,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const [categories, products] = await Promise.all([
        this.productService.getCategories(),
        this.productService.getAll({
          categoryId: this.categoryId === 'all' ? undefined : this.categoryId,
          search: this.searchTerm
        })
      ]);

      this.categories = categories;
      this.products = products;
    } finally {
      this.isLoading = false;
    }
  }

  async toggleActive(product: Product): Promise<void> {
    await this.productService.toggleActive(product.id);
    this.toast.success(product.is_active ? 'Đã ẩn sản phẩm.' : 'Đã hiển thị sản phẩm.');
    await this.loadProducts();
  }

  handleVisibilityClick(product: Product): void {
    if (product.is_active) {
      this.openHideConfirm(product);
      return;
    }

    this.openShowConfirm(product);
  }

  openHideConfirm(product: Product): void {
    this.showingProduct = null;
    this.hidingProduct = product;
  }

  closeHideConfirm(): void {
    if (this.isSavingVisibility) {
      return;
    }

    this.hidingProduct = null;
  }

  async confirmHideProduct(): Promise<void> {
    if (!this.hidingProduct || this.isSavingVisibility) {
      return;
    }

    this.isSavingVisibility = true;
    try {
      await this.productService.toggleActive(this.hidingProduct.id);
      this.toast.success('Đã ẩn sản phẩm.');
      this.hidingProduct = null;
      await this.loadProducts();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể ẩn sản phẩm.');
    } finally {
      this.isSavingVisibility = false;
    }
  }

  openShowConfirm(product: Product): void {
    this.hidingProduct = null;
    this.showingProduct = product;
  }

  closeShowConfirm(): void {
    if (this.isSavingVisibility) {
      return;
    }

    this.showingProduct = null;
  }

  async confirmShowProduct(): Promise<void> {
    if (!this.showingProduct || this.isSavingVisibility) {
      return;
    }

    this.isSavingVisibility = true;
    try {
      await this.productService.toggleActive(this.showingProduct.id);
      this.toast.success('Đã hiển thị sản phẩm.');
      this.showingProduct = null;
      await this.loadProducts();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể hiển thị sản phẩm.');
    } finally {
      this.isSavingVisibility = false;
    }
  }

  onProductImageError(event: Event, product: Product): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = this.productService.getDefaultImageForName(product.name);

    if (image.getAttribute('src') === fallbackUrl) {
      return;
    }

    image.src = fallbackUrl;
  }
}
