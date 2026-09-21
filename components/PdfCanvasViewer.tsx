"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export function PdfCanvasViewer({ blob }: { blob: Blob }) {
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [page, setPage] = useState(1),
    [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(300),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    setDocument(undefined);
    setPage(1);
    setError("");
    setBusy(true);
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
        const data = new Uint8Array(await blob.arrayBuffer());
        if (cancelled) return;
        task = pdfjs.getDocument({
          data,
          standardFontDataUrl: "/pdf/standard_fonts/",
          wasmUrl: "/pdf/wasm/",
        });
        const loaded = await task.promise;
        if (!cancelled) setDocument(loaded);
      } catch {
        if (!cancelled) {
          setError(
            "L’aperçu ne peut pas être affiché ici. Utilisez « Ouvrir le PDF » ou téléchargez le fichier.",
          );
          setBusy(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      if (task) void task.destroy();
    };
  }, [blob]);
  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    const observer = new ResizeObserver(() =>
      setWidth(Math.max(200, element.clientWidth - 24)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let cancelled = false;
    let rendering:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    const target = canvas.current;
    async function render() {
      setBusy(true);
      setError("");
      try {
        const pdfPage = await document!.getPage(page);
        if (cancelled) return;
        const original = pdfPage.getViewport({ scale: 1 });
        const viewport = pdfPage.getViewport({
          scale: (Math.min(width, 900) / original.width) * zoom,
        });
        const density = Math.min(window.devicePixelRatio || 1, 2);
        target.width = Math.floor(viewport.width * density);
        target.height = Math.floor(viewport.height * density);
        target.style.width = `${viewport.width}px`;
        target.style.height = `${viewport.height}px`;
        rendering = pdfPage.render({
          canvas: target,
          viewport,
          transform: density === 1 ? undefined : [density, 0, 0, density, 0, 0],
        });
        await rendering.promise;
      } catch (cause) {
        if (
          !cancelled &&
          (cause as Error).name !== "RenderingCancelledException"
        )
          setError("Impossible d’afficher cette page du PDF.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void render();
    return () => {
      cancelled = true;
      rendering?.cancel();
    };
  }, [document, page, width, zoom]);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            className="icon-btn !size-11"
            disabled={!document || page <= 1}
            aria-label="Page précédente"
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={20} />
          </button>
          <span
            className="text-xs font-semibold tabular-nums"
            aria-live="polite"
          >
            Page {page} / {document?.numPages || "…"}
          </span>
          <button
            className="icon-btn !size-11"
            disabled={!document || page >= document.numPages}
            aria-label="Page suivante"
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="icon-btn !size-11"
            aria-label="Réduire le PDF"
            disabled={zoom <= 1}
            onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-[11px] tabular-nums">
            {Math.round(zoom * 100)} %
          </span>
          <button
            className="icon-btn !size-11"
            aria-label="Agrandir le PDF"
            disabled={zoom >= 2}
            onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      <div
        ref={container}
        className="relative max-h-[70dvh] min-h-52 overflow-auto p-3"
      >
        {busy && (
          <div
            role="status"
            className="sticky top-2 z-10 mx-auto mb-2 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs shadow"
          >
            <LoaderCircle size={15} className="animate-spin" />
            Préparation de l’aperçu…
          </div>
        )}
        {error ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <canvas
            ref={canvas}
            aria-label={`Aperçu PDF, page ${page}`}
            className="mx-auto bg-white shadow-md"
          />
        )}
      </div>
    </div>
  );
}
