import { APP_NAME } from "@/lib/constants";

/** Email per richieste privacy (opzionale in .env.local). */
export function getLegalContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() ||
    "contatto indicato dal gestore del sito"
  );
}

/** Usato solo in contesti legali se necessario; non mostrato fuori da termini/privacy. */
export const LEGAL_SHORT_NOTICE =
  "App per creare checklist ed esportarle in PDF.";

export const LEGAL_AUTH_FOOTER =
  "Continuando accetti Termini e Privacy.";

export const termsSections = [
  {
    title: "1. Natura del servizio",
    body: `${APP_NAME} è un applicativo web offerto dal gestore del sito (“Gestore”) per compilare checklist personalizzate e generare documenti PDF. Il servizio è di uso generico e non è rivolto a un settore, un’organizzazione o un gruppo di utenti in particolare.`,
  },
  {
    title: "2. Uso e responsabilità dell'utente",
    body: `L'uso del servizio è facoltativo. Chi accede (“Utente”) è responsabile dei contenuti che inserisce (testi, dati, immagini) e del rispetto delle leggi applicabili. L'Utente si impegna a non caricare contenuti illeciti o non necessari e a custodire le proprie credenziali di accesso.`,
  },
  {
    title: "3. Disponibilità e limitazioni",
    body: `Il servizio è fornito “così com'è”, senza garanzia di continuità, assenza di errori o idoneità a uno scopo particolare. Il Gestore può modificare, sospendere o interrompere il servizio in qualsiasi momento, anche senza preavviso, salvo obblighi di legge inderogabili.`,
  },
  {
    title: "4. Limitazione di responsabilità",
    body: `Nei limiti consentiti dalla legge italiana, il Gestore non risponde per danni indiretti, perdita di dati dovuta a cause non imputabili al Gestore, uso improprio del servizio o per scelte dell'Utente basate su PDF o informazioni visualizzate nell'app. Restano ferme le responsabilità che non possono essere escluse per legge.`,
  },
  {
    title: "5. Proprietà dei contenuti",
    body: `I contenuti caricati dall'Utente restano di sua competenza. Il Gestore non ne rivendica la proprietà, ma tratta i dati strettamente necessari all'erogazione del servizio come descritto nell'Informativa privacy.`,
  },
  {
    title: "6. Account e cessazione",
    body: `L'Utente può eliminare il proprio account dalla sezione Profilo. Il Gestore può sospendere o chiudere account in caso di uso manifestamente abusivo o illegale.`,
  },
  {
    title: "7. Legge applicabile e foro",
    body: `I presenti Termini sono regolati dalla legge italiana. Per le controversie con consumatori si applicano le regole inderogabili di competenza; negli altri casi, salvo diversa disposizione obbligatoria, è competente il foro del Gestore.`,
  },
  {
    title: "8. Modifiche",
    body: `Il Gestore può aggiornare i Termini. La versione in vigore è pubblicata su questa pagina. L'uso continuato del servizio dopo la pubblicazione delle modifiche implica accettazione, ove consentito dalla legge.`,
  },
] as const;

export const privacySections = [
  {
    title: "1. Titolare del trattamento",
    body: `Il titolare del trattamento dei dati personali è il gestore di questo sito/applicativo. Contatto: ${getLegalContactEmail()}.`,
  },
  {
    title: "2. Dati trattati",
    body: `In base all'uso del servizio possono essere trattati: dati di account e autenticazione (email, identificativo; eventuale accesso tramite provider terzi come Google); dati di profilo opzionali (es. nome, cognome, etichette di sedi o aree); contenuti di checklist e note; fotografie caricate; dati tecnici essenziali (es. log di sicurezza) secondo quanto previsto dall'infrastruttura di hosting.`,
  },
  {
    title: "3. Finalità e base giuridica",
    body: `I dati sono trattati per registrare l'account, sincronizzare i contenuti, generare PDF e garantire sicurezza del servizio. Base giuridica: esecuzione del servizio richiesto dall'Utente (art. 6.1.b GDPR) e, se del caso, legittimo interesse del Gestore a proteggere la piattaforma (art. 6.1.f GDPR).`,
  },
  {
    title: "4. Hosting",
    body: `I dati sono ospitati su servizi cloud (es. Firebase / Google Cloud) utilizzati dal Gestore. Per dettagli su conservazione e sicurezza si rimanda alle informative dei rispettivi fornitori.`,
  },
  {
    title: "5. Conservazione",
    body: `I dati sono conservati per il tempo necessario al funzionamento del servizio e, ove occorra, per obblighi di legge. L'eliminazione dell'account avvia la cancellazione dei dati associati, nei limiti tecnicamente possibili.`,
  },
  {
    title: "6. Destinatari e trasferimenti",
    body: `I dati possono essere trattati da fornitori tecnici indispensabili al servizio. Eventuali trasferimenti extra-UE avvengono con gli strumenti previsti dal GDPR, ove applicabili.`,
  },
  {
    title: "7. Diritti dell'interessato",
    body: `L'Utente può esercitare i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, e proporre reclamo al Garante (www.garanteprivacy.it). Dal Profilo è disponibile la funzione “Elimina account”.`,
  },
  {
    title: "8. Sicurezza",
    body: `Sono adottate misure tecniche ragionevoli (autenticazione, accesso ai dati limitato per account, hosting su piattaforme diffuse). L'Utente è invitato a usare password sicure e non condividere l'accesso.`,
  },
  {
    title: "9. Modifiche",
    body: `Questa informativa può essere aggiornata. La data indicata in pagina è quella dell'ultima revisione.`,
  },
] as const;

export const LEGAL_LAST_UPDATED = "2026-06-05";
