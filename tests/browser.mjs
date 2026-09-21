import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { localReports } from "./helpers.mjs";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: undefined,
  });
});
const page = await context.newPage(),
  errors = [],
  external = [],
  downloads = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("download", (download) => downloads.push(download));
page.on("request", (request) => {
  if (
    /^https?:/.test(request.url()) &&
    !request.url().startsWith("http://127.0.0.1:3000")
  )
    external.push(request.url());
});
try {
  await page.goto("http://127.0.0.1:3000/lecture");
  await page
    .getByRole("heading", { name: "Lecture de fiches", exact: true })
    .waitFor();
  await expect(
    page.getByRole("heading", { name: "Données extraites", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Analyser et créer le PDF", exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: /Essayer avec une fiche exemple/ })
    .click();
  await page.getByAltText("Fiche de production importée").waitFor();
  await page.getByRole("button", { name: "Tourner de 90°" }).click();
  await expect(
    page.getByAltText("Fiche de production importée"),
  ).toHaveAttribute("style", /rotate\(90deg\)/);
  await page.getByRole("button", { name: "Réinitialiser la vue" }).click();
  await page
    .getByRole("button", { name: "Analyser et créer le PDF", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Votre rapport est prêt", exact: true })
    .waitFor({ timeout: 180000 });
  await expect(page.getByLabel("Aperçu PDF, page 1")).toBeVisible();
  await expect(
    page.getByText("Préparation de l’aperçu…", { exact: true }),
  ).toHaveCount(0, { timeout: 30000 });
  assert.equal(downloads.length, 0, "Preview must appear before any download");
  const reports = await localReports(page);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].quantity, 1130);
  assert.equal(reports[0].quantity_ok, 1095);
  assert.equal(reports[0].quantity_nok, 35);
  assert.equal(reports[0].rows.length, 4);
  assert.match(
    reports[0].filename,
    /^Rapport_Injection_\d{8}_\d{6}_[a-z0-9]{6}\.pdf$/,
  );
  assert.equal(reports[0].title, "FICHE DE PRODUCTION");
  assert.ok(
    await page.getByLabel("Aperçu PDF, page 1").evaluate((canvas) =>
      canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.some((v, i) => i % 4 !== 3 && v < 150),
    ),
    "PDF page must contain rendered content",
  );
  await page
    .getByRole("button", { name: "Page suivante", exact: true })
    .click();
  await expect(page.getByLabel("Aperçu PDF, page 2")).toBeVisible();
  await page.getByRole("button", { name: "Renommer le PDF" }).click();
  await page.getByLabel("Nom du fichier PDF").fill("Atelier matin");
  await page.getByRole("button", { name: "Enregistrer le nom" }).click();
  await expect
    .poll(async () => (await localReports(page))[0].filename)
    .toBe("Atelier_matin.pdf");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger", exact: true }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), "Atelier_matin.pdf");
  await download.saveAs("test-results/report.pdf");
  const pdf = (await readFile("test-results/report.pdf")).toString("latin1");
  for (const text of [
    "1130",
    "1095",
    "35",
    "08:00",
    "OF-260921-01",
    "/Subtype /Image",
  ])
    assert.ok(pdf.includes(text), `PDF must contain ${text}`);
  assert.ok(
    !pdf.includes("superviseur"),
    "Auto report must not claim manual verification",
  );
  await page.getByRole("button", { name: "Partager", exact: true }).click();
  await page
    .getByText(/Le partage de fichiers n’est pas disponible ici/)
    .waitFor();
  await page.getByRole("button", { name: "Agrandir l’aperçu" }).click();
  await page.getByRole("dialog", { name: "Aperçu du PDF" }).waitFor();
  await page.getByRole("button", { name: "Fermer l’aperçu" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/mobile-report.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page
    .getByRole("navigation", { name: "Navigation mobile" })
    .getByRole("link", { name: "Historique" })
    .click();
  await page.getByRole("cell", { name: "21/09/2026 OF-260921-01" }).waitFor();
  await page.getByLabel("Rechercher dans l’historique").fill("missing");
  await page.getByText("Aucune fiche correspondante").waitFor();
  await page.getByLabel("Rechercher dans l’historique").fill("INJ-04");
  await page.getByRole("cell", { name: "21/09/2026 OF-260921-01" }).waitFor();
  await page.reload();
  await page.getByRole("cell", { name: "21/09/2026 OF-260921-01" }).waitFor();
  await page.goto("http://127.0.0.1:3000/dashboard");
  await page.getByText("1 130", { exact: true }).first().waitFor();
  await page.goto("http://127.0.0.1:3000/parametres");
  await page.getByLabel("Département par défaut").selectOption("Assemblage");
  await page
    .getByRole("button", { name: "Enregistrer les préférences" })
    .click();
  await page.reload();
  await expect(page.getByLabel("Département par défaut")).toHaveValue(
    "Assemblage",
  );
  await page.goto("http://127.0.0.1:3000/lecture");
  await expect(
    page.getByRole("button", { name: /Assemblage/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await expect(
    page.getByRole("button", {
      name: "Utiliser l’appareil photo du téléphone",
    }),
  ).toBeVisible();
  await page.goto("http://127.0.0.1:3000/historique");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Supprimer OF-260921-01", exact: true })
    .click();
  await page.getByText("Votre première fiche vous attend.").waitFor();
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real OCR -> automatic PDF, 4 table rows, local PDF canvas before download, timestamp filename, persistent rename, sharing fallback, mobile layout, history, dashboard, settings; no external requests.",
  );
} catch (error) {
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  console.error("BROWSER ERRORS", errors);
  throw error;
} finally {
  await browser.close();
}
