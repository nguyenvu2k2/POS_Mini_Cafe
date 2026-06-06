import { NgClass, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  roles: Role[];
  exact?: boolean;
  iconPath: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgFor, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['admin'],
      iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h3.75C8.496 12 9 12.504 9 13.125v6.75C9 20.496 8.496 21 7.875 21h-3.75A1.125 1.125 0 013 19.875v-6.75zM15 4.125C15 3.504 15.504 3 16.125 3h3.75C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-3.75A1.125 1.125 0 0115 19.875V4.125zM3 4.125C3 3.504 3.504 3 4.125 3h3.75C8.496 3 9 3.504 9 4.125v3.75C9 8.496 8.496 9 7.875 9h-3.75A1.125 1.125 0 013 7.875v-3.75zM12 13.125c0-.621.504-1.125 1.125-1.125h-3.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h3.75A1.125 1.125 0 0015 19.875v-6.75z'
    },
    {
      label: 'Tạo đơn',
      path: '/orders/new',
      roles: ['admin', 'cashier'],
      iconPath: 'M12 6v12m6-6H6'
    },
    {
      label: 'Đơn hàng',
      path: '/orders',
      roles: ['admin', 'cashier', 'barista'],
      exact: true,
      iconPath: 'M9 12h6m-6 4h6m2.25 5H6.75A2.25 2.25 0 014.5 18.75V5.25A2.25 2.25 0 016.75 3h7.5L19.5 8.25v10.5A2.25 2.25 0 0117.25 21z'
    },
    {
      label: 'Sản phẩm',
      path: '/products',
      roles: ['admin'],
      iconPath: 'M20.25 7.5l-.625 10.632A2.25 2.25 0 0117.38 20.25H6.62a2.25 2.25 0 01-2.245-2.118L3.75 7.5m16.5 0H3.75m16.5 0l-1.5-3H5.25l-1.5 3'
    },
    {
      label: 'Khách hàng',
      path: '/customers',
      roles: ['admin', 'cashier'],
      iconPath: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0'
    },
    {
      label: 'Nguyên liệu',
      path: '/ingredients',
      roles: ['admin'],
      iconPath: 'M12 3.75c-4.142 0-7.5 2.686-7.5 6 0 2.176 1.448 4.084 3.617 5.137L7.5 20.25l4.5-2.25 4.5 2.25-.617-5.363C18.552 13.834 19.5 11.926 19.5 9.75c0-3.314-3.358-6-7.5-6z'
    },
    {
      label: 'Báo cáo',
      path: '/reports/revenue',
      roles: ['admin'],
      iconPath: 'M3 13.125h4.5v7.125H3v-7.125zM9.75 8.625h4.5V20.25h-4.5V8.625zM16.5 3.75H21v16.5h-4.5V3.75z'
    },
    {
      label: 'Nhân viên',
      path: '/users',
      roles: ['admin'],
      iconPath: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72M15 11.25a3 3 0 11-6 0 3 3 0 016 0zM4.5 20.25a6 6 0 0115 0'
    }
  ];

  constructor(readonly authService: AuthService) {}

  get visibleItems(): NavItem[] {
    const role = this.authService.currentRole();
    return role ? this.navItems.filter((item) => item.roles.includes(role)) : [];
  }
}
