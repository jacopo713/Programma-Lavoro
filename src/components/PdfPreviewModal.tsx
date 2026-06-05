"use client";

import { Download, X } from "lucide-react";
import { useEffect } from "react";
import { downloadPdfBlob } from "@/lib/pdf/exportChecklistPdf";

interface PdfPreviewModalProps {
  open: boolean;
  previewUrl: string | null;
  filename: string;
  onClose: () => void;
}

export function PdfPreviewModal({
  open,
  previewUrl,
  filename,
  onClose,
}: PdfPreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleDownload = async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      downloadPdfBlob(blob, filename);
    } catch {
      /* fallback: apri in nuova scheda */
      window.open(previewUrl, "_blank");
    }
  };

  if (!open || !previewUrl) return null;

  return (
    <div
      className="pdf-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pdf-preview-panel">
        <header className="pdf-preview-header">
          <div>
            <h2 id="pdf-preview-title" className="pdf-preview-title">
              Anteprima PDF
            </h2>
            <p className="pdf-preview-subtitle">{filename}</p>
          </div>
          <div className="pdf-preview-actions">
            <button
              type="button"
              className="btn-save pdf-preview-download"
              onClick={handleDownload}
            >
              <Download size={16} aria-hidden />
              <span className="pdf-preview-download-label">Scarica PDF</span>
            </button>
            <button
              type="button"
              className="pdf-preview-close"
              onClick={onClose}
              aria-label="Chiudi anteprima"
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        </header>
        <div className="pdf-preview-body">
          <iframe
            src={previewUrl}
            title={`Anteprima ${filename}`}
            className="pdf-preview-iframe"
          />
        </div>
      </div>
    </div>
  );
}
