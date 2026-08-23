import { Injectable } from '@angular/core';
import { get, ref } from 'firebase/database';
import { ServiceItemCatalogEntry } from '../models/service-item-catalog.model';
import { database } from './firebase';

const SERVICE_ITEM_TYPES_PATH = 'serviceItemTypes';

@Injectable({ providedIn: 'root' })
export class ServiceItemCatalogService {
  private cache: ServiceItemCatalogEntry[] | null = null;

  async getCatalog(): Promise<ServiceItemCatalogEntry[]> {
    if (this.cache) return this.cache;

    const snapshot = await get(ref(database, SERVICE_ITEM_TYPES_PATH));
    const value = (snapshot.val() ?? {}) as Record<string, { name: string; replacementIntervalKm: number }>;
    this.cache = Object.entries(value)
      .map(([id, data]) => ({ id, name: data.name, replacementIntervalKm: data.replacementIntervalKm }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this.cache;
  }
}
