/**
 * Tiny IndexedDB "draft" store so a refresh (or an accidental tab close) does
 * not lose the files a user already added. Everything stays in THIS browser:
 * nothing is uploaded. Files are structured-cloned into IndexedDB as they are.
 *
 * Every function swallows errors (private mode, quota, blocked storage) and
 * simply behaves as "nothing saved": the tools work without it.
 */
const DB_NAME = 'pdf-tools';
const STORE = 'drafts';

/**
 * A draft is dropped this long after the user's LAST CHANGE (a refresh does not count as a change).
 * Short on purpose: no files left lying around on shared computers.
 */
export const DRAFT_TTL_MS = 15 * 60 * 1000;

/** After the user downloads the result, the draft is wiped after this long (in the same page). */
export const DRAFT_WIPE_AFTER_DOWNLOAD_MS = 60_000;

interface Record<T> {
  savedAt: number;
  value: T;
  /**
   * Set when the user has downloaded the result. Such a draft is never brought back again
   * (the work is done) and is deleted shortly after. Any later save writes a new record
   * without this field, which cancels the wipe (the user went on editing).
   */
  downloadedAt?: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveDraft<T>(key: string, value: T): Promise<void> {
  try {
    const rec: Record<T> = { savedAt: Date.now(), value };
    await run('readwrite', (s) => s.put(rec, key));
  } catch {
    /* storage unavailable: no draft */
  }
}

export async function loadDraft<T>(key: string): Promise<T | null> {
  try {
    const rec = await run<Record<T> | undefined>('readonly', (s) => s.get(key));
    if (!rec) return null;
    if (rec.downloadedAt || Date.now() - rec.savedAt > DRAFT_TTL_MS) {
      await clearDraft(key);
      return null;
    }
    return rec.value;
  } catch {
    return null;
  }
}

export async function clearDraft(key: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(key));
  } catch {
    /* nothing to clear */
  }
}

/** The user downloaded the result: never restore this draft again, and delete it soon (see clearIfDownloaded). */
export async function markDownloaded(key: string): Promise<void> {
  try {
    const rec = await run<Record<unknown> | undefined>('readonly', (s) => s.get(key));
    if (rec) await run('readwrite', (s) => s.put({ ...rec, downloadedAt: Date.now() }, key));
  } catch {
    /* nothing saved */
  }
}

/** Delete the draft only if it is still marked as downloaded (not if the user kept editing meanwhile). */
export async function clearIfDownloaded(key: string): Promise<void> {
  try {
    const rec = await run<Record<unknown> | undefined>('readonly', (s) => s.get(key));
    if (rec?.downloadedAt) await run('readwrite', (s) => s.delete(key));
  } catch {
    /* nothing to clear */
  }
}
