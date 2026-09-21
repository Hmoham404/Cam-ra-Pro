import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { localReports } from "./helpers.mjs";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await context.addInitScript(() => {
  window.cameraStreams = [];
  window.cameraConstraints = [];
  const original = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    window.cameraConstraints.push(constraints);
    const stream = await original(constraints);
    window.cameraStreams.push(stream);
    return stream;
  };
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: () => true,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async (data) => {
      window.sharedPdfName = data.files[0].name;
    },
  });
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://127.0.0.1:3000/lecture");
  async function capture() {
    await page
      .getByRole("button", { name: "Prendre une photo", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Capturer la photo", exact: true }),
    ).toBeEnabled({ timeout: 30000 });
    await page
      .getByRole("button", { name: "Capturer la photo", exact: true })
      .click();
    await page.getByAltText("Photo capturée à vérifier").waitFor();
  }
  await capture();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.cameraStreams.every((s) =>
          s.getTracks().every((t) => t.readyState === "ended"),
        ),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Reprendre la photo" }).click();
  await expect(
    page.getByRole("button", { name: "Capturer la photo", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page.screenshot({ path: "test-results/camera-mobile.png" });
  await page
    .getByRole("button", { name: "Capturer la photo", exact: true })
    .click();
  await page.getByRole("button", { name: "Utiliser cette photo" }).click();
  await page.getByAltText("Fiche de production importée").waitFor();
  assert.equal(
    await page.evaluate(() =>
      window.cameraConstraints.every((c) => c.audio === false),
    ),
    true,
  );
  await page
    .getByRole("button", { name: "Analyser et créer le PDF", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Votre rapport est prêt" })
    .waitFor({ timeout: 180000 });
  await expect.poll(async () => (await localReports(page)).length).toBe(1);
  await page.getByRole("button", { name: "Partager", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.sharedPdfName || ""))
    .toMatch(/^Rapport_Injection_/);
  await page
    .getByRole("button", { name: "Nouvelle fiche", exact: true })
    .click();
  await capture();
  await page.getByRole("button", { name: "Utiliser cette photo" }).click();
  await page.getByAltText("Fiche de production importée").waitFor();
  await page
    .getByRole("button", { name: "Analyser et créer le PDF", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Votre rapport est prêt" })
    .waitFor({ timeout: 180000 });
  await expect.poll(async () => (await localReports(page)).length).toBe(2);
  const reports = await localReports(page);
  assert.notEqual(reports[0].id, reports[1].id);
  assert.notEqual(reports[0].filename, reports[1].filename);
  assert.notEqual(reports[0].source_filename, reports[1].source_filename);
  await page
    .getByRole("button", { name: "Nouvelle fiche", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Prendre une photo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Capturer la photo", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.cameraStreams.every((s) =>
          s.getTracks().every((t) => t.readyState === "ended"),
        ),
      ),
    )
    .toBe(true);
  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("denied", "NotAllowedError");
    };
  });
  const deniedPage = await denied.newPage();
  await deniedPage.goto("http://127.0.0.1:3000/lecture");
  await deniedPage
    .getByRole("button", { name: "Prendre une photo", exact: true })
    .click();
  await expect(deniedPage.getByRole("dialog").getByRole("alert")).toContainText(
    "L’accès à la caméra est refusé",
  );
  const choosing = deniedPage.waitForEvent("filechooser");
  await deniedPage
    .getByRole("button", { name: "Ouvrir l’appareil photo du téléphone" })
    .click();
  const chooser = await choosing;
  assert.equal(await chooser.element().getAttribute("capture"), "environment");
  await denied.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile synthetic webcam, capture, retake, stream cleanup, denied camera native fallback, two automatic separate PDFs, mocked file sharing. No physical webcam or real message sending.",
  );
} catch (error) {
  await page.screenshot({
    path: "test-results/camera-failure.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
