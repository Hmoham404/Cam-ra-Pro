import type { DocumentTable } from "@/types/production";

// Reconstruct regular tables only when at least two rows share explicit column boundaries.
// Uncertain layouts remain available in the complete transcription and original image.
export function parseDocumentTables(text: string): DocumentTable[] {
  const tables: DocumentTable[] = [];
  let group: string[][] = [];
  const flush = () => {
    if (group.length >= 3 && group[0].some((cell) => /[a-zÀ-ÿ]/i.test(cell))) {
      tables.push({ headers: group[0], rows: group.slice(1) });
    }
    group = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim().replace(/^\|\s*|\s*\|$/g, "");
    if (/^[\s|+\-:]+$/.test(clean)) continue;
    const cells = clean.split(/\s*\|\s*|\t+| {2,}/).map((cell) => cell.trim());
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
