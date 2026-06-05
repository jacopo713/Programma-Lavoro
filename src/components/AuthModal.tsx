"use client";

import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LegalLinks } from "@/components/LegalLinks";
import { useAuth } from "@/contexts/AuthContext";

export type AuthModalMode = "login" | "register" | "reset";

interface AuthModalProps {
  open: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
  /** Schermata login obbligatoria: niente chiusura con X o Esc */
  mandatory?: boolean;
}

export function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
  mandatory = false,
}: AuthModalProps) {
  const titleId = useId();
  const { signIn, signUp, signInWithGoogle, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResetSent(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptedLegal(false);
  }, [open, mode]);

  const handleClose = useCallback(() => {
    if (mandatory || submitting || googleSubmitting) return;
    onClose();
  }, [mandatory, onClose, submitting, googleSubmitting]);

  const handleGoogleSignIn = async () => {
    setError(null);

    if (mode === "register" && !acceptedLegal) {
      setError("Accetta Termini d'uso e Informativa privacy per continuare.");
      return;
    }

    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    if (mode === "register" && !acceptedLegal) {
      setError("Accetta Termini d'uso e Informativa privacy per registrarti.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        onClose();
      } else if (mode === "register") {
        await signUp(email, password);
        onClose();
      } else {
        await sendPasswordReset(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isReset = mode === "reset";
  const busy = submitting || googleSubmitting;
  const showGoogle = !isReset;

  const title = isReset
    ? "Recupera password"
    : isLogin
      ? "Accedi"
      : "Crea account";

  const lead = isReset
    ? "Inserisci l'email dell'account. Riceverai un link per impostare una nuova password."
    : isLogin
      ? "Accedi per sincronizzare profilo e preferenze."
      : "Registrati con email e password. Dopo la registrazione completerai un breve profilo.";

  return (
    <dialog
      ref={dialogRef}
      className={`auth-modal${mandatory ? " auth-modal--mandatory" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!mandatory) handleClose();
      }}
      onClose={handleClose}
    >
      <form className="auth-modal-panel" onSubmit={handleSubmit}>
        <div className="auth-modal-header">
          <h2 id={titleId} className="auth-modal-title">
            {title}
          </h2>
          {!mandatory ? (
            <button
              type="button"
              className="auth-modal-close"
              aria-label="Chiudi"
              disabled={busy}
              onClick={handleClose}
            >
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </div>

        <p className="auth-modal-lead">{lead}</p>

        {!isReset ? <LegalLinks variant="auth" /> : null}

        {resetSent ? (
          <p className="auth-modal-success" role="status">
            Se esiste un account con questa email, riceverai a breve le istruzioni per
            reimpostare la password.
          </p>
        ) : (
          <>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                disabled={busy}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {!isReset ? (
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            ) : null}

            {isRegister ? (
              <label className="auth-field">
                <span>Conferma password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  disabled={busy}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            ) : null}

            {isLogin ? (
              <p className="auth-modal-forgot">
                <button
                  type="button"
                  className="auth-link-btn"
                  disabled={busy}
                  onClick={() => onModeChange("reset")}
                >
                  Password dimenticata?
                </button>
              </p>
            ) : null}

            {isRegister ? (
              <label className="auth-legal-consent">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  disabled={busy}
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
            ) : null}
          </>
        )}

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        {!resetSent ? (
          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={busy}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : null}
            <span>
              {isReset
                ? "Invia email di recupero"
                : isLogin
                  ? "Accedi"
                  : "Registrati"}
            </span>
          </button>
        ) : null}

        {showGoogle && !resetSent ? (
          <>
            <div className="auth-modal-divider" role="presentation">
              <span>oppure</span>
            </div>
            <button
              type="button"
              className="auth-btn auth-btn--google"
              disabled={busy}
              onClick={() => void handleGoogleSignIn()}
            >
              {googleSubmitting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : null}
              <span>Continua con Google</span>
            </button>
          </>
        ) : null}

        <p className="auth-modal-switch">
          {isReset ? (
            <>
              <button
                type="button"
                className="auth-link-btn"
                disabled={busy}
                onClick={() => onModeChange("login")}
              >
                Torna al login
              </button>
            </>
          ) : (
            <>
              {isLogin ? "Non hai un account?" : "Hai già un account?"}{" "}
              <button
                type="button"
                className="auth-link-btn"
                disabled={busy}
                onClick={() => onModeChange(isLogin ? "register" : "login")}
              >
                {isLogin ? "Registrati" : "Accedi"}
              </button>
            </>
          )}
        </p>
      </form>
    </dialog>
  );
}
