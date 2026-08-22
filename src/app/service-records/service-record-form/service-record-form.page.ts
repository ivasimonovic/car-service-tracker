import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ServiceItemCatalogService } from '../../core/service-item-catalog.service';
import { ServiceItemCatalogEntry } from '../../models/service-item-catalog.model';
import { ServiceItem, ServiceItemInput, ServiceRecordInput } from '../../models/service-record.model';
import { ServiceRecordService } from '../service-record.service';

interface CatalogSelection {
  entry: ServiceItemCatalogEntry;
  selected: boolean;
  price: string;
}

@Component({
  selector: 'app-service-record-form',
  templateUrl: './service-record-form.page.html',
  styleUrls: ['./service-record-form.page.scss'],
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonInput,
    IonTextarea,
    IonCheckbox,
    IonLabel,
    IonText,
    IonButton,
    IonSpinner,
  ],
})
export class ServiceRecordFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly serviceItemCatalogService = inject(ServiceItemCatalogService);
  private readonly router = inject(Router);

  readonly vehicleId = input.required<string>();
  readonly serviceId = input<string>();
  readonly isEditMode = computed(() => !!this.serviceId());

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Popunjava se samo u režimu izmene - stavke se tada prikazuju kao pregled, ne menjaju se. */
  readonly existingItems = signal<ServiceItem[]>([]);
  readonly existingTotalPrice = signal(0);

  /** Popunjava se samo pri kreiranju - korisnik bira stavke iz kataloga sa cenom. */
  readonly catalogSelections = signal<CatalogSelection[]>([]);
  readonly selectedItems = computed(() => this.catalogSelections().filter((item) => item.selected));
  readonly newTotalPrice = computed(() =>
    this.selectedItems().reduce((sum, item) => sum + (Number(item.price) || 0), 0),
  );

  readonly form = this.fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    mileage: ['0', [Validators.required, Validators.pattern(/^\d+$/)]],
    serviceType: ['', [Validators.required, Validators.minLength(2)]],
    note: [''],
  });

  async ngOnInit(): Promise<void> {
    const serviceId = this.serviceId();

    this.isLoading.set(true);
    try {
      if (serviceId) {
        await this.loadExistingRecord(serviceId);
      } else {
        const catalog = await this.serviceItemCatalogService.getCatalog();
        this.catalogSelections.set(catalog.map((entry) => ({ entry, selected: false, price: '' })));
        // Naslov servisa se pri kreiranju automatski izvodi iz izabranih stavki (vidi onSubmit),
        // pa polje ne treba da bude vidljivo korisniku - ovde samo zadovoljava validator.
        this.form.patchValue({ serviceType: 'Servis' });
      }
    } catch {
      this.errorMessage.set('Greška pri učitavanju podataka.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadExistingRecord(serviceId: string): Promise<void> {
    const [record, items] = await Promise.all([
      this.serviceRecordService.getServiceRecord(serviceId),
      this.serviceRecordService.getServiceItems(serviceId),
    ]);
    if (!record) {
      this.errorMessage.set('Servis nije pronađen.');
      return;
    }

    this.existingItems.set(items);
    this.existingTotalPrice.set(record.totalPrice);
    this.form.patchValue({
      date: (record.date ?? new Date()).toISOString().slice(0, 10),
      mileage: String(record.mileage),
      serviceType: record.serviceType,
      note: record.note,
    });
  }

  toggleItem(index: number, selected: boolean): void {
    this.catalogSelections.update((items) => items.map((item, i) => (i === index ? { ...item, selected } : item)));
  }

  updateItemPrice(index: number, price: string | number | null | undefined): void {
    const value = String(price ?? '');
    this.catalogSelections.update((items) => items.map((item, i) => (i === index ? { ...item, price: value } : item)));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const serviceId = this.serviceId();
    if (!serviceId && this.selectedItems().length === 0) {
      this.errorMessage.set('Izaberite bar jednu odrađenu stavku servisa.');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    try {
      if (serviceId) {
        const value: ServiceRecordInput = {
          vehicleId: this.vehicleId(),
          date: new Date(raw.date),
          mileage: Number(raw.mileage),
          serviceType: raw.serviceType.trim(),
          note: raw.note.trim(),
          totalPrice: this.existingTotalPrice(),
        };
        await this.serviceRecordService.updateServiceRecord(serviceId, value);
      } else {
        const selected = this.selectedItems();
        const items: ServiceItemInput[] = selected.map((item) => ({
          name: item.entry.name,
          price: Number(item.price) || 0,
          replacementIntervalKm: item.entry.replacementIntervalKm,
        }));
        const value: ServiceRecordInput = {
          vehicleId: this.vehicleId(),
          date: new Date(raw.date),
          mileage: Number(raw.mileage),
          serviceType: selected.map((item) => item.entry.name).join(', '),
          note: raw.note.trim(),
          totalPrice: 0,
        };
        await this.serviceRecordService.addCompleteService(value, items);
      }
      await this.router.navigateByUrl(`/vehicles/${this.vehicleId()}`);
    } catch {
      this.errorMessage.set('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
