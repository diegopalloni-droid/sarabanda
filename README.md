# Guida all'Installazione e Messa Online con GitHub Pages

Questa guida ti mostrerà il percorso completo e più semplice per configurare il backend su Firebase e mettere online la tua applicazione usando il metodo standard di GitHub: **GitHub Pages**.

## Fase 1: Configurazione di Firebase (Obbligatorio)

Questo è il "cervello" della tua applicazione. Segui questi passaggi con attenzione.

### A. Crea il Progetto Firebase

1.  Vai alla [Console di Firebase](https://console.firebase.google.com/).
2.  Clicca su **"Aggiungi progetto"** e segui le istruzioni. Dagli un nome (es. `report-giornaliero-pro`). Puoi disabilitare Google Analytics.

### B. Abilita i Servizi Essenziali

1.  **Authentication (Login):**
    *   Nel menu del progetto, vai su **Authentication**.
    *   Clicca **"Inizia"**.
    *   Scegli **"Email/Password"**, **abilitalo** e salva.

2.  **Firestore (Database):**
    *   Nel menu, vai su **Firestore Database**.
    *   Clicca **"Crea database"**.
    *   Inizia in **modalità produzione**.
    *   Scegli una località (es. `europe-west`) e clicca **"Abilita"**.

### C. Collega l'App al Progetto Firebase

1.  Torna alle **Impostazioni progetto** (icona ingranaggio ⚙️ in alto a sinistra).
2.  Nella tab "Generali", scorri in basso e clicca sull'icona web `</>`.
3.  Registra l'app dandogli un nome (es. "Web App Report").
4.  Firebase ti mostrerà le credenziali di configurazione (`firebaseConfig`).
5.  **Copia questi valori e incollali** nell'oggetto `firebaseConfig` che si trova nel file `services/firebase.ts` del tuo progetto.

---

## Fase 2: Creazione degli Utenti Iniziali (Obbligatorio)

L'app ha bisogno che gli utenti `master` e `diego` esistano per poter funzionare.

### A. Crea gli Utenti in "Authentication"

1.  Vai alla sezione **Authentication** nella tua console Firebase.
2.  Clicca **"Aggiungi utente"** e crea i seguenti due utenti:
    *   **Utente 1**: Email `master@example.com`, Password `master`
    *   **Utente 2**: Email `diego@example.com`, Password `diego`
3.  **MOLTO IMPORTANTE**: Dopo averli creati, **copia il "UID utente"** per ciascuno. È una stringa di lettere e numeri che identifica univocamente l'utente. Salvali in un blocco note.

### B. Crea i Profili Utente in "Firestore"

1.  Vai alla sezione **Firestore Database**.
2.  Clicca **"+ Avvia raccolta"** e chiamala **`users`**.
3.  **Crea il documento per `master`**:
    *   **ID documento**: **Incolla l'UID** che hai copiato per l'utente `master`.
    *   Aggiungi questi campi:
        *   `displayName` (string) -> `master`
        *   `email` (string) -> `master@example.com`
        *   `status` (string) -> `active`
        *   `uid` (string) -> (incolla di nuovo l'UID di `master`)
    *   Salva.
4.  **Crea il documento per `diego`**:
    *   Clicca **"+ Aggiungi documento"**.
    *   **ID documento**: **Incolla l'UID** che hai copiato per l'utente `diego`.
    *   Aggiungi i campi con i suoi dati (`displayName`: `diego`, etc.).
    *   Salva.

---

## Fase 3: Messa Online con GitHub Pages

Ora che tutto è configurato, mettere online il sito è semplicissimo.

1.  **Carica il Codice su GitHub**: Assicurati che l'ultima versione del tuo codice, specialmente il file `services/firebase.ts` aggiornato, sia stata caricata sul tuo repository GitHub (`git push`).
2.  **Vai alle Impostazioni del Repository**: Sulla pagina del tuo repository su GitHub, clicca sulla tab **"Settings"**.
3.  **Vai alla Sezione "Pages"**: Nel menu a sinistra, clicca su **"Pages"**.
4.  **Configura la Sorgente**:
    *   Sotto "Build and deployment", alla voce "Branch", seleziona il tuo branch principale (di solito si chiama **`main`**).
    *   Lascia la cartella su **`/(root)`**.
5.  **Salva**: Clicca su **"Save"**.

**Fatto!** Attendi un minuto o due. Ricaricando la pagina, apparirà un riquadro verde con l'indirizzo del tuo sito web pubblico.

---

### Nota Importante sulla Gestione Utenti

Quando l'utente `master` "aggiunge" un nuovo utente dall'interfaccia, viene creato solo un profilo nel database Firestore. **Questo non crea un utente che può effettuare il login.** Per permettere a un nuovo utente di accedere, l'amministratore deve **crearlo manualmente anche nella sezione Authentication di Firebase**, come hai fatto nella Fase 2A.
