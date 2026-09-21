import path from "node:path";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(".playwright");
const { webkit, devices, expect } = await import("@playwright/test");
const { localReports } = await import("./helpers.mjs");
await mkdir("test-results", { recursive: true });
const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  ...devices["iPhone 13"],
  acceptDownloads: true,
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://127.0.0.1:3000/lecture");
  await expect(
    page.getByRole("button", {
      name: "Utiliser l’appareil photo du téléphone",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Essayer avec une fiche exemple/ })
    .click();
  await page.getByAltText("Fiche de production importée").waitFor();
  await page
    .getByRole("button", { name: "Analyser et créer le PDF", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Votre rapport est prêt" })
    .waitFor({ timeout: 180000 });
  await expect(page.getByLabel("Aperçu PDF, page 1")).toBeVisible({
    timeout: 30000,
  });
  await expect(
    page.getByText("Préparation de l’aperçu…", { exact: true }),
  ).toHaveCount(0, { timeout: 30000 });
  await expect.poll(async () => (await localReports(page)).length).toBe(1);
  assert.equal((await localReports(page))[0].quantity, 1130);
  const canvas = page.getByLabel("Aperçu PDF, page 1");
  assert.ok(
    await canvas.evaluate(
      (c) =>
        c.width > 0 &&
        c
          .getContext("2d")
          .getImageData(0, 0, c.width, c.height)
          .data.some((v, i) => i % 4 !== 3 && v < 150),
    ),
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "test-results/webkit-iphone-report.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "Renommer le PDF" }).click();
  await page.getByLabel("Nom du fichier PDF").fill("Rapport iPhone");
  assert.equal(
    await page
      .getByLabel("Nom du fichier PDF")
      .evaluate((el) => getComputedStyle(el).fontSize),
    "16px",
  );
  await page.getByRole("button", { name: "Enregistrer le nom" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger", exact: true }).click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), "Rapport_iPhone.pdf");
  await download.saveAs("test-results/webkit-iphone-report.pdf");
  await page
    .getByRole("button", { name: "Page suivante", exact: true })
    .click();
  await expect(page.getByLabel("Aperçu PDF, page 2")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByLabel("Aperçu PDF, page 2")).toBeVisible();
  await expect(
    page.getByText("Préparation de l’aperçu…", { exact: true }),
  ).toHaveCount(0, { timeout: 10000 });
  await page.screenshot({
    path: "test-results/webkit-wide-report.png",
    fullPage: true,
    caret: "initial",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: WebKit with iPhone emulation, real OCR, local PDF rendering, table totals, IndexedDB, no overflow, 16px fields, filename editing and PDF download.",
  );
} catch (error) {
  await page.screenshot({
    path: "test-results/webkit-failure.png",
    fullPage: true,
    caret: "initial",
  });
  console.error("WEBKIT ERRORS", errors);
  throw error;
} finally {
  await browser.close();
}
