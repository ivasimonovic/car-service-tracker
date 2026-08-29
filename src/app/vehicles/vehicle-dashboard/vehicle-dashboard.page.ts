import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  buildOutline,
  calendarOutline,
  cashOutline,
  createOutline,
  pencilOutline,
  speedometerOutline,
  trashOutline,
} from 'ionicons/icons';
import { MaintenanceStatus } from '../../models/maintenance-status.model';
import { ServiceRecord } from '../../models/service-record.model';
import { Vehicle } from '../../models/vehicle.model';
import { MaintenanceService } from '../../service-records/maintenance.service';
import { ServiceRecordService } from '../../service-records/service-record.service';
import { VehicleService } from '../vehicle.service';

@Component({
  selector: 'app-vehicle-dashboard',
  templateUrl: './vehicle-dashboard.page.html',
  styleUrls: ['./vehicle-dashboard.page.scss'],
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonText,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
  ],
})
export class VehicleDashboardPage implements ViewWillEnter {
  private readonly vehicleService = inject(VehicleService);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly alertController = inject(AlertController);

  readonly id = input.required<string>();

  readonly vehicle = signal<Vehicle | null>(null);
  readonly serviceRecords = signal<ServiceRecord[]>([]);
  readonly recordsLoaded = signal(false);
  readonly maintenanceStatuses = signal<MaintenanceStatus[]>([]);
  readonly loadError = signal<string | null>(null);

  private loadToken = 0;

  constructor() {
    addIcons({
      addOutline,
      buildOutline,
      calendarOutline,
      cashOutline,
      createOutline,
      pencilOutline,
      speedometerOutline,
      trashOutline,
    });

    effect(() => {
      const vehicle = this.vehicle();
      const records = this.serviceRecords();
      if (!vehicle) {
        this.maintenanceStatuses.set([]);
        return;
      }
      this.maintenanceStatuses.set(this.maintenanceService.getMaintenanceStatus(vehicle.currentMileage, records));
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.loadError.set(null);
    this.recordsLoaded.set(false);
    await this.load();
  }

  private async load(): Promise<void> {
    const vehicleId = this.id();
    const token = ++this.loadToken;

    try {
      const vehicle = await this.vehicleService.getVehicle(vehicleId);
      if (token === this.loadToken) this.vehicle.set(vehicle);
    } catch (error: any) {
      if (token !== this.loadToken) return;
      console.error('Greška pri učitavanju vozila', error);
      this.loadError.set(`Greška pri učitavanju vozila (${error.code ?? error.message}).`);
    }

    try {
      const records = await this.serviceRecordService.getServiceRecords(vehicleId);
      if (token !== this.loadToken) return;
      this.serviceRecords.set(records);
      this.recordsLoaded.set(true);
    } catch (error: any) {
      if (token !== this.loadToken) return;
      console.error('Greška pri učitavanju istorije servisa', error);
      this.loadError.set(`Greška pri učitavanju istorije servisa (${error.code ?? error.message}).`);
      this.recordsLoaded.set(true);
    }
  }

  async onUpdateMileage(): Promise<void> {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    const alert = await this.alertController.create({
      header: 'Ažuriraj kilometražu',
      inputs: [
        {
          name: 'mileage',
          type: 'number',
          value: vehicle.currentMileage,
          min: vehicle.currentMileage,
          placeholder: 'Kilometraža (km)',
        },
      ],
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        {
          text: 'Sačuvaj',
          handler: async (data: { mileage: string }) => {
            const mileage = Number(data.mileage);
            if (!Number.isFinite(mileage) || mileage < vehicle.currentMileage) return false;
            await this.vehicleService.updateMileage(vehicle.id, mileage);
            await this.load();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async onDeleteRecord(recordId: string, slidingItem: IonItemSliding): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Obriši servis',
      message: 'Da li ste sigurni da želite da obrišete ovaj servis iz istorije?',
      buttons: [
        { text: 'Otkaži', role: 'cancel', handler: () => slidingItem.close() },
        {
          text: 'Obriši',
          role: 'destructive',
          handler: async () => {
            await this.serviceRecordService.deleteServiceRecord(this.id(), recordId);
            await this.load();
          },
        },
      ],
    });
    await alert.present();
  }
}
