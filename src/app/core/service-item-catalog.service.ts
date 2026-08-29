import { Injectable, inject } from '@angular/core';
import { ServiceItemCatalogEntry } from '../models/service-item-catalog.model';
import { RtdbService } from './rtdb.service';

const SERVICE_ITEM_TYPES_PATH = 'serviceItemTypes';

@Injectable({ providedIn: 'root' })
export class ServiceItemCatalogService {
  private readonly rtdb = inject(RtdbService);
  private cache: ServiceItemCatalogEntry[] | null = null;

  async getCatalog(): Promise<ServiceItemCatalogEntry[]> {
    if (this.cache) return this.cache;

    const value =
      (await this.rtdb.get<Record<string, { name: string; replacementIntervalKm: number }>>(
        SERVICE_ITEM_TYPES_PATH,
      )) ?? {};
    this.cache = Object.entries(value)
      .map(([id, data]) => ({ id, name: data.name, replacementIntervalKm: data.replacementIntervalKm }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this.cache;
  }
}
