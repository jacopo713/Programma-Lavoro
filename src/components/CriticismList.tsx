"use client";

import { Clipboard } from "lucide-react";
import type { Criticism, SeverityLevel } from "@/lib/types";
import { AddCriticismForm, type CriticismFormInitial } from "./AddCriticismForm";
import { CriticismCard } from "./CriticismCard";

interface CriticismListProps {
  items: Criticism[];
  focusedId?: number | null;
  formOpen: boolean;
  formMode: "add" | "edit";
  formSession: number;
  editingId: number | null;
  formInitial?: CriticismFormInitial;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number, resolved: boolean) => void;
  onPhotoClick: (src: string) => void;
  onFormCancel: () => void;
  onFormSave: (title: string, photo: string, severity: SeverityLevel) => void;
  authRequired?: boolean;
  saving?: boolean;
}

export function CriticismList({
  items,
  focusedId = null,
  formOpen,
  formMode,
  formSession,
  editingId,
  formInitial,
  onEdit,
  onDelete,
  onToggleResolved,
  onPhotoClick,
  onFormCancel,
  onFormSave,
  authRequired = false,
  saving = false,
}: CriticismListProps) {
  const showEmptyState =
    items.length === 0 && !(formOpen && formMode === "add");

  return (
    <div className="criticism-list">
      {showEmptyState ? (
        <div className="criticism-list-empty empty-state">
          <Clipboard size={36} strokeWidth={1.5} aria-hidden />
          <p>Nessuna foto in questa area</p>
          <small>Usa «Aggiungi foto» per allegare un&apos;immagine</small>
        </div>
      ) : (
        items.map((item) => {
          const isEditingItem =
            formOpen && formMode === "edit" && editingId === item.id;

          if (isEditingItem) {
            return (
              <AddCriticismForm
                key={`edit-${formSession}`}
                layout="inline"
                editingId={item.id}
                open
                mode="edit"
                initial={formInitial}
                onCancel={onFormCancel}
                onSave={onFormSave}
                authRequired={authRequired}
                saving={saving}
              />
            );
          }

          return (
            <CriticismCard
              key={item.id}
              item={item}
              focused={focusedId === item.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleResolved={onToggleResolved}
              onPhotoClick={onPhotoClick}
            />
          );
        })
      )}

      {formOpen && formMode === "add" && (
        <AddCriticismForm
          key={`add-${formSession}`}
          open
          mode="add"
          layout="panel"
          initial={formInitial}
          onCancel={onFormCancel}
          onSave={onFormSave}
          authRequired={authRequired}
          saving={saving}
        />
      )}
    </div>
  );
}
