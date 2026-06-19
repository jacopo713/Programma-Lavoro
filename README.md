This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sync e account

L'app richiede l'accesso con Firebase Auth (email/password e Google). Checklist e registry stazioni sono salvati su Firestore (`users/{uid}/workspace/`) e sincronizzati tra dispositivi con strategia **ultima modifica vince** (`updatedAt`). Le foto restano su Firebase Storage.

Al primo login con dati solo in locale, i dati vengono migrati automaticamente al cloud se il workspace remoto è vuoto.

### Configurazione Firebase Console

1. **Authentication → Sign-in method**
   - Abilita **Email/Password**
   - Abilita **Google** (nome supporto e email progetto)
2. **Authentication → Settings → Authorized domains**
   - Aggiungi `localhost` per lo sviluppo locale
   - Aggiungi il dominio di produzione (es. `*.vercel.app` o dominio custom)
3. Se Google è in modalità test, aggiungi gli utenti tester nella **OAuth consent screen** del progetto Google Cloud collegato

Variabili ambiente richieste in `.env.local`: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, e le altre chiavi del progetto Firebase.

`NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` — email del titolare per richieste privacy/GDPR (in produzione è configurata in `apphosting.yaml`; in locale impostala anche in `.env.local`, es. `gymlionshop@gmail.com`).

Termini d'uso e informativa privacy: `/termini` e `/privacy`.

### Deploy su Firebase App Hosting

L'app è pubblicata su **Firebase App Hosting** (backend `programma-lavoro`, regione `europe-west4`).

URL produzione: `https://programma-lavoro--programma-lavoro-8c0cd.europe-west4.hosted.app`

#### Variabili d'ambiente (build time)

Le variabili `NEXT_PUBLIC_FIREBASE_*` devono essere disponibili durante `next build`. Configurale in:

- **Firebase Console** → App Hosting → backend → Settings → Environment, oppure
- [`apphosting.yaml`](apphosting.yaml) (i valori in Console hanno precedenza)

Dopo ogni modifica alle variabili, esegui un nuovo rollout/deploy del backend.

#### Domini autorizzati per Google Sign-In

Firebase Auth accetta login solo da domini in **Authentication → Settings → Authorized domains**.

Oltre a `localhost`, aggiungi sempre il dominio App Hosting (senza `https://`):

```
programma-lavoro--programma-lavoro-8c0cd.europe-west4.hosted.app
```

Se aggiungi un dominio custom, includilo anch'esso. Senza questo passaggio, Google Sign-In funziona in locale ma fallisce in produzione con `auth/unauthorized-domain`.

#### Checklist post-deploy

1. Verificare tutte le `NEXT_PUBLIC_FIREBASE_*` nel rollout (tab Rollouts → dettaglio rollout)
2. Verificare il dominio produzione negli Authorized domains
3. Testare "Continua con Google" sull'URL live
4. Se l'app OAuth è in modalità **Testing**, pubblicarla o aggiungere utenti tester in Google Cloud Console

### Deploy regole Firestore e Storage

Dopo modifiche a `firebase.firestore.rules` o `firebase.storage.rules`:

```bash
npx firebase-tools deploy --only firestore:rules,storage --project <project-id>
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
