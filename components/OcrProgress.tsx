import { LoaderCircle, CheckCircle2 } from "lucide-react";
import type { Progress } from "@/lib/ocr";
export function OcrProgress({ progress }: { progress: Progress }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-blue-100 bg-blue-50 p-4"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
        {progress.percent === 100 ? (
          <CheckCircle2 size={16} />
        ) : (
          <LoaderCircle size={16} className="animate-spin" />
        )}
        {progress.stage}
        <span className="ml-auto tabular-nums">{progress.percent} %</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progression OCR"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-full bg-blue-100"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
