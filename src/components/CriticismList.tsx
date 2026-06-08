"use client";

import type { Criticism, SeverityLevel } from "@/lib/types";
import { AddCriticismForm, type CriticismFormInitial } from "./AddCriticismForm";
import { CriticismCard } from "./CriticismCard";

interface CriticismListProps {
  items: Criticism[];
  editingId: number | null;
  formSession: number;
  focusedId?: number | null;
  formInitial?: CriticismFormInitial;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number, resolved: boolean) => void;
  onPhotoClick: (src: string) => void;
  onMove?: (id: number, direction: -1 | 1) => void;
  onFormCancel: () => void;
  onFormSave: (title: string, photo: string, severity: SeverityLevel) => void;
  canReorder?: boolean;
  authRequired?: boolean;
  saving?: boolean;
}

export function CriticismList({
  items,
  editingId,
  formSession,
  focusedId = null,
  formInitial,
  onEdit,
  onDelete,
  onToggleResolved,
  onPhotoClick,
  onMove,
  onFormCancel,
  onFormSave,
  canReorder = false,
  authRequired = false,
  saving = false,
}: CriticismListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="criticism-list">
      {items.map((item, index) => {
        const isEditingItem = editingId === item.id;

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
            index={index}
            totalInSection={items.length}
            canReorder={canReorder}
            focused={focusedId === item.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleResolved={onToggleResolved}
            onPhotoClick={onPhotoClick}
            onMove={onMove}
          />
        );
      })}
    </div>
  );
}
