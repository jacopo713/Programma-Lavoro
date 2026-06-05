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

Opzionale: `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` — email mostrata nell'informativa privacy per richieste GDPR.

Termini d'uso e informativa privacy: `/termini` e `/privacy`.

### Deploy regole Firestore

Dopo modifiche a `firebase.firestore.rules`:

```bash
npx firebase-tools deploy --only firestore:rules --project <project-id>
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
