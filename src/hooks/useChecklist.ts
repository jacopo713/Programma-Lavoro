"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canSavePhotoEntry, isDataUrlPhoto, isRemotePhoto } from "@/lib/criticismDisplay";
import { DEFAULT_STATION_NAME, MAX_STATION_NAME_LENGTH } from "@/lib/constants";
import { formatDateTimeIT } from "@/lib/format";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  deleteCriticismPhoto,
  deleteStationPhotos,
  uploadCriticismPhoto,
} from "@/lib/firebase/criticismPhotos";
import {
  deleteStationFromCloud,
  loadWorkspace,
  saveRegistryToCloud,
  saveStationChecklistToCloud,
} from "@/lib/firebase/workspace";
import type { SectionId } from "@/lib/inspectionSections";
import {
  INSPECTION_SECTION_COUNT,
  INSPECTION_SECTIONS,
} from "@/lib/inspectionSections";
import {
  createEmptySectionDescriptions,
  type SectionDescriptions,
} from "@/lib/sectionDescriptions";
import { isSectionIncludedInReport } from "@/lib/sectionReport";
import {
  createStationRecord,
  saveRegistrySafe,
} from "@/lib/stationsStorage";
import {
  getChecklistForStation,
  getDefaultChecklist,
  loadChecklistForStation,
  saveChecklistForStationSafe,
  StorageQuotaError,
} from "@/lib/storage";
import type {
  Criticism,
  ChecklistPersisted,
  SeverityLevel,
  Station,
  StationsRegistry,
  SyncStatus,
} from "@/lib/types";

const CLOUD_SAVE_DEBOUNCE_MS = 700;

function applyChecklistState(
  checklist: ChecklistPersisted,
  setters: {
    setItems: (items: Criticism[]) => void;
    setIdCounter: (id: number) => void;
    setStationName: (name: string) => void;
    setSectionDescriptions: (descriptions: SectionDescriptions) => void;
  },
) {
  setters.setItems(checklist.items);
  setters.setIdCounter(checklist.idCounter);
  setters.setStationName(checklist.stationName);
  setters.setSectionDescriptions(checklist.sectionDescriptions);
}

