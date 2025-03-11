import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.profile$.pipe(
    map(profile => {
      // Check if the user is an admin
      if (profile?.role === 'admin') {
        return true;
      }
      
      // Not authorized as author, redirect to home
      router.navigate(['/']);
      return false;
    })
  );
};
