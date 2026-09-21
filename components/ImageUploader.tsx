"use client";
import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { CameraCapture } from "./CameraCapture";
export function ImageUploader({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const nativeCamera = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <input
        ref={upload}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={change}
      />
      <input
        ref={nativeCamera}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={change}
      />
      <button
        disabled={disabled}
        onClick={() => setCameraOpen(true)}
        className="btn-secondary"
      >
        <Camera size={16} />
        Prendre une photo
      </button>
      <button
        disabled={disabled}
        className="order-2 col-span-2 min-h-12 text-xs font-semibold text-blue-600 sm:hidden"
        onClick={() => nativeCamera.current?.click()}
      >
        Utiliser l’appareil photo du téléphone
      </button>
      <button
        disabled={disabled}
        onClick={() => upload.current?.click()}
        className="btn-secondary"
      >
        <Upload size={16} />
        Importer une image
      </button>
      {cameraOpen && (
        <CameraCapture
          onCapture={onFile}
          onClose={() => setCameraOpen(false)}
          onNativeCamera={() => {
            setCameraOpen(false);
            nativeCamera.current?.click();
          }}
        />
      )}
    </div>
  );
}
