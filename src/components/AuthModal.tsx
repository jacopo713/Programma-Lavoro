"use client";

import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type AuthModalMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const titleId = useId();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, [open, mode]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <dialog
      ref={dialogRef}
      className="auth-modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
    >
      <form className="auth-modal-panel" onSubmit={handleSubmit}>
        <div className="auth-modal-header">
          <h2 id={titleId} className="auth-modal-title">
            {isLogin ? "Accedi" : "Crea account"}
          </h2>
          <button
            type="button"
            className="auth-modal-close"
            aria-label="Chiudi"
            disabled={submitting}
            onClick={handleClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <p className="auth-modal-lead">
          {isLogin
            ? "Accedi per sincronizzare profilo e preferenze."
            : "Registrati con email e password."}
        </p>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            disabled={submitting}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            disabled={submitting}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {!isLogin ? (
          <label className="auth-field">
            <span>Conferma password</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              disabled={submitting}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
        ) : null}

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="auth-btn auth-btn--primary" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          <span>{isLogin ? "Accedi" : "Registrati"}</span>
        </button>

        <p className="auth-modal-switch">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}{" "}
          <button
            type="button"
            className="auth-link-btn"
            disabled={submitting}
            onClick={() => onModeChange(isLogin ? "register" : "login")}
          >
            {isLogin ? "Registrati" : "Accedi"}
          </button>
        </p>
      </form>
    </dialog>
  );
}