function getCurrentUserId(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

async function resolvePhotoForSave(
  uid: string,
  stationId: string,
  criticismId: number,
  photo: string,
  previousPhoto?: string,
): Promise<string> {
  if (isRemotePhoto(photo) && photo === previousPhoto) {
    return photo;
  }

  if (isDataUrlPhoto(photo)) {
    if (previousPhoto && isRemotePhoto(previousPhoto)) {
      try {
        await deleteCriticismPhoto(uid, stationId, criticismId);
      } catch {
        /* sostituzione: procedi con upload */
      }
    }
    return uploadCriticismPhoto(uid, stationId, criticismId, photo);
  }

  return photo;
}

export function useChecklist(
  uid: string | null,
  authReady: boolean,
  onStorageError?: () => void,
) {
  const [items, setItems] = useState<Criticism[]>([]);
  const [idCounter, setIdCounter] = useState(0);
  const [stationName, setStationName] = useState(DEFAULT_STATION_NAME);
  const [sectionDescriptions, setSectionDescriptions] =
    useState<SectionDescriptions>(createEmptySectionDescriptions);
  const [stations, setStations] = useState<Station[]>([]);
  const [activeStationId, setActiveStationId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [focusSessionId, setFocusSessionId] = useState<number | null>(null);

  const checklistTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const registryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushRegistryToCloud = useCallback(
    async (registry: StationsRegistry) => {
      if (!uid) return;
      try {
        setSyncStatus("syncing");
        await saveRegistryToCloud(uid, registry);
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    },
    [uid],
  );

  const scheduleRegistryCloudSave = useCallback(
    (registry: StationsRegistry) => {
      saveRegistrySafe(registry);
      if (!uid) return;
      if (registryTimerRef.current) {
        clearTimeout(registryTimerRef.current);
      }
      setSyncStatus("syncing");
      registryTimerRef.current = setTimeout(() => {
        void flushRegistryToCloud(registry);
      }, CLOUD_SAVE_DEBOUNCE_MS);
    },
    [uid, flushRegistryToCloud],
  );

  const flushChecklistToCloud = useCallback(
    async (stationId: string, data: ChecklistPersisted) => {
      if (!uid) return;
      try {
        setSyncStatus("syncing");
        await saveStationChecklistToCloud(uid, stationId, data);
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    },
    [uid],
  );

  const persist = useCallback(
    (stationId: string, data: ChecklistPersisted) => {
      try {
        saveChecklistForStationSafe(stationId, data);
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          onStorageError?.();
        }
        throw err;
      }

      if (!uid) return;

      const existing = checklistTimersRef.current.get(stationId);
      if (existing) clearTimeout(existing);
      setSyncStatus("syncing");
      checklistTimersRef.current.set(
        stationId,
        setTimeout(() => {
          void flushChecklistToCloud(stationId, data);
        }, CLOUD_SAVE_DEBOUNCE_MS),
      );
    },
    [uid, onStorageError, flushChecklistToCloud],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate checklist from cloud */
  useEffect(() => {
    if (!authReady || !uid) {
      setHydrated(false);
      setCloudSynced(false);
      setSyncStatus("idle");
      return;
    }

    let cancelled = false;
    setHydrated(false);
    setCloudSynced(false);
    setSyncStatus("loading");

    void loadWorkspace(uid)
      .then((workspace) => {
        if (cancelled) return;

        saveRegistrySafe(workspace.registry);
        for (const [stationId, checklist] of Object.entries(
          workspace.checklistsByStationId,
        )) {
          saveChecklistForStationSafe(stationId, checklist);
        }

        const activeChecklist =
          workspace.checklistsByStationId[workspace.registry.activeStationId] ??
          getDefaultChecklist();

        setStations(workspace.registry.stations);
        setActiveStationId(workspace.registry.activeStationId);
        applyChecklistState(activeChecklist, {
          setItems,
          setIdCounter,
          setStationName,
          setSectionDescriptions,
        });
        setCloudSynced(true);
        setHydrated(true);
        setSyncStatus("saved");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Caricamento workspace cloud:", error);
        setSyncStatus("error");
        setHydrated(true);
        setCloudSynced(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, uid]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const snapshot = useCallback(
    (
      nextItems: Criticism[],
      nextIdCounter: number,
      nextStationName: string = stationName,
      nextSectionDescriptions: SectionDescriptions = sectionDescriptions,
    ): ChecklistPersisted => ({
      version: 3,
      items: nextItems,
      idCounter: nextIdCounter,
      stationName: nextStationName,
      sectionDescriptions: nextSectionDescriptions,
    }),
    [stationName, sectionDescriptions],
  );

  const persistActive = useCallback(
    (data: ChecklistPersisted) => {
      if (!activeStationId) return;
      persist(activeStationId, data);
    },
    [activeStationId, persist],
  );

  const switchStation = useCallback(
    (nextId: string): boolean => {
      if (!activeStationId || nextId === activeStationId) return true;

      const target = stations.find((station) => station.id === nextId);
      if (!target) return false;

      try {
        persistActive(snapshot(items, idCounter, stationName, sectionDescriptions));

        const nextRegistry: StationsRegistry = {
          version: 1,
          activeStationId: nextId,
          stations,
        };
        scheduleRegistryCloudSave(nextRegistry);

        const nextChecklist = getChecklistForStation(nextId, target.name);
        setActiveStationId(nextId);
        applyChecklistState(nextChecklist, {
          setItems,
          setIdCounter,
          setStationName,
          setSectionDescriptions,
        });
        return true;
      } catch {
        return false;
      }
    },
    [
      activeStationId,
      stations,
      items,
      idCounter,
      stationName,
      sectionDescriptions,
      persistActive,
      snapshot,
      scheduleRegistryCloudSave,
    ],
  );

  const addStation = useCallback(
    (name: string): Station | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const station = createStationRecord(trimmed.slice(0, MAX_STATION_NAME_LENGTH));
      const nextRegistry: StationsRegistry = {
        version: 1,
        activeStationId,
        stations: [...stations, station],
      };

      try {
        const emptyChecklist = {
          ...getDefaultChecklist(),
          stationName: station.name,
        };
        saveChecklistForStationSafe(station.id, emptyChecklist);
        scheduleRegistryCloudSave(nextRegistry);
        if (uid) {
          void saveStationChecklistToCloud(uid, station.id, emptyChecklist);
        }
        setStations(nextRegistry.stations);
        return station;
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          onStorageError?.();
        }
        return null;
      }
    },
    [activeStationId, stations, uid, onStorageError, scheduleRegistryCloudSave],
  );

  const renameStation = useCallback(
    (id: string, name: string): boolean => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const nextName = trimmed.slice(0, MAX_STATION_NAME_LENGTH);
      const nextStations = stations.map((station) =>
        station.id === id ? { ...station, name: nextName } : station,
      );
      const nextRegistry: StationsRegistry = {
        version: 1,
        activeStationId,
        stations: nextStations,
      };

      try {
        scheduleRegistryCloudSave(nextRegistry);
        setStations(nextStations);

        if (id === activeStationId) {
          persistActive(snapshot(items, idCounter, nextName, sectionDescriptions));
          setStationName(nextName);
        } else {
          const saved = loadChecklistForStation(id);
          if (saved) {
            persist(id, { ...saved, stationName: nextName });
          }
        }
        return true;
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          onStorageError?.();
        }
        return false;
      }
    },
    [
      activeStationId,
      stations,
      items,
      idCounter,
      sectionDescriptions,
      persistActive,
      persist,
      snapshot,
      onStorageError,
      scheduleRegistryCloudSave,
    ],
  );

  const reloadActiveChecklist = useCallback(() => {
    if (!activeStationId) return;
    const station = stations.find((entry) => entry.id === activeStationId);
    const checklist = getChecklistForStation(
      activeStationId,
      station?.name ?? stationName,
    );
    applyChecklistState(checklist, {
      setItems,
      setIdCounter,
      setStationName,
      setSectionDescriptions,
    });
  }, [activeStationId, stations, stationName]);

  const deleteStation = useCallback(
    async (id: string): Promise<boolean> => {
      if (stations.length <= 1) return false;

      const uidForPhotos = getCurrentUserId();
      if (uidForPhotos) {
        try {
          await deleteStationPhotos(uidForPhotos, id);
        } catch {
          /* elimina comunque i dati */
        }
      }

      const nextStations = stations.filter((station) => station.id !== id);
      const nextActiveId =
        id === activeStationId ? nextStations[0].id : activeStationId;
      const nextRegistry: StationsRegistry = {
        version: 1,
        activeStationId: nextActiveId,
        stations: nextStations,
      };

      try {
        scheduleRegistryCloudSave(nextRegistry);
        if (uid) {
          void deleteStationFromCloud(uid, id);
        }
        setStations(nextStations);

        if (id === activeStationId) {
          const active = nextStations[0];
          const nextChecklist = getChecklistForStation(nextActiveId, active.name);
          setActiveStationId(nextActiveId);
          applyChecklistState(nextChecklist, {
            setItems,
            setIdCounter,
            setStationName,
            setSectionDescriptions,
          });
        }
        return true;
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          onStorageError?.();
        }
        return false;
      }
    },
    [activeStationId, stations, uid, onStorageError, scheduleRegistryCloudSave],
  );

  const getStationCriticismCount = useCallback((stationId: string): number => {
    const saved = loadChecklistForStation(stationId);
    return saved?.items.length ?? 0;
  }, []);

  const stationHasContent = useCallback((stationId: string): boolean => {
    const saved = loadChecklistForStation(stationId);
    if (!saved) return false;
    if (saved.items.length > 0) return true;
    return Object.values(saved.sectionDescriptions).some(
      (description) => description.trim().length > 0,
    );
  }, []);

  const seedStationsFromProfile = useCallback(
    (primaryName: string, additionalNames: string[]): boolean => {
      const primary = primaryName.trim().slice(0, MAX_STATION_NAME_LENGTH);
      if (!primary || !activeStationId) return false;

      const extras = additionalNames
        .map((name) => name.trim().slice(0, MAX_STATION_NAME_LENGTH))
        .filter(Boolean)
        .filter(
          (name, index, list) =>
            list.findIndex(
              (entry) => entry.toLowerCase() === name.toLowerCase(),
            ) === index,
        )
        .filter((name) => name.toLowerCase() !== primary.toLowerCase());

      try {
        let nextStations = [...stations];
        let nextActiveId = activeStationId;

        const findByName = (name: string) =>
          nextStations.find(
            (station) => station.name.toLowerCase() === name.toLowerCase(),
          );

        const isDefaultOnlyEmpty =
          nextStations.length === 1 &&
          nextStations[0].name === DEFAULT_STATION_NAME &&
          !stationHasContent(nextStations[0].id);

        if (isDefaultOnlyEmpty) {
          const stationId = nextStations[0].id;
          nextStations = [{ ...nextStations[0], name: primary }];
          nextActiveId = stationId;

          const saved =
            loadChecklistForStation(stationId) ?? getDefaultChecklist();
          persist(stationId, {
            ...saved,
            stationName: primary,
          });

          setStationName(primary);
        } else {
          const existingPrimary = findByName(primary);
          if (existingPrimary) {
            nextActiveId = existingPrimary.id;
          } else {
            const station = createStationRecord(primary);
            persist(station.id, {
              ...getDefaultChecklist(),
              stationName: station.name,
            });
            nextStations = [...nextStations, station];
            nextActiveId = station.id;
          }
        }

        for (const name of extras) {
          if (!findByName(name)) {
            const station = createStationRecord(name);
            persist(station.id, {
              ...getDefaultChecklist(),
              stationName: station.name,
            });
            nextStations = [...nextStations, station];
          }
        }

        const nextRegistry = {
          version: 1 as const,
          activeStationId: nextActiveId,
          stations: nextStations,
        };
        scheduleRegistryCloudSave(nextRegistry);
        setStations(nextStations);

        if (nextActiveId !== activeStationId) {
          persistActive(snapshot(items, idCounter, stationName, sectionDescriptions));

          const target = nextStations.find(
            (station) => station.id === nextActiveId,
          );
          if (target) {
            const nextChecklist = getChecklistForStation(
              nextActiveId,
              target.name,
            );
            setActiveStationId(nextActiveId);
            applyChecklistState(nextChecklist, {
              setItems,
              setIdCounter,
              setStationName,
              setSectionDescriptions,
            });
          }
        }

        return true;
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          onStorageError?.();
        }
        return false;
      }
    },
    [
      activeStationId,
      stations,
      stationHasContent,
      onStorageError,
      items,
      idCounter,
      stationName,
      sectionDescriptions,
      persistActive,
      persist,
      snapshot,
      scheduleRegistryCloudSave,
    ],
  );

  const setSectionDescriptionAndSave = useCallback(
    (sectionId: SectionId, text: string): boolean => {
      const nextDescriptions: SectionDescriptions = {
        ...sectionDescriptions,
        [sectionId]: text,
      };
      try {
        persistActive(snapshot(items, idCounter, stationName, nextDescriptions));
        setSectionDescriptions(nextDescriptions);
        return true;
      } catch {
        return false;
      }
    },
    [items, idCounter, stationName, sectionDescriptions, persistActive, snapshot],
  );

  const getItemsForSection = useCallback(
    (sectionId: SectionId) =>
      items.filter((item) => item.sectionId === sectionId),
    [items],
  );

  const countForSection = useCallback(
    (sectionId: SectionId) =>
      items.filter((item) => item.sectionId === sectionId).length,
    [items],
  );

  const totalCount = items.length;
  const inspectedSectionCount = useMemo(() => {
    let n = 0;
    for (const section of INSPECTION_SECTIONS) {
      if (
        isSectionIncludedInReport(
          section.id,
          items,
          sectionDescriptions,
        )
      ) {
        n += 1;
      }
    }
    return n;
  }, [items, sectionDescriptions]);

  const hasReportContent = useMemo(() => {
    if (totalCount > 0) return true;
    return Object.values(sectionDescriptions).some((d) => d.trim().length > 0);
  }, [totalCount, sectionDescriptions]);

  const totalPhotoCount = useMemo(
    () => items.reduce((sum, item) => sum + item.photos.length, 0),
    [items],
  );

  const addCriticism = useCallback(
    async (
      sectionId: SectionId,
      title: string,
      photo: string,
      severity: SeverityLevel,
    ): Promise<Criticism | null> => {
      if (!canSavePhotoEntry(title, photo)) return null;

      const currentUid = getCurrentUserId();
      if (!currentUid || !activeStationId) return null;

      const newId = idCounter + 1;

      let remotePhoto: string;
      try {
        remotePhoto = await resolvePhotoForSave(
          currentUid,
          activeStationId,
          newId,
          photo,
        );
      } catch {
        return null;
      }

      const item: Criticism = {
        id: newId,
        sectionId,
        title: title.trim(),
        time: formatDateTimeIT(new Date()),
        photos: [remotePhoto],
        severity,
        resolved: false,
      };

      const nextItems = [...items, item];

      try {
        persistActive(snapshot(nextItems, newId));
        setItems(nextItems);
        setIdCounter(newId);
        return item;
      } catch {
        return null;
      }
    },
    [items, idCounter, activeStationId, persistActive, snapshot],
  );

  const deleteCriticism = useCallback(
    async (id: number): Promise<boolean> => {
      const existing = items.find((item) => item.id === id);
      const currentUid = getCurrentUserId();

      if (
        currentUid &&
        activeStationId &&
        existing?.photos[0] &&
        isRemotePhoto(existing.photos[0])
      ) {
        try {
          await deleteCriticismPhoto(currentUid, activeStationId, id);
        } catch {
          /* rimuovi comunque dal checklist */
        }
      }

      const nextItems = items.filter((item) => item.id !== id);
      try {
        persistActive(snapshot(nextItems, idCounter));
        setItems(nextItems);
        return true;
      } catch {
        return false;
      }
    },
    [items, idCounter, activeStationId, persistActive, snapshot],
  );

  const updateCriticism = useCallback(
    async (
      id: number,
      title: string,
      photo: string,
      severity: SeverityLevel,
    ): Promise<boolean> => {
      if (!canSavePhotoEntry(title, photo)) return false;

      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return false;

      const existing = items[index];
      const currentUid = getCurrentUserId();
      if (!currentUid || !activeStationId) return false;

      let remotePhoto: string;
      try {
        remotePhoto = await resolvePhotoForSave(
          currentUid,
          activeStationId,
          id,
          photo,
          existing.photos[0],
        );
      } catch {
        return false;
      }

      const updated: Criticism = {
        ...existing,
        title: title.trim(),
        photos: [remotePhoto],
        severity,
      };

      const nextItems = [...items];
      nextItems[index] = updated;

      try {
        persistActive(snapshot(nextItems, idCounter));
        setItems(nextItems);
        return true;
      } catch {
        return false;
      }
    },
    [items, idCounter, activeStationId, persistActive, snapshot],
  );

  const setCriticismResolved = useCallback(
    (id: number, resolved: boolean): boolean => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return false;

      const existing = items[index];
      if (existing.resolved === resolved) return true;

      const nextItems = [...items];
      nextItems[index] = { ...existing, resolved };

      try {
        persistActive(snapshot(nextItems, idCounter));
        setItems(nextItems);
        return true;
      } catch {
        return false;
      }
    },
    [items, idCounter, persistActive, snapshot],
  );

  return {
    items,
    stationName,
    sectionDescriptions,
    stations,
    activeStationId,
    hydrated,
    cloudSynced,
    syncStatus,
    switchStation,
    addStation,
    renameStation,
    deleteStation,
    getStationCriticismCount,
    stationHasContent,
    seedStationsFromProfile,
    setSectionDescription: setSectionDescriptionAndSave,
    reloadActiveChecklist,
    addCriticism,
    updateCriticism,
    deleteCriticism,
    setCriticismResolved,
    getItemsForSection,
    countForSection,
    totalCount,
    inspectedSectionCount,
    inspectionSectionTotal: INSPECTION_SECTION_COUNT,
    totalPhotoCount,
    hasReportContent,
    focusSessionId,
    setFocusSessionId,
    resetToDefault: () => {
      const def = getDefaultChecklist();
      const active = stations.find((station) => station.id === activeStationId);
      const next = {
        ...def,
        stationName: active?.name ?? def.stationName,
      };
      applyChecklistState(next, {
        setItems,
        setIdCounter,
        setStationName,
        setSectionDescriptions,
      });
      if (activeStationId) {
        persistActive(next);
      }
    },
  };
}
