import { Injectable, inject } from '@angular/core';
import { CarBrand } from '../models/car-brand.model';
import { RtdbService } from './rtdb.service';

const VEHICLE_BRANDS_PATH = 'vehicleBrands';

@Injectable({ providedIn: 'root' })
export class CarBrandService {
  private readonly rtdb = inject(RtdbService);
  private cache: CarBrand[] | null = null;

  async getBrands(): Promise<CarBrand[]> {
    if (this.cache) return this.cache;

    const value = (await this.rtdb.get<Record<string, { name: string }>>(VEHICLE_BRANDS_PATH)) ?? {};
    this.cache = Object.entries(value)
      .map(([id, data]) => ({ id, name: data.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this.cache;
  }
}
