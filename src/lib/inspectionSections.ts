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
  /** Testo guida nel PDF per compilare la descrizione dell'area */
  descriptionExample: string;
}

export const INSPECTION_SECTIONS: readonly InspectionSectionDef[] = [
  {
    id: "building",
    number: "1",
    title: "Edificio principale",
    hint: "Descrivi lo stato generale dell'edificio e le osservazioni trasversali.",
    descriptionExample:
      "Esempio: facciate e coperture, infissi e serramenti, pavimenti e pareti interne, infiltrazioni o crepe, segnaletica interna, accessibilità degli spazi.",
  },
  {
    id: "external",
    number: "2",
    title: "Aree esterne",
    hint: "Descrivi pertinenze, percorsi e spazi all'aperto.",
    descriptionExample:
      "Esempio: viabilità e parcheggi, recinzioni e cancelli, illuminazione esterna, drenaggio, stato del verde, pulizia e ordine delle aree.",
  },
  {
    id: "platforms",
    number: "3",
    title: "Percorsi e piattaforme",
    hint: "Descrivi marciapiedi, rampe, scale e zone di transito.",
    descriptionExample:
      "Esempio: pavimentazioni e cordoli, rampe e scale, contrasti tattili, illuminazione, pulizia, segnaletica orizzontale e verticale.",
  },
  {
    id: "trackAreas",
    number: "4",
    title: "Aree tecniche e di transito",
    hint: "Descrivi spazi di transito e aree non accessibili al pubblico.",
    descriptionExample:
      "Esempio: pulizia e ordine, accumulo materiali, barriere e recinzioni, segnaletica di sicurezza, condizioni dei percorsi di servizio.",
  },
  {
    id: "publicServices",
    number: "5",
    title: "Servizi al pubblico",
    hint: "Descrivi spazi e servizi rivolti a utenti e visitatori.",
    descriptionExample:
      "Esempio: biglietteria o reception, sale d'attesa, servizi igienici, informazioni, percorsi per tutti, ordine e manutenzione degli arredi.",
  },
  {
    id: "safety",
    number: "6",
    title: "Sicurezza e antincendio",
    hint: "Descrivi dispositivi e misure di sicurezza.",
    descriptionExample:
      "Esempio: estintori e idranti (presenza ed etichettatura), uscite di emergenza, cartellonistica, illuminazione di emergenza, percorsi di fuga liberi.",
  },
  {
    id: "furniture",
    number: "7",
    title: "Arredi e complementi",
    hint: "Descrivi arredi fissi e mobili, pensiline e complementi.",
    descriptionExample:
      "Esempio: panchine e pensiline, protezioni solari, stabilità delle strutture, graffiti o danneggiamenti, raccolta rifiuti nelle aree comuni.",
  },
  {
    id: "lifts",
    number: "8",
    title: "Ascensori e montascale",
    hint: "Descrivi impianti di sollevamento e accessibilità verticale.",
    descriptionExample:
      "Esempio: cabina e porte, pulsantiera e allarme, rumorosità in corsa, cartellini revisione, scale mobili se presenti.",
  },
  {
    id: "water",
    number: "9",
    title: "Impianti idrici",
    hint: "Descrivi impianti idrici e sanitari.",
    descriptionExample:
      "Esempio: perdite o gocciolamenti, rubinetteria e scarichi, antiallagamento, locale tecnico o pompe, segnalazioni di umidità.",
  },
  {
    id: "electrical",
    number: "10",
    title: "Impianti elettrici",
    hint: "Descrivi impianti elettrici e illuminazione.",
    descriptionExample:
      "Esempio: quadri elettrici chiusi e accessibili, illuminazione funzionante, cablaggi a vista, prese danneggiate, messa a terra e cartellini.",
  },
  {
    id: "access",
    number: "11",
    title: "Controllo accessi",
    hint: "Descrivi ingressi, varchi e sistemi di accesso.",
    descriptionExample:
      "Esempio: porte automatiche o tornelli, orari di funzionamento, intercom, videosorveglianza se prevista, stato delle serrature e dei sensori.",
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
