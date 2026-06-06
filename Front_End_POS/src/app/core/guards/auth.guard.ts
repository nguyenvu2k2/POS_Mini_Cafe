import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

type GuardResult = boolean | UrlTree;

function checkAuth(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): GuardResult {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const requiredRoles = (route.data['roles'] ?? []) as Role[];
  const currentRole = authService.currentRole();

  if (requiredRoles.length && (!currentRole || !requiredRoles.includes(currentRole))) {
    const fallbackByRole: Record<Role, string> = {
      admin: '/dashboard',
      cashier: '/orders/new',
      barista: '/orders'
    };
    return router.createUrlTree([currentRole ? fallbackByRole[currentRole] : '/login']);
  }

  return true;
}

export const authGuard: CanActivateFn = (route, state) => checkAuth(route, state);
export const authChildGuard: CanActivateChildFn = (route, state) => checkAuth(route, state);
