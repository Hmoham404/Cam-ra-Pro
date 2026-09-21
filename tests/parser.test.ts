import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProductionSheet, registerParser } from "../lib/parser";
import { scrapRate, totals } from "../lib/calculations";
test("keeps the title and all text for an image-specific report", () => {
  const text =
    "CONTRÔLE DE SURFACE\nDate : 21/09/2026\nLot : LOT-42\nAspect : brillant";
  const sheet = parseProductionSheet(text);
  assert.equal(sheet.title, "CONTRÔLE DE SURFACE");
  assert.equal(sheet.extracted_text, text);
  assert.equal(
    parseProductionSheet("Titre : Rapport atelier\nLot : X").title,
    "Rapport atelier",
  );
  assert.equal(
    parseProductionSheet("Machine : INJ-04\nDate : 21/09/2026").title,
    "",
  );
});
const example = `Date : 21/09/2026
Département : Injection
Machine : INJ-04
Référence : CAP-245
N° OF : OF-260921-01
Heure Quantité OK NOK Observation
08:00 250 240 10
10:00 300 290 10
12:00 280 270 10 Rayure
14:00 300 295 5`;
test("extracts the supplied production example without losing table rows", () => {
  const sheet = parseProductionSheet(example);
  assert.equal(sheet.date, "21/09/2026");
  assert.equal(sheet.department, "Injection");
  assert.equal(sheet.machine, "INJ-04");
  assert.equal(sheet.product_reference, "CAP-245");
  assert.equal(sheet.work_order, "OF-260921-01");
  assert.equal(sheet.quantity, 1130);
  assert.equal(sheet.quantity_ok, 1095);
  assert.equal(sheet.quantity_nok, 35);
  assert.equal(sheet.defect_type, "Rayure");
  assert.equal(sheet.rows.length, 4);
  assert.equal(sheet.rows[2].observation, "Rayure");
  assert.equal(sheet.observation, "");
});
test("accepts OCR label variants, accents and missing spaces after separators", () => {
  for (const label of ["N° OF", "N OF", "No OF", "N0 OF", "OF"])
    assert.equal(parseProductionSheet(`${label}:OF-123`).work_order, "OF-123");
  for (const label of ["Référence", "Reference", "Ref", "Réf"])
    assert.equal(
      parseProductionSheet(`${label} : CAP-245`).product_reference,
      "CAP-245",
    );
  for (const label of ["Quantité", "Quantite", "Qte", "Qté"]) {
    const s = parseProductionSheet(
      `${label} totale : 1 130\n${label} OK : 1 095\n${label} NOK : 35`,
    );
    assert.equal(s.quantity, 1130);
    assert.equal(s.quantity_ok, 1095);
    assert.equal(s.quantity_nok, 35);
  }
});
test("handles common character confusions only inside numeric cells", () => {
  const s = parseProductionSheet(
    "8h00 | 25O | 24O | IO | Rayure\n25:90 100 100 0",
  );
  assert.equal(s.rows.length, 1);
  assert.equal(s.rows[0].time, "08:00");
  assert.equal(s.quantity, 250);
  assert.equal(s.quantity_nok, 10);
});
test("keeps accented free text and supports ISO dates", () => {
  const s = parseProductionSheet(
    "Date:2026-09-21\nObservation : Contrôle effectué\nDépartement : Métallisation",
  );
  assert.equal(s.date, "21/09/2026");
  assert.equal(s.observation, "Contrôle effectué");
  assert.equal(s.department, "Métallisation");
});
test("does not invent missing quantities or data", () => {
  const s = parseProductionSheet("");
  assert.equal(s.date, "");
  assert.equal(s.department, "");
  assert.deepEqual(s.rows, []);
  assert.equal(s.quantity, 0);
});
test("does not mistake the OK or NOK label for a total quantity", () => {
  const s = parseProductionSheet("Quantité OK : 50\nQuantité NOK : 2");
  assert.equal(s.quantity, 0);
  assert.equal(s.quantity_ok, 50);
  assert.equal(s.quantity_nok, 2);
  assert.equal(
    parseProductionSheet(
      "Quantité OK : 50\nQuantité NOK : 2\nQuantité totale : 52",
    ).quantity,
    52,
  );
});
test("can extend a parser for a department and document type", () => {
  registerParser("Assemblage", "Fiche qualité", (text, sheet) => ({
    ...sheet,
    team: text.includes("Ligne A") ? "A" : sheet.team,
  }));
  assert.equal(
    parseProductionSheet("Ligne A", "Assemblage", "Fiche qualité").team,
    "A",
  );
});
test("calculations support empty production and complete totals", () => {
  assert.equal(scrapRate(0, 0), 0);
  assert.equal(scrapRate(5, 100), 5);
  assert.deepEqual(totals([]), {
    quantity: 0,
    quantity_ok: 0,
    quantity_nok: 0,
  });
  assert.equal(totals(parseProductionSheet(example).rows).quantity, 1130);
});
