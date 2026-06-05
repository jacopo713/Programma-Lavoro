import { jsPDF } from "jspdf";
import { isDataUrlPhoto } from "@/lib/criticismDisplay";
import { OPERATOR_NAME } from "@/lib/constants";
import {
  INSPECTION_SECTIONS,
  type InspectionSectionDef,
} from "@/lib/inspectionSections";
import {
  countSectionPhotos,
  getSectionDescription,
  type SectionDescriptions,
} from "@/lib/sectionDescriptions";
import {
  getSeverityBannerLabel,
  getSeverityLabel,
  getSeverityReportBannerLabel,
  normalizeSeverity,
  SEVERITY_OPTIONS,
  SEVERITY_BANNER_BORDER_RGB,
  SEVERITY_BANNER_DOT_RGB,
  SEVERITY_BANNER_FILL_RGB,
  SEVERITY_BANNER_TEXT_RGB,
} from "@/lib/severity";
import { formatCriticismNumber, pad } from "@/lib/format";
import {
  getSanatecLogoDataUrl,
  SANATEC_LOGO_ASPECT,
} from "@/lib/pdf/pdfLogo";
import {
  PDF_LAYOUT,
  PDF_THEME,
  PDF_TYPO,
  PHOTO_ROW_STRIDE_MM,
} from "@/lib/pdf/pdfTheme";
import {
  writeWithCriticityRed,
  writeWithCriticityRedLight,
  writeWithCriticityRedMuted,
} from "@/lib/pdf/pdfText";
import type { Criticism, SeverityLevel } from "@/lib/types";

export interface ExportPdfOptions {
  items: Criticism[];
  stationName: string;
  sectionDescriptions: SectionDescriptions;
  inspectedSectionCount: number;
  inspectionSectionTotal: number;
  totalPhotoCount: number;
}

interface NumberedCriticism {
  item: Criticism;
  numStr: string;
}

function buildNumberedItems(items: Criticism[]): NumberedCriticism[] {
  const numbered: NumberedCriticism[] = [];
  for (const section of INSPECTION_SECTIONS) {
    const sectionItems = items.filter((i) => i.sectionId === section.id);
    sectionItems.forEach((item, idx) => {
      numbered.push({
        item,
        numStr: formatCriticismNumber(section.number, idx + 1),
      });
    });
  }
  return numbered;
}

function getSectionItems(items: Criticism[], sectionId: string): Criticism[] {
  return items.filter((i) => i.sectionId === sectionId);
}

const L = PDF_LAYOUT;
const T = PDF_TYPO;
const PAGE_BOTTOM = L.pageBottom;
const PAGE_TOP = L.pageTop;
const PHOTO_SIDE_MM = L.photoSideMm;
const PHOTO_COL_GAP_MM = L.photoColGapMm;
const PHOTO_ROW_STRIDE = PHOTO_ROW_STRIDE_MM;
const CARD_PAD = PDF_THEME.cardPadMm;
const CARD_GAP = PDF_THEME.cardGapMm;
const CARD_R = PDF_THEME.cardRadiusMm;
const BANNER_H = L.bannerHeightMm;
const SUMMARY_PAD_MM = 5;

export async function buildPdfBlob({
  items,
  stationName,
  sectionDescriptions,
  inspectedSectionCount,
  inspectionSectionTotal,
  totalPhotoCount,
}: ExportPdfOptions): Promise<Blob> {
  const logoDataUrl = await getSanatecLogoDataUrl();
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const mL = L.marginL;
  const mR = L.marginR;
  const uW = pageW - mL - mR;
  let y = 0;

  function need(h: number) {
    if (y + h > PAGE_BOTTOM) {
      doc.addPage();
      y = PAGE_TOP;
    }
  }

  doc.setFillColor(...PDF_THEME.brand);
  doc.rect(0, 0, pageW, PDF_THEME.topbarMm, "F");
  y = drawPdfHeader(doc, logoDataUrl, mL, mR, pageW, uW);

  doc.setDrawColor(...PDF_THEME.borderLight);
  doc.setLineWidth(0.25);
  doc.line(mL, y, pageW - mR, y);
  y += L.gapMd;

  const now = new Date();
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  doc.setFontSize(T.meta);
  const metaRows: [string, string][] = [
    ["Stazione", stationName],
    ["Operatore", OPERATOR_NAME],
    ["Data rilevazione", `${dateStr} — ${timeStr}`],
  ];

  for (const [label, value] of metaRows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_THEME.textSecondary);
    doc.text(label, mL, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.text);
    doc.text(value, mL + L.metaLabelColMm, y);
    y += L.lineMeta;
  }
  y += L.gapMd;

  y = drawLegacyKpi(
    doc,
    inspectedSectionCount,
    inspectionSectionTotal,
    items.length,
    totalPhotoCount,
    mL,
    uW,
    pageW,
    mR,
    y,
    need,
  );

  const numberedItems = buildNumberedItems(items);
  y = drawExecutiveSummary(
    doc,
    numberedItems,
    mL,
    mR,
    uW,
    pageW,
    y,
    need,
  );

  y = drawInspectionDetail(
    doc,
    items,
    sectionDescriptions,
    mL,
    mR,
    uW,
    pageW,
    y,
    need,
  );

  stampFooters(doc, pageW, mL, mR);
  return doc.output("blob");
}

