import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResult, LoginPayload, Role, User } from '../models/user.model';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserKey = 'pos_current_user';
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly tokenService: TokenService,
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  async login(payload: LoginPayload): Promise<AuthResult> {
    const result = this.normalizeAuthResult(
      await this.api.post<AuthResult, LoginPayload>(`${this.apiUrl}/login`, payload)
    );
    this.storeSession(result);
    return result;
  }

  logout(): void {
    this.tokenService.removeTokens();
    this.storage?.removeItem(this.currentUserKey);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.getAccessToken() && !!this.currentUserSubject.value;
  }

  currentRole(): Role | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private readStoredUser(): User | null {
    const rawUser = this.storage?.getItem(this.currentUserKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  private normalizeAuthResult(result: AuthResult): AuthResult {
    const apiUser = result.user as User & { name?: string };
    const fullName = apiUser.full_name ?? apiUser.name ?? apiUser.email;

    return {
      ...result,
      user: {
        ...apiUser,
        full_name: fullName,
        is_active: apiUser.is_active ?? true,
        avatar_url: apiUser.avatar_url ?? this.initials(fullName),
        created_at: apiUser.created_at ?? new Date().toISOString()
      }
    };
  }

  private initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }

  private storeSession(result: AuthResult): void {
    this.tokenService.setTokens(result.access_token, result.refresh_token);
    this.storage?.setItem(this.currentUserKey, JSON.stringify(result.user));
    this.currentUserSubject.next(result.user);
  }

  private get storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}
