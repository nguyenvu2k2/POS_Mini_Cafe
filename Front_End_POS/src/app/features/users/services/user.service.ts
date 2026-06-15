import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateUserDto, Role, UpdateUserDto, User } from '../../../core/models/user.model';
import { ApiService } from '../../../core/services/api.service';

interface ApiRole {
  id: number;
  name: Role;
}

interface ApiUser {
  id: number;
  role_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  role?: ApiRole | Role;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly roleIds: Record<Role, number> = {
    admin: 1,
    cashier: 2,
    barista: 3
  };

  constructor(private readonly api: ApiService) {}

  async getAll(): Promise<User[]> {
    const users = await this.api.get<ApiUser[]>(this.apiUrl);
    return users.map((user) => this.toUser(user));
  }

  async create(payload: CreateUserDto): Promise<User> {
    const role = payload.role ?? 'cashier';

    const user = await this.api.post<ApiUser, {
      role_id: number;
      name: string;
      phone: string;
      email: string | null;
      password: string;
      is_active: boolean;
    }>(this.apiUrl, {
      role_id: this.roleIds[role],
      name: payload.full_name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim().toLowerCase() || null,
      password: payload.password.trim(),
      is_active: true
    });

    return this.toUser(user);
  }

  async toggleActive(id: number): Promise<User> {
    const currentUser = (await this.getAll()).find((user) => user.id === id);

    if (!currentUser) {
      throw new Error('Khong tim thay nhan vien.');
    }

    const user = await this.api.put<ApiUser, { is_active: boolean }>(`${this.apiUrl}/${id}`, {
      is_active: !currentUser.is_active
    });

    return this.toUser(user);
  }

  async update(id: number, payload: UpdateUserDto): Promise<User> {
    const body: {
      role_id: number;
      name: string;
      phone: string;
      email: string | null;
      password?: string;
    } = {
      role_id: this.roleIds[payload.role],
      name: payload.full_name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase() || null
    };

    const password = payload.password?.trim();
    if (password) {
      body.password = password;
    }

    const user = await this.api.put<ApiUser, typeof body>(`${this.apiUrl}/${id}`, body);
    return this.toUser(user);
  }

  private toUser(user: ApiUser): User {
    const role = typeof user.role === 'string' ? user.role : user.role?.name;

    return {
      id: user.id,
      full_name: user.name,
      email: user.email ?? '',
      phone: user.phone,
      role: role ?? 'cashier',
      is_active: user.is_active,
      avatar_url: this.initials(user.name),
      created_at: user.created_at
    };
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