function drawPdfHeader(
  doc: jsPDF,
  logoDataUrl: string,
  mL: number,
  mR: number,
  pageW: number,
  uW: number,
): number {
  const y0 = L.pageTop;
  const logoW = L.logoWidthMm;
  const logoH = logoW * SANATEC_LOGO_ASPECT;
  const textX = mL + logoW + 5;
  const textMaxW = pageW - mR - textX;

  try {
    doc.addImage(logoDataUrl, "PNG", mL, y0, logoW, logoH);
  } catch (err) {
    console.warn("Logo PDF non caricato:", err);
  }

  const titleY = y0 + logoH * 0.42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.reportTitle);
  doc.setTextColor(...PDF_THEME.text);
  const titleLines = doc.splitTextToSize(
    "Report manutenzione — Checklist",
    textMaxW,
  ) as string[];
  doc.text(titleLines[0] ?? "", textX, titleY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(T.reportSubtitle);
  doc.setTextColor(...PDF_THEME.textMuted);
  doc.text("Checklist ispezione stazione", textX, titleY + 6);

  return y0 + logoH + L.logoGapAfterMm;
}

interface SummaryStats {
  total: number;
  photos: number;
  bySeverity: Record<SeverityLevel, number>;
}

function computeSummaryStats(items: Criticism[]): SummaryStats {
  const bySeverity: Record<SeverityLevel, number> = { 1: 0, 2: 0, 3: 0 };
  let photos = 0;
  for (const item of items) {
    bySeverity[normalizeSeverity(item.severity)] += 1;
    photos += item.photos.length;
  }
  return { total: items.length, photos, bySeverity };
}

/** Altezza blocco pillole con eventuale a capo */
function measurePillBlockHeight(
  doc: jsPDF,
  bySeverity: Record<SeverityLevel, number>,
  startX: number,
  maxX: number,
  onlyNonZero: boolean,
): number {
  let pillX = startX;
  let rowCount = 0;
  SEVERITY_OPTIONS.forEach((opt) => {
    const count = bySeverity[opt.level];
    if (onlyNonZero && count === 0) return;
    const label = `${getSeverityBannerLabel(opt.level)} (${count})`;
    const pillW = measureBannerWidth(doc, label);
    if (rowCount === 0 || pillX + pillW > maxX) {
      if (rowCount > 0) pillX = startX;
      rowCount += 1;
    }
    pillX += pillW + 3;
  });
  if (rowCount === 0) return 0;
  return rowCount * BANNER_H + (rowCount - 1) * 3;
}

function computeGlobalSummaryBoxHeight(
  doc: jsPDF,
  stats: SummaryStats,
  mL: number,
  uW: number,
): number {
  const innerPad = SUMMARY_PAD_MM;
  const pillMaxX = mL + uW - innerPad;
  let h = innerPad + L.gapLg + L.gapLg + L.gapMd;
  h +=
    measurePillBlockHeight(doc, stats.bySeverity, mL + innerPad, pillMaxX, false) +
    4;
  if (stats.total > 0) {
    h += 4 + L.lineBody;
  } else {
    h += 8;
  }
  return h + innerPad;
}

