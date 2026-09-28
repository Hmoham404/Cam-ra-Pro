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
): Promise<Blob[]> {
  const image = await loadImage(file);
  const scale = Math.min(1, 1800 / Math.min(image.width, image.height));
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
  const tileSize = 2400;
  const overlap = 160;
  const vertical = canvas.height >= canvas.width;
  const extent = vertical ? canvas.height : canvas.width;
  const crossExtent = vertical ? canvas.width : canvas.height;
  const tiles: Blob[] = [];

  for (let start = 0; start < extent; start += tileSize - overlap) {
    const length = Math.min(tileSize, extent - start);
    const tile = document.createElement("canvas");
    tile.width = vertical ? crossExtent : length;
    tile.height = vertical ? length : crossExtent;
    const tileContext = tile.getContext("2d", { willReadFrequently: true });
    if (!tileContext) throw new Error("Le traitement d’image est indisponible.");
    tileContext.drawImage(
      canvas,
      vertical ? 0 : start,
      vertical ? start : 0,
      vertical ? crossExtent : length,
      vertical ? length : crossExtent,
      0,
      0,
      tile.width,
      tile.height,
    );

    if (enhance) {
      const pixels = tileContext.getImageData(0, 0, tile.width, tile.height);
      for (let y = 0; y < tile.height; y++) {
        for (let x = 0; x < tile.width; x++) {
          const i = (y * tile.width + x) * 4;
          const gray =
            0.299 * pixels.data[i] +
            0.587 * pixels.data[i + 1] +
            0.114 * pixels.data[i + 2];
          const adjusted = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = adjusted;
        }
        if (y % 150 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      }
      tileContext.putImageData(pixels, 0, 0);
      const copy = document.createElement("canvas");
      copy.width = tile.width;
      copy.height = tile.height;
      copy.getContext("2d")!.drawImage(tile, 0, 0);
      tileContext.filter = "blur(0.3px)";
      tileContext.drawImage(copy, 0, 0);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      tile.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Échec du traitement de l’image.");
    tiles.push(blob);
    if (start + length >= extent) break;
  }
  return tiles;
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
