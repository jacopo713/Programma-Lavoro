"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function LegalConsentGate() {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { acceptLegalConsent, rejectLegalConsent } = useAuth();
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleAccept = async () => {
    if (!acceptedLegal) {
      setError("Accetta Termini d'uso e Informativa privacy per continuare.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      acceptLegalConsent();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rejectLegalConsent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-modal auth-modal--mandatory"
      aria-labelledby={titleId}
      onCancel={(event) => event.preventDefault()}
    >
      <div className="auth-modal-panel">
        <div className="auth-modal-header">
          <h2 id={titleId} className="auth-modal-title">
            Accetta Termini e Privacy
          </h2>
        </div>

        <p className="auth-modal-lead">
          Per completare la registrazione con Google devi accettare i Termini
          d&apos;uso e l&apos;Informativa privacy.
        </p>

        <label className="auth-legal-consent">
          <input
            type="checkbox"
            checked={acceptedLegal}
            disabled={submitting}
            onChange={(event) => setAcceptedLegal(event.target.checked)}
          />
          <span>
            Ho letto e accetto i{" "}
            <Link href="/termini" className="legal-inline-link" target="_blank">
              Termini d&apos;uso
            </Link>{" "}
            e l&apos;
            <Link href="/privacy" className="legal-inline-link" target="_blank">
              Informativa privacy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="auth-btn auth-btn--primary"
          disabled={submitting}
          onClick={() => void handleAccept()}
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : null}
          <span>Continua</span>
        </button>

        <p className="auth-modal-switch">
          <button
            type="button"
            className="auth-link-btn"
            disabled={submitting}
            onClick={() => void handleReject()}
          >
            Annulla registrazione
          </button>
        </p>
      </div>
    </dialog>
  );
}
