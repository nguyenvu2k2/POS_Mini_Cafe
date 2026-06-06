import { HttpClient, HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { TokenService } from '../services/token.service';

const BYPASS_AUTH = new HttpContextToken(() => false);
const CURRENT_USER_KEY = 'pos_current_user';

interface RefreshResult {
  access_token: string;
  refresh_token: string;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const http = inject(HttpClient);
  const router = inject(Router);

  if (req.context.get(BYPASS_AUTH)) {
    return next(req);
  }

  const accessToken = tokenService.getAccessToken();
  const authReq = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(error, req.url)) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        clearSession(tokenService, router);
        return throwError(() => error);
      }

      return http.post<ApiResponse<RefreshResult>>(
        `${environment.apiUrl}/auth/refresh`,
        { refresh_token: refreshToken },
        { context: new HttpContext().set(BYPASS_AUTH, true) }
      ).pipe(
        switchMap((response) => {
          tokenService.setTokens(response.data.access_token, response.data.refresh_token);

          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.data.access_token}`
            }
          }));
        }),
        catchError((refreshError: unknown) => {
          clearSession(tokenService, router);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function shouldRefresh(error: unknown, url: string): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }

  return !url.includes('/auth/login') && !url.includes('/auth/refresh');
}

function clearSession(tokenService: TokenService, router: Router): void {
  tokenService.removeTokens();

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }

  void router.navigate(['/login']);
}
