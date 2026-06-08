import { BRAND_RGB } from "@/lib/brandColors";

/** Colori PDF allineati a `globals.css` */
export const PDF_THEME = {
  brand: BRAND_RGB,
  bg: [245, 243, 240] as const,
  card: [255, 255, 255] as const,
  border: [226, 222, 217] as const,
  borderLight: [237, 234, 230] as const,
  text: [26, 26, 26] as const,
  textSecondary: [107, 101, 96] as const,
  textMuted: [160, 154, 148] as const,
  summaryBg: [248, 247, 245] as const,
  topbarMm: 1.4,
  cardPadMm: 5.5,
  cardGapMm: 2.5,
  cardRadiusMm: 3.5,
  /** 0 = angoli foto squadrati (nessun effetto card) */
  photoRadiusMm: 0,
  bannerRadiusMm: 4,
} as const;

/** Dimensioni font (pt) ottimizzate per stampa e lettura su schermo */
export const PDF_TYPO = {
  reportTitle: 18,
  reportSubtitle: 11,
  meta: 10.5,
  sectionTitle: 14,
  sectionHint: 10.5,
  summaryHeading: 11.5,
  summaryBody: 10.5,
  summaryLabel: 9.5,
  summaryTable: 9,
  cardTitle: 12.5,
  fieldLabel: 10,
  body: 11,
  banner: 10,
  photoCaption: 8.5,
  footer: 8.5,
} as const;

/** Interlinea e blocchi (mm) */
export const PDF_LAYOUT = {
  lineTitle: 6.2,
  lineBody: 5.5,
  lineMeta: 6,
  gapSm: 3,
  gapMd: 4.5,
  gapLg: 6,
  /** Separazione verticale tra una sezione e la successiva */
  sectionGapMm: 9,
  bannerHeightMm: 7.5,
  bannerDotMm: 1.15,
  photoSideMm: 38,
  photoCaptionMm: 3.5,
  photoColGapMm: 6,
  photoBlockGapMm: 3,
  /** Voci foto in dettaglio sezione: colonne da sinistra a destra */
  photoEntryCols: 2,
  photoEntryColGapMm: 5,
  photoEntryRowGapMm: 3.5,
  photoEntryInnerGapMm: 2,
  /** Padding interno card voce foto (mm) */
  photoEntryCardPadMm: 3,
  /** Gap sopra/sotto la linea separatrice tra foto e titolo (mm) */
  photoEntrySepGapMm: 3,
  /** Spazio tra bordo inferiore foto e titolo (baseline jsPDF) */
  photoEntryTitleGapMm: 5,
  photoEntryTitleLineMm: 5.2,
  photoEntryTitleFontPt: 10.5,
  marginL: 14,
  marginR: 14,
  pageTop: 18,
  footerLineMm: 282,
  footerTextMm: 287,
  /** Buffer tra contenuto e linea footer */
  contentFooterGapMm: 8,
  /** Limite contenuto (sotto questa Y non si disegna corpo pagina) */
  pageBottom: 274,
  metaLabelColMm: 34,
  /** Righe max nell'elenco compatto «Sintesi area» prima del dettaglio */
  sectionSummaryMaxLines: 8,
  logoSizeMm: 16,
  logoGapAfterMm: 5,
} as const;

export const PHOTO_ROW_STRIDE_MM =
  PDF_LAYOUT.photoSideMm +
  PDF_LAYOUT.photoCaptionMm +
  PDF_LAYOUT.photoBlockGapMm;
