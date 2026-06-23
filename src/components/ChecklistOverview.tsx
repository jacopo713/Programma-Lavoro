"use client";

import { useMemo } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { getChecklistVisibleItems } from "@/lib/criticismNavigation";

export function ChecklistOverview() {
  const {
    items,
    focusSessionId,
    inspectedSectionCount,
    inspectionSectionTotal,
    totalPhotoCount,
    hydrated,
  } = useChecklistContext();

  const visibleItems = useMemo(
    () => getChecklistVisibleItems(items, focusSessionId),
    [items, focusSessionId],
  );
  const openCount = useMemo(
    () => items.filter((item) => !item.resolved).length,
    [items],
  );

  if (!hydrated) return null;

  const inFocus = focusSessionId !== null;
  const openLabel = inFocus ? "In focus" : "Aperte";
  const openTitle = inFocus
    ? `${visibleItems.length} criticità visualizzate nel contesto completo`
    : `${openCount} criticità aperte`;

  return (
    <ul className="checklist-stats" aria-label="Riepilogo checklist">
      <li className="checklist-stat">
        <span className="checklist-stat-value">
          <strong>{inspectedSectionCount}</strong>/{inspectionSectionTotal}
        </span>
        <span className="checklist-stat-label">Aree</span>
      </li>
      <li className="checklist-stat" title={openTitle}>
        <span className="checklist-stat-value">
          <strong>{inFocus ? visibleItems.length : openCount}</strong>
        </span>
        <span className="checklist-stat-label">{openLabel}</span>
      </li>
      <li className="checklist-stat">
        <span className="checklist-stat-value">
          <strong>{totalPhotoCount}</strong>
        </span>
        <span className="checklist-stat-label">Allegati</span>
      </li>
    </ul>
  );
}
