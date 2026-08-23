import { Injectable } from '@angular/core';
import { get, ref } from 'firebase/database';
import { CarBrand } from '../models/car-brand.model';
import { database } from './firebase';

const VEHICLE_BRANDS_PATH = 'vehicleBrands';

@Injectable({ providedIn: 'root' })
export class CarBrandService {
  private cache: CarBrand[] | null = null;

  async getBrands(): Promise<CarBrand[]> {
    if (this.cache) return this.cache;

    const snapshot = await get(ref(database, VEHICLE_BRANDS_PATH));
    const value = (snapshot.val() ?? {}) as Record<string, { name: string }>;
    this.cache = Object.entries(value)
      .map(([id, data]) => ({ id, name: data.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this.cache;
  }
}
