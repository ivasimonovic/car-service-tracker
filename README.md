# Car Service Tracker 🚗🔧

Hibridna mobilna aplikacija za praćenje servisa i održavanja vozila. Umesto beležaka na papiru ili u glavi, sva istorija servisa, troškovi i podsetnici za sledeće održavanje su na jednom mestu, dostupni sa telefona.

## Šta aplikacija radi

- **Vaša vozila** — evidencija više vozila po korisniku (marka, model, godište, registracija, gorivo, motor, trenutna kilometraža).
- **Istorija servisa** — za svako vozilo, hronološki pregled odrađenih servisa sa datumom, kilometražom i cenom.
- **Kompletan servis u jednom potezu** — dodavanje servisa se radi biranjem stavki iz kataloga (zamena ulja, filteri, kočnice...), svaka sa svojom cenom; ukupna cena i kilometraža vozila se automatski ažuriraju.
- **Stanje održavanja** — za svaku servisiranu stavku, aplikacija sama izračunava koliko je kilometara ostalo do sledeće zamene i prikazuje status bojom: 🟢 u redu, 🟡 uskoro, 🔴 dospelo.
- **Statistika** — pregled ukupne potrošnje po vozilu i objedinjena lista svega što uskoro treba servisirati, na jednom mestu za sva vozila.
- **Nalozi i prijava** — svaki korisnik vidi i uređuje samo svoja vozila i servise.

## Tehnologije

- [Angular](https://angular.dev/) 22 (standalone komponente, signali)
- [Ionic](https://ionicframework.com/) 9
- [Firebase Authentication](https://firebase.google.com/docs/auth) — prijava/registracija
- [Firebase Realtime Database](https://firebase.google.com/docs/database) — čuvanje podataka, uživo osvežavanje

## Pokretanje lokalno

Potreban je instaliran [Node.js](https://nodejs.org/).

```bash
npm install
npm start
```

Aplikacija se pokreće na `http://localhost:8100`.

## Struktura projekta

```
src/app/
├── auth/              prijava, registracija, zaštita ruta
├── core/               Firebase konfiguracija, katalozi (marke vozila, tipovi servisa)
├── vehicles/           lista vozila, forma, dashboard pojedinačnog vozila
├── service-records/    evidencija servisa i izračunavanje stanja održavanja
├── stats/               statistika preko svih vozila
├── profile/             nalog i odjava
└── tabs/                donja navigacija
```
