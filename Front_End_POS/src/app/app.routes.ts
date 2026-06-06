import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Đăng nhập',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'orders/new',
        title: 'Tạo đơn',
        data: { roles: ['admin', 'cashier'] },
        loadComponent: () => import('./features/orders/create-order/create-order.component').then((m) => m.CreateOrderComponent)
      },
      {
        path: 'orders',
        title: 'Đơn hàng',
        data: { roles: ['admin', 'cashier', 'barista'] },
        loadComponent: () => import('./features/orders/order-list/order-list.component').then((m) => m.OrderListComponent)
      },
      {
        path: 'orders/:id',
        title: 'Chi tiết đơn',
        data: { roles: ['admin', 'cashier', 'barista'] },
        loadComponent: () => import('./features/orders/order-detail/order-detail.component').then((m) => m.OrderDetailComponent)
      },
      {
        path: 'products/new',
        title: 'Thêm sản phẩm',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent)
      },
      {
        path: 'products/:id/edit',
        title: 'Sửa sản phẩm',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent)
      },
      {
        path: 'products',
        title: 'Sản phẩm',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/products/product-list/product-list.component').then((m) => m.ProductListComponent)
      },
      {
        path: 'customers',
        title: 'Khách hàng',
        data: { roles: ['admin', 'cashier'] },
        loadComponent: () => import('./features/customers/customer-list/customer-list.component').then((m) => m.CustomerListComponent)
      },
      {
        path: 'customers/:id',
        title: 'Chi tiết khách hàng',
        data: { roles: ['admin', 'cashier'] },
        loadComponent: () => import('./features/customers/customer-detail/customer-detail.component').then((m) => m.CustomerDetailComponent)
      },
      {
        path: 'ingredients',
        title: 'Nguyên liệu',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/ingredients/ingredient-list/ingredient-list.component').then((m) => m.IngredientListComponent)
      },
      {
        path: 'reports',
        pathMatch: 'full',
        redirectTo: 'reports/revenue'
      },
      {
        path: 'reports/:tab',
        title: 'Báo cáo',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/reports/report-page/report-page.component').then((m) => m.ReportPageComponent)
      },
      {
        path: 'users',
        title: 'Nhân viên',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
