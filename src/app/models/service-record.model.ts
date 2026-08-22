export interface ServiceRecord {
  id: string;
  vehicleId: string;
  userId: string;
  date: Date | null;
  mileage: number;
  serviceType: string;
  note: string;
  totalPrice: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ServiceRecordInput = Omit<ServiceRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/** Stavka jednog servisa (npr. zamena ulja), čuva se u podkolekciji serviceRecords/{id}/items. */
export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  replacementIntervalKm: number;
}

export type ServiceItemInput = Omit<ServiceItem, 'id'>;
