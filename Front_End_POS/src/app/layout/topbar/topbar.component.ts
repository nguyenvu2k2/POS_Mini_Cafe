import { NgIf } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  title = 'Dashboard';

  constructor(
    readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.syncTitle(router.url);
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.syncTitle(event.urlAfterRedirects);
    });
  }

  roleLabel(): string {
    const role = this.authService.currentRole();
    const map: Record<string, string> = {
      admin: 'Admin',
      cashier: 'Cashier',
      barista: 'Barista'
    };

    return role ? map[role] : '';
  }

  private syncTitle(url: string): void {
    const items: { test: RegExp; title: string }[] = [
      { test: /^\/dashboard/, title: 'Dashboard' },
      { test: /^\/orders\/new/, title: 'Tạo đơn hàng' },
      { test: /^\/orders\/\d+/, title: 'Chi tiết đơn hàng' },
      { test: /^\/orders/, title: 'Đơn hàng' },
      { test: /^\/products\/new/, title: 'Thêm sản phẩm' },
      { test: /^\/products\/\d+\/edit/, title: 'Sửa sản phẩm' },
      { test: /^\/products/, title: 'Sản phẩm' },
      { test: /^\/customers\/\d+/, title: 'Chi tiết khách hàng' },
      { test: /^\/customers/, title: 'Khách hàng' },
      { test: /^\/ingredients/, title: 'Nguyên liệu' },
      { test: /^\/reports/, title: 'Báo cáo' },
      { test: /^\/users/, title: 'Nhân viên' }
    ];

    this.title = items.find((item) => item.test.test(url))?.title ?? 'POS Mini Cafe';
  }
}
