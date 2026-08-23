import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
