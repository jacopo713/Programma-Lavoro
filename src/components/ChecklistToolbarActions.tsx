"use client";

import { FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useAppToast } from "@/contexts/ToastContext";
import { buildPdfBlob, getPdfFilename } from "@/lib/pdf/exportChecklistPdf";
import { resolveCriticismsForPdf } from "@/lib/resolvePhotoForPdf";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { StationSelectControl } from "./StationSelectControl";

export function ChecklistToolbarActions() {
  const { showToast } = useAppToast();
  const {
    items,
    stationName,
    sectionDescriptions,
    stations,
    activeStationId,
    hydrated,
    switchStation,
    inspectedSectionCount,
    inspectionSectionTotal,
    totalPhotoCount,
    hasReportContent,
  } = useChecklistContext();

  const [exportLoading, setExportLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewOpen(false);
    setPdfPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleExport = () => {
    if (!hasReportContent || exportLoading) return;
    setExportLoading(true);
    void (async () => {
      try {
        closePdfPreview();
        const itemsForPdf = await resolveCriticismsForPdf(items);
        const blob = await buildPdfBlob({
          items: itemsForPdf,
          stationName,
          sectionDescriptions,
          inspectedSectionCount,
          inspectionSectionTotal,
          totalPhotoCount,
        });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setPdfPreviewOpen(true);
        showToast("Anteprima PDF pronta", "pdf");
      } catch (err) {
        console.error("Errore PDF:", err);
        showToast("Errore nella generazione del PDF", "warning");
      }
      setExportLoading(false);
    })();
  };

  const handleStationChange = (stationId: string) => {
    const ok = switchStation(stationId);
    if (ok) {
      const next = stations.find((station) => station.id === stationId);
      if (next) showToast(`Stazione: ${next.name}`, "success");
    }
    return ok;
  };

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        className={`btn-export${exportLoading ? " loading" : ""}`}
        id="btnExport"
        aria-label="Anteprima ed esporta checklist in PDF"
        disabled={!hasReportContent || exportLoading}
        onClick={handleExport}
      >
        <FileText size={16} className="export-icon" aria-hidden />
        <Loader2 size={16} className="spinner animate-spin" aria-hidden />
        <span className="btn-label">Anteprima PDF</span>
      </button>
      <StationSelectControl
        stations={stations}
        activeStationId={activeStationId}
        onChange={handleStationChange}
      />
      <PdfPreviewModal
        open={pdfPreviewOpen}
        previewUrl={pdfPreviewUrl}
        filename={getPdfFilename()}
        onClose={closePdfPreview}
      />
    </>
  );
}
