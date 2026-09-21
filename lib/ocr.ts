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
  const image = await preprocessImage(file, rotation, enhance);
  signal?.throwIfAborted();
  const { createWorker } = await import("tesseract.js");
  report("Chargement du moteur OCR", 12);
  const worker = await createWorker("fra+eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr",
    langPath: "/ocr",
    logger: (message) => {
      if (message.status === "recognizing text")
        report("Lecture OCR", 20 + Math.round(message.progress * 68));
    },
  });
  const abort = () => {
    void worker.terminate();
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    signal?.throwIfAborted();
    await worker.setParameters({ preserve_interword_spaces: "1" });
    const result = await worker.recognize(image);
    report("Extraction du texte", 92);
    return result.data.text;
  } finally {
    signal?.removeEventListener("abort", abort);
    await worker.terminate();
  }
}
