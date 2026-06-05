import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import {
  LEGAL_LAST_UPDATED,
  privacySections,
  termsSections,
} from "@/lib/legal/legalCopy";

type LegalDocumentKind = "terms" | "privacy";

interface LegalDocumentProps {
  kind: LegalDocumentKind;
}

export function LegalDocument({ kind }: LegalDocumentProps) {
  const isTerms = kind === "terms";
  const title = isTerms ? "Termini d'uso" : "Informativa privacy";
  const sections = isTerms ? termsSections : privacySections;
  const otherHref = isTerms ? "/privacy" : "/termini";
  const otherLabel = isTerms ? "Informativa privacy" : "Termini d'uso";

  return (
    <article className="legal-page">
      <header className="legal-page-header">
        <p className="legal-page-eyebrow">{APP_NAME}</p>
        <h1>{title}</h1>
        <p className="legal-page-meta">
          Versione in vigore dal {LEGAL_LAST_UPDATED}
        </p>
      </header>

      <div className="legal-page-sections">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <footer className="legal-page-footer">
        <Link href={otherHref} className="legal-page-link">
          {otherLabel}
        </Link>
        <span aria-hidden> · </span>
        <Link href="/" className="legal-page-link">
          Torna all&apos;app
        </Link>
      </footer>
    </article>
  );
}
