"use client";

import { FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAppToast } from "@/contexts/ToastContext";
import { MOBILE_NAV_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { buildPdfBlob, getPdfFilename } from "@/lib/pdf/exportChecklistPdf";
import { resolveCriticismsForPdf } from "@/lib/resolvePhotoForPdf";
import { ChecklistOverview } from "./ChecklistOverview";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { ReportDateControl } from "./ReportDateControl";
import { StationSelectControl } from "./StationSelectControl";

export function ChecklistToolbarActions() {
  const { showToast } = useAppToast();
  const {
    items,
    stationName,
    sectionDescriptions,
    reportDate,
    setReportDate,
    stations,
    activeStationId,
    hydrated,
    syncStatus,
    switchStation,
    inspectedSectionCount,
    inspectionSectionTotal,
    totalPhotoCount,
    hasReportContent,
  } = useChecklistContext();
  const { operatorDisplayName } = useUserProfile();

  const isMobile = useMediaQuery(MOBILE_NAV_QUERY);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    blob: Blob;
    url: string;
  } | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewOpen(false);
    setPdfResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfResult) URL.revokeObjectURL(pdfResult.url);
    };
  }, [pdfResult]);

  const handleExport = () => {
    if (!hasReportContent || exportLoading) {
      if (!hasReportContent) {
        showToast("Aggiungi almeno una foto o una descrizione area", "warning");
      }
      return;
    }
    setExportLoading(true);
    showToast("Generazione PDF in corso…", "pdf");
    void (async () => {
      try {
        setPdfPreviewOpen(false);
        setPdfResult((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return null;
        });

        const itemsForPdf = await resolveCriticismsForPdf(items);
        const blob = await buildPdfBlob({
          items: itemsForPdf,
          stationName,
          operatorName: operatorDisplayName,
          reportDate,
          sectionDescriptions,
          inspectedSectionCount,
          inspectionSectionTotal,
          totalPhotoCount,
        });
        const url = URL.createObjectURL(blob);
        setPdfResult({ blob, url });
        setPdfPreviewOpen(true);
        showToast(
          isMobile
            ? "PDF pronto — salva o condividi dal pannello"
            : "Anteprima PDF pronta",
          "pdf",
        );
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

  const syncLabel =
    syncStatus === "loading"
      ? "Caricamento dati…"
      : syncStatus === "syncing"
        ? "Salvataggio…"
        : syncStatus === "error"
          ? "Errore sincronizzazione"
          : "Sincronizzato";

  if (!hydrated) return null;

  return (
    <>
      <div className="checklist-toolbar">
        <div className="checklist-toolbar-primary">
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
            className="checklist-toolbar-station"
            stations={stations}
            activeStationId={activeStationId}
            onChange={handleStationChange}
          />
          <ReportDateControl
            className="checklist-toolbar-date"
            value={reportDate}
            onChange={setReportDate}
          />
        </div>
        <ChecklistOverview />
        <p
          className={`checklist-sync-status checklist-sync-status--${syncStatus}`}
          aria-live="polite"
        >
          {syncLabel}
        </p>
      </div>
      <PdfPreviewModal
        open={pdfPreviewOpen}
        previewUrl={pdfResult?.url ?? null}
        blob={pdfResult?.blob ?? null}
        filename={getPdfFilename()}
        onClose={closePdfPreview}
      />
    </>
  );
}
