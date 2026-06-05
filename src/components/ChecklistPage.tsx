"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import {
  getChecklistVisibleItems,
  getCriticismDomId,
  parseCriticismFocusId,
  scheduleCriticismScroll,
} from "@/lib/criticismNavigation";
import {
  INSPECTION_SECTIONS,
  type SectionId,
} from "@/lib/inspectionSections";
import { getPhotoDataUrl } from "@/lib/criticismDisplay";
import { DEFAULT_SEVERITY } from "@/lib/severity";
import type { SeverityLevel } from "@/lib/types";
import { useAppToast } from "@/contexts/ToastContext";
import type { CriticismFormInitial } from "./AddCriticismForm";
import { Footer } from "./Footer";
import { InspectionSection } from "./InspectionSection";
import { Lightbox } from "./Lightbox";

export function ChecklistPage() {
  const { showToast } = useAppToast();
  const { user } = useAuth();
  const router = useRouter();
  const canManagePhotos = Boolean(user);

  const {
    items,
    sectionDescriptions,
    activeStationId,
    hydrated,
    setSectionDescription,
    addCriticism,
    updateCriticism,
    deleteCriticism,
    setCriticismResolved,
    inspectedSectionCount,
    inspectionSectionTotal,
    totalPhotoCount,
  } = useChecklistContext();

  const searchParams = useSearchParams();
  const urlFocusId = useMemo(
    () => parseCriticismFocusId(searchParams),
    [searchParams],
  );
  const [focusSessionId, setFocusSessionId] = useState<number | null>(null);
  const visibleItems = useMemo(
    () => getChecklistVisibleItems(items, focusSessionId),
    [items, focusSessionId],
  );
  const [focusedCriticismId, setFocusedCriticismId] = useState<number | null>(
    null,
  );
  const focusHandledRef = useRef<number | null>(null);

  const getVisibleItemsForSection = useCallback(
    (sectionId: SectionId) =>
      visibleItems.filter((item) => item.sectionId === sectionId),
    [visibleItems],
  );

  const countVisibleForSection = useCallback(
    (sectionId: SectionId) => getVisibleItemsForSection(sectionId).length,
    [getVisibleItemsForSection],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("building");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [addFormInitial, setAddFormInitial] = useState<
    CriticismFormInitial | undefined
  >();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const scrollAfterOpenRef = useRef<SectionId | null>(null);
  /** Scroll verticale prima di aprire modifica inline — ripristinato alla chiusura */
  const editScrollYRef = useRef<number | null>(null);

  const editFormInitial = useMemo((): CriticismFormInitial | undefined => {
    if (editingId === null) return undefined;
    const item =
      visibleItems.find((i) => i.id === editingId) ??
      items.find((i) => i.id === editingId);
    if (!item) return undefined;
    const photo = getPhotoDataUrl(item.photos);
    if (!photo) return undefined;
    return {
      title: item.title,
      photo,
      severity: item.severity,
    };
  }, [editingId, items, visibleItems]);

  const formInitial =
    formMode === "edit" ? editFormInitial : addFormInitial;

  useEffect(() => {
    if (!hydrated || urlFocusId === null) return;
    if (focusHandledRef.current === urlFocusId) return;

    const target = items.find((item) => item.id === urlFocusId);
    if (!target) {
      showToast("Criticità non trovata", "warning");
      router.replace("/");
      return;
    }

    focusHandledRef.current = urlFocusId;
    setFocusSessionId(urlFocusId);
    setFocusedCriticismId(urlFocusId);

    const highlightTimer = window.setTimeout(() => {
      setFocusedCriticismId(null);
    }, 2800);

    return () => {
      window.clearTimeout(highlightTimer);
    };
  }, [urlFocusId, hydrated, items, router, showToast]);

  useEffect(() => {
    if (!hydrated || focusSessionId === null) return;

    const hasFocusParam = parseCriticismFocusId(searchParams) !== null;
    if (hasFocusParam) {
      router.replace("/");
      return;
    }

    const element = document.getElementById(getCriticismDomId(focusSessionId));
    if (!element) return;

    return scheduleCriticismScroll(element);
  }, [focusSessionId, hydrated, searchParams, router]);

  useEffect(() => {
    if (!hydrated || focusSessionId === null) return;
    const target = items.find((item) => item.id === focusSessionId);
    if (!target) {
      showToast("Criticità non trovata in questa stazione", "warning");
      setFocusSessionId(null);
      setFocusedCriticismId(null);
      focusHandledRef.current = null;
      router.replace("/");
    }
  }, [activeStationId, focusSessionId, hydrated, items, router, showToast]);

  useEffect(() => {
    const sectionId = scrollAfterOpenRef.current;
    if (!sectionId || !formOpen || formMode !== "add") return;
    scrollAfterOpenRef.current = null;
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-section-id="${sectionId}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [formOpen, formMode, formSession]);

  const restoreEditScroll = useCallback(() => {
    const y = editScrollYRef.current;
    if (y === null) return;
    editScrollYRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      });
    });
  }, []);

  const closeForm = useCallback(() => {
    const shouldRestoreScroll =
      formMode === "edit" && editScrollYRef.current !== null;
    setFormOpen(false);
    setEditingId(null);
    setFormMode("add");
    setAddFormInitial(undefined);
    if (shouldRestoreScroll) restoreEditScroll();
  }, [formMode, restoreEditScroll]);

  const openAddWithPhoto = useCallback(
    (sectionId: SectionId, photo: string) => {
      setActiveSectionId(sectionId);
      setEditingId(null);
      setFormMode("add");
      setAddFormInitial({
        title: "",
        photo,
        severity: DEFAULT_SEVERITY,
      });
      setFormSession((s) => s + 1);
      scrollAfterOpenRef.current = sectionId;
      setFormOpen(true);
    },
    [],
  );

  const openEdit = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    editScrollYRef.current = window.scrollY;
    setActiveSectionId(item.sectionId);
    setEditingId(id);
    setFormMode("edit");
    setFormSession((s) => s + 1);
    setFormOpen(true);
  };

  const handleSave = async (
    title: string,
    photo: string,
    severity: SeverityLevel,
  ) => {
    if (!canManagePhotos) {
      showToast("Accedi per allegare foto", "warning");
      return;
    }
    if (savingPhoto) return;

    setSavingPhoto(true);
    try {
      if (formMode === "edit" && editingId !== null) {
        const ok = await updateCriticism(editingId, title, photo, severity);
        if (ok) {
          closeForm();
          showToast("Foto aggiornata", "success");
        } else {
          showToast("Errore caricamento foto", "warning");
        }
        return;
      }

      const result = await addCriticism(activeSectionId, title, photo, severity);
      if (result) {
        closeForm();
        showToast("Foto aggiunta", "success");
      } else {
        showToast("Errore caricamento foto", "warning");
      }
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (editingId === id) closeForm();
    const ok = await deleteCriticism(id);
    if (ok) {
      showToast("Foto eliminata", "danger");
    } else {
      showToast("Errore durante l'eliminazione", "warning");
    }
  };

  const handleToggleResolved = (id: number, resolved: boolean) => {
    if (setCriticismResolved(id, resolved)) {
      showToast(
        resolved ? "Criticità segnata come risolta" : "Criticità riaperta",
        "success",
      );
    } else {
      showToast("Impossibile aggiornare lo stato", "warning");
    }
  };

  const handleStartAdd = useCallback(
    (sectionId: SectionId, photo: string) => {
      if (!canManagePhotos) {
        showToast("Accedi per allegare foto", "warning");
        return;
      }
      openAddWithPhoto(sectionId, photo);
    },
    [canManagePhotos, openAddWithPhoto, showToast],
  );

  if (!hydrated) {
    return (
      <main className="checklist-main">
        <p className="page-loading">Caricamento...</p>
      </main>
    );
  }

  return (
    <>
      <main className="checklist-main">
        <div className="checklist-overview" aria-live="polite">
          <p className="checklist-overview-text">
            <strong>{inspectedSectionCount}</strong> / {inspectionSectionTotal}{" "}
            aree con contenuti ·             <strong>{visibleItems.length}</strong>{" "}
            {focusSessionId !== null ? "visualizzate (contesto completo)" : "aperte"}{" "}
            · <strong>{totalPhotoCount}</strong> allegati totali
          </p>
        </div>

        <div className="inspection-sections">
          {INSPECTION_SECTIONS.map((section) => (
            <InspectionSection
              key={section.id}
              section={section}
              items={getVisibleItemsForSection(section.id)}
              sectionCount={countVisibleForSection(section.id)}
              sectionDescription={sectionDescriptions[section.id] ?? ""}
              onSectionDescriptionSave={(value) => {
                setSectionDescription(section.id, value);
              }}
              formOpen={formOpen}
              isActiveFormSection={activeSectionId === section.id}
              formMode={formMode}
              formSession={formSession}
              editingId={editingId}
              focusedId={focusedCriticismId}
              formInitial={formInitial}
              canManagePhotos={canManagePhotos}
              savingPhoto={savingPhoto}
              onStartAdd={(photo) => handleStartAdd(section.id, photo)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleResolved={handleToggleResolved}
              onPhotoClick={setLightboxSrc}
              onFormCancel={closeForm}
              onFormSave={handleSave}
            />
          ))}
        </div>
      </main>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <Footer />
    </>
  );
}
