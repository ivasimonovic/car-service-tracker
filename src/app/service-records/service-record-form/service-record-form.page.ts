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
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ServiceRecordInput } from '../../models/service-record.model';
import { ServiceRecordService } from '../service-record.service';

@Component({
  selector: 'app-service-record-form',
  templateUrl: './service-record-form.page.html',
  styleUrls: ['./service-record-form.page.scss'],
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
    IonTextarea,
    IonText,
    IonButton,
    IonSpinner,
  ],
})
export class ServiceRecordFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly router = inject(Router);

  readonly vehicleId = input.required<string>();
  readonly serviceId = input<string>();
  readonly isEditMode = computed(() => !!this.serviceId());

  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    mileage: ['0', [Validators.required, Validators.pattern(/^\d+$/)]],
    serviceType: ['', [Validators.required, Validators.minLength(2)]],
    note: [''],
    totalPrice: ['0', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
  });

  async ngOnInit(): Promise<void> {
    const serviceId = this.serviceId();
    if (!serviceId) return;

    this.isLoading.set(true);
    try {
      const record = await this.serviceRecordService.getServiceRecord(serviceId);
      if (!record) {
        this.errorMessage.set('Servis nije pronađen.');
        return;
      }
      this.form.patchValue({
        date: (record.date ?? new Date()).toISOString().slice(0, 10),
        mileage: String(record.mileage),
        serviceType: record.serviceType,
        note: record.note,
        totalPrice: String(record.totalPrice),
      });
    } catch {
      this.errorMessage.set('Greška pri učitavanju servisa.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const value: ServiceRecordInput = {
      vehicleId: this.vehicleId(),
      date: new Date(raw.date),
      mileage: Number(raw.mileage),
      serviceType: raw.serviceType.trim(),
      note: raw.note.trim(),
      totalPrice: Number(raw.totalPrice),
    };

    try {
      const serviceId = this.serviceId();
      if (serviceId) {
        await this.serviceRecordService.updateServiceRecord(serviceId, value);
      } else {
        await this.serviceRecordService.addServiceRecord(value);
      }
      await this.router.navigateByUrl(`/vehicles/${this.vehicleId()}`);
    } catch {
      this.errorMessage.set('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
