import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
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
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'vehicles',
        loadComponent: () => import('./vehicles/vehicles.page').then((m) => m.VehiclesPage),
      },
      {
        path: 'stats',
        loadComponent: () => import('./stats/stats.page').then((m) => m.StatsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'vehicles',
        pathMatch: 'full',
      },
    ],
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
    redirectTo: 'tabs',
  },
];
