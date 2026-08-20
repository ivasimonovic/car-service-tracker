import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

/** Sprečava prijavljenog korisnika da vidi login/register ekrane. */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authReady$.pipe(
    map((user) => (user ? router.createUrlTree(['/vehicles']) : true)),
  );
};
