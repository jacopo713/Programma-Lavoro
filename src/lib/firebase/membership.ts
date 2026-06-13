import { doc, getDoc, runTransaction } from "firebase/firestore";
import type { User } from "firebase/auth";
import { ensureFirestoreOnline, getFirestoreDb } from "./client";

/** Numero massimo di utenti ammessi. Deve combaciare col valore nelle regole. */
export const MAX_USERS = 30;

const MEMBERS_COLLECTION = "members";

function counterRefOf(db: ReturnType<typeof getFirestoreDb>) {
  return doc(db!, "meta", "members");
}

function readCount(snap: { exists: () => boolean; data: () => unknown }): number {
  if (!snap.exists()) return 0;
  const data = snap.data() as { count?: unknown };
  return typeof data.count === "number" ? data.count : 0;
}

class SeatsFullError extends Error {}

/**
 * Garantisce che l'utente occupi uno dei posti disponibili.
 * - true  → è già membro oppure ha appena ottenuto un posto
 * - false → limite massimo raggiunto (nessun posto libero)
 * Lancia in caso di errore non gestibile (es. rete/regole).
 */
export async function ensureMembership(user: User): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  await ensureFirestoreOnline();

  const memberRef = doc(db, MEMBERS_COLLECTION, user.uid);
  const existing = await getDoc(memberRef);
  if (existing.exists()) return true;

  const counterRef = counterRefOf(db);

  try {
    await runTransaction(db, async (tx) => {
      const memberSnap = await tx.get(memberRef);
      if (memberSnap.exists()) return;

      const counterSnap = await tx.get(counterRef);
      const current = readCount(counterSnap);
      if (current >= MAX_USERS) {
        throw new SeatsFullError();
      }

      tx.set(memberRef, { joinedAt: new Date().toISOString() });
      tx.update(counterRef, { count: current + 1 });
    });
    return true;
  } catch (error) {
    if (error instanceof SeatsFullError) return false;
    throw error;
  }
}

/**
 * Libera il posto occupato dall'utente (alla cancellazione dell'account).
 * Best-effort: non deve bloccare la cancellazione.
 */
export async function releaseMembership(uid: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;

  try {
    await ensureFirestoreOnline();
    const memberRef = doc(db, MEMBERS_COLLECTION, uid);
    const counterRef = counterRefOf(db);

    await runTransaction(db, async (tx) => {
      const memberSnap = await tx.get(memberRef);
      if (!memberSnap.exists()) return;

      const counterSnap = await tx.get(counterRef);
      const current = readCount(counterSnap);

      tx.delete(memberRef);
      if (current > 0) {
        tx.update(counterRef, { count: current - 1 });
      }
    });
  } catch (error) {
    console.warn("Impossibile liberare il posto utente:", error);
  }
}