function drawLegacyKpi(
  doc: jsPDF,
  inspected: number,
  totalSections: number,
  problemCount: number,
  photoCount: number,
  mL: number,
  uW: number,
  pageW: number,
  mR: number,
  startY: number,
  need: (h: number) => void,
): number {
  need(22);
  let y = startY + L.gapSm;
  const colW = uW / 3;
  const kpiRows: [string, string][] = [
    ["Aree ispezionate", `${inspected} / ${totalSections}`],
    ["Problemi rilevati", String(problemCount)],
    ["Foto allegate", String(photoCount)],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.summaryLabel);
  doc.setTextColor(...PDF_THEME.textSecondary);

  kpiRows.forEach(([label, value], i) => {
    const x = mL + i * colW;
    doc.text(label.toUpperCase(), x, y);
    doc.setFontSize(T.summaryHeading);
    doc.setTextColor(...PDF_THEME.brand);
    doc.text(value, x, y + 5);
    doc.setFontSize(T.summaryLabel);
    doc.setTextColor(...PDF_THEME.textSecondary);
  });

  y += 12;
  doc.setDrawColor(...PDF_THEME.borderLight);
  doc.setLineWidth(0.25);
  doc.line(mL, y, pageW - mR, y);
  return y + L.gapMd;
}

function drawInspectionDetail(
  doc: jsPDF,
  items: Criticism[],
  sectionDescriptions: SectionDescriptions,
  mL: number,
  mR: number,
  uW: number,
  pageW: number,
  startY: number,
  need: (h: number) => void,
): number {
  let y = startY;
  need(10);
  y += L.gapSm;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.sectionTitle);
  doc.setTextColor(...PDF_THEME.brand);
  doc.text("DETTAGLIO ISPEZIONI ED EVIDENZE", mL, y);
  y += L.gapMd;

  const sectionsWithItems = INSPECTION_SECTIONS.filter((s) => {
    const hasItems = getSectionItems(items, s.id).length > 0;
    const hasNarrative =
      getSectionDescription(sectionDescriptions, s.id).length > 0;
    return hasItems || hasNarrative;
  });

  if (sectionsWithItems.length === 0) {
    need(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(T.body);
    writeWithCriticityRedLight(
      doc,
      "Nessuna criticità segnalata.",
      mL,
      y,
    );
    return y + L.gapMd;
  }

  for (const section of sectionsWithItems) {
    y = drawSectionChapter(
      doc,
      section,
      items,
      sectionDescriptions,
      mL,
      mR,
      uW,
      pageW,
      y,
      need,
    );
  }

  return y;
}

function measureSectionNarrativeHeight(
  doc: jsPDF,
  text: string,
  widthMm: number,
): number {
  if (!text) return 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(T.body);
  const lines = doc.splitTextToSize(text, widthMm) as string[];
  return L.gapSm + lines.length * L.lineBody + L.gapSm;
}

function drawSectionNarrative(
  doc: jsPDF,
  text: string,
  mL: number,
  uW: number,
  startY: number,
): number {
  if (!text) return startY;
  let y = startY + L.gapSm;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(T.body);
  doc.setTextColor(...PDF_THEME.text);
  const lines = doc.splitTextToSize(text, uW) as string[];
  for (const line of lines) {
    doc.text(line, mL, y);
    y += L.lineBody;
  }
  return y + L.gapSm;
}

function drawSectionChapter(
  doc: jsPDF,
  section: InspectionSectionDef,
  allItems: Criticism[],
  sectionDescriptions: SectionDescriptions,
  mL: number,
  mR: number,
  uW: number,
  pageW: number,
  startY: number,
  need: (h: number) => void,
): number {
  const sectionItems = getSectionItems(allItems, section.id);
  const narrative = getSectionDescription(sectionDescriptions, section.id);
  if (sectionItems.length === 0 && !narrative) return startY;

  let y = startY;
  need(L.gapMd + 6);
  y += L.gapMd;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.sectionTitle);
  doc.setTextColor(...PDF_THEME.brand);
  doc.text(`${section.number}.`, mL, y);
  const numW = doc.getTextWidth(`${section.number}. `);
  doc.setTextColor(...PDF_THEME.text);
  const titleUpper = section.title.toUpperCase();
  doc.text(titleUpper, mL + numW, y);

  const photoCount = countSectionPhotos(sectionItems);
  if (photoCount > 0) {
    const allegatiLabel = `${photoCount} ALLEGATI`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.summaryLabel);
    doc.setTextColor(...PDF_THEME.textSecondary);
    doc.text(allegatiLabel, pageW - mR - doc.getTextWidth(allegatiLabel), y);
  }
  y += L.gapMd;

  if (narrative) {
    need(measureSectionNarrativeHeight(doc, narrative, uW));
    y = drawSectionNarrative(doc, narrative, mL, uW, y);
  } else if (sectionItems.length > 0) {
    y += L.gapSm;
  }

  if (sectionItems.length === 0) {
    return y;
  }
  y = renderCriticismItems(
    doc,
    sectionItems,
    section.number,
    mL,
    uW,
    y,
  );
  return y;
}

