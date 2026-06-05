import type { jsPDF } from "jspdf";
import { CRITICITY_RGB } from "@/lib/brandColors";

function isCriticityWord(part: string): boolean {
  return /^criticità$/i.test(part) || /^criticita$/i.test(part);
}

type Rgb = readonly [number, number, number];

/** Scrive testo con la parola «criticità» in rosso (solo report PDF). */
export function writeWithCriticityRed(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  defaultColor: Rgb = [26, 26, 26],
): void {
  const parts = text.split(/(criticità|criticita)/gi);
  let cursorX = x;

  for (const part of parts) {
    if (!part) continue;
    if (isCriticityWord(part)) {
      doc.setTextColor(...CRITICITY_RGB);
    } else {
      doc.setTextColor(...defaultColor);
    }
    doc.text(part, cursorX, y);
    cursorX += doc.getTextWidth(part);
  }
}

/** Variante per etichette secondarie (grigio + criticità rossa). */
export function writeWithCriticityRedMuted(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
): void {
  writeWithCriticityRed(doc, text, x, y, [107, 101, 96]);
}

export function writeWithCriticityRedLight(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
): void {
  writeWithCriticityRed(doc, text, x, y, [160, 154, 148]);
}
