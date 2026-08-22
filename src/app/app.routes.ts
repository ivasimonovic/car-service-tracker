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
    path: 'vehicles/new',
    loadComponent: () =>
      import('./vehicles/vehicle-form/vehicle-form.page').then((m) => m.VehicleFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'vehicles/:id/edit',
    loadComponent: () =>
      import('./vehicles/vehicle-form/vehicle-form.page').then((m) => m.VehicleFormPage),
    canActivate: [authGuard],
  },
  {
    path: 'vehicles/:vehicleId/services/new',
    loadComponent: () =>
      import('./service-records/service-record-form/service-record-form.page').then(
        (m) => m.ServiceRecordFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'vehicles/:vehicleId/services/:serviceId/edit',
    loadComponent: () =>
      import('./service-records/service-record-form/service-record-form.page').then(
        (m) => m.ServiceRecordFormPage,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'vehicles/:id',
    loadComponent: () =>
      import('./vehicles/vehicle-dashboard/vehicle-dashboard.page').then((m) => m.VehicleDashboardPage),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'vehicles',
  },
];
