import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  carSportOutline,
  logOutOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
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
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonText,
    IonSpinner,
  ],
})
export class VehiclesPage implements ViewWillEnter, ViewWillLeave {
  private readonly authService = inject(AuthService);
  private readonly vehicleService = inject(VehicleService);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  private vehiclesSubscription: Subscription | null = null;

  readonly currentUser = this.authService.currentUser;
  readonly vehicles = signal<Vehicle[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  constructor() {
    addIcons({ addOutline, carSportOutline, logOutOutline, speedometerOutline, trashOutline });
  }

  /** Ionic keširanjem stranica ngOnInit se ne pokreće ponovo pri povratku na
   *  listu, pa se pretplata na uživo podatke osvežava ovde umesto u ngOnInit. */
  ionViewWillEnter(): void {
    this.loadError.set(null);
    this.isLoading.set(true);
    this.vehiclesSubscription = this.vehicleService.getVehicles$().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Greška pri učitavanju vozila', error);
        this.loadError.set('Greška pri učitavanju vozila. Proverite internet konekciju.');
        this.isLoading.set(false);
      },
    });
  }

  ionViewWillLeave(): void {
    this.vehiclesSubscription?.unsubscribe();
    this.vehiclesSubscription = null;
  }

  async onLogOut(): Promise<void> {
    await this.authService.logOut();
    await this.router.navigateByUrl('/login');
  }

  async onDelete(vehicleId: string, slidingItem: IonItemSliding): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Obriši vozilo',
      message: 'Da li ste sigurni da želite da obrišete ovo vozilo?',
      buttons: [
        { text: 'Otkaži', role: 'cancel', handler: () => slidingItem.close() },
        {
          text: 'Obriši',
          role: 'destructive',
          handler: async () => {
            await this.vehicleService.deleteVehicle(vehicleId);
          },
        },
      ],
    });
    await alert.present();
  }
}
