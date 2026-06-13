import { NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { Ingredient } from '../../../core/models/ingredient.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { ReportService, RevenueGroupBy, RevenuePoint, TopProductPoint } from '../services/report.service';

type ReportTab = 'revenue' | 'top-products' | 'low-stock';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule, RouterLink, EmptyStateComponent, LoadingSpinnerComponent, CurrencyVnPipe],
  templateUrl: './report-page.component.html'
})
export class ReportPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueCanvas') revenueCanvas?: ElementRef<HTMLCanvasElement>;

  activeTab: ReportTab = 'revenue';
  fromDate = this.formatDate(new Date(Date.now() - 6 * 86400000));
  toDate = this.formatDate(new Date());
  groupBy: RevenueGroupBy = 'day';
  isLoading = false;

  revenueData: RevenuePoint[] = [];
  topProducts: TopProductPoint[] = [];
  lowStockIngredients: Ingredient[] = [];
  private chart?: Chart;

  readonly tabs: { value: ReportTab; label: string; path: string }[] = [
    { value: 'revenue', label: 'Doanh thu', path: '/reports/revenue' },
    { value: 'top-products', label: 'Top sản phẩm', path: '/reports/top-products' },
    { value: 'low-stock', label: 'Tồn kho thấp', path: '/reports/low-stock' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as ReportTab | null;
      this.activeTab = tab && this.tabs.some((item) => item.value === tab) ? tab : 'revenue';
      void this.loadActiveTab();
    });
  }

  ngAfterViewInit(): void {
    this.renderRevenueChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  async loadActiveTab(): Promise<void> {
    if (this.activeTab === 'revenue') {
      await this.loadRevenue();
      return;
    }

    if (this.activeTab === 'top-products') {
      await this.loadTopProducts();
      return;
    }

    await this.loadLowStock();
  }

  async loadRevenue(): Promise<void> {
    this.isLoading = true;
    try {
      this.revenueData = await this.reportService.getRevenue(this.fromDate, this.toDate, this.groupBy);
      window.setTimeout(() => this.renderRevenueChart());
    } finally {
      this.isLoading = false;
    }
  }

  async loadTopProducts(): Promise<void> {
    this.isLoading = true;
    try {
      this.topProducts = await this.reportService.getTopProducts();
    } finally {
      this.isLoading = false;
    }
  }

  async loadLowStock(): Promise<void> {
    this.isLoading = true;
    try {
      this.lowStockIngredients = await this.reportService.getLowStock();
    } finally {
      this.isLoading = false;
    }
  }

  private renderRevenueChart(): void {
    if (!this.revenueCanvas || this.activeTab !== 'revenue') {
      return;
    }

    this.chart?.destroy();
    this.chart = new Chart(this.revenueCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.revenueData.map((item) => item.period),
        datasets: [
          {
            label: 'Doanh thu',
            data: this.revenueData.map((item) => item.revenue),
            backgroundColor: '#1D4ED8',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => `${Number(value).toLocaleString('vi-VN')}đ`
            }
          }
        }
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