function drawSeverityPills(
  doc: jsPDF,
  bySeverity: Record<SeverityLevel, number>,
  startX: number,
  maxX: number,
  startY: number,
  onlyNonZero: boolean,
): number {
  let pillX = startX;
  let pillRowY = startY;
  SEVERITY_OPTIONS.forEach((opt) => {
    const count = bySeverity[opt.level];
    if (onlyNonZero && count === 0) return;
    const label = `${getSeverityBannerLabel(opt.level)} (${count})`;
    const pillW = measureBannerWidth(doc, label);
    if (pillX + pillW > maxX && pillX > startX) {
      pillX = startX;
      pillRowY += BANNER_H + 3;
    }
    drawSeverityBannerPdf(doc, opt.level, pillX, pillRowY, label);
    pillX += pillW + 3;
  });
  return pillRowY + BANNER_H;
}

function drawExecutiveSummary(
  doc: jsPDF,
  numberedItems: NumberedCriticism[],
  mL: number,
  _mR: number,
  uW: number,
  _pageW: number,
  startY: number,
  need: (h: number) => void,
): number {
  const items = numberedItems.map((n) => n.item);
  const stats = computeSummaryStats(items);
  const hasItems = items.length > 0;
  const innerPad = SUMMARY_PAD_MM;
  const boxH = computeGlobalSummaryBoxHeight(doc, stats, mL, uW);
  const pillStartX = mL + innerPad;
  const pillMaxX = mL + uW - innerPad;

  need(boxH + 4);

  const y = startY;
  doc.setFillColor(...PDF_THEME.summaryBg);
  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(mL, y, uW, boxH, 1.5, 1.5, "FD");

  let innerY = y + innerPad;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.summaryHeading);
  doc.setTextColor(...PDF_THEME.brand);
  doc.text("RIEPILOGO", pillStartX, innerY);
  innerY += L.gapLg;

  doc.setFontSize(T.summaryBody);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_THEME.text);
  writeWithCriticityRed(
    doc,
    `${stats.total} criticità segnalate  ·  ${stats.photos} foto allegate`,
    pillStartX,
    innerY,
  );
  innerY += L.gapLg;

  doc.setFontSize(T.summaryLabel);
  doc.setTextColor(...PDF_THEME.textSecondary);
  doc.text("Distribuzione per livello di gravità", pillStartX, innerY);
  innerY += L.gapMd;

  innerY = drawSeverityPills(
    doc,
    stats.bySeverity,
    pillStartX,
    pillMaxX,
    innerY,
    false,
  );
  innerY += 4;

  if (hasItems) {
    doc.setFontSize(T.summaryLabel);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text(
      "Dettaglio e sintesi per area nella sezione seguente.",
      pillStartX,
      innerY,
    );
  } else {
    doc.setFontSize(T.summaryTable);
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text("Nessuna voce da elencare.", pillStartX, innerY + 2);
  }

  return y + boxH + 6;
}

function countPhotoRows(
  photoCount: number,
  startX: number,
  maxX: number,
): number {
  if (photoCount === 0) return 0;
  const slotW = PHOTO_SIDE_MM + PHOTO_COL_GAP_MM;
  const perRow = Math.max(
    1,
    Math.floor((maxX - startX + PHOTO_COL_GAP_MM) / slotW),
  );
  return Math.ceil(photoCount / perRow);
}

function measurePhotosBlockHeight(
  photoCount: number,
  startX: number,
  maxX: number,
): number {
  const rows = countPhotoRows(photoCount, startX, maxX);
  if (rows === 0) return 0;
  return rows * PHOTO_ROW_STRIDE;
}

function measureBannerWidth(doc: jsPDF, label: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.banner);
  return 3 + L.bannerDotMm * 2 + 2 + doc.getTextWidth(label) + 4;
}

/** Spazio per riga etichetta campo (es. «Descrizione:») */
function measureFieldLabelBlock(): number {
  return L.gapMd + L.lineBody + L.gapMd;
}

/** Tolleranza paginazione: evita salto pagina se mancano pochi mm */
const PAGE_BREAK_TOLERANCE_MM = 6;

