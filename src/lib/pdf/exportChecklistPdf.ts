import { jsPDF } from "jspdf";
import { isDataUrlPhoto } from "@/lib/criticismDisplay";
import { APP_NAME } from "@/lib/constants";
import {
  INSPECTION_SECTIONS,
  type InspectionSectionDef,
} from "@/lib/inspectionSections";
import {
  countSectionPhotos,
  getSectionDescription,
  type SectionDescriptions,
} from "@/lib/sectionDescriptions";
import { isSectionIncludedInReport } from "@/lib/sectionReport";
import {
  getSeverityBannerLabel,
  getSeverityReportBannerLabel,
  normalizeSeverity,
  SEVERITY_OPTIONS,
  SEVERITY_BANNER_BORDER_RGB,
  SEVERITY_BANNER_DOT_RGB,
  SEVERITY_BANNER_FILL_RGB,
  SEVERITY_BANNER_TEXT_RGB,
} from "@/lib/severity";
import { formatCriticismNumber, formatReportDateIT, pad } from "@/lib/format";
import { getAppLogoDataUrl } from "@/lib/pdf/pdfLogo";
import { PDF_LAYOUT, PDF_THEME, PDF_TYPO } from "@/lib/pdf/pdfTheme";
import { writeWithCriticityRed } from "@/lib/pdf/pdfText";
import type { Criticism, SeverityLevel } from "@/lib/types";

