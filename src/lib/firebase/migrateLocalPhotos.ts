import { isDataUrlPhoto } from "@/lib/criticismDisplay";
import { loadRegistry } from "@/lib/stationsStorage";
import { loadChecklistForStation, saveChecklistForStationSafe } from "@/lib/storage";
import { uploadCriticismPhoto } from "./criticismPhotos";

export interface PhotoMigrationResult {
  migrated: number;
  failed: number;
}

export async function migrateLocalPhotos(uid: string): Promise<PhotoMigrationResult> {
  const registry = loadRegistry();
  if (!registry) return { migrated: 0, failed: 0 };

  let migrated = 0;
  let failed = 0;

  for (const station of registry.stations) {
    const checklist = loadChecklistForStation(station.id);
    if (!checklist) continue;

    let changed = false;

    for (const item of checklist.items) {
      const photo = item.photos[0];
      if (!photo || !isDataUrlPhoto(photo)) continue;

      try {
        const remoteUrl = await uploadCriticismPhoto(
          uid,
          station.id,
          item.id,
          photo,
        );
        item.photos = [remoteUrl];
        changed = true;
        migrated += 1;
      } catch {
        failed += 1;
      }
    }

    if (changed) {
      saveChecklistForStationSafe(station.id, checklist);
    }
  }

  return { migrated, failed };
}