const PHOTO_ENTRY_COLS = L.photoEntryCols;
const PHOTO_ENTRY_COL_GAP = L.photoEntryColGapMm;
const PHOTO_ENTRY_ROW_GAP = L.photoEntryRowGapMm;
const PHOTO_ENTRY_INNER_GAP = L.photoEntryInnerGapMm;

function photoEntryCellWidth(contentWidthMm: number): number {
  return (
    (contentWidthMm - (PHOTO_ENTRY_COLS - 1) * PHOTO_ENTRY_COL_GAP) /
    PHOTO_ENTRY_COLS
  );
}

function measurePhotoEntryCellHeight(
  doc: jsPDF,
  item: Criticism,
  cellW: number,
): number {
  const photoSize = cellW;
  let h = photoSize + L.photoEntryTitleGapMm;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.photoEntryTitleFontPt);
  const titleLines = doc.splitTextToSize(item.title, cellW) as string[];
  h +=
    titleLines.length * L.photoEntryTitleLineMm +
    PHOTO_ENTRY_INNER_GAP +
    BANNER_H;

  return h;
}

function drawPhotoEntryCell(
  doc: jsPDF,
  item: Criticism,
  x: number,
  y: number,
  cellW: number,
): number {
  const severity = normalizeSeverity(item.severity);
  const photoData = item.photos[0];
  const photoSize = cellW;
  let cy = y;

  if (photoData) {
    drawPhotoCell(doc, photoData, x, cy, 0, photoSize, false);
  } else {
    doc.setDrawColor(...PDF_THEME.border);
    doc.setFillColor(...PDF_THEME.summaryBg);
    doc.roundedRect(
      x,
      cy,
      photoSize,
      photoSize,
      PDF_THEME.photoRadiusMm,
      PDF_THEME.photoRadiusMm,
      "FD",
    );
    doc.setFontSize(T.photoCaption);
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text("N/D", x + photoSize / 2 - 3, cy + photoSize / 2);
  }
  cy += photoSize + L.photoEntryTitleGapMm;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.photoEntryTitleFontPt);
  doc.setTextColor(...PDF_THEME.text);
  const titleLines = doc.splitTextToSize(item.title, cellW) as string[];
  for (const line of titleLines) {
    doc.text(line, x, cy);
    cy += L.photoEntryTitleLineMm;
  }
  cy += PHOTO_ENTRY_INNER_GAP;

  cy = drawSeverityBannerPdf(
    doc,
    severity,
    x,
    cy,
    getSeverityReportBannerLabel(severity),
  );

  return cy;
}

/** Griglia foto: sinistra → destra, più voci per riga */
function renderCriticismItems(
  doc: jsPDF,
  items: Criticism[],
  _sectionNumber: string,
  mL: number,
  uW: number,
  startY: number,
): number {
  if (items.length === 0) return startY;

  const cellW = photoEntryCellWidth(uW);
  let y = startY;

  for (let i = 0; i < items.length; i += PHOTO_ENTRY_COLS) {
    const rowItems = items.slice(i, i + PHOTO_ENTRY_COLS);
    let rowH = 0;
    for (const item of rowItems) {
      rowH = Math.max(rowH, measurePhotoEntryCellHeight(doc, item, cellW));
    }

    const rowGap = i === 0 ? 0 : PHOTO_ENTRY_ROW_GAP;
    const needed = rowH + rowGap;
    const remaining = PAGE_BOTTOM - y;
    if (needed > remaining + PAGE_BREAK_TOLERANCE_MM) {
      doc.addPage();
      y = PAGE_TOP;
    }

    rowItems.forEach((item, colIdx) => {
      const x = mL + colIdx * (cellW + PHOTO_ENTRY_COL_GAP);
      drawPhotoEntryCell(doc, item, x, y, cellW);
    });

    y += rowH + rowGap;
  }

  return y;
}

type BannerPdfColors = {
  fill: readonly [number, number, number];
  border: readonly [number, number, number];
  dot: readonly [number, number, number];
  text: readonly [number, number, number];
};

function drawColoredBannerPdf(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  colors: BannerPdfColors,
): number {
  const dotR = L.bannerDotMm;
  const padL = 3;
  const padR = 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.banner);
  const textW = doc.getTextWidth(label);
  const bannerW = padL + dotR * 2 + 2 + textW + padR;

  doc.setFillColor(...colors.fill);
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    x,
    y,
    bannerW,
    BANNER_H,
    PDF_THEME.bannerRadiusMm,
    PDF_THEME.bannerRadiusMm,
    "FD",
  );

  doc.setFillColor(...colors.dot);
  doc.circle(x + padL + dotR, y + BANNER_H / 2, dotR, "F");

  doc.setTextColor(...colors.text);
  doc.text(label, x + padL + dotR * 2 + 2, y + BANNER_H / 2 + 1.1);

  return y + BANNER_H;
}

