import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly demoAccounts = [
    { label: 'Admin', email: 'admin@pos.local', password: 'admin123456' },
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['admin@pos.local', [Validators.required, Validators.email]],
    password: ['admin123456', Validators.required]
  });

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toast: ToastService
  ) {}

  fillAccount(account: { email: string; password: string }): void {
    this.form.patchValue(account);
    this.errorMessage = '';
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.login(this.form.getRawValue());
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl ?? this.homeByRole(result.user.role));
      this.toast.success('Đăng nhập thành công.');
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Không thể đăng nhập.';
    } finally {
      this.isLoading = false;
    }
  }

  private homeByRole(role: Role): string {
    const map: Record<Role, string> = {
      admin: '/dashboard',
      cashier: '/orders/new',
      barista: '/orders'
    };

    return map[role];
  }
}
