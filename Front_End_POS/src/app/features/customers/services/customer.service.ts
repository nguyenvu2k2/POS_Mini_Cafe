import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateCustomerDto, Customer, UpdateCustomerDto } from '../../../core/models/customer.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  constructor(private readonly api: ApiService) {}

  async getAll(search = ''): Promise<Customer[]> {
    return this.api.get<Customer[]>(this.apiUrl, { q: search });
  }

  async create(payload: CreateCustomerDto): Promise<Customer> {
    return this.api.post<Customer, CreateCustomerDto>(this.apiUrl, {
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || null,
      note: payload.note?.trim() || null
    });
  }

  async update(id: number, payload: UpdateCustomerDto): Promise<Customer> {
    return this.api.put<Customer, UpdateCustomerDto>(`${this.apiUrl}/${id}`, {
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null
    });
  }

  async getById(id: number): Promise<Customer | null> {
    try {
      const [customer, orders] = await Promise.all([
        this.api.get<Customer>(`${this.apiUrl}/${id}`),
        this.api.get<unknown[]>(`${this.apiUrl}/${id}/orders`, { limit: 100 })
      ]);

      return { ...customer, orders: orders as Customer['orders'] };
    } catch {
      return null;
    }
  }

  async searchByPhone(phone: string): Promise<Customer | null> {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      return null;
    }

    try {
      const customers = await this.getAll(normalizedPhone);
      return customers.find((customer) => customer.phone === normalizedPhone) ?? customers[0] ?? null;
    } catch {
      return null;
    }
  }
}
