import { mkdir, copyFile, readdir, cp } from "node:fs/promises";
import path from "node:path";
const destination = path.resolve("public/ocr");
await mkdir(destination, { recursive: true });
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  path.join(destination, "worker.min.js"),
);
for (const file of await readdir("node_modules/tesseract.js-core")) {
  if (file.endsWith(".wasm") || file.endsWith(".wasm.js"))
    await copyFile(
      path.join("node_modules/tesseract.js-core", file),
      path.join(destination, file),
    );
}
for (const language of ["fra", "eng"]) {
  await copyFile(
    `node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,
    path.join(destination, `${language}.traineddata.gz`),
  );
}
console.log(
  "OCR : moteur et langues copiés sur le même hébergement que l’application.",
);
await mkdir("public/pdf", { recursive: true });
await copyFile(
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  "public/pdf/pdf.worker.min.mjs",
);
await cp(
  "node_modules/pdfjs-dist/standard_fonts",
  "public/pdf/standard_fonts",
  { recursive: true },
);
await cp("node_modules/pdfjs-dist/wasm", "public/pdf/wasm", {
  recursive: true,
});
