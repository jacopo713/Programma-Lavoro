"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChecklistContext } from "@/contexts/ChecklistContext";
import { useAppToast } from "@/contexts/ToastContext";
import { migrateLocalPhotos } from "@/lib/firebase/migrateLocalPhotos";

export function usePhotoMigration() {
  const { user, loading } = useAuth();
  const { hydrated, cloudSynced, reloadActiveChecklist } = useChecklistContext();
  const { showToast } = useAppToast();
  const migratedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !hydrated || !cloudSynced || !user) return;
    if (migratedForUid.current === user.uid) return;

    void migrateLocalPhotos(user.uid).then(({ migrated, failed }) => {
      if (migrated > 0) {
        reloadActiveChecklist();
        showToast(
          migrated === 1
            ? "1 foto migrata su cloud"
            : `${migrated} foto migrate su cloud`,
          "success",
        );
      }
      if (failed === 0) {
        migratedForUid.current = user.uid;
      }
      if (failed > 0) {
        showToast(
          failed === 1
            ? "1 foto non migrata — controlla le regole Storage in Firebase Console"
            : `${failed} foto non migrate — controlla le regole Storage in Firebase Console`,
          "warning",
        );
      }
      if (migrated === 0 && failed === 0) {
        migratedForUid.current = user.uid;
      }
    });
  }, [user, loading, hydrated, cloudSynced, reloadActiveChecklist, showToast]);
}

function PhotoMigrationRunner() {
  usePhotoMigration();
  return null;
}

export { PhotoMigrationRunner };
