import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description: "Informativa privacy del Generatore checklist PDF",
};

export default function PrivacyPage() {
  return <LegalDocument kind="privacy" />;
}
