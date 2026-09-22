import type { DocumentTable } from "@/types/production";

const hasLetters = (cell: string) => /[a-zA-Z\u00c0-\u024f]/.test(cell);

const normalizeHeader = (cells: string[]) =>
  cells
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const compactCells = (cells: string[]) =>
  cells.map((cell) => cell.trim()).filter((cell) => cell.length > 0);

const splitRegular = (line: string) => {
  if (line.includes("|")) {
    const trimmed = line.replace(/^\|\s*|\s*\|$/g, "");
    return trimmed.split(/\s*\|\s*/).map((cell) => cell.trim());
  }
  return compactCells(line.split(/\t+| {2,}/));
};

const looksLikeProductionHeader = (cells: string[]) => {
  const header = normalizeHeader(cells);
  return (
    /\bheure\b/.test(header) &&
    /\b(ok|bon)\b/.test(header) &&
    /\b(nok|rebut|defaut)\b/.test(header)
  );
};

const splitLooseProductionRow = (line: string) => {
  const match = line.match(
    /^(\d{1,2}[:h.]\d{2})\s+([\dOoIl]+)\s+([\dOoIl]+)\s+([\dOoIl]+)(?:\s+(.*))?$/,
  );
  if (!match) return [];
  return [
    match[1].replace(/[h.]/, ":"),
    match[2],
    match[3],
    match[4],
    match[5]?.trim() || "",
  ];
};

const splitLooseProductionHeader = (line: string) => {
  const cells = compactCells(line.split(/\s+/));
  return looksLikeProductionHeader(cells) && cells.length >= 4 ? cells : [];
};

// Reconstruct regular tables only when at least two rows share column boundaries.
// Common production rows are also accepted because OCR often collapses their spacing.
export function parseDocumentTables(text: string): DocumentTable[] {
  const tables: DocumentTable[] = [];
  let group: string[][] = [];

  const flush = () => {
    const width = group[0]?.length || 0;
    const rows = group.filter((row) => row.length === width);
    if (rows.length >= 3 && rows[0].some(hasLetters)) {
      tables.push({ headers: rows[0], rows: rows.slice(1) });
    }
    group = [];
  };

  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    const clean = raw.replace(/^\|\s*|\s*\|$/g, "");
    if (!clean) {
      flush();
      continue;
    }
    if (/^[\s|+\-:]+$/.test(clean)) continue;

    const regular = splitRegular(raw.includes("|") ? raw : clean);
    const cells =
      regular.length >= 2
        ? regular
        : group.length
          ? looksLikeProductionHeader(group[0])
            ? splitLooseProductionRow(clean)
            : []
          : splitLooseProductionHeader(clean);

    if (cells.length < 2 || cells.length > 12) {
      flush();
      continue;
    }
    if (group.length && group[0].length !== cells.length) flush();
    group.push(cells);
  }

  flush();
  return tables;
}
