# Guide: Firebase & Google Auth Setup för Viggen Utlägg

Följ dessa steg för att hämta alla nycklar du behöver till Vercel.

## 1. Firebase Setup
Denna del lagrar all data (utlägg, kommentarer, etc.).

1.  Gå till [Firebase Console](https://console.firebase.google.com/).
2.  Klicka på **Add project** och ge det ett namn (t.ex. `viggen-utlagg`).
3.  **Cloud Firestore**:
    - Klicka på **Firestore Database** i vänstermenyn.
    - Klicka på **Create database**.
    - Välj **Production mode** och en plats (t.ex. `eur3 (europe-west)`).
4.  **Hämta API-nycklarna**:
    - Klicka på kugghjulet (Project settings) -> **General**.
    - Gå ner till "Your apps" och klicka på webb-ikonen (`</>`).
    - Registrera appen (du behöver inte "Firebase Hosting").
    - Du ser nu ett `firebaseConfig`-objekt. Kopiera värdena till dessa variabler i Vercel:
        - `apiKey` -> `NEXT_PUBLIC_FIREBASE_API_KEY`
        - `authDomain` -> `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        - `projectId` -> `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        - `storageBucket` -> `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        - `messagingSenderId` -> `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        - `appId` -> `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 2. Google Authentication
Denna del sköter inloggningen.

1.  Gå till [Google Cloud Console](https://console.cloud.google.com/).
2.  Välj ditt Firebase-projekt i menyn högst upp (Firebase skapar ett Google Cloud-projekt automatiskt).
3.  Gå till **APIs & Services** -> **OAuth consent screen**.
    - Välj **External**.
    - Fyll i "App name" (`Viggen Utlägg`) och din e-post.
4.  Gå till **Credentials**:
    - Klicka på **Create Credentials** -> **OAuth client ID**.
    - Application type: **Web application**.
    - **Authorized redirect URIs**: Lägg till `https://baten.vercel.app/api/auth/callback/google` (ersätt med din faktiska domän senare).
5.  Kopiera **Client ID** och **Client Secret** till:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`

---

## 3. Slutför i Firebase Console
1.  Gå tillbaka till Firebase Console.
2.  Klicka på **Authentication** -> **Get started**.
3.  Välj **Google** som Sign-in provider.
4.  Aktivera den och spara.

---

### Tips för Vercel
Klistra in alla dessa i **Environment Variables** sektionen på Vercel-sidan du har uppe. Kom ihåg att lägga till `NEXTAUTH_SECRET` (hitta på något själv) och `NEXTAUTH_URL` (din vercel-länk).

Lycka till! ⛵️🔥
