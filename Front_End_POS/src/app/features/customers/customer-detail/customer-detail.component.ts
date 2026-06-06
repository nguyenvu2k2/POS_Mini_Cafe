import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Customer } from '../../../core/models/customer.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyVnPipe } from '../../../shared/pipes/currency-vn.pipe';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, RouterLink, BadgeComponent, LoadingSpinnerComponent, CurrencyVnPipe],
  templateUrl: './customer-detail.component.html'
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  isLoading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly customerService: CustomerService
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.customer = await this.customerService.getById(id);
    } finally {
      this.isLoading = false;
    }
  }
}
