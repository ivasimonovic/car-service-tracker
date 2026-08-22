import { Injectable } from '@angular/core';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ServiceItemCatalogEntry } from '../models/service-item-catalog.model';
import { firestore } from './firebase';

const SERVICE_ITEM_TYPES_COLLECTION = 'serviceItemTypes';

@Injectable({ providedIn: 'root' })
export class ServiceItemCatalogService {
  private cache: ServiceItemCatalogEntry[] | null = null;

  /** Katalog uobičajenih stavki servisa (referentni podaci, ne menjaju se iz aplikacije). */
  async getCatalog(): Promise<ServiceItemCatalogEntry[]> {
    if (this.cache) return this.cache;

    const snapshot = await getDocs(
      query(collection(firestore, SERVICE_ITEM_TYPES_COLLECTION), orderBy('name')),
    );
    this.cache = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      name: docSnap.data()['name'],
      replacementIntervalKm: docSnap.data()['replacementIntervalKm'],
    }));
    return this.cache;
  }
}
