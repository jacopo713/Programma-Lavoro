import Link from "next/link";
import { LEGAL_AUTH_FOOTER } from "@/lib/legal/legalCopy";

interface LegalLinksProps {
  variant?: "inline" | "footer" | "auth";
}

export function LegalLinks({ variant = "inline" }: LegalLinksProps) {
  const links = (
    <>
      <Link href="/termini" className="legal-inline-link">
        Termini d&apos;uso
      </Link>
      {" · "}
      <Link href="/privacy" className="legal-inline-link">
        Privacy
      </Link>
    </>
  );

  if (variant === "footer") {
    return (
      <span className="legal-footer-links">
        {links}
      </span>
    );
  }

  if (variant === "auth") {
    return (
      <p className="auth-legal-notice">
        {LEGAL_AUTH_FOOTER} {links}
      </p>
    );
  }

  return <span className="legal-inline-links">{links}</span>;
}
