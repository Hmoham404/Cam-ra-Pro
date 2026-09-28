import { preprocessImage } from "./imageProcessing";
export type Progress = { stage: string; percent: number };
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: Progress) => void,
  rotation = 0,
  enhance = true,
  signal?: AbortSignal,
): Promise<string> {
  const report = (stage: string, percent: number) =>
    onProgress?.({ stage, percent });
  report("Préparation de l’image", 3);
  signal?.throwIfAborted();
  const { createWorker } = await import("tesseract.js");
  report("Chargement du moteur de lecture", 12);
  const worker = await createWorker("fra+eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr",
    logger: (message) => {
      if (message.status === "recognizing text")
        report("Lecture automatique", 20 + Math.round(message.progress * 68));
    },
  });
  const abort = () => {
    void worker.terminate();
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const readable = (text: string) =>
      (text.match(/[A-Za-zÀ-ÿ]{3,}/g) || []).length;

    const scan = async (angle: number) => {
      const tiles = await preprocessImage(file, angle, enhance);
      const results = [];
      for (const tile of tiles) {
        signal?.throwIfAborted();
        results.push(await worker.recognize(tile, { rotateAuto: true }));
      }
      const lines: string[] = [];
      const recent: string[] = [];
      for (const result of results) {
        for (const line of result.data.text.split(/\r?\n/)) {
          const key = line.toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "");
          if (key && recent.includes(key)) continue;
          lines.push(line);
          if (key) recent.push(key);
          if (recent.length > 8) recent.shift();
        }
      }
      return {
        text: lines.join("\n"),
        confidence:
          results.reduce((sum, result) => sum + result.data.confidence, 0) /
          Math.max(1, results.length),
      };
    };
    let best = await scan(rotation);

    // A sideways photo can still produce confident but unusable fragments.
    // Retry quarter turns only when the first pass looks weak, then keep the
    // orientation with the strongest OCR confidence and readable word count.
    const firstWords = readable(best.text);
    if (best.confidence < 58 || firstWords < 8) {
      for (const offset of [90, 180, 270]) {
        signal?.throwIfAborted();
        report("Redressement automatique du document", 75);
        const candidate = await scan((rotation + offset) % 360);
        const score = (data: typeof best) =>
          data.confidence + Math.min(readable(data.text), 40) * 0.6;
        if (score(candidate) > score(best)) best = candidate;
      }
    }
    report("Extraction du texte", 92);
    return best.text;
  } finally {
    signal?.removeEventListener("abort", abort);
    await worker.terminate();
  }
}
