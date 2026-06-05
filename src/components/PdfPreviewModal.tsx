"use client";

import { Download, ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
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
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);

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
      const ok = downloadPdfBlob(blob, filename);
      if (!ok) {
        window.open(previewUrl, "_blank");
      }
    } catch {
      window.open(previewUrl, "_blank");
    }
  };

  const handleOpen = () => {
    if (!previewUrl) return;
    const opened = window.open(previewUrl, "_blank");
    if (!opened) {
      void handleDownload();
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
            {isMobile ? (
              <button
                type="button"
                className="btn-save pdf-preview-download"
                onClick={handleOpen}
              >
                <ExternalLink size={16} aria-hidden />
                <span>Apri PDF</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-save pdf-preview-download"
                onClick={handleDownload}
              >
                <Download size={16} aria-hidden />
                <span className="pdf-preview-download-label">Scarica PDF</span>
              </button>
            )}
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
        {isMobile ? (
          <div className="pdf-preview-fallback">
            <p className="pdf-preview-fallback-text">
              L&apos;anteprima inline non è supportata su questo dispositivo.
              Apri il PDF in una nuova scheda o scaricalo sul dispositivo.
            </p>
            <div className="pdf-preview-fallback-actions">
              <button
                type="button"
                className="btn-save pdf-preview-fallback-btn"
                onClick={handleOpen}
              >
                <ExternalLink size={16} aria-hidden />
                Apri PDF
              </button>
              <button
                type="button"
                className="btn-export pdf-preview-fallback-btn"
                onClick={handleDownload}
              >
                <Download size={16} aria-hidden />
                Scarica PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="pdf-preview-body">
            <iframe
              src={previewUrl}
              title={`Anteprima ${filename}`}
              className="pdf-preview-iframe"
            />
          </div>
        )}
      </div>
    </div>
  );
}
