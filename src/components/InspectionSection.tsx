"use client";

import { Plus } from "lucide-react";
import { useRef } from "react";
import { useAppToast } from "@/contexts/ToastContext";
import { useImageFileInput } from "@/hooks/useImageFileInput";
import type { InspectionSectionDef } from "@/lib/inspectionSections";
import type { Criticism, SeverityLevel } from "@/lib/types";
import type { CriticismFormInitial } from "./AddCriticismForm";
import { CriticismList } from "./CriticismList";
import { SectionDescriptionField } from "./SectionDescriptionField";

interface InspectionSectionProps {
  section: InspectionSectionDef;
  items: Criticism[];
  sectionCount: number;
  sectionDescription: string;
  onSectionDescriptionSave: (value: string) => void;
  formOpen: boolean;
  isActiveFormSection: boolean;
  formMode: "add" | "edit";
  formSession: number;
  editingId: number | null;
  focusedId?: number | null;
  formInitial?: CriticismFormInitial;
  onStartAdd: (photo: string) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number, resolved: boolean) => void;
  onPhotoClick: (src: string) => void;
  onFormCancel: () => void;
  onFormSave: (title: string, photo: string, severity: SeverityLevel) => void;
  canManagePhotos?: boolean;
  savingPhoto?: boolean;
}

export function InspectionSection({
  section,
  items,
  sectionCount,
  sectionDescription,
  onSectionDescriptionSave,
  formOpen,
  isActiveFormSection,
  formMode,
  formSession,
  editingId,
  focusedId = null,
  formInitial,
  onStartAdd,
  onEdit,
  onDelete,
  onToggleResolved,
  onPhotoClick,
  onFormCancel,
  onFormSave,
  canManagePhotos = true,
  savingPhoto = false,
}: InspectionSectionProps) {
  const rootRef = useRef<HTMLElement>(null);
  const titleId = `section-title-${section.id}`;
  const { showToast } = useAppToast();

  const { openPicker, inputProps } = useImageFileInput({
    onPhotoReady: onStartAdd,
    showToast,
  });

  const handleOpenPicker = () => {
    if (!canManagePhotos) {
      showToast("Accedi per allegare foto", "warning");
      return;
    }
    openPicker();
  };

  const addFormActive =
    formOpen && isActiveFormSection && formMode === "add";

  return (
    <section
      ref={rootRef}
      className="inspection-section"
      aria-labelledby={titleId}
      data-section-id={section.id}
    >
      <input {...inputProps} />

      <header className="section-header">
        <div className="section-header-row">
          <h2 id={titleId} className="section-title">
            <span className="section-number">{section.number}.</span>{" "}
            {section.title}
          </h2>
          <button
            type="button"
            className="btn-section-add"
            onClick={handleOpenPicker}
            disabled={addFormActive || !canManagePhotos}
            aria-label={`Aggiungi foto in ${section.title}`}
            title={canManagePhotos ? undefined : "Accedi per allegare foto"}
          >
            <Plus size={16} aria-hidden />
            Aggiungi foto
          </button>
        </div>
        {!canManagePhotos ? (
          <p className="section-auth-hint">Accedi per allegare foto alle criticità.</p>
        ) : null}
        <p className="section-hint">{section.hint}</p>
      </header>

      <SectionDescriptionField
        sectionTitle={section.title}
        value={sectionDescription}
        onSave={onSectionDescriptionSave}
      />

      <div className="total-bar">
        <div className="total-bar-label">
          Foto in questa area: <strong>{sectionCount}</strong>
        </div>
      </div>

      <CriticismList
        items={items}
        focusedId={focusedId}
        formOpen={formOpen && isActiveFormSection}
        formMode={formMode}
        formSession={formSession}
        editingId={editingId}
        formInitial={formInitial}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleResolved={onToggleResolved}
        onPhotoClick={onPhotoClick}
        onFormCancel={onFormCancel}
        onFormSave={onFormSave}
        authRequired={!canManagePhotos}
        saving={savingPhoto}
      />
    </section>
  );
}
