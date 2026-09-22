"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileDown,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { DepartmentSelector } from "./DepartmentSelector";
import { SheetTypeSelector } from "./SheetTypeSelector";
import { ImageUploader } from "./ImageUploader";
import { ImageViewer } from "./ImageViewer";
import { OcrProgress } from "./OcrProgress";
import { PdfPreview, type PdfResult } from "./PdfPreview";
import { ExtractedDataPanel } from "./ExtractedDataPanel";
import {
  DEPARTMENTS,
  type Department,
  type ProductionSheet,
  type SavedSheet,
  type SheetType,
} from "@/types/production";
import { extractTextFromImage, type Progress } from "@/lib/ocr";
import { parseProductionSheet } from "@/lib/parser";
import { generatePdf } from "@/lib/pdf";
import { saveSheet } from "@/lib/storage";
import { scrapRate, totals } from "@/lib/calculations";
import { createExample } from "@/lib/example";
import { loadImage } from "@/lib/imageProcessing";

export function Reader() {
  const [department, setDepartment] = useState<Department>("Injection"),
    [sheetType, setSheetType] = useState<SheetType>("Fiche de production");
  const [file, setFile] = useState<File>(),
    [url, setUrl] = useState(""),
    [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<Progress>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [pdf, setPdf] = useState<PdfResult>(),
    [extractedSheet, setExtractedSheet] = useState<ProductionSheet>(),
    [enhance, setEnhance] = useState(true);
  const controller = useRef<AbortController | null>(null),
    record = useRef<SavedSheet | null>(null),
    report = useRef<HTMLDivElement>(null),
    accepting = useRef(0);
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const source = URL.createObjectURL(file);
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, [file]);
  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("psr-settings") || "{}");
      if (DEPARTMENTS.includes(settings.department))
        setDepartment(settings.department);
      if (typeof settings.enhance === "boolean") setEnhance(settings.enhance);
    } catch {}
    return () => {
      controller.current?.abort();
      accepting.current++;
    };
  }, []);
  useEffect(() => {
    if (pdf && window.matchMedia("(max-width: 1023px)").matches)
      report.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pdf?.blob]);
  function clearReport() {
    setPdf(undefined);
    setExtractedSheet(undefined);
    setProgress(undefined);
    setNotice("");
    setError("");
    record.current = null;
  }
  function reset() {
    controller.current?.abort();
    accepting.current++;
    setFile(undefined);
    setRotation(0);
    clearReport();
  }
  async function acceptFile(next: File) {
    const request = ++accepting.current;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError(
        "Choisissez une image JPG, PNG ou WEBP. Sur iPhone, utilisez la caméra intégrée ou exportez la photo en JPEG.",
      );
      return;
    }
    if (next.size > 20 * 1024 * 1024) {
      setError(
        "Cette image dépasse 20 Mo. Réduisez sa taille avant de l’importer.",
      );
      return;
    }
    try {
      await loadImage(next);
      if (request !== accepting.current) return;
      clearReport();
      setRotation(0);
      setFile(next);
    } catch (cause) {
      if (request === accepting.current) setError((cause as Error).message);
    }
  }
  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setPdf(undefined);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const text = await extractTextFromImage(
        file,
        setProgress,
        rotation,
        enhance,
        abort.signal,
      );
      abort.signal.throwIfAborted();
      setProgress({ stage: "Création du rapport PDF", percent: 95 });
      const sheet = parseProductionSheet(text, department, sheetType);
      sheet.source_filename = file.name;
      sheet.department = department;
      setExtractedSheet(sheet);
      const id = record.current?.id || crypto.randomUUID();
      const result = await generatePdf(sheet, sheetType, file, id);
      abort.signal.throwIfAborted();
      const saved: SavedSheet = {
        ...sheet,
        id,
        sheetType,
        filename: result.filename,
        createdAt: result.createdAt,
        pdf: result.blob,
        scrapRate: scrapRate(sheet.quantity_nok, sheet.quantity),
      };
      record.current = saved;
      setPdf(result);
      setProgress({ stage: "Rapport PDF prêt", percent: 100 });
      const warnings: string[] = [];
      if (!text.trim())
        warnings.push(
          "Aucun texte lisible détecté : le PDF contient la photo originale. Une photo plus nette peut améliorer la lecture.",
        );
      if (sheet.rows.some((row) => row.quantity !== row.ok + row.nok))
        warnings.push(
          "Des quantités semblent incohérentes. Vérifiez le tableau dans le PDF avec la photo originale.",
        );
      try {
        await saveSheet(saved);
      } catch (cause) {
        warnings.push((cause as Error).message);
      }
      if (!abort.signal.aborted) setNotice(warnings.join(" "));
    } catch (cause) {
      if (!abort.signal.aborted) {
        setError(`L’analyse n’a pas abouti. ${(cause as Error).message}`);
        setProgress(undefined);
      }
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  async function applyCorrections(sheet: ProductionSheet) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const nextSheet = sheet.rows.length
        ? { ...sheet, ...totals(sheet.rows) }
        : sheet;
      nextSheet.source_filename = file.name;
      nextSheet.department = department;
      const id = record.current?.id || crypto.randomUUID();
      const result = await generatePdf(nextSheet, sheetType, file, id);
      const saved: SavedSheet = {
        ...nextSheet,
        id,
        sheetType,
        filename: record.current?.filename || result.filename,
        createdAt: result.createdAt,
        pdf: result.blob,
        scrapRate: scrapRate(nextSheet.quantity_nok, nextSheet.quantity),
      };
      record.current = saved;
      await saveSheet(saved);
      setExtractedSheet(nextSheet);
      setPdf({ ...result, filename: saved.filename });
      setProgress({
        stage: "PDF mis a jour avec vos corrections",
        percent: 100,
      });
      if (nextSheet.rows.some((row) => row.quantity !== row.ok + row.nok))
        setNotice(
          "Certaines lignes restent incoherentes: verifiez la quantite, OK et NOK.",
        );
    } catch (cause) {
      setError(
        `La mise a jour du PDF n'a pas abouti. ${(cause as Error).message}`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function rename(filename: string) {
    if (!pdf || !record.current) return;
    const next = { ...record.current, filename };
    try {
      await saveSheet(next);
    } catch {
      setNotice(
        "Le nouveau nom est utilisé pour le téléchargement, mais l’historique local n’a pas pu être mis à jour.",
      );
    }
    record.current = next;
    setPdf({ ...pdf, filename });
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">
            <span className="h-1 w-5 rounded bg-blue-500" />
            Du papier au PDF
          </p>
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-3xl">
            Lecture de fiches
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Une photo. Une analyse. Votre rapport prêt à consulter.
          </p>
        </div>
        <Link
          href="/guide"
          className="btn-secondary !min-h-10 !px-3 !text-[11px]"
        >
          Aide
        </Link>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          { label: "Photographier", icon: ImageIcon, complete: !!file },
          { label: "Analyser", icon: ScanLine, complete: !!pdf },
          { label: "Consulter le PDF", icon: FileDown, complete: !!pdf },
        ].map(({ label, icon: Icon, complete }, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${complete ? "border-blue-100 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"}`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
              {complete ? <Check size={15} /> : <Icon size={15} />}
            </span>
            <span className="text-[10px] font-bold sm:text-xs">
              <span className="hidden sm:inline">0{index + 1} · </span>
              {label}
            </span>
          </div>
        ))}
      </div>
      <section className="panel mb-5 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold">Votre département</h2>
          <span className="text-[10px] text-slate-400">
            Le PDF sera classé automatiquement
          </span>
        </div>
        <DepartmentSelector
          value={department}
          disabled={busy}
          onChange={(value) => {
            setDepartment(value);
            clearReport();
          }}
        />
        <div className="mt-4 max-w-sm">
          <SheetTypeSelector
            value={sheetType}
            disabled={busy}
            onChange={(value) => {
              setSheetType(value);
              clearReport();
            }}
          />
        </div>
      </section>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="flex-1">{error}</p>
          <button
            aria-label="Fermer le message"
            className="shrink-0"
            onClick={() => setError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div
        className={`grid items-start gap-5 ${pdf ? "xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]" : "lg:grid-cols-[minmax(0,1fr)_300px]"}`}
      >
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <ImageIcon size={18} className="text-blue-600" />
              Image à analyser
            </h2>
            {file && (
              <span className="text-[10px] text-slate-400">
                1 image · 1 rapport
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5">
            <ImageUploader onFile={acceptFile} disabled={busy} />
            <div className="mt-4">
              <ImageViewer
                url={url}
                filename={file?.name || ""}
                rotation={rotation}
                onRotate={(value) => {
                  setRotation(value);
                  clearReport();
                }}
                onFile={acceptFile}
                disabled={busy}
                onExample={async () => {
                  try {
                    await acceptFile(await createExample());
                  } catch (cause) {
                    setError((cause as Error).message);
                  }
                }}
              />
            </div>
            {progress && (
              <div className="mt-4">
                <OcrProgress progress={progress} />
              </div>
            )}
            <button
              className="btn-primary mt-4 w-full !text-sm"
              disabled={!file || busy}
              onClick={analyze}
            >
              {busy ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ScanLine size={18} />
              )}{" "}
              {busy
                ? "Analyse et création du PDF…"
                : pdf
                  ? "Analyser à nouveau"
                  : "Analyser et créer le PDF"}
              {!busy && <ArrowRight size={17} className="ml-auto" />}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <LockKeyhole size={12} />
              Votre image reste sur cet appareil.
            </p>
          </div>
        </section>
        <div ref={report} className="min-w-0 scroll-mt-4">
          {pdf ? (
            <>
              {extractedSheet && (
                <ExtractedDataPanel
                  sheet={extractedSheet}
                  disabled={busy}
                  onApply={applyCorrections}
                />
              )}
              <PdfPreview
                key={pdf.createdAt}
                pdf={pdf}
                onNew={reset}
                onRename={rename}
                autoPreview
              />
              {notice && (
                <p
                  role="status"
                  className="mt-3 rounded-xl bg-orange-50 p-4 text-xs leading-6 text-orange-800"
                >
                  {notice}
                </p>
              )}
            </>
          ) : (
            <aside className="panel p-6">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={23} />
              </span>
              <h2 className="text-base font-extrabold">
                Tout est dans le rapport.
              </h2>
              <p className="mt-3 text-xs leading-6 text-slate-500">
                Le titre, le texte et les tableaux détectés sont réunis dans un
                PDF. L’aperçu s’ouvre dès la fin de l’analyse.
              </p>
              <div className="my-5 space-y-3 text-xs text-slate-600">
                {[
                  "Nom avec département, date et heure",
                  "Tableaux et photo originale inclus",
                  "Renommage, téléchargement et partage",
                ].map((text) => (
                  <p className="flex items-start gap-2" key={text}>
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    {text}
                  </p>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold">Pour une lecture plus nette</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Posez la fiche à plat, rapprochez la caméra et évitez les
                  ombres. Vérifiez la netteté avant de capturer.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
      <footer className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
        <ShieldCheck size={15} className="text-emerald-600" />
        Analyse locale · Rapports sauvegardés sur cet appareil
      </footer>
    </div>
  );
}
