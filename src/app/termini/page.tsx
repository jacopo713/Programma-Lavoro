import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Termini d'uso",
  description: "Termini d'uso del Generatore checklist PDF",
};

export default function TerminiPage() {
  return <LegalDocument kind="terms" />;
}
