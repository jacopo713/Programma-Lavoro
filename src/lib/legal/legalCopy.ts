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
    body: `${APP_NAME} è un applicativo web offerto dal gestore del sito (“Gestore”) per compilare checklist personalizzate e generare documenti PDF. Il servizio è di uso generico, accessibile tramite registrazione nei limiti dei posti disponibili, e non è rivolto a un settore, un’organizzazione o un gruppo di utenti in particolare.`,
  },
  {
    title: "2. Uso e responsabilità dell'utente",
    body: `L'uso del servizio è facoltativo. Chi accede (“Utente”) è l'unico responsabile dei contenuti che inserisce (testi, note, dati, immagini e fotografie) e del rispetto delle leggi applicabili, inclusi diritti di terzi, privacy e norme sul copyright. L'Utente si impegna a non caricare contenuti illeciti, a non inserire dati personali non necessari al servizio (inclusi dati sensibili o relativi a terzi senza un titolo legittimo) e a custodire le proprie credenziali di accesso. Il Gestore non effettua alcun controllo preventivo sui contenuti caricati.`,
  },
  {
    title: "3. Manleva",
    body: `Nei limiti consentiti dalla legge italiana, l'Utente si impegna a tenere indenne il Gestore da qualsiasi pretesa, danno, costo o onere (incluse spese legali ragionevoli) derivanti da contenuti inseriti o caricati dall'Utente, dall'uso del servizio in violazione dei presenti Termini o di leggi applicabili, o da violazioni di diritti di terzi.`,
  },
  {
    title: "4. Disponibilità e limitazioni",
    body: `Il servizio è fornito “così com'è”, senza garanzia di continuità, assenza di errori o idoneità a uno scopo particolare. Il Gestore può modificare, sospendere o interrompere il servizio in qualsiasi momento, anche senza preavviso, salvo obblighi di legge inderogabili.`,
  },
  {
    title: "5. Limitazione di responsabilità",
    body: `Nei limiti consentiti dalla legge italiana, il Gestore non risponde per danni indiretti, perdita di dati dovuta a cause non imputabili al Gestore, uso improprio del servizio, contenuti caricati dall'Utente o per scelte dell'Utente basate su PDF o informazioni visualizzate nell'app. Restano ferme le responsabilità che non possono essere escluse per legge.`,
  },
  {
    title: "6. Proprietà dei contenuti",
    body: `I contenuti caricati dall'Utente restano di sua competenza. Il Gestore non ne rivendica la proprietà, ma tratta i dati strettamente necessari all'erogazione del servizio come descritto nell'Informativa privacy.`,
  },
  {
    title: "7. Account e cessazione",
    body: `L'Utente può eliminare il proprio account dalla sezione Profilo. Il Gestore può sospendere o chiudere account in caso di uso manifestamente abusivo o illegale, e può cessare l'offerta del servizio in qualsiasi momento.`,
  },
  {
    title: "8. Legge applicabile e foro",
    body: `I presenti Termini sono regolati dalla legge italiana. Per le controversie con consumatori si applicano le regole inderogabili di competenza; negli altri casi, salvo diversa disposizione obbligatoria, è competente il foro del Gestore.`,
  },
  {
    title: "9. Modifiche",
    body: `Il Gestore può aggiornare i Termini. La versione in vigore è pubblicata su questa pagina. L'uso continuato del servizio dopo la pubblicazione delle modifiche implica accettazione, ove consentito dalla legge.`,
  },
] as const;

