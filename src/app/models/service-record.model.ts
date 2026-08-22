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

/** Stavka jednog servisa (npr. zamena ulja) - koristi se od Sprinta 4 za kompletan servis sa više stavki. */
export interface ServiceItem {
  id: string;
  serviceRecordId: string;
  type: string;
  name: string;
  price: number;
  replacementIntervalKm: number;
  note: string;
}
