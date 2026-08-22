import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { firestore } from '../core/firebase';
import { ServiceRecord, ServiceRecordInput } from '../models/service-record.model';

const SERVICE_RECORDS_COLLECTION = 'serviceRecords';

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

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly authService = inject(AuthService);

  /** Istorija servisa za jedno vozilo, uživo (real-time). */
  getServiceRecords$(vehicleId: string): Observable<ServiceRecord[]> {
    return new Observable<ServiceRecord[]>((subscriber) => {
      const recordsQuery = query(
        collection(firestore, SERVICE_RECORDS_COLLECTION),
        where('vehicleId', '==', vehicleId),
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

  async addServiceRecord(input: ServiceRecordInput): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const docRef = await addDoc(collection(firestore, SERVICE_RECORDS_COLLECTION), {
      ...input,
      date: Timestamp.fromDate(input.date ?? new Date()),
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
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
}
