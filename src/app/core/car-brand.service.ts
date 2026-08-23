import { Injectable } from '@angular/core';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { CarBrand } from '../models/car-brand.model';
import { firestore } from './firebase';

const VEHICLE_BRANDS_COLLECTION = 'vehicleBrands';

@Injectable({ providedIn: 'root' })
export class CarBrandService {
  private cache: CarBrand[] | null = null;

  async getBrands(): Promise<CarBrand[]> {
    if (this.cache) return this.cache;

    const snapshot = await getDocs(query(collection(firestore, VEHICLE_BRANDS_COLLECTION), orderBy('name')));
    this.cache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, name: docSnap.data()['name'] }));
    return this.cache;
  }
}
