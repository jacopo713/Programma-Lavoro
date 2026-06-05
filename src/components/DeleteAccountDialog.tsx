"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  userHasGoogleProvider,
  userHasPasswordProvider,
} from "@/lib/firebase/authActions";

const CONFIRM_PHRASE = "ELIMINA";

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccountDialog({
  open,
  onClose,
  onDeleted,
}: DeleteAccountDialogProps) {
  const titleId = useId();
  const { user, deleteAccount } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const needsPassword = user ? userHasPasswordProvider(user) : false;
  const needsGoogle = user ? userHasGoogleProvider(user) && !needsPassword : false;

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
    setConfirmText("");
    setPassword("");
    setError(null);
  }, [open]);

  const handleClose = () => {
    if (deleting) return;
    onClose();
  };

  const handleDelete = async () => {
    setError(null);

    if (confirmText.trim() !== CONFIRM_PHRASE) {
      setError(`Digita ${CONFIRM_PHRASE} per confermare.`);
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount({ password: password.trim() || undefined });
      onDeleted();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Eliminazione account non riuscita.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-modal delete-account-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
    >
      <div className="auth-modal-panel">
        <div className="auth-modal-header">
          <h2 id={titleId} className="auth-modal-title">
            Elimina account
          </h2>
          <button
            type="button"
            className="auth-modal-close"
            aria-label="Chiudi"
            disabled={deleting}
            onClick={handleClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <p className="auth-modal-lead">
          Questa azione è irreversibile. Verranno eliminati profilo, checklist
          nel cloud e tutte le foto associate.
        </p>

        <label className="auth-field">
          <span>
            Digita <strong>{CONFIRM_PHRASE}</strong> per confermare
          </span>
          <input
            type="text"
            value={confirmText}
            disabled={deleting}
            autoComplete="off"
            onChange={(event) => setConfirmText(event.target.value)}
          />
        </label>

        {needsPassword ? (
          <label className="auth-field">
            <span>Password attuale</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={deleting}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        ) : null}

        {needsGoogle ? (
          <p className="delete-account-dialog-hint">
            Ti verrà chiesto di confermare l&apos;identità con Google.
          </p>
        ) : null}

        {error ? (
          <p className="auth-modal-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="delete-account-dialog-actions">
          <button
            type="button"
            className="auth-btn auth-btn--ghost"
            disabled={deleting}
            onClick={handleClose}
          >
            Annulla
          </button>
          <button
            type="button"
            className="auth-btn auth-btn--danger"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
            <span>Elimina definitivamente</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
