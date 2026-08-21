import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebaseConfig);
export const auth = getAuth(firebaseApp);

// IndexedDB perzistencija: upisi se trajno čuvaju lokalno dok ne stignu do
// servera, tako da spor/nestabilan mobilni internet ili zatvaranje taba pre
// sinhronizacije ne izbriše korisnikove podatke. Podrazumevani single-tab
// menadžer se koristi namerno (ne multi-tab) - multi-tab koordinacija
// zahteva Web Locks API koji radi samo na HTTPS/localhost, a app se testira
// i preko običnog HTTP-a na telefonu preko lokalne mreže.
export const firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
});
