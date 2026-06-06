import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessTokenKey = 'pos_access_token';
  private readonly refreshTokenKey = 'pos_refresh_token';

  getAccessToken(): string | null {
    return this.storage?.getItem(this.accessTokenKey) ?? null;
  }

  getRefreshToken(): string | null {
    return this.storage?.getItem(this.refreshTokenKey) ?? null;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.storage?.setItem(this.accessTokenKey, accessToken);
    this.storage?.setItem(this.refreshTokenKey, refreshToken);
  }

  removeTokens(): void {
    this.storage?.removeItem(this.accessTokenKey);
    this.storage?.removeItem(this.refreshTokenKey);
  }

  private get storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}
