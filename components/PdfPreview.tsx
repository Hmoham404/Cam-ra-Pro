"use client";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Maximize,
  Pencil,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { downloadPdf } from "@/lib/pdf";
import { safeFilename } from "@/lib/filenames";
import { PdfCanvasViewer } from "./PdfCanvasViewer";
export type PdfResult = { blob: Blob; filename: string; createdAt: string };
export function PdfPreview({
  pdf,
  onNew,
  autoPreview = false,
  onRename,
}: {
  pdf: PdfResult;
  onNew: () => void;
  autoPreview?: boolean;
  onRename?: (filename: string) => Promise<void>;
}) {
  const [preview, setPreview] = useState(autoPreview),
    [fullscreen, setFullscreen] = useState(false);
  const [url, setUrl] = useState(""),
    [filename, setFilename] = useState(pdf.filename),
    [name, setName] = useState(pdf.filename.replace(/\.pdf$/i, ""));
  const [editing, setEditing] = useState(false),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(pdf.blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pdf.blob]);
  useEffect(() => {
    setFilename(pdf.filename);
    setName(pdf.filename.replace(/\.pdf$/i, ""));
  }, [pdf.filename]);
  useEffect(() => {
    if (fullscreen) dialog.current?.showModal();
  }, [fullscreen]);
  async function rename() {
    setSaving(true);
    setMessage("");
    try {
      const next = safeFilename(name);
      await onRename?.(next);
      setFilename(next);
      setName(next.replace(/\.pdf$/i, ""));
      setEditing(false);
    } catch {
      setMessage("Le nom n’a pas pu être enregistré. Réessayez.");
    } finally {
      setSaving(false);
    }
  }
  async function share() {
    const file = new File([pdf.blob], filename, { type: "application/pdf" });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      setMessage(
        "Le partage de fichiers n’est pas disponible ici. Téléchargez le PDF, puis joignez-le dans Telegram ou votre application de messagerie.",
      );
      return;
    }
    try {
      await navigator.share({ files: [file], title: filename });
      setMessage("Le PDF a été transmis au menu de partage.");
    } catch (cause) {
      if ((cause as Error).name !== "AbortError")
        setMessage(
          "Le partage n’a pas abouti. Vous pouvez télécharger le PDF et le joindre à votre message.",
        );
    }
  }
  return (
    <section
      className="panel mt-5 scroll-mt-5 overflow-hidden"
      aria-label="Rapport PDF"
    >
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={27} className="shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold">Votre rapport est prêt</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Consultez le PDF ici, puis téléchargez-le ou partagez-le.
            </p>
          </div>
          <button
            className="icon-btn"
            aria-label="Renommer le PDF"
            onClick={() => setEditing((value) => !value)}
          >
            <Pencil size={17} />
          </button>
        </div>
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void rename();
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <label className="min-w-0 flex-1">
              <span className="label">Nom du fichier PDF</span>
              <input
                className="field min-h-12"
                value={name}
                maxLength={150}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </label>
            <button
              disabled={saving || !name.trim()}
              className="btn-primary self-end"
              type="submit"
            >
              Enregistrer le nom
            </button>
          </form>
        ) : (
          <p className="mt-4 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            {filename}
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          {(pdf.blob.size / 1024).toFixed(1)} Ko ·{" "}
          {new Date(pdf.createdAt).toLocaleString("fr-FR")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            className="btn-primary"
            onClick={() => downloadPdf(pdf.blob, filename)}
          >
            <Download size={16} />
            Télécharger
          </button>
          <button className="btn-secondary" onClick={share}>
            <Share2 size={16} />
            Partager
          </button>
          <button
            className="btn-secondary"
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Masquer l’aperçu" : "Aperçu"}
          </button>
          <button className="btn-secondary" onClick={onNew}>
            <Plus size={16} />
            Nouvelle fiche
          </button>
        </div>
        {message && (
          <p
            role="status"
            className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-700"
          >
            {message}
          </p>
        )}
      </div>
      {preview && (
        <div className="p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold">Aperçu avant téléchargement</p>
            <div className="flex gap-2">
              <a
                href={url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !min-h-10 !px-3 !text-[10px]"
              >
                <ExternalLink size={14} />
                Ouvrir le PDF
              </a>
              <button
                className="icon-btn !size-10"
                aria-label="Agrandir l’aperçu"
                onClick={() => setFullscreen(true)}
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
          {!fullscreen && <PdfCanvasViewer blob={pdf.blob} />}
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            Rapport automatique : verifiez les champs et tableaux dans l'aper�u.
            La photo originale est incluse.
          </p>
        </div>
      )}
      {fullscreen && (
        <dialog
          ref={dialog}
          onCancel={(event) => {
            event.preventDefault();
            setFullscreen(false);
          }}
          aria-label="Aperçu du PDF"
          className="fixed inset-0 m-auto max-h-[96dvh] w-[calc(100%-1rem)] max-w-5xl overflow-auto rounded-xl border-0 bg-white p-3 backdrop:bg-slate-950/80"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="truncate text-xs font-bold">{filename}</span>
            <button
              autoFocus
              aria-label="Fermer l’aperçu"
              className="icon-btn !size-11"
              onClick={() => setFullscreen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <PdfCanvasViewer blob={pdf.blob} />
        </dialog>
      )}
    </section>
  );
}
