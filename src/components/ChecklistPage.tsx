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
import { applyFormStatus, type CriticismFormStatus } from "@/lib/criticismStatus";
import { getPhotoDataUrl } from "@/lib/criticismDisplay";
import { DEFAULT_SEVERITY } from "@/lib/severity";
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
    addCriticisms,
    updateCriticism,
    deleteCriticism,
    setCriticismResolved,
    moveCriticismInSection,
    focusSessionId,
    setFocusSessionId,
  } = useChecklistContext();

  const searchParams = useSearchParams();
  const urlFocusId = useMemo(
    () => parseCriticismFocusId(searchParams),
    [searchParams],
  );
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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
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
      resolved: item.resolved,
    };
  }, [editingId, items, visibleItems]);

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
    const shouldRestoreScroll = editScrollYRef.current !== null;
    setEditingId(null);
    if (shouldRestoreScroll) restoreEditScroll();
  }, [restoreEditScroll]);

  const openEdit = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    editScrollYRef.current = window.scrollY;
    setEditingId(id);
    setFormSession((s) => s + 1);
  };

  const handleSave = async (
    title: string,
    photo: string,
    status: CriticismFormStatus,
  ) => {
    if (!canManagePhotos) {
      showToast("Accedi per allegare foto", "warning");
      return;
    }
    if (savingPhoto || editingId === null) return;

    const existing =
      items.find((i) => i.id === editingId) ??
      visibleItems.find((i) => i.id === editingId);
    const currentSeverity = existing?.severity ?? DEFAULT_SEVERITY;
    const { severity, resolved } = applyFormStatus(currentSeverity, status);

    setSavingPhoto(true);
    try {
      const ok = await updateCriticism(
        editingId,
        title,
        photo,
        severity,
        resolved,
      );
      if (ok) {
        closeForm();
        showToast("Foto aggiornata", "success");
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

  const handleMoveCriticism = (
    sectionId: SectionId,
    id: number,
    direction: -1 | 1,
  ) => {
    if (!moveCriticismInSection(sectionId, id, direction)) {
      showToast("Impossibile riordinare la foto", "warning");
    }
  };

  const handleStartAdd = useCallback(
    async (sectionId: SectionId, photos: string[]) => {
      if (!canManagePhotos) {
        showToast("Accedi per allegare foto", "warning");
        return;
      }
      if (photos.length === 0 || savingPhoto) return;

      setSavingPhoto(true);
      try {
        const created = await addCriticisms(
          sectionId,
          photos,
          DEFAULT_SEVERITY,
        );
        if (created.length > 0) {
          showToast(
            created.length > 1
              ? `${created.length} foto aggiunte`
              : "Foto aggiunta",
            "success",
          );
        } else {
          showToast("Errore caricamento foto", "warning");
        }
      } finally {
        setSavingPhoto(false);
      }
    },
    [addCriticisms, canManagePhotos, savingPhoto, showToast],
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
              editingId={editingId}
              formSession={formSession}
              focusedId={focusedCriticismId}
              formInitial={editFormInitial}
              canManagePhotos={canManagePhotos}
              savingPhoto={savingPhoto}
              onStartAdd={(photos) => void handleStartAdd(section.id, photos)}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleResolved={handleToggleResolved}
              onPhotoClick={setLightboxSrc}
              onMove={(id, direction) =>
                handleMoveCriticism(section.id, id, direction)
              }
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
