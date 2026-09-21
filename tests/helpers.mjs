export async function localReports(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("production-sheet-reader", 1);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("sheets")) {
            db.close();
            resolve([]);
            return;
          }
          const transaction = db.transaction("sheets", "readonly"),
            reading = transaction.objectStore("sheets").getAll();
          transaction.oncomplete = () => {
            db.close();
            resolve(
              reading.result.map(({ pdf, ...record }) => ({
                ...record,
                pdfSize: pdf.size,
              })),
            );
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      }),
  );
}
