import type { SavedSheet } from "@/types/production";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("production-sheet-reader", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("sheets", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Le stockage local est indisponible. Vérifiez les autorisations du navigateur.",
        ),
      );
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sheets", mode);
    const request = action(tx.objectStore("sheets"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(
        new Error(
          "Impossible d’enregistrer les données locales. Le stockage est peut-être plein.",
        ),
      );
    };
  });
}
export async function getSheets(): Promise<SavedSheet[]> {
  return (
    (await transaction("readonly", (store) => store.getAll())) as SavedSheet[]
  )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}
export async function saveSheet(sheet: SavedSheet): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("sheets", "readwrite");
    const store = tx.objectStore("sheets");
    store.put(sheet);
    const request = store.getAll();
    request.onsuccess = () => {
      (request.result as SavedSheet[])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(50)
        .forEach((old) => store.delete(old.id));
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(
        new Error(
          "Le PDF est prêt, mais l’historique n’a pas pu être enregistré. Vérifiez l’espace disponible.",
        ),
      );
    };
  });
  window.dispatchEvent(new Event("sheets-updated"));
}
export async function deleteSheet(id: string) {
  await transaction("readwrite", (store) => store.delete(id));
  window.dispatchEvent(new Event("sheets-updated"));
}
export async function clearSheets() {
  await transaction("readwrite", (store) => store.clear());
  window.dispatchEvent(new Event("sheets-updated"));
}
