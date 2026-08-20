import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vehicles',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
  },
  {
    path: 'vehicles',
    loadComponent: () => import('./vehicles/vehicles.page').then((m) => m.VehiclesPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'vehicles',
  },
];
