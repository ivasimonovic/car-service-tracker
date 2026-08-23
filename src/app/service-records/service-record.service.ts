import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { firestore } from '../core/firebase';
import { ServiceItem, ServiceItemInput, ServiceRecord, ServiceRecordInput } from '../models/service-record.model';

const SERVICE_RECORDS_COLLECTION = 'serviceRecords';
const SERVICE_ITEMS_SUBCOLLECTION = 'items';
const VEHICLES_COLLECTION = 'vehicles';

function toServiceRecord(id: string, data: DocumentData): ServiceRecord {
  return {
    id,
    vehicleId: data['vehicleId'],
    userId: data['userId'],
    date: data['date']?.toDate() ?? null,
    mileage: data['mileage'],
    serviceType: data['serviceType'],
    note: data['note'] ?? '',
    totalPrice: data['totalPrice'],
    createdAt: data['createdAt']?.toDate() ?? null,
    updatedAt: data['updatedAt']?.toDate() ?? null,
  };
}

function toServiceItem(id: string, data: DocumentData): ServiceItem {
  return {
    id,
    name: data['name'],
    price: data['price'],
    replacementIntervalKm: data['replacementIntervalKm'],
  };
}

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly authService = inject(AuthService);

  /** Istorija servisa za jedno vozilo, uživo (real-time). */
  getServiceRecords$(vehicleId: string): Observable<ServiceRecord[]> {
    return new Observable<ServiceRecord[]>((subscriber) => {
      const userId = this.authService.currentUser?.uid;
      if (!userId) {
        subscriber.next([]);
        subscriber.complete();
        return;
      }

      // Pravilo za serviceRecords proverava resource.data.userId, pa upit MORA
      // eksplicitno da filtrira po userId - inače Firestore odbija celu listu sa
      // permission-denied jer ne može da garantuje, samo iz oblika upita, da će
      // vratiti isključivo dokumente trenutnog korisnika (bez obzira što bi u praksi
      // svi rezultati za dato vehicleId realno pripadali njemu).
      const recordsQuery = query(
        collection(firestore, SERVICE_RECORDS_COLLECTION),
        where('vehicleId', '==', vehicleId),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
      );

      return onSnapshot(
        recordsQuery,
        (snapshot) =>
          subscriber.next(snapshot.docs.map((docSnap) => toServiceRecord(docSnap.id, docSnap.data()))),
        (error) => subscriber.error(error),
      );
    });
  }

  async getServiceRecord(id: string): Promise<ServiceRecord | null> {
    const snapshot = await getDoc(doc(firestore, SERVICE_RECORDS_COLLECTION, id));
    return snapshot.exists() ? toServiceRecord(snapshot.id, snapshot.data()) : null;
  }

  async updateServiceRecord(id: string, input: ServiceRecordInput): Promise<void> {
    await updateDoc(doc(firestore, SERVICE_RECORDS_COLLECTION, id), {
      ...input,
      date: Timestamp.fromDate(input.date ?? new Date()),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteServiceRecord(id: string): Promise<void> {
    await deleteDoc(doc(firestore, SERVICE_RECORDS_COLLECTION, id));
  }

  async getServiceItems(recordId: string): Promise<ServiceItem[]> {
    const snapshot = await getDocs(
      collection(firestore, SERVICE_RECORDS_COLLECTION, recordId, SERVICE_ITEMS_SUBCOLLECTION),
    );
    return snapshot.docs.map((docSnap) => toServiceItem(docSnap.id, docSnap.data()));
  }

  /**
   * Složeni slučaj korišćenja: jednim korisničkim dejstvom, u jednoj Firestore transakciji,
   * kreira servis (serviceRecords), sve njegove stavke (podkolekcija items) i po potrebi
   * podiže trenutnu kilometražu vozila - sve ili ništa, atomski.
   */
  async addCompleteService(input: ServiceRecordInput, items: ServiceItemInput[]): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const recordRef = doc(collection(firestore, SERVICE_RECORDS_COLLECTION));
    const vehicleRef = doc(firestore, VEHICLES_COLLECTION, input.vehicleId);

    await runTransaction(firestore, async (transaction) => {
      const vehicleSnap = await transaction.get(vehicleRef);
      const currentMileage: number = vehicleSnap.data()?.['currentMileage'] ?? 0;

      transaction.set(recordRef, {
        ...input,
        totalPrice,
        date: Timestamp.fromDate(input.date ?? new Date()),
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const item of items) {
        const itemRef = doc(collection(recordRef, SERVICE_ITEMS_SUBCOLLECTION));
        transaction.set(itemRef, { ...item, userId });
      }

      if (input.mileage > currentMileage) {
        transaction.update(vehicleRef, { currentMileage: input.mileage, updatedAt: serverTimestamp() });
      }
    });

    return recordRef.id;
  }
}