function drawSeverityBannerPdf(
  doc: jsPDF,
  severity: SeverityLevel,
  x: number,
  y: number,
  labelOverride?: string,
): number {
  const label = labelOverride ?? getSeverityBannerLabel(severity);
  return drawColoredBannerPdf(doc, label, x, y, {
    fill: SEVERITY_BANNER_FILL_RGB[severity],
    border: SEVERITY_BANNER_BORDER_RGB[severity],
    dot: SEVERITY_BANNER_DOT_RGB[severity],
    text: SEVERITY_BANNER_TEXT_RGB[severity],
  });
}

/** Foto sotto il testo, disposte a riga con a capo */
function drawPhotosRowBelow(
  doc: jsPDF,
  photos: string[],
  startX: number,
  startY: number,
  maxX: number,
): number {
  let photoX = startX;
  let photoY = startY;
  let rowStartY = startY;
  let maxBottom = startY;

  photos.forEach((photoData, pIdx) => {
    if (photoX + PHOTO_SIDE_MM > maxX && photoX > startX) {
      photoX = startX;
      photoY = rowStartY + PHOTO_ROW_STRIDE;
      rowStartY = photoY;
    }

    drawPhotoCell(doc, photoData, photoX, photoY, pIdx, PHOTO_SIDE_MM);
    maxBottom = Math.max(maxBottom, photoY + PHOTO_ROW_STRIDE);
    photoX += PHOTO_SIDE_MM + PHOTO_COL_GAP_MM;
  });

  return maxBottom;
}

function dataUrlImageFormat(dataUrl: string): "JPEG" | "PNG" | "WEBP" {
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "JPEG";
}

function drawPhotoPlaceholder(
  doc: jsPDF,
  px: number,
  py: number,
  s: number,
) {
  doc.setDrawColor(...PDF_THEME.border);
  doc.setFillColor(...PDF_THEME.summaryBg);
  doc.roundedRect(
    px,
    py,
    s,
    s,
    PDF_THEME.photoRadiusMm,
    PDF_THEME.photoRadiusMm,
    "FD",
  );
  doc.setFontSize(T.photoCaption);
  doc.setTextColor(...PDF_THEME.textMuted);
  doc.text("Immagine non disponibile", px + 4, py + s / 2);
}

function drawPhotoCell(
  doc: jsPDF,
  photoData: string,
  px: number,
  py: number,
  pIdx: number,
  sizeMm: number = PHOTO_SIDE_MM,
  showCaption = true,
) {
  const s = sizeMm;
  if (photoData && isDataUrlPhoto(photoData)) {
    try {
      doc.addImage(
        photoData,
        dataUrlImageFormat(photoData),
        px,
        py,
        s,
        s,
      );
    } catch {
      drawPhotoPlaceholder(doc, px, py, s);
    }
  } else {
    drawPhotoPlaceholder(doc, px, py, s);
  }
  doc.setDrawColor(...PDF_THEME.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(px, py, s, s, PDF_THEME.photoRadiusMm, PDF_THEME.photoRadiusMm, "S");
  if (showCaption) {
    doc.setFontSize(T.photoCaption);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text(`Allegato ${pIdx + 1}`, px, py + s + 4);
  }
}

function stampFooters(doc: jsPDF, pageW: number, mL: number, mR: number) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.25);
    doc.line(mL, 282, pageW - mR, 282);
    doc.setFontSize(T.footer);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text("sanatec Piemonte — Documento uso interno", mL, 287);
    const pgTxt = `Pagina ${i} / ${n}`;
    doc.text(pgTxt, pageW - mR - doc.getTextWidth(pgTxt), 287);
  }
}

export function getPdfFilename(): string {
  const now = new Date();
  const fileDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `Checklist_Stazione_${fileDate}.pdf`;
}

export function downloadPdfBlob(blob: Blob, filename: string): boolean {
  let success = false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
    success = true;
  } catch (e) {
    console.warn("Metodo 1 download fallito:", e);
  }

  if (!success) {
    try {
      const url2 = URL.createObjectURL(blob);
      window.open(url2, "_blank");
      success = true;
    } catch (e) {
      console.warn("Metodo 2 download fallito:", e);
    }
  }

  return success;
}
