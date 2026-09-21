"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, LoaderCircle, RotateCcw, X } from "lucide-react";

function cameraError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "L’accès à la caméra est refusé. Autorisez la caméra dans les paramètres de ce site, puis réessayez.";
  if (name === "NotFoundError")
    return "Aucune caméra détectée. Branchez une webcam ou importez une image.";
  if (name === "NotReadableError")
    return "La caméra est indisponible. Fermez les applications qui l’utilisent, puis réessayez.";
  return "Impossible d’ouvrir la caméra. Vérifiez son branchement et les autorisations du navigateur.";
}

export function CameraCapture({
  onCapture,
  onClose,
  onNativeCamera,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onNativeCamera?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState<File>();
  const [preview, setPreview] = useState("");

  useEffect(() => {
    mounted.current = true;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      mounted.current = false;
      document.body.style.overflow = previous;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (photo) return;
    let cancelled = false;
    let active: MediaStream | undefined;
    setReady(false);
    setError("");
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Pour ouvrir la caméra, utilisez localhost sur ce PC ou une adresse HTTPS. Vous pouvez aussi importer une image.",
        );
        return;
      }
      try {
        active = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: { ideal: "environment" } }),
            width: { ideal: 2560 },
            height: { ideal: 1920 },
          },
        });
        if (cancelled) {
          active.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = active;
        if (video.current) {
          video.current.srcObject = active;
          await video.current.play();
        }
        if (cancelled) return;
        try {
          const available = await navigator.mediaDevices.enumerateDevices();
          if (!cancelled)
            setDevices(
              available.filter((device) => device.kind === "videoinput"),
            );
        } catch {
          /* Live capture still works if device enumeration is unavailable. */
        }
      } catch (cause) {
        active?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setError(cameraError(cause));
      }
    }
    void start();
    return () => {
      cancelled = true;
      active?.getTracks().forEach((track) => track.stop());
      if (stream.current === active) stream.current = null;
    };
  }, [deviceId, attempt, photo]);

  async function capture() {
    const element = video.current;
    if (!element?.videoWidth || !ready) return;
    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = element.videoWidth;
      canvas.height = element.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Capture indisponible.");
      context.drawImage(element, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("La photo n’a pas pu être capturée.")),
          "image/jpeg",
          0.95,
        ),
      );
      if (mounted.current)
        setPhoto(
          new File(
            [blob],
            `capture-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
            { type: "image/jpeg" },
          ),
        );
    } catch {
      if (mounted.current) setError("La capture a échoué. Veuillez réessayer.");
    } finally {
      if (mounted.current) setCapturing(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="camera-title"
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[95dvh] overflow-auto rounded-2xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-slate-950/75"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2
            id="camera-title"
            className="flex items-center gap-2 text-base font-bold"
          >
            <Camera size={20} className="text-blue-600" />
            {photo ? "Vérifier la photo" : "Caméra de votre appareil"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Cadrez le document entier, avec un titre et des données bien
            lisibles.
          </p>
        </div>
        <button
          autoFocus
          className="icon-btn shrink-0"
          aria-label="Fermer la caméra"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-5">
        <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl bg-slate-950">
          {photo ? (
            <img
              src={preview || undefined}
              alt="Photo capturée à vérifier"
              className="max-h-[55dvh] w-full object-contain"
            />
          ) : (
            <video
              ref={video}
              autoPlay
              muted
              playsInline
              onPlaying={(event) =>
                setReady(
                  event.currentTarget.videoWidth > 0 &&
                    event.currentTarget.readyState >= 2,
                )
              }
              aria-label="Aperçu en direct de la caméra"
              className="max-h-[55dvh] w-full object-contain"
            />
          )}
          {!photo && !ready && !error && (
            <div
              role="status"
              className="absolute flex flex-col items-center gap-3 px-5 text-center text-sm text-white"
            >
              <LoaderCircle className="animate-spin" size={24} />
              Ouverture de la caméra…
              <span className="text-xs text-slate-300">
                Autorisez l’accès à la caméra si le navigateur le demande.
              </span>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="absolute max-w-lg rounded-xl bg-slate-900/95 p-5 text-center text-sm leading-6 text-white"
            >
              {error}
            </p>
          )}
        </div>
        {!photo && devices.length > 1 && (
          <label className="mt-4 block">
            <span className="label">Choisir une caméra</span>
            <select
              className="field"
              value={
                deviceId ||
                stream.current?.getVideoTracks()[0]?.getSettings().deviceId ||
                ""
              }
              onChange={(event) => {
                setReady(false);
                setDeviceId(event.target.value);
              }}
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Caméra ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          {photo ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  setReady(false);
                  setPhoto(undefined);
                }}
              >
                <RotateCcw size={16} />
                Reprendre la photo
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  onCapture(photo);
                  onClose();
                }}
              >
                <Check size={16} />
                Utiliser cette photo
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Annuler
              </button>
              {error ? (
                <button
                  className="btn-primary"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Réessayer
                </button>
              ) : (
                <button
                  className="btn-primary"
                  disabled={!ready || capturing}
                  onClick={capture}
                >
                  <Camera size={16} />
                  {capturing ? "Capture…" : "Capturer la photo"}
                </button>
              )}
            </>
          )}
        </div>
        {!photo && onNativeCamera && (
          <button
            className="btn-secondary mt-3 w-full"
            onClick={onNativeCamera}
          >
            Ouvrir l’appareil photo du téléphone
          </button>
        )}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Photo locale uniquement · La caméra s’arrête après la capture ou la
          fermeture.
        </p>
      </div>
    </dialog>
  );
}
