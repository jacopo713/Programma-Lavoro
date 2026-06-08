/**
 * Firebase Storage — criticità foto
 *
 * Path: users/{uid}/stations/{stationId}/criticisms/{criticismId}.jpg
 *       users/{uid}/stations/{stationId}/criticisms/{criticismId}_{index}.jpg (index > 0)
 *
 * Regole da applicare in Firebase Console → Storage → Rules:
 *
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /users/{userId}/stations/{stationId}/criticisms/{fileName} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */

import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";
import { dataUrlToBlob } from "@/lib/compressImage";
import { isDataUrlPhoto } from "@/lib/criticismDisplay";
import { getFirebaseStorage } from "./client";
import { firebaseStorageErrorMessage } from "./storageErrors";

export function criticismPhotoFileName(
  criticismId: number,
  photoIndex = 0,
): string {
  return photoIndex === 0
    ? `${criticismId}.jpg`
    : `${criticismId}_${photoIndex}.jpg`;
}

function criticismPhotoRef(
  uid: string,
  stationId: string,
  criticismId: number,
  photoIndex = 0,
) {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage non configurato");
  }
  return ref(
    storage,
    `users/${uid}/stations/${stationId}/criticisms/${criticismPhotoFileName(criticismId, photoIndex)}`,
  );
}

function stationPhotosPrefixRef(uid: string, stationId: string) {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage non configurato");
  }
  return ref(storage, `users/${uid}/stations/${stationId}/criticisms`);
}

function isCriticismPhotoFile(fileName: string, criticismId: number): boolean {
  return (
    fileName === criticismPhotoFileName(criticismId, 0) ||
    fileName.startsWith(`${criticismId}_`)
  );
}

export async function uploadCriticismPhoto(
  uid: string,
  stationId: string,
  criticismId: number,
  photo: string,
  photoIndex = 0,
): Promise<string> {
  if (!isDataUrlPhoto(photo)) {
    return photo;
  }

  try {
    const blob = dataUrlToBlob(photo);
    const fileRef = criticismPhotoRef(uid, stationId, criticismId, photoIndex);
    await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
    return await getDownloadURL(fileRef);
  } catch (error) {
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

export async function deleteCriticismPhoto(
  uid: string,
  stationId: string,
  criticismId: number,
  photoIndex = 0,
): Promise<void> {
  try {
    await deleteObject(
      criticismPhotoRef(uid, stationId, criticismId, photoIndex),
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "storage/object-not-found") return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

export async function deleteAllCriticismPhotos(
  uid: string,
  stationId: string,
  criticismId: number,
): Promise<void> {
  try {
    const folderRef = stationPhotosPrefixRef(uid, stationId);
    const listing = await listAll(folderRef);
    const toDelete = listing.items.filter((itemRef) =>
      isCriticismPhotoFile(itemRef.name, criticismId),
    );
    await Promise.all(
      toDelete.map((itemRef) =>
        deleteObject(itemRef).catch((error) => {
          const code =
            error && typeof error === "object" && "code" in error
              ? String((error as { code: string }).code)
              : "";
          if (code === "storage/object-not-found") return;
          throw error;
        }),
      ),
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "storage/object-not-found") return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

function storageErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: string }).code);
  }
  return "";
}

function isBenignStorageDeleteError(code: string): boolean {
  return (
    code === "storage/object-not-found" ||
    code === "storage/unauthorized" ||
    code === "storage/unauthenticated"
  );
}

export async function deleteStationPhotos(
  uid: string,
  stationId: string,
): Promise<void> {
  try {
    const folderRef = stationPhotosPrefixRef(uid, stationId);
    const listing = await listAll(folderRef);
    await Promise.all(listing.items.map((itemRef) => deleteObject(itemRef)));
  } catch (error) {
    const code = storageErrorCode(error);
    if (isBenignStorageDeleteError(code)) return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

/** Elimina le foto per ogni sede nota (path consentito dalle regole Storage). */
export async function deleteAllUserStorage(
  uid: string,
  stationIds: Iterable<string>,
): Promise<void> {
  const errors: unknown[] = [];

  for (const stationId of stationIds) {
    try {
      await deleteStationPhotos(uid, stationId);
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    console.warn("Alcune foto non sono state rimosse da Storage:", errors);
  }
}
