"use client";

import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { getPhotoDataUrl } from "@/lib/criticismDisplay";
import { getCriticismDomId } from "@/lib/criticismNavigation";
import type { Criticism } from "@/lib/types";
import { SeverityLabelBanner } from "./SeverityLabelBanner";

interface CriticismCardProps {
  item: Criticism;
  focused?: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number, resolved: boolean) => void;
  onPhotoClick: (src: string) => void;
}

export function CriticismCard({
  item,
  focused = false,
  onEdit,
  onDelete,
  onToggleResolved,
  onPhotoClick,
}: CriticismCardProps) {
  const photo = getPhotoDataUrl(item.photos);

  return (
    <div
      id={getCriticismDomId(item.id)}
      className={`crit-card crit-card--photo-entry${item.resolved ? " crit-card--resolved" : ""}${focused ? " crit-card--focused" : ""}`}
    >
      <div className="crit-card-photo-block">
        <div className="crit-card-photo-toolbar">
          <button
            type="button"
            className="btn-icon btn-icon--edit"
            title="Modifica"
            aria-label="Modifica foto"
            onClick={() => onEdit(item.id)}
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="btn-icon btn-icon--resolve"
            title={item.resolved ? "Riapri criticità" : "Segna come risolto"}
            aria-label={
              item.resolved ? "Riapri criticità" : "Segna come risolto"
            }
            onClick={() => onToggleResolved(item.id, !item.resolved)}
          >
            {item.resolved ? (
              <RotateCcw size={14} aria-hidden />
            ) : (
              <CheckCircle2 size={14} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="btn-icon btn-icon--delete"
            title="Elimina"
            aria-label="Elimina foto"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>

        {photo ? (
          <button
            type="button"
            className="crit-card-photo"
            title="Clicca per ingrandire"
            onClick={() => onPhotoClick(photo)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={item.title} />
          </button>
        ) : (
          <p className="crit-card-missing-photo">Foto non disponibile</p>
        )}

        <p className="crit-card-photo-title">{item.title}</p>
        <SeverityLabelBanner level={item.severity} />
      </div>
    </div>
  );
}
