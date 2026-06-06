import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role, User } from '../../../core/models/user.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, BadgeComponent, LoadingSpinnerComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  users: User[] = [];
  isLoading = false;
  isSaving = false;
  activeForm = false;

  readonly roles: { value: Role; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'barista', label: 'Barista' }
  ];

  readonly form = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.email],
    role: ['cashier' as Role],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private readonly userService: UserService,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading = true;
    try {
      this.users = await this.userService.getAll();
    } finally {
      this.isLoading = false;
    }
  }

  openCreateForm(): void {
    this.activeForm = true;
  }

  cancelCreateUser(): void {
    this.resetCreateForm();
    this.activeForm = false;
  }

  async createUser(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    try {
      await this.userService.create(this.form.getRawValue());
      this.toast.success('Đã thêm nhân viên.');
      this.resetCreateForm();
      this.activeForm = false;
      await this.loadUsers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể thêm nhân viên.');
    } finally {
      this.isSaving = false;
    }
  }

  async toggleActive(user: User): Promise<void> {
    await this.userService.toggleActive(user.id);
    this.toast.success(user.is_active ? 'Đã khóa tài khoản.' : 'Đã mở tài khoản.');
    await this.loadUsers();
  }

  private resetCreateForm(): void {
    this.form.reset({ full_name: '', phone: '', email: '', role: 'cashier', password: '' });
  }
}
