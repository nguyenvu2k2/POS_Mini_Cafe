import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CreateCustomerDto, Customer, UpdateCustomerDto } from '../../../core/models/customer.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule, RouterLink, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './customer-list.component.html'
})
export class CustomerListComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  customers: Customer[] = [];
  searchTerm = '';
  isLoading = false;
  isCreating = false;
  isUpdating = false;
  activeForm = false;
  editingCustomer: Customer | null = null;
  private searchTimeoutId: number | null = null;

  newCustomer = {
    name: '',
    phone: '',
    email: '',
    note: ''
  };

  readonly editForm = this.fb.nonNullable.group({
    phone: ['', Validators.required],
    email: ['', Validators.email]
  });

  constructor(
    private readonly customerService: CustomerService,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.clearSearchTimer();
  }

  async loadCustomers(): Promise<void> {
    this.isLoading = true;
    try {
      this.customers = await this.customerService.getAll(this.searchTerm.trim());
    } finally {
      this.isLoading = false;
    }
  }

  scheduleSearch(term: string): void {
    this.searchTerm = term;
    this.clearSearchTimer();
    this.searchTimeoutId = window.setTimeout(() => {
      void this.searchCustomers();
    }, 1000);
  }

  async searchCustomers(): Promise<void> {
    this.clearSearchTimer();
    await this.loadCustomers();
  }

  openCreateForm(): void {
    this.activeForm = true;
  }

  cancelCreateCustomer(): void {
    this.resetCreateForm();
    this.activeForm = false;
  }

  openEditForm(customer: Customer): void {
    this.editingCustomer = customer;
    this.editForm.reset({
      phone: customer.phone ?? '',
      email: customer.email ?? ''
    });
  }

  cancelEditCustomer(): void {
    this.editingCustomer = null;
    this.editForm.reset({ phone: '', email: '' });
  }

  async createCustomer(): Promise<void> {
    const payload: CreateCustomerDto = {
      name: this.newCustomer.name.trim(),
      phone: this.newCustomer.phone.trim(),
      email: this.newCustomer.email.trim() || null,
      note: this.newCustomer.note.trim() || null
    };

    if (!payload.name || !payload.phone) {
      this.toast.warning('Vui lòng nhập tên và số điện thoại khách hàng.');
      return;
    }

    this.isCreating = true;
    try {
      await this.customerService.create(payload);
      this.toast.success('Đã thêm khách hàng.');
      this.resetCreateForm();
      this.activeForm = false;
      this.searchTerm = '';
      await this.loadCustomers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể thêm khách hàng.');
    } finally {
      this.isCreating = false;
    }
  }

  async updateCustomer(): Promise<void> {
    if (!this.editingCustomer) {
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    const payload: UpdateCustomerDto = {
      phone: value.phone.trim(),
      email: value.email.trim() || null
    };

    if (!payload.phone) {
      this.toast.warning('Vui lòng nhập số điện thoại.');
      return;
    }

    this.isUpdating = true;
    try {
      await this.customerService.update(this.editingCustomer.id, payload);
      this.toast.success('Đã cập nhật khách hàng.');
      this.cancelEditCustomer();
      await this.loadCustomers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể cập nhật khách hàng.');
    } finally {
      this.isUpdating = false;
    }
  }

  private resetCreateForm(): void {
    this.newCustomer = { name: '', phone: '', email: '', note: '' };
  }

  private clearSearchTimer(): void {
    if (this.searchTimeoutId !== null) {
      window.clearTimeout(this.searchTimeoutId);
      this.searchTimeoutId = null;
    }
  }
}
