import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDocumentTables } from "../lib/tables";
import { reportFilename, safeFilename } from "../lib/filenames";

test("preserves table headers and cells for regular OCR tables", () => {
  const tables = parseDocumentTables(
    "FICHE STOCK\nArticle  Lot  Quantité\nCAP-245  A01  200\nBAG-100  A02  300\n\nObservation : bon état",
  );
  assert.deepEqual(tables, [
    {
      headers: ["Article", "Lot", "Quantité"],
      rows: [
        ["CAP-245", "A01", "200"],
        ["BAG-100", "A02", "300"],
      ],
    },
  ]);
});
test("reconstructs compact OCR production rows under a detected header", () => {
  const tables = parseDocumentTables(
    "Heure Quantite OK NOK Observation\n08:00 250 240 10\n10h00 300 290 10 Rayure",
  );
  assert.deepEqual(tables, [
    {
      headers: ["Heure", "Quantite", "OK", "NOK", "Observation"],
      rows: [
        ["08:00", "250", "240", "10", ""],
        ["10:00", "300", "290", "10", "Rayure"],
      ],
    },
  ]);
});
test("supports pipe tables, empty cells, multiple tables and separator lines", () => {
  const tables = parseDocumentTables(
    "| Produit | Quantité | Note |\n|---|---|---|\n| A | 20 | |\n| B | 30 | Rayure |\n\nHeure\tValeur\n08:00\t12\n09:00\t15",
  );
  assert.equal(tables.length, 2);
  assert.equal(tables[0].rows[0][2], "");
  assert.equal(tables[1].rows[1][1], "15");
});
test("does not invent a table from ordinary prose or incomplete columns", () => {
  assert.deepEqual(
    parseDocumentTables(
      "Une fiche de production\nTexte normal\nDate : 21/09/2026",
    ),
    [],
  );
  assert.deepEqual(
    parseDocumentTables("Article  Quantité  Lot\nA  100\nB  200"),
    [],
  );
});
test("names each PDF by department, local generation date and time plus distinct id", () => {
  const date = new Date(2026, 8, 21, 14, 7, 9);
  assert.equal(
    reportFilename("Métallisation", date, "abc123456"),
    "Rapport_Metallisation_20260921_140709_abc123.pdf",
  );
  assert.notEqual(
    reportFilename("Injection", date, "aaaaaa"),
    reportFilename("Injection", date, "bbbbbb"),
  );
  assert.equal(safeFilename("../../Atelier matin.pdf"), "Atelier_matin.pdf");
  assert.equal(safeFilename("   "), "Rapport.pdf");
});
