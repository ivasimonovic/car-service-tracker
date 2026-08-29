import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, carSportOutline, speedometerOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';
import { Vehicle } from '../models/vehicle.model';
import { VehicleService } from './vehicle.service';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
  imports: [
    RouterLink,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonFab,
    IonFabButton,
    IonText,
    IonSpinner,
  ],
})
export class VehiclesPage implements ViewWillEnter {
  private readonly authService = inject(AuthService);
  private readonly vehicleService = inject(VehicleService);
  private readonly alertController = inject(AlertController);

  private loadToken = 0;

  readonly currentUser = this.authService.currentUser;
  readonly vehicles = signal<Vehicle[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, carSportOutline, speedometerOutline, trashOutline });
  }

  get greeting(): string {
    const name = this.currentUser?.displayName?.split(' ')[0];
    return name ? `Zdravo, ${name}` : 'Vaša vozila';
  }

  async ionViewWillEnter(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    this.loadError.set(null);
    this.isLoading.set(true);
    const token = ++this.loadToken;

    try {
      const vehicles = await this.vehicleService.getVehicles();
      if (token !== this.loadToken) return;
      this.vehicles.set(vehicles);
    } catch (error: any) {
      if (token !== this.loadToken) return;
      console.error('Greška pri učitavanju vozila', error);
      this.loadError.set(`Greška pri učitavanju vozila (${error.code ?? error.message}).`);
    } finally {
      if (token === this.loadToken) this.isLoading.set(false);
    }
  }

  async onDelete(vehicleId: string, event: Event): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const alert = await this.alertController.create({
      header: 'Obriši vozilo',
      message: 'Da li ste sigurni da želite da obrišete ovo vozilo?',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        {
          text: 'Obriši',
          role: 'destructive',
          handler: async () => {
            await this.vehicleService.deleteVehicle(vehicleId);
            await this.load();
          },
        },
      ],
    });
    await alert.present();
  }
}