export const privacySections = [
  {
    title: "1. Titolare del trattamento",
    body: `Il titolare del trattamento dei dati personali è il gestore pro-tempore di questa applicazione web (di seguito “Applicazione”), contattabile per qualsiasi questione relativa alla privacy all'indirizzo email: ${getLegalContactEmail()}.`,
  },
  {
    title: "2. Tipologia di dati trattati",
    body: `L'Applicazione raccoglie e tratta esclusivamente i dati strettamente necessari all'erogazione del servizio: dati di autenticazione e account (indirizzo email, identificativo univoco dell'utente, raccolti tramite registrazione diretta o tramite il provider terzo Google OAuth); dati di profilo (nome, cognome, nomi delle sedi o aree di lavoro); contenuti dell'utente (testi, note, strutture delle checklist, date e metadati associati, fotografie caricate volontariamente per la generazione dei PDF); metadati tecnici di registrazione al servizio (es. data di adesione); copie locali sul dispositivo dell'utente (cache nel browser, es. localStorage) per il funzionamento e la sincronizzazione; dati tecnici e di navigazione (log di sistema, indirizzo IP e metadati di accesso secondo quanto previsto dall'infrastruttura di hosting).`,
  },
  {
    title: "3. Finalità del trattamento e base giuridica",
    body: `I dati sono trattati per: erogazione e gestione del servizio (creazione dell'account, sincronizzazione cloud delle checklist, salvataggio dei dati sul server e generazione dei file PDF) — base giuridica: esecuzione di un contratto o di misure precontrattuali di cui l'Utente è parte (art. 6, par. 1, lett. b, GDPR); sicurezza e integrità della piattaforma (monitoraggio tecnico, prevenzione di abusi e accessi non autorizzati) — base giuridica: legittimo interesse del Titolare alla protezione e stabilità della piattaforma (art. 6, par. 1, lett. f, GDPR).`,
  },
  {
    title: "4. Luogo del trattamento, hosting e trasferimento dati",
    body: `I dati dell'Applicazione sono ospitati e memorizzati tramite Google Firebase / Google Cloud Platform, che agisce in qualità di responsabile del trattamento ai sensi dell'art. 28 GDPR, secondo il relativo accordo sul trattamento dei dati (DPA) previsto da Google. L'applicazione è pubblicata su Firebase App Hosting (regione europe-west4, Unione Europea). I database e lo storage Firebase possono essere ubicati nell'Unione Europea e/o negli Stati Uniti, a seconda della configurazione del progetto. Qualora i dati venissero trasferiti al di fuori dello Spazio Economico Europeo (SEE), tale trasferimento è garantito dall'adesione di Google al Data Privacy Framework (DPF) UE-USA e/o dalla sottoscrizione delle Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea. Per la generazione dei PDF, le immagini possono transitare temporaneamente sul server dell'Applicazione (regione UE) prima di essere incluse nel documento.`,
  },
  {
    title: "5. Periodo di conservazione dei dati",
    body: `I dati dell'account, le checklist e i relativi contenuti rimangono memorizzati sui server Firebase finché l'account dell'Utente risulta attivo. In caso di utilizzo della funzione “Elimina account” presente nel Profilo, l'Applicazione avvia la cancellazione dell'account e dei dati ad esso associati (profilo, checklist, fotografie) dai database attivi, previa riautenticazione dell'Utente. Restano possibili tempi tecnici legati ai sistemi di backup del fornitore cloud e conservazioni imposte da obblighi di legge o per la tutela dei diritti del Titolare in sede giudiziaria. Le copie locali sul dispositivo vengono rimosse al termine dell'operazione di eliminazione account, nei limiti del browser utilizzato.`,
  },
  {
    title: "6. Destinatari dei dati e responsabilità sui contenuti",
    body: `I dati non saranno venduti, ceduti o comunicati a terzi per finalità commerciali. Potranno essere accessibili solo a: Google LLC / Google Cloud come fornitore dell'infrastruttura cloud; autorità competenti, in adempimento a specifici obblighi di legge. Responsabilità sui contenuti inseriti: l'Utente è l'unico responsabile dei contenuti, delle note e delle fotografie caricate nell'Applicazione. Il Titolare non effettua alcun controllo preventivo sui dati inseriti e declina ogni responsabilità per l'eventuale caricamento non autorizzato di dati sensibili, dati di terzi o materiale protetto da copyright da parte dell'Utente.`,
  },
  {
    title: "7. Diritti dell'interessato",
    body: `In conformità al GDPR, l'Utente ha il diritto di: accedere ai propri dati e riceverne copia; chiedere la rettifica o l'aggiornamento dei dati inesatti; ottenere la cancellazione (“diritto all'oblio”), esercitabile anche in autonomia tramite la funzione “Elimina account”; richiedere la limitazione del trattamento o opporsi al trattamento, ove applicabile; richiedere la portabilità dei dati, ove applicabile; revocare l'autorizzazione all'accesso tramite Google dalle impostazioni del proprio account Google; proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali (www.garanteprivacy.it). Per esercitare i propri diritti, l'Utente può inviare una comunicazione scritta a ${getLegalContactEmail()}.`,
  },
  {
    title: "8. Misure di sicurezza",
    body: `L'Applicazione adotta misure tecniche ragionevoli, tra cui: connessioni protette tramite HTTPS in produzione; autenticazione sicura (OAuth 2.0 / email e password); regole di sicurezza lato database e storage (Firebase Security Rules) per garantire che nessun utente possa leggere o modificare i dati di un altro account; crittografia dei dati in transito e a riposo secondo gli standard dell'infrastruttura Firebase. L'Utente è responsabile della riservatezza delle proprie credenziali di accesso.`,
  },
  {
    title: "9. Aggiornamenti dell'informativa",
    body: `Il Titolare si riserva il diritto di modificare la presente informativa. Qualora le modifiche siano sostanziali, verrà data comunicazione agli utenti all'interno dell'applicazione o tramite l'email registrata. La data indicata in pagina è quella dell'ultima revisione.`,
  },
] as const;

export const LEGAL_LAST_UPDATED = "2026-06-18";
