import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Ingredient } from '../../../core/models/ingredient.model';
import { ApiService } from '../../../core/services/api.service';
import { IngredientService } from '../../ingredients/services/ingredient.service';

export interface RevenuePoint {
  period: string;
  orderCount: number;
  revenue: number;
}

export interface TopProductPoint {
  rank: number;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

export type RevenueGroupBy = 'day' | 'week' | 'month';

interface ApiRevenuePoint {
  period: string | number;
  total_orders: string | number;
  revenue: string | number;
}

interface ApiTopProductPoint {
  product_name: string;
  variant_name: string;
  total_sold: string | number;
  revenue: string | number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(
    private readonly api: ApiService,
    private readonly ingredientService: IngredientService
  ) {}

  async getRevenue(fromDate: string, toDate: string, groupBy: RevenueGroupBy): Promise<RevenuePoint[]> {
    const points = await this.api.get<ApiRevenuePoint[]>(`${this.apiUrl}/revenue`, {
      from: fromDate,
      to: toDate,
      group_by: groupBy
    });

    return points.map((point) => ({
      period: this.formatPeriod(point.period, groupBy),
      orderCount: Number(point.total_orders),
      revenue: Number(point.revenue)
    }));
  }

  async getTopProducts(): Promise<TopProductPoint[]> {
    const points = await this.api.get<ApiTopProductPoint[]>(`${this.apiUrl}/top-products`, { limit: 10 });

    return points.map((point, index) => ({
      rank: index + 1,
      productName: point.product_name,
      variantName: point.variant_name,
      quantity: Number(point.total_sold),
      revenue: Number(point.revenue)
    }));
  }

  async getLowStock(): Promise<Ingredient[]> {
    return this.ingredientService.getAll(true);
  }

  private formatPeriod(period: string | number, groupBy: RevenueGroupBy): string {
    const value = String(period);

    if (groupBy === 'day') {
      return this.formatDateLabel(value);
    }

    if (groupBy === 'month') {
      const [year, month] = value.split('-');
      return year && month ? `${month}/${year}` : value;
    }

    const normalizedWeek = value.padStart(6, '0');
    const year = normalizedWeek.slice(0, 4);
    const week = normalizedWeek.slice(4);

    return year && week ? `Tuần ${Number(week)}/${year}` : value;
  }

  private formatDateLabel(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}
