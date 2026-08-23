import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { CarBrandService } from '../../core/car-brand.service';
import { CarBrand } from '../../models/car-brand.model';
import { FuelType, VehicleInput } from '../../models/vehicle.model';
import { firstFieldError } from '../../shared/form-errors';
import { VehicleService } from '../vehicle.service';

const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  brand: { required: 'Izaberite marku vozila.' },
  model: { required: 'Model je obavezan.' },
  year: { required: 'Godište je obavezno.', pattern: 'Unesite ispravnu godinu (npr. 2018).' },
  registrationNumber: { required: 'Registarska oznaka je obavezna.' },
  engine: { required: 'Motor je obavezan.' },
  currentMileage: { required: 'Kilometraža je obavezna.', pattern: 'Unesite ispravnu kilometražu (samo brojevi).' },
};

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.page.html',
  styleUrls: ['./vehicle-form.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonText,
    IonButton,
    IonSpinner,
  ],
})
export class VehicleFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vehicleService = inject(VehicleService);
  private readonly carBrandService = inject(CarBrandService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly brands = signal<CarBrand[]>([]);

  readonly fuelTypes: { value: FuelType; label: string }[] = [
    { value: 'benzin', label: 'Benzin' },
    { value: 'dizel', label: 'Dizel' },
    { value: 'hibrid', label: 'Hibrid' },
    { value: 'električni', label: 'Električni' },
    { value: 'gas', label: 'Gas (TNG/CNG)' },
  ];

  readonly form = this.fb.nonNullable.group({
    brand: ['', [Validators.required]],
    model: ['', [Validators.required, Validators.minLength(1)]],
    year: [String(new Date().getFullYear()), [Validators.required, Validators.pattern(/^(19|20)\d{2}$/)]],
    registrationNumber: ['', [Validators.required]],
    fuelType: ['benzin' as FuelType, [Validators.required]],
    engine: ['', [Validators.required]],
    currentMileage: ['0', [Validators.required, Validators.pattern(/^\d+$/)]],
  });

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.brands.set(await this.carBrandService.getBrands());

      const vehicleId = this.id();
      if (!vehicleId) return;

      const vehicle = await this.vehicleService.getVehicle(vehicleId);
      if (!vehicle) {
        this.errorMessage.set('Vozilo nije pronađeno.');
        return;
      }
      this.form.patchValue({
        brand: vehicle.brand,
        model: vehicle.model,
        year: String(vehicle.year),
        registrationNumber: vehicle.registrationNumber,
        fuelType: vehicle.fuelType,
        engine: vehicle.engine,
        currentMileage: String(vehicle.currentMileage),
      });
    } catch {
      this.errorMessage.set('Greška pri učitavanju vozila.');
    } finally {
      this.isLoading.set(false);
    }
  }

  errorFor(field: string): string | null {
    const key = firstFieldError(this.form.get(field));
    return key ? (FIELD_MESSAGES[field]?.[key] ?? 'Neispravna vrednost.') : null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const value: VehicleInput = {
      brand: raw.brand.trim(),
      model: raw.model.trim(),
      year: Number(raw.year),
      registrationNumber: raw.registrationNumber.trim().toUpperCase(),
      fuelType: raw.fuelType,
      engine: raw.engine.trim(),
      currentMileage: Number(raw.currentMileage),
    };

    try {
      const vehicleId = this.id();
      if (vehicleId) {
        await this.vehicleService.updateVehicle(vehicleId, value);
      } else {
        await this.vehicleService.addVehicle(value);
      }
      await this.router.navigateByUrl('/tabs/vehicles');
    } catch {
      this.errorMessage.set('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