export interface ExportPdfOptions {
  items: Criticism[];
  stationName: string;
  operatorName: string;
  /** Data di redazione scelta dall'utente (ISO YYYY-MM-DD, "" = non impostata) */
  reportDate: string;
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
const BANNER_H = L.bannerHeightMm;
const SUMMARY_PAD_MM = 6;

export async function buildPdfBlob({
  items,
  stationName,
  operatorName,
  reportDate,
  sectionDescriptions,
  inspectedSectionCount,
  inspectionSectionTotal,
  totalPhotoCount,
}: ExportPdfOptions): Promise<Blob> {
  const logoDataUrl = await getAppLogoDataUrl();
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const mL = L.marginL;
  const mR = L.marginR;
  const uW = pageW - mL - mR;
  let y = 0;

  function need(cursorY: number, h: number): number {
    if (cursorY + h >= PAGE_BOTTOM) {
      doc.addPage();
      return PAGE_TOP;
    }
    return cursorY;
  }

  doc.setFillColor(...PDF_THEME.brand);
  doc.rect(0, 0, pageW, PDF_THEME.topbarMm, "F");
  y = drawPdfHeader(doc, logoDataUrl, mL, mR, pageW, uW);

  doc.setDrawColor(...PDF_THEME.borderLight);
  doc.setLineWidth(0.2);
  doc.line(mL, y, pageW - mR, y);
  y += L.gapLg;

  const now = new Date();
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const reportDateStr = formatReportDateIT(reportDate) || dateStr;

  const metaRows: [string, string][] = [
    ["Sede/Luogo lavoro", stationName],
    ["Compilato da", operatorName || "—"],
    ["Data redazione", reportDateStr],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.summaryLabel);
  const metaLabelColMm = Math.min(
    uW * 0.5,
    Math.max(
      L.metaLabelColMm,
      ...metaRows.map(([label]) => doc.getTextWidth(label.toUpperCase()) + 4),
    ),
  );

  for (const [label, value] of metaRows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.summaryLabel);
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text(label.toUpperCase(), mL, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(T.meta);
    doc.setTextColor(...PDF_THEME.text);
    const valueX = mL + metaLabelColMm;
    const valueMaxW = uW - metaLabelColMm;
    const valueLines = doc.splitTextToSize(value, valueMaxW) as string[];
    if (valueLines.length > 0) {
      doc.text(valueLines, valueX, y);
    }
    y += L.lineMeta * Math.max(valueLines.length, 1);
  }
  y += L.gapLg;

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
  const logoSize = L.logoSizeMm;
  const textX = mL + logoSize + 5;
  const textMaxW = pageW - mR - textX;

  try {
    doc.addImage(logoDataUrl, "PNG", mL, y0, logoSize, logoSize);
  } catch (err) {
    console.warn("Logo PDF non caricato:", err);
  }

  const subtitleGap = 5.4;
  const titleY = y0 + logoSize / 2 - 0.6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.reportTitle);
  doc.setTextColor(...PDF_THEME.text);
  const titleLines = doc.splitTextToSize(
    "Report checklist",
    textMaxW,
  ) as string[];
  doc.text(titleLines[0] ?? "", textX, titleY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(T.reportSubtitle);
  doc.setTextColor(...PDF_THEME.textSecondary);
  doc.text("Checklist — report PDF", textX, titleY + subtitleGap);

  return y0 + logoSize + L.logoGapAfterMm;
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
  _pageW: number,
  _mR: number,
  startY: number,
  need: (cursorY: number, h: number) => number,
): number {
  const y = need(startY, 22) + L.gapSm;
  const colW = uW / 3;
  const kpiRows: [string, string][] = [
    ["Aree ispezionate", `${inspected} / ${totalSections}`],
    ["Problemi rilevati", String(problemCount)],
    ["Foto allegate", String(photoCount)],
  ];

  const valueY = y + 7.5;

  kpiRows.forEach(([label, value], i) => {
    const x = mL + i * colW;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.summaryTable);
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.sectionTitle);
    doc.setTextColor(...PDF_THEME.brand);
    doc.text(value, x, valueY);
  });

  return valueY + L.gapLg;
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
  need: (cursorY: number, h: number) => number,
): number {
  let y = startY;

  const includedSections = INSPECTION_SECTIONS.filter((section) =>
    isSectionIncludedInReport(section.id, items, sectionDescriptions),
  );

  const detailHeaderBlock = L.gapSm + L.lineTitle + L.gapMd;
  const firstSection = includedSections[0];
  const firstSectionMin = firstSection
    ? measureSectionChapterMinHeight(
        doc,
        getSectionDescription(sectionDescriptions, firstSection.id),
        getSectionItems(items, firstSection.id),
        uW,
      )
    : 0;
  y = need(y, detailHeaderBlock + firstSectionMin);

  y += L.gapSm;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.sectionTitle);
  doc.setTextColor(...PDF_THEME.brand);
  doc.text("DETTAGLIO ISPEZIONI ED EVIDENZE", mL, y);
  y += L.gapMd;

  includedSections.forEach((section, idx) => {
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
      idx === 0,
    );
  });

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
  need: (cursorY: number, h: number) => number,
  isFirst: boolean,
): number {
  const sectionItems = getSectionItems(allItems, section.id);
  const narrative = getSectionDescription(sectionDescriptions, section.id);

  const minHeight = measureSectionChapterMinHeight(
    doc,
    narrative,
    sectionItems,
    uW,
  );
  const leadGap = isFirst ? 0 : L.sectionGapMm;
  const brokenY = need(startY, leadGap + minHeight);
  const samePage = brokenY === startY;

  let y = brokenY;
  if (samePage && !isFirst) {
    y += L.sectionGapMm;
    doc.setDrawColor(...PDF_THEME.border);
    doc.setLineWidth(0.25);
    doc.line(mL, y, pageW - mR, y);
  }

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
    y = need(y, measureSectionNarrativeHeight(doc, narrative, uW));
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
  need: (cursorY: number, h: number) => number,
): number {
  const items = numberedItems.map((n) => n.item);
  const stats = computeSummaryStats(items);
  const hasItems = items.length > 0;
  const innerPad = SUMMARY_PAD_MM;
  const boxH = computeGlobalSummaryBoxHeight(doc, stats, mL, uW);
  const pillStartX = mL + innerPad;
  const pillMaxX = mL + uW - innerPad;

  const y = need(startY, boxH + 4);
  doc.setFillColor(...PDF_THEME.summaryBg);
  doc.setDrawColor(...PDF_THEME.borderLight);
  doc.setLineWidth(0.2);
  doc.roundedRect(mL, y, uW, boxH, 2.5, 2.5, "FD");

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

function measureBannerWidth(doc: jsPDF, label: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(T.banner);
  return 3 + L.bannerDotMm * 2 + 2 + doc.getTextWidth(label) + 4;
}

const PHOTO_ENTRY_COLS = L.photoEntryCols;
const PHOTO_ENTRY_COL_GAP = L.photoEntryColGapMm;
const PHOTO_ENTRY_ROW_GAP = L.photoEntryRowGapMm;
const PHOTO_ENTRY_INNER_GAP = L.photoEntryInnerGapMm;
const PHOTO_ENTRY_CARD_PAD = L.photoEntryCardPadMm;
const PHOTO_ENTRY_SEP_GAP = L.photoEntrySepGapMm;

function photoEntryCellWidth(contentWidthMm: number): number {
  return (
    (contentWidthMm - (PHOTO_ENTRY_COLS - 1) * PHOTO_ENTRY_COL_GAP) /
    PHOTO_ENTRY_COLS
  );
}

function photoEntryInnerWidth(cellW: number): number {
  return cellW - PHOTO_ENTRY_CARD_PAD * 2;
}

function measurePhotoEntryTitleLines(
  doc: jsPDF,
  title: string,
  innerW: number,
): string[] {
  if (!title.trim()) return [];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(L.photoEntryTitleFontPt);
  return doc.splitTextToSize(title, innerW) as string[];
}

function measurePhotoEntryCellHeight(
  doc: jsPDF,
  item: Criticism,
  cellW: number,
  photoSize: number = photoEntryInnerWidth(cellW),
): number {
  const innerW = photoEntryInnerWidth(cellW);
  let h = PHOTO_ENTRY_CARD_PAD;
  h += photoSize;

  const titleLines = measurePhotoEntryTitleLines(doc, item.title, innerW);
  if (titleLines.length > 0) {
    h += PHOTO_ENTRY_SEP_GAP * 2;
    h += titleLines.length * L.photoEntryTitleLineMm;
  }

  h += PHOTO_ENTRY_INNER_GAP + BANNER_H;
  h += PHOTO_ENTRY_CARD_PAD;
  return h;
}

function measurePhotoRowHeight(
  doc: jsPDF,
  rowItems: Criticism[],
  cellW: number,
  photoSize: number,
): number {
  let rowH = 0;
  for (const item of rowItems) {
    rowH = Math.max(
      rowH,
      measurePhotoEntryCellHeight(doc, item, cellW, photoSize),
    );
  }
  return rowH;
}

function measureSectionHeaderBlock(): number {
  return L.gapMd + L.lineTitle + L.gapMd;
}

function measureSectionChapterMinHeight(
  doc: jsPDF,
  narrative: string,
  sectionItems: Criticism[],
  uW: number,
): number {
  let h = measureSectionHeaderBlock();
  if (narrative) {
    h += measureSectionNarrativeHeight(doc, narrative, uW);
  } else if (sectionItems.length > 0) {
    h += L.gapSm;
  }
  if (sectionItems.length > 0) {
    const cellW = photoEntryCellWidth(uW);
    const firstRowItems = sectionItems.slice(0, PHOTO_ENTRY_COLS);
    h += measurePhotoRowHeight(
      doc,
      firstRowItems,
      cellW,
      photoEntryInnerWidth(cellW),
    );
  }
  return h;
}

function drawPhotoEntryMissingPhoto(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
) {
  doc.setDrawColor(...PDF_THEME.border);
  doc.setFillColor(...PDF_THEME.summaryBg);
  doc.roundedRect(
    x,
    y,
    size,
    size,
    PDF_THEME.photoRadiusMm,
    PDF_THEME.photoRadiusMm,
    "FD",
  );
  doc.setFontSize(T.photoCaption);
  doc.setTextColor(...PDF_THEME.textMuted);
  doc.text("N/D", x + size / 2 - 3, y + size / 2);
}

function drawPhotoEntryCell(
  doc: jsPDF,
  item: Criticism,
  x: number,
  y: number,
  cellW: number,
  photoSize: number,
  cardH: number,
): void {
  const severity = normalizeSeverity(item.severity);
  const photoData = item.photos[0];
  const innerW = photoEntryInnerWidth(cellW);
  const innerX = x + PHOTO_ENTRY_CARD_PAD;

  doc.setFillColor(...PDF_THEME.card);
  doc.setDrawColor(...PDF_THEME.borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(
    x,
    y,
    cellW,
    cardH,
    PDF_THEME.cardRadiusMm,
    PDF_THEME.cardRadiusMm,
    "FD",
  );

  const photoX = innerX + (innerW - photoSize) / 2;
  let cy = y + PHOTO_ENTRY_CARD_PAD;

  if (photoData) {
    drawPhotoCell(doc, photoData, photoX, cy, 0, photoSize, false);
  } else {
    drawPhotoEntryMissingPhoto(doc, photoX, cy, photoSize);
  }
  cy += photoSize;

  const titleLines = measurePhotoEntryTitleLines(doc, item.title, innerW);
  if (titleLines.length > 0) {
    cy += PHOTO_ENTRY_SEP_GAP;
    doc.setDrawColor(...PDF_THEME.borderLight);
    doc.setLineWidth(0.25);
    doc.line(innerX, cy, innerX + innerW, cy);
    cy += PHOTO_ENTRY_SEP_GAP;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(L.photoEntryTitleFontPt);
    doc.setTextColor(...PDF_THEME.text);
    for (const line of titleLines) {
      doc.text(line, innerX, cy);
      cy += L.photoEntryTitleLineMm;
    }
  }

  const bannerY = y + cardH - PHOTO_ENTRY_CARD_PAD - BANNER_H;
  drawSeverityBannerPdf(
    doc,
    severity,
    innerX,
    bannerY,
    getSeverityReportBannerLabel(severity),
  );
}

/** Salta pagina se la riga non entra nello spazio verticale residuo (foto sempre a dimensione piena) */
function resolvePhotoRowLayout(
  doc: jsPDF,
  rowItems: Criticism[],
  cellW: number,
  y: number,
  rowGap: number,
): { y: number; photoSize: number; rowH: number } {
  const innerW = photoEntryInnerWidth(cellW);
  const photoSize = innerW;
  let rowH = measurePhotoRowHeight(doc, rowItems, cellW, photoSize);
  const available = PAGE_BOTTOM - y - rowGap;

  if (rowH > available) {
    doc.addPage();
    y = PAGE_TOP;
    rowH = measurePhotoRowHeight(doc, rowItems, cellW, photoSize);
  }

  return { y, photoSize, rowH };
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
    const rowGap = i === 0 ? 0 : PHOTO_ENTRY_ROW_GAP;
    const layout = resolvePhotoRowLayout(
      doc,
      rowItems,
      cellW,
      y,
      rowGap,
    );
    y = layout.y;

    rowItems.forEach((item, colIdx) => {
      const x = mL + colIdx * (cellW + PHOTO_ENTRY_COL_GAP);
      drawPhotoEntryCell(
        doc,
        item,
        x,
        y,
        cellW,
        layout.photoSize,
        layout.rowH,
      );
    });

    y += layout.rowH + rowGap;
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
  sizeMm: number,
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
    doc.line(mL, L.footerLineMm, pageW - mR, L.footerLineMm);
    doc.setFontSize(T.footer);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_THEME.textMuted);
    doc.text(
      `${APP_NAME} — Documento generato automaticamente`,
      mL,
      L.footerTextMm,
    );
    const pgTxt = `Pagina ${i} / ${n}`;
    doc.text(
      pgTxt,
      pageW - mR - doc.getTextWidth(pgTxt),
      L.footerTextMm,
    );
  }
}

export function getPdfFilename(): string {
  const now = new Date();
  const fileDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `Checklist_${fileDate}.pdf`;
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
