"use client";
import { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize,
  X,
  FileImage,
  Upload,
  ScanLine,
} from "lucide-react";
export function ImageViewer({
  url,
  filename,
  rotation,
  onRotate,
  onFile,
  onExample,
  disabled,
}: {
  url: string;
  filename: string;
  rotation: number;
  onRotate: (n: number) => void;
  onFile: (file: File) => void;
  onExample: () => void;
  disabled: boolean;
}) {
  const [zoom, setZoom] = useState(1),
    [fullscreen, setFullscreen] = useState(false),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setZoom(1);
  }, [url]);
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);
  const reset = () => {
    setZoom(1);
    onRotate(0);
  };
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-white p-4"
          : "flex flex-col"
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex min-w-0 items-center gap-2 text-[10px] text-slate-400">
          <FileImage size={14} />
          <span className="max-w-[180px] truncate">
            {filename || "Aucune image sélectionnée"}
          </span>
        </span>
        <div className="flex items-center">
          {[
            {
              label: "Réduire",
              icon: ZoomOut,
              action: () => setZoom((v) => Math.max(0.5, v - 0.25)),
            },
            {
              label: "Agrandir",
              icon: ZoomIn,
              action: () => setZoom((v) => Math.min(3, v + 0.25)),
            },
            {
              label: "Tourner de 90°",
              icon: RotateCw,
              action: () => onRotate((rotation + 90) % 360),
            },
            { label: "Réinitialiser la vue", icon: RotateCcw, action: reset },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              disabled={!url || disabled}
              className="icon-btn !size-8"
              title={label}
              aria-label={label}
              onClick={action}
            >
              <Icon size={14} />
            </button>
          ))}
          <span className="mx-1 h-4 border-l border-slate-200" />
          <button
            className="icon-btn !size-8"
            title={fullscreen ? "Fermer" : "Plein écran"}
            aria-label={fullscreen ? "Fermer le plein écran" : "Plein écran"}
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? <X size={15} /> : <Maximize size={15} />}
          </button>
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled && e.dataTransfer.files[0])
            onFile(e.dataTransfer.files[0]);
        }}
        className={`relative flex min-h-[300px] items-center justify-center overflow-auto rounded-xl border border-dashed p-6 ${fullscreen ? "flex-1" : "h-[328px]"} ${drag ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-[#f8fafc]"}`}
      >
        {url ? (
          <img
            src={url}
            alt="Fiche de production importée"
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex size-20 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-[0_6px_20px_#2563eb0d]">
              <ScanLine
                className="text-blue-400"
                size={36}
                strokeWidth={1.25}
              />
              <span className="absolute -right-2 -bottom-1 flex size-7 items-center justify-center rounded-lg border-[3px] border-slate-50 bg-blue-600 text-white">
                <Upload size={12} />
              </span>
            </div>
            <h3 className="text-[13px] font-bold">
              Votre fiche, le point de départ.
            </h3>
            <p className="mt-2 max-w-60 text-[11px] leading-5 text-slate-400">
              Glissez votre image ici, ou importez-la
              <br />
              depuis votre appareil.
            </p>
            <button
              onClick={() => input.current?.click()}
              disabled={disabled}
              className="mt-3 min-h-10 text-[11px] font-bold text-blue-600 hover:text-blue-800"
            >
              Parcourir les fichiers <span className="ml-1">→</span>
            </button>
            <span className="mt-2 text-[9px] text-slate-400">
              JPG, PNG ou WEBP · 20 Mo maximum
            </span>
          </div>
        )}
      </div>
      <input
        ref={input}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      {!url && (
        <button
          disabled={disabled}
          onClick={onExample}
          className="mt-3 min-h-8 text-[10px] text-slate-400 hover:text-blue-600"
        >
          Vous découvrez l’outil ?{" "}
          <span className="font-bold text-blue-600">
            Essayer avec une fiche exemple ↗
          </span>
        </button>
      )}
    </div>
  );
}
