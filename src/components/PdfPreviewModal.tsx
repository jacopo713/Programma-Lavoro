"use client";

import { Download, ExternalLink, Share2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { downloadPdfBlob } from "@/lib/pdf/exportChecklistPdf";
import { canSharePdfFile, sharePdfFile } from "@/lib/pdf/sharePdf";

interface PdfPreviewModalProps {
  open: boolean;
  previewUrl: string | null;
  blob: Blob | null;
  filename: string;
  onClose: () => void;
}

export function PdfPreviewModal({
  open,
  previewUrl,
  blob,
  filename,
  onClose,
}: PdfPreviewModalProps) {
  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const shareAvailable = useMemo(() => {
    if (!open || !blob) return false;
    return canSharePdfFile(blob, filename);
  }, [open, blob, filename]);

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

  const openPreviewInNewTab = () => {
    if (!previewUrl) return;
    const opened = window.open(previewUrl, "_blank");
    if (!opened) {
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    const ok = downloadPdfBlob(blob, filename);
    if (!ok && previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  const handleShareOrDownload = () => {
    if (!blob) return;
    if (shareAvailable) {
      void (async () => {
        const result = await sharePdfFile(blob, filename);
        if (result === "failed") {
          handleDownload();
        }
      })();
      return;
    }
    handleDownload();
  };

  if (!open || !previewUrl || !blob) return null;

  const primaryLabel = isMobile
    ? shareAvailable
      ? "Salva o condividi PDF"
      : "Scarica PDF"
    : "Scarica PDF";

  const PrimaryIcon = isMobile && shareAvailable ? Share2 : Download;

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
              <>
                <button
                  type="button"
                  className="btn-save pdf-preview-download"
                  onClick={handleShareOrDownload}
                >
                  <PrimaryIcon size={16} aria-hidden />
                  <span>{primaryLabel}</span>
                </button>
                <button
                  type="button"
                  className="btn-export pdf-preview-download"
                  onClick={openPreviewInNewTab}
                >
                  <ExternalLink size={16} aria-hidden />
                  <span>Apri PDF</span>
                </button>
              </>
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
              {shareAvailable
                ? "Usa Salva o condividi PDF per inviare il report con il nome corretto. Non usare Stampa del browser."
                : "L'anteprima inline non è supportata su questo dispositivo. Scarica il PDF o aprilo in una nuova scheda. Non usare Stampa del browser."}
            </p>
            <div className="pdf-preview-fallback-actions">
              <button
                type="button"
                className="btn-save pdf-preview-fallback-btn"
                onClick={handleShareOrDownload}
              >
                <PrimaryIcon size={16} aria-hidden />
                {primaryLabel}
              </button>
              <button
                type="button"
                className="btn-export pdf-preview-fallback-btn"
                onClick={openPreviewInNewTab}
              >
                <ExternalLink size={16} aria-hidden />
                Apri PDF
              </button>
              {!shareAvailable ? (
                <button
                  type="button"
                  className="btn-export pdf-preview-fallback-btn"
                  onClick={handleDownload}
                >
                  <Download size={16} aria-hidden />
                  Scarica PDF
                </button>
              ) : null}
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
