import {
  emptySheet,
  DEPARTMENTS,
  type ProductionSheet,
  type Department,
  type SheetType,
} from "@/types/production";
import { totals } from "./calculations";
import { parseDocumentTables } from "./tables";
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const numeric = (value: string) =>
  Number(
    value.replace(/[Oo]/g, "0").replace(/[Il]/g, "1").replace(/[^\d]/g, ""),
  ) || 0;
type Parser = (text: string, sheet: ProductionSheet) => ProductionSheet;
const parsers = new Map<string, Parser>();
export function registerParser(
  department: Department,
  type: SheetType,
  parser: Parser,
) {
  parsers.set(`${department}:${type}`, parser);
}
export function parseProductionSheet(
  text: string,
  department?: Department,
  type?: SheetType,
): ProductionSheet {
  const sheet = emptySheet(department);
  sheet.extracted_text = text.trim();
  sheet.tables = parseDocumentTables(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const value = (pattern: string) => {
    const regex = new RegExp(
      `^\\s*(?:${pattern})\\s*(?::|=|\\|)?\\s+(.+?)\\s*$`,
      "i",
    );
    for (const line of lines) {
      const match = normalize(line).match(regex);
      if (match) return line.slice(line.length - match[1].length).trim();
      const colonMatch = normalize(line).match(
        new RegExp(`^(?:${pattern})\\s*[:=]\\s*(.+)$`, "i"),
      );
      if (colonMatch)
        return line.slice(line.length - colonMatch[1].length).trim();
    }
    return "";
  };
  // Prefer an explicit title; otherwise use a heading before the first data field.
  // Preserve the original text so unrecognized layouts never silently lose their content.
  const heading = lines[0];
  sheet.title =
    value("titre(?: du document)?|title") ||
    (heading &&
    !/[:=|]/.test(heading) &&
    !/^\d/.test(heading) &&
    !/^(date|departement|machine|reference|ref\b|n[°o0]?\s*of|of\b|equipe|quantite|qte|heure|observation|defaut)\b/.test(
      normalize(heading),
    )
      ? heading
      : "");
  sheet.title = sheet.title.slice(0, 200);
  const date = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/);
  if (date)
    sheet.date = `${date[1].padStart(2, "0")}/${date[2].padStart(2, "0")}/${date[3]}`;
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (!date && iso) sheet.date = `${iso[3]}/${iso[2]}/${iso[1]}`;
  const foundDepartment = value("departement|atelier|dept");
  sheet.department =
    DEPARTMENTS.find((d) => normalize(d) === normalize(foundDepartment)) ||
    department ||
    "";
  sheet.machine = value("machine|presse");
  sheet.product_reference = value("reference(?: produit)?|ref(?:erence)?\\.?");
  sheet.work_order = value("(?:n[°o0º]?\\s*)?of|ordre de fabrication");
  sheet.team = value("equipe|team");
  sheet.defect_type = value("defaut(?:s)?|type de defaut");
  sheet.observation = value("observations?|remarques?");
  for (const line of lines) {
    const row = line
      .replace(/\|/g, " ")
      .match(
        /^(\d{1,2})[:h.](\d{2})\s+([\dOoIl]+)\s+([\dOoIl]+)\s+([\dOoIl]+)(?:\s+(.*))?$/,
      );
    if (!row || Number(row[1]) > 23 || Number(row[2]) > 59) continue;
    sheet.rows.push({
      time: `${row[1].padStart(2, "0")}:${row[2]}`,
      quantity: numeric(row[3]),
      ok: numeric(row[4]),
      nok: numeric(row[5]),
      observation: row[6]?.trim() || "",
    });
  }
  if (sheet.rows.length) Object.assign(sheet, totals(sheet.rows));
  else {
    const quantity = value(
      "(?:quantite|qte)(?!\\s*(?:ok|nok)\\b)(?: totale)?|total",
    );
    sheet.quantity = /^[\dOoIl\s.,]+$/.test(quantity) ? numeric(quantity) : 0;
    sheet.quantity_ok = numeric(value("(?:quantite|qte)\\s*ok|ok"));
    sheet.quantity_nok = numeric(value("(?:quantite|qte)\\s*nok|nok|rebuts?"));
  }
  if (!sheet.defect_type)
    sheet.defect_type = [
      ...new Set(
        sheet.rows
          .filter((r) => r.nok > 0)
          .map((r) => r.observation)
          .filter(Boolean),
      ),
    ].join(", ");
  return (
    (department && type
      ? parsers.get(`${department}:${type}`)?.(text, sheet)
      : undefined) || sheet
  );
}
