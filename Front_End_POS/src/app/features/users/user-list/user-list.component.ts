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
  editingUser: User | null = null;
  lockingUser: User | null = null;
  unlockingUser: User | null = null;

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

  readonly editForm = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['cashier' as Role, Validators.required],
    change_password: [false],
    password: [''],
    confirm_password: ['']
  });

  readonly lockConfirmForm = this.fb.nonNullable.group({
    user_id: [0, Validators.min(1)],
    full_name: [''],
    email: ['']
  });

  readonly unlockConfirmForm = this.fb.nonNullable.group({
    user_id: [0, Validators.min(1)],
    full_name: [''],
    email: ['']
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
      console.log(this.users);
    } finally {
      this.isLoading = false;
    }
  }

  openCreateForm(): void {
    this.editingUser = null;
    this.lockingUser = null;
    this.unlockingUser = null;
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

  handleActiveClick(user: User): void {
    if (!user.is_active) {
      this.openUnlockConfirm(user);
      return;
    }

    this.openLockConfirm(user);
  }

  openLockConfirm(user: User): void {
    this.activeForm = false;
    this.editingUser = null;
    this.unlockingUser = null;
    this.lockingUser = user;
    this.lockConfirmForm.reset({
      user_id: user.id,
      full_name: user.full_name,
      email: user.email
    });
  }

  closeLockConfirm(): void {
    if (this.isSaving) {
      return;
    }

    this.lockingUser = null;
    this.lockConfirmForm.reset({ user_id: 0, full_name: '', email: '' });
  }

  async confirmLockUser(): Promise<void> {
    if (!this.lockingUser || this.lockConfirmForm.invalid) {
      this.lockConfirmForm.markAllAsTouched();
      return;
    }

    const raw = this.lockConfirmForm.getRawValue();
    this.isSaving = true;
    try {
      await this.userService.toggleActive(raw.user_id);
      this.toast.success('Đã khóa tài khoản.');
      this.lockingUser = null;
      this.lockConfirmForm.reset({ user_id: 0, full_name: '', email: '' });
      await this.loadUsers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể khóa tài khoản.');
    } finally {
      this.isSaving = false;
    }
  }

  openUnlockConfirm(user: User): void {
    this.activeForm = false;
    this.editingUser = null;
    this.lockingUser = null;
    this.unlockingUser = user;
    this.unlockConfirmForm.reset({
      user_id: user.id,
      full_name: user.full_name,
      email: user.email
    });
  }

  closeUnlockConfirm(): void {
    if (this.isSaving) {
      return;
    }

    this.unlockingUser = null;
    this.unlockConfirmForm.reset({ user_id: 0, full_name: '', email: '' });
  }

  async confirmUnlockUser(): Promise<void> {
    if (!this.unlockingUser || this.unlockConfirmForm.invalid) {
      this.unlockConfirmForm.markAllAsTouched();
      return;
    }

    const raw = this.unlockConfirmForm.getRawValue();
    this.isSaving = true;
    try {
      await this.userService.toggleActive(raw.user_id);
      this.toast.success('Đã mở tài khoản.');
      this.unlockingUser = null;
      this.unlockConfirmForm.reset({ user_id: 0, full_name: '', email: '' });
      await this.loadUsers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể mở tài khoản.');
    } finally {
      this.isSaving = false;
    }
  }

  openEditForm(user: User): void {
    this.activeForm = false;
    this.lockingUser = null;
    this.unlockingUser = null;
    this.editingUser = user;
    this.editForm.reset({
      full_name: user.full_name,
      phone: user.phone ?? '',
      email: user.email,
      role: user.role,
      change_password: false,
      password: '',
      confirm_password: ''
    });
  }

  cancelEditUser(): void {
    this.editingUser = null;
    this.editForm.reset({
      full_name: '',
      phone: '',
      email: '',
      role: 'cashier',
      change_password: false,
      password: '',
      confirm_password: ''
    });
  }

  togglePasswordChange(): void {
    if (this.editForm.controls.change_password.value) {
      return;
    }

    this.editForm.patchValue({ password: '', confirm_password: '' });
    this.editForm.controls.password.setErrors(null);
    this.editForm.controls.confirm_password.setErrors(null);
  }

  async updateUser(): Promise<void> {
    if (!this.editingUser || !this.validateEditForm()) {
      return;
    }

    const raw = this.editForm.getRawValue();
    this.isSaving = true;
    try {
      await this.userService.update(this.editingUser.id, {
        full_name: raw.full_name,
        phone: raw.phone,
        email: raw.email,
        role: raw.role,
        password: raw.change_password ? raw.password : null
      });
      this.toast.success('Da cap nhat nhan vien.');
      this.cancelEditUser();
      await this.loadUsers();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Khong the cap nhat nhan vien.');
    } finally {
      this.isSaving = false;
    }
  }

  private resetCreateForm(): void {
    this.form.reset({ full_name: '', phone: '', email: '', role: 'cashier', password: '' });
  }

  private validateEditForm(): boolean {
    this.editForm.controls.password.setErrors(null);
    this.editForm.controls.confirm_password.setErrors(null);

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return false;
    }

    const raw = this.editForm.getRawValue();
    if (!raw.change_password) {
      return true;
    }

    if (raw.password.trim().length < 6) {
      this.editForm.controls.password.setErrors({ minlength: true });
      this.editForm.controls.password.markAsTouched();
      return false;
    }

    if (raw.password !== raw.confirm_password) {
      this.editForm.controls.confirm_password.setErrors({ mismatch: true });
      this.editForm.controls.confirm_password.markAsTouched();
      return false;
    }

    return true;
  }
}
