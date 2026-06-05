"use client";

import { Building2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useAppToast } from "@/contexts/ToastContext";
import { MAX_STATION_NAME_LENGTH } from "@/lib/constants";
import type { Station } from "@/lib/types";
import { Footer } from "./Footer";

function StationRow({
  station,
  isActive,
  criticismCount,
  canDelete,
  onRename,
  onDelete,
  onCompile,
}: {
  station: Station;
  isActive: boolean;
  criticismCount: number;
  canDelete: boolean;
  onRename: (id: string, name: string) => boolean;
  onDelete: (id: string) => boolean;
  onCompile: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(station.name);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(station.name);
      setEditing(false);
      return;
    }
    if (trimmed !== station.name) {
      onRename(station.id, trimmed);
    }
    setEditing(false);
  }, [draft, onRename, station.id, station.name]);

  const handleDelete = useCallback(() => {
    onDelete(station.id);
  }, [onDelete, station.id]);

  return (
    <article className="station-card">
      <div className="station-card-main">
        <div className="station-card-icon" aria-hidden>
          <Building2 size={18} />
        </div>
        <div className="station-card-body">
          {editing ? (
            <input
              type="text"
              className="station-card-name-input"
              value={draft}
              maxLength={MAX_STATION_NAME_LENGTH}
              aria-label="Rinomina stazione"
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDraft(station.name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div className="station-card-title-row">
              <h2 className="station-card-name">{station.name}</h2>
              {isActive ? (
                <span className="station-card-badge">Attiva</span>
              ) : null}
            </div>
          )}
          <p className="station-card-meta">
            {criticismCount}{" "}
            {criticismCount === 1 ? "criticità" : "criticità"}
          </p>
        </div>
      </div>
      <div className="station-card-actions">
        <button
          type="button"
          className="btn-icon btn-icon--edit"
          aria-label={`Rinomina ${station.name}`}
          onClick={() => {
            setDraft(station.name);
            setEditing(true);
          }}
        >
          <Pencil size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="btn-icon btn-icon--delete"
          aria-label={`Elimina ${station.name}`}
          disabled={!canDelete}
          title={canDelete ? "Elimina stazione" : "Impossibile eliminare l'ultima stazione"}
          onClick={handleDelete}
        >
          <Trash2 size={16} aria-hidden />
        </button>
        <button
          type="button"
          className="btn-save station-card-compile"
          onClick={() => onCompile(station.id)}
        >
          Compila
        </button>
      </div>
    </article>
  );
}

export function StationsPage() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const {
    stations,
    activeStationId,
    hydrated,
    addStation,
    renameStation,
    deleteStation,
    switchStation,
    getStationCriticismCount,
    stationHasContent,
  } = useChecklistContext();
  const [newStationName, setNewStationName] = useState("");

  const handleAddStation = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const created = addStation(newStationName);
      if (created) {
        setNewStationName("");
        showToast(`Stazione "${created.name}" aggiunta`, "success");
      } else {
        showToast("Impossibile aggiungere la stazione", "warning");
      }
    },
    [addStation, newStationName, showToast],
  );

  const handleRename = useCallback(
    (id: string, name: string) => {
      const ok = renameStation(id, name);
      if (ok) showToast("Nome stazione aggiornato", "success");
      else showToast("Impossibile aggiornare il nome", "warning");
      return ok;
    },
    [renameStation, showToast],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const station = stations.find((entry) => entry.id === id);
      if (!station) return false;

      const count = getStationCriticismCount(id);
      const hasContent = stationHasContent(id);
      const message = hasContent
        ? `Eliminare "${station.name}"? La checklist contiene dati (${count} criticità o note di sezione).`
        : `Eliminare la stazione "${station.name}"?`;
      if (!window.confirm(message)) return false;

      void deleteStation(id).then((ok) => {
        if (ok) showToast("Stazione eliminata", "success");
        else showToast("Impossibile eliminare la stazione", "warning");
      });
      return true;
    },
    [deleteStation, getStationCriticismCount, stationHasContent, stations, showToast],
  );

  const handleCompile = useCallback(
    (id: string) => {
      const ok = switchStation(id);
      if (ok) {
        router.push("/");
      } else {
        showToast("Impossibile aprire la checklist", "warning");
      }
    },
    [router, showToast, switchStation],
  );

  if (!hydrated) {
    return (
      <main className="page-main">
        <p className="page-loading">Caricamento...</p>
      </main>
    );
  }

  return (
    <>
      <main className="page-main">
        <p className="stations-intro">
          Gestisci le sedi. Ogni sede ha una checklist indipendente.
        </p>

        <form className="stations-add-form" onSubmit={handleAddStation}>
          <label className="stations-add-label" htmlFor="new-station-name">
            Nuova sede
          </label>
          <div className="stations-add-row">
            <input
              id="new-station-name"
              type="text"
              className="stations-add-input"
              value={newStationName}
              maxLength={MAX_STATION_NAME_LENGTH}
              placeholder="Es. Sede nord, Cantiere A"
              onChange={(event) => setNewStationName(event.target.value)}
            />
            <button
              type="submit"
              className="btn-save"
              disabled={!newStationName.trim()}
            >
              Aggiungi
            </button>
          </div>
        </form>

        <div className="stations-list">
          {stations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              isActive={station.id === activeStationId}
              criticismCount={getStationCriticismCount(station.id)}
              canDelete={stations.length > 1}
              onRename={handleRename}
              onDelete={handleDelete}
              onCompile={handleCompile}
            />
          ))}
        </div>

        <p className="stations-hint">
          Seleziona la stazione attiva dalla checklist con il menu in alto a destra, oppure usa{" "}
          <Link href="/">Compila</Link> da qui.
        </p>
      </main>
      <Footer />
    </>
  );
}
