"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { getPhotoDataUrl } from "@/lib/criticismDisplay";
import { getCriticismDomId } from "@/lib/criticismNavigation";
import type { Criticism } from "@/lib/types";
import { CriticismStatusBanner } from "./SeverityLabelBanner";

interface CriticismCardProps {
  item: Criticism;
  index: number;
  totalInSection: number;
  canReorder?: boolean;
  focused?: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleResolved: (id: number, resolved: boolean) => void;
  onPhotoClick: (src: string) => void;
  onMove?: (id: number, direction: -1 | 1) => void;
}

export function CriticismCard({
  item,
  index,
  totalInSection,
  canReorder = false,
  focused = false,
  onEdit,
  onDelete,
  onToggleResolved,
  onPhotoClick,
  onMove,
}: CriticismCardProps) {
  const photo = getPhotoDataUrl(item.photos);
  const canMoveBack = index > 0;
  const canMoveForward = index < totalInSection - 1;

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

        {item.title.trim() ? (
          <p className="crit-card-photo-title">{item.title}</p>
        ) : null}
        {canReorder && onMove ? (
          <div className="crit-card-reorder">
            <button
              type="button"
              className="btn-icon btn-icon--reorder"
              title="Sposta indietro"
              aria-label="Sposta indietro"
              disabled={!canMoveBack}
              onClick={() => onMove(item.id, -1)}
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <button
              type="button"
              className="btn-icon btn-icon--reorder"
              title="Sposta avanti"
              aria-label="Sposta avanti"
              disabled={!canMoveForward}
              onClick={() => onMove(item.id, 1)}
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        ) : null}
        <CriticismStatusBanner item={item} />
      </div>
    </div>
  );
}
