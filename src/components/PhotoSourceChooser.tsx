"use client";

import { Camera, ImageIcon, X } from "lucide-react";
import { useEffect } from "react";

export interface PhotoSourceChooserProps {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

export function PhotoSourceChooser({
  open,
  onClose,
  onCamera,
  onGallery,
}: PhotoSourceChooserProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="photo-source-sheet" role="presentation">
      <button
        type="button"
        className="photo-source-sheet-backdrop"
        aria-label="Chiudi"
        onClick={onClose}
      />
      <div
        className="photo-source-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Come aggiungere la foto"
      >
        <div className="photo-source-sheet-header">
          <p className="photo-source-sheet-title">Aggiungi foto</p>
          <button
            type="button"
            className="photo-source-sheet-close"
            aria-label="Chiudi"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="photo-source-sheet-actions">
          <button
            type="button"
            className="photo-source-sheet-action"
            onClick={onCamera}
          >
            <span className="photo-source-sheet-action-icon" aria-hidden>
              <Camera size={20} />
            </span>
            <span className="photo-source-sheet-action-label">Scatta foto</span>
          </button>
          <button
            type="button"
            className="photo-source-sheet-action"
            onClick={onGallery}
          >
            <span className="photo-source-sheet-action-icon" aria-hidden>
              <ImageIcon size={20} />
            </span>
            <span className="photo-source-sheet-action-label">
              Scegli da galleria
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
