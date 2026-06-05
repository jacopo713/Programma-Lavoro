/** Aree di verifica checklist (11 sezioni) */
export type SectionId =
  | "building"
  | "external"
  | "platforms"
  | "trackAreas"
  | "publicServices"
  | "safety"
  | "furniture"
  | "lifts"
  | "water"
  | "electrical"
  | "access";

export interface InspectionSectionDef {
  id: SectionId;
  /** Numero capitolo nel report (es. "1", "4") */
  number: string;
  title: string;
  hint: string;
  /** Placeholder breve nel campo descrizione (UI) */
  descriptionPlaceholder: string;
  /** Elenco puntato guida nel PDF */
  descriptionExample: string;
}

export const INSPECTION_SECTIONS: readonly InspectionSectionDef[] = [
  {
    id: "building",
    number: "1",
    title: "Edificio principale",
    hint: "Segnala criticità sull'edificio: danni, infiltrazioni, elementi non conformi.",
    descriptionPlaceholder:
      "Es. Edificio: infiltrazione al primo piano lato nord; infissi usurati sul vano scala.",
    descriptionExample:
      "Esempio: infiltrazioni o crepe in facciata, serramenti non a tenuta, umidità di risalita, pavimenti danneggiati, segnaletica interna assente o illeggibile.",
  },
  {
    id: "external",
    number: "2",
    title: "Aree esterne",
    hint: "Segnala criticità su pertinenze, percorsi e spazi all'aperto.",
    descriptionPlaceholder:
      "Es. Marciapiede con mattonelle sollevate vicino ingresso est; illuminazione assente sul percorso laterale.",
    descriptionExample:
      "Esempio: pavimentazioni dissestate, recinzioni danneggiate, illuminazione esterna insufficiente, ristagni d'acqua, vegetazione che ostruisce i passaggi.",
  },
  {
    id: "platforms",
    number: "3",
    title: "Percorsi e piattaforme",
    hint: "Segnala criticità su marciapiedi, rampe, scale e zone di transito.",
    descriptionPlaceholder:
      "Es. Cordolo usurato in rampa principale; contrasto tattile mancante all'inizio scala.",
    descriptionExample:
      "Esempio: pavimentazioni rotte o scivolose, cordoli sporgenti, rampe troppo ripide, scale senza corrimano, illuminazione insufficiente.",
  },
  {
    id: "trackAreas",
    number: "4",
    title: "Aree tecniche e di transito",
    hint: "Segnala criticità in spazi di transito e aree di servizio.",
    descriptionPlaceholder:
      "Es. Materiale abbandonato in area transito; segnaletica di sicurezza mancante su varco tecnico.",
    descriptionExample:
      "Esempio: materiali abbandonati, barriere danneggiate, segnaletica assente, percorsi ostruiti, condizioni di scivolosità.",
  },
  {
    id: "publicServices",
    number: "5",
    title: "Servizi al pubblico",
    hint: "Segnala criticità su spazi e servizi per utenti e visitatori.",
    descriptionPlaceholder:
      "Es. Servizi igienici con perdita al lavabo; segnaletica informativa illeggibile in sala attesa.",
    descriptionExample:
      "Esempio: locali non accessibili, arredi danneggiati, impianti igienici fuori servizio, cartellonistica assente o obsoleta.",
  },
  {
    id: "safety",
    number: "6",
    title: "Sicurezza e antincendio",
    hint: "Segnala criticità su dispositivi e misure di sicurezza.",
    descriptionPlaceholder:
      "Es. Estintore con revisione scaduta; uscita di emergenza parzialmente ostruita.",
    descriptionExample:
      "Esempio: estintori assenti o non revisionati, idranti non accessibili, vie di fuga ostruite, cartellonistica antincendio mancante.",
  },
  {
    id: "furniture",
    number: "7",
    title: "Arredi e complementi",
    hint: "Segnala criticità su arredi, pensiline e complementi.",
    descriptionPlaceholder:
      "Es. Pensilina con lamiera deformata; panchina con struttura instabile in area attesa.",
    descriptionExample:
      "Esempio: strutture corrode o instabili, graffiti, vetri rotti, raccolta rifiuti inadeguata, elementi vandalizzati.",
  },
  {
    id: "lifts",
    number: "8",
    title: "Ascensori e montascale",
    hint: "Segnala criticità su impianti di sollevamento.",
    descriptionPlaceholder:
      "Es. Ascensore con pulsante allarme non funzionante; cabina con illuminazione guasta.",
    descriptionExample:
      "Esempio: revisione scaduta, porte che non chiudono correttamente, pulsantiera danneggiata, rumori anomali, scale mobili ferme.",
  },
  {
    id: "water",
    number: "9",
    title: "Impianti idrici",
    hint: "Segnala criticità su impianti idrici e sanitari.",
    descriptionPlaceholder:
      "Es. Perdita sotto lavabo piano terra; macchia di umidità su parete locale tecnico.",
    descriptionExample:
      "Esempio: perdite attive, rubinetteria danneggiata, scarichi intasati, tracce di allagamento, pompe non funzionanti.",
  },
  {
    id: "electrical",
    number: "10",
    title: "Impianti elettrici",
    hint: "Segnala criticità su impianti elettrici e illuminazione.",
    descriptionPlaceholder:
      "Es. Tratto di corridoio senza illuminazione; cavi a vista vicino quadro elettrico.",
    descriptionExample:
      "Esempio: illuminazione insufficiente o guasta, quadri aperti o non accessibili, prese danneggiate, cablaggi a vista non protetti.",
  },
  {
    id: "access",
    number: "11",
    title: "Controllo accessi",
    hint: "Segnala criticità su ingressi, varchi e sistemi di accesso.",
    descriptionPlaceholder:
      "Es. Tornello bloccato in apertura; porta automatica che non chiude completamente.",
    descriptionExample:
      "Esempio: serrature difettose, sensori non funzionanti, tornelli fuori servizio, videocitofono assente o guasto.",
  },
] as const;

export const SECTION_BY_ID: Record<SectionId, InspectionSectionDef> =
  Object.fromEntries(
    INSPECTION_SECTIONS.map((s) => [s.id, s]),
  ) as Record<SectionId, InspectionSectionDef>;

export const DEFAULT_SECTION_ID: SectionId = "building";

export const INSPECTION_SECTION_COUNT = INSPECTION_SECTIONS.length;

export function getSectionDef(id: SectionId): InspectionSectionDef {
  return SECTION_BY_ID[id];
}

export function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && value in SECTION_BY_ID;
}

export function normalizeSectionId(value: unknown): SectionId {
  return isSectionId(value) ? value : DEFAULT_SECTION_ID;
}

export function formatSectionHeading(section: InspectionSectionDef): string {
  return `${section.number}. ${section.title}`;
}
