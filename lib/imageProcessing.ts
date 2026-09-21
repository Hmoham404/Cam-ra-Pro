export async function loadImage(source: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(source);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(
          new Error(
            "Cette image ne peut pas être ouverte. Utilisez JPG, PNG ou WEBP.",
          ),
        );
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function preprocessImage(
  file: File,
  rotation = 0,
  enhance = true,
): Promise<Blob> {
  const image = await loadImage(file);
  const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale),
    height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  const radians = (rotation * Math.PI) / 180;
  canvas.width = Math.ceil(
    Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)),
  );
  canvas.height = Math.ceil(
    Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)),
  );
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Le traitement d’image est indisponible.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, -width / 2, -height / 2, width, height);
  if (enhance) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const gray =
          0.299 * pixels.data[i] +
          0.587 * pixels.data[i + 1] +
          0.114 * pixels.data[i + 2];
        const adjusted = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = adjusted;
      }
      if (y % 150 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    context.putImageData(pixels, 0, 0);
    // A very light blur suppresses isolated sensor noise without erasing character strokes.
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext("2d")!.drawImage(canvas, 0, 0);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.filter = "blur(0.3px)";
    context.drawImage(copy, 0, 0);
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Échec du traitement de l’image.")),
      "image/png",
    ),
  );
}
export async function thumbnail(file: Blob, maxSize = 700): Promise<string> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
