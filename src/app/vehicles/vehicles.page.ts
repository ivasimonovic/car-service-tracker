import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { carSportOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent],
})
export class VehiclesPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  constructor() {
    addIcons({ carSportOutline, logOutOutline });
  }

  async onLogOut(): Promise<void> {
    await this.authService.logOut();
    await this.router.navigateByUrl('/login');
  }
}
