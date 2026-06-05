/**
 * Firebase Storage — criticità foto
 *
 * Path: users/{uid}/stations/{stationId}/criticisms/{criticismId}.jpg
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

function criticismPhotoRef(
  uid: string,
  stationId: string,
  criticismId: number,
) {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage non configurato");
  }
  return ref(
    storage,
    `users/${uid}/stations/${stationId}/criticisms/${criticismId}.jpg`,
  );
}

function stationPhotosPrefixRef(uid: string, stationId: string) {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage non configurato");
  }
  return ref(storage, `users/${uid}/stations/${stationId}/criticisms`);
}

export async function uploadCriticismPhoto(
  uid: string,
  stationId: string,
  criticismId: number,
  photo: string,
): Promise<string> {
  if (!isDataUrlPhoto(photo)) {
    return photo;
  }

  try {
    const blob = dataUrlToBlob(photo);
    const fileRef = criticismPhotoRef(uid, stationId, criticismId);
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
): Promise<void> {
  try {
    await deleteObject(criticismPhotoRef(uid, stationId, criticismId));
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "storage/object-not-found") return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

export async function deleteStationPhotos(
  uid: string,
  stationId: string,
): Promise<void> {
  try {
    const folderRef = stationPhotosPrefixRef(uid, stationId);
    await deleteStorageTree(folderRef);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "storage/object-not-found") return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}

async function deleteStorageTree(folderRef: ReturnType<typeof ref>): Promise<void> {
  const listing = await listAll(folderRef);
  await Promise.all(listing.items.map((itemRef) => deleteObject(itemRef)));
  await Promise.all(listing.prefixes.map((prefixRef) => deleteStorageTree(prefixRef)));
}

/** Elimina tutte le foto sotto users/{uid}/ (ricorsivo). */
export async function deleteAllUserStorage(uid: string): Promise<void> {
  const storage = getFirebaseStorage();
  if (!storage) return;

  try {
    const userRootRef = ref(storage, `users/${uid}`);
    await deleteStorageTree(userRootRef);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "storage/object-not-found") return;
    throw new Error(firebaseStorageErrorMessage(error));
  }
}
