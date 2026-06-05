"use client";

import { Check, Loader2, PenSquare, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "@/contexts/ToastContext";
import { useImageFileInput } from "@/hooks/useImageFileInput";
import { canSavePhotoEntry } from "@/lib/criticismDisplay";
import { MAX_TITLE_LENGTH } from "@/lib/constants";
import type { SeverityLevel } from "@/lib/types";
import { DEFAULT_SEVERITY, SeveritySelect } from "./SeveritySelect";

export interface CriticismFormInitial {
  title: string;
  photo: string;
  severity: SeverityLevel;
}

export type PhotoEntryFormLayout = "panel" | "inline";

interface AddCriticismFormProps {
  open: boolean;
  mode: "add" | "edit";
  layout?: PhotoEntryFormLayout;
  editingId?: number;
  initial?: CriticismFormInitial;
  onCancel: () => void;
  onSave: (title: string, photo: string, severity: SeverityLevel) => void;
  authRequired?: boolean;
  saving?: boolean;
}

export function AddCriticismForm({
  open,
  mode,
  layout = "panel",
  editingId,
  initial,
  onCancel,
  onSave,
  authRequired = false,
  saving = false,
}: AddCriticismFormProps) {
  const isEdit = mode === "edit";
  const isInline = layout === "inline";
  const { showToast } = useAppToast();
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel>(DEFAULT_SEVERITY);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const formId = isInline && editingId != null
    ? `criticism-form-edit-${editingId}`
    : "criticism-form";
  const titleFieldId = isInline && editingId != null
    ? `criticism-title-${editingId}`
    : "criticism-title";
  const severityFieldId = isInline && editingId != null
    ? `criticism-severity-${editingId}`
    : "criticism-severity";

  const resetForm = useCallback(() => {
    setTitle("");
    setPhoto(null);
    setSeverity(DEFAULT_SEVERITY);
  }, []);

  const loadInitial = useCallback(() => {
    if (initial) {
      setTitle(initial.title);
      setPhoto(initial.photo);
      setSeverity(initial.severity);
    } else {
      resetForm();
    }
  }, [initial, resetForm]);

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleSave = () => {
    if (!canSavePhotoEntry(title, photo) || saving) return;
    onSave(title.trim(), photo!, severity);
  };

  const handlePhotoReady = useCallback((dataUrl: string) => {
    setPhoto(dataUrl);
  }, []);

  const { openPicker, inputProps } = useImageFileInput({
    onPhotoReady: handlePhotoReady,
    showToast,
  });

  const handleRemovePhoto = () => {
    if (isEdit) {
      setPhoto(null);
      return;
    }
    handleCancel();
  };

  useEffect(() => {
    if (!open) return;
    loadInitial();
    const t = setTimeout(
      () => titleInputRef.current?.focus({ preventScroll: true }),
      350,
    );
    return () => clearTimeout(t);
  }, [open, loadInitial]);

  useEffect(() => {
    if (!open || !isInline || !isEdit) return;
    const t = window.setTimeout(() => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      document.getElementById(formId)?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [open, isInline, isEdit, formId]);

  if (!open) return null;

  const wrapperClassName = isInline
    ? "crit-card crit-card--photo-entry crit-card--editing photo-entry-form--inline"
    : "photo-draft-card";

  const innerClassName = isInline
    ? "crit-card-photo-block photo-draft-inner"
    : "photo-draft-inner";

  return (
    <div id={formId} className={wrapperClassName}>
      <input {...inputProps} />

      <div className={innerClassName}>
        {!isInline && (
          <div className="photo-draft-header">
            <PenSquare size={16} aria-hidden />
            <span>{isEdit ? "Modifica foto" : "Nuova foto"}</span>
          </div>
        )}

        {photo ? (
          <div className="photo-draft-preview">
            <button
              type="button"
              className="photo-draft-preview-image crit-card-photo"
              onClick={openPicker}
              aria-label="Sostituisci foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
            </button>
            <button
              type="button"
              className="photo-draft-remove"
              aria-label={isEdit ? "Rimuovi foto" : "Annulla"}
              onClick={handleRemovePhoto}
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="photo-draft-missing"
            onClick={openPicker}
          >
            Aggiungi o sostituisci foto
          </button>
        )}

        <label className="form-field-label" htmlFor={titleFieldId}>
          Titolo
        </label>
        <input
          id={titleFieldId}
          ref={titleInputRef}
          type="text"
          className="add-form-input photo-draft-title-input"
          value={title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Es. Porta REI bloccata"
          aria-label="Titolo foto"
        />

        <SeveritySelect
          id={severityFieldId}
          value={severity}
          onChange={setSeverity}
        />

        {authRequired ? (
          <p className="photo-draft-auth-hint">Accedi per salvare foto su cloud.</p>
        ) : null}

        <div className="form-buttons photo-draft-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel} disabled={saving}>
            Annulla
          </button>
          <button
            type="button"
            className="btn-save"
            disabled={!canSavePhotoEntry(title, photo) || saving || authRequired}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Caricamento…
              </>
            ) : isEdit ? (
              <>
                <Check size={16} aria-hidden />
                Salva modifiche
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden />
                Aggiungi foto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
