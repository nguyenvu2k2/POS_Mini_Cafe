import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ingredient } from '../../core/models/ingredient.model';
import { Order } from '../../core/models/order.model';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyVnPipe } from '../../shared/pipes/currency-vn.pipe';
import { IngredientService } from '../ingredients/services/ingredient.service';
import { OrderService } from '../orders/services/order.service';
import { ProductService } from '../products/services/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, BadgeComponent, LoadingSpinnerComponent, CurrencyVnPipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  todayRevenue = 0;
  todayOrderCount = 0;
  activeProductCount = 0;
  lowStockIngredients: Ingredient[] = [];
  recentOrders: Order[] = [];

  constructor(
    private readonly orderService: OrderService,
    private readonly productService: ProductService,
    private readonly ingredientService: IngredientService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      const [orders, products, lowStockIngredients] = await Promise.all([
        this.orderService.getAll(),
        this.productService.getAll({ isActive: true }),
        this.ingredientService.getAll(true)
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter((order) => order.created_at.slice(0, 10) === today && order.status !== 'cancelled');
      const completedTodayOrders = todayOrders.filter((order) => order.status === 'completed');

      this.todayRevenue = completedTodayOrders.reduce((sum, order) => sum + order.total_amount, 0);
      this.todayOrderCount = todayOrders.length;
      this.activeProductCount = products.length;
      this.lowStockIngredients = lowStockIngredients;
      this.recentOrders = orders.slice(0, 5);
    } finally {
      this.isLoading = false;
    }
  }
}
