export const DEPARTMENTS = [
  "Injection",
  "Métallisation",
  "Sérigraphie",
  "Assemblage",
] as const;
export type Department = (typeof DEPARTMENTS)[number];
export const SHEET_TYPES = [
  "Fiche de production",
  "Fiche qualité",
  "Fiche de réglage",
  "Fiche de contrôle",
  "Fiche de rebut",
  "Autre",
] as const;
export type SheetType = (typeof SHEET_TYPES)[number];
export interface ProductionRow {
  time: string;
  quantity: number;
  ok: number;
  nok: number;
  observation: string;
}
export interface ProductionSheet {
  tables?: DocumentTable[];
  title: string;
  extracted_text: string;
  source_filename: string;
  date: string;
  department: string;
  machine: string;
  product_reference: string;
  work_order: string;
  team: string;
  quantity: number;
  quantity_ok: number;
  quantity_nok: number;
  defect_type: string;
  observation: string;
  rows: ProductionRow[];
}
export interface DocumentTable {
  headers: string[];
  rows: string[][];
}
export interface SavedSheet extends ProductionSheet {
  id: string;
  sheetType: SheetType;
  createdAt: string;
  filename: string;
  pdf: Blob;
  scrapRate: number;
}
export const emptySheet = (
  department: Department = "Injection",
): ProductionSheet => ({
  title: "",
  extracted_text: "",
  source_filename: "",
  date: "",
  department,
  machine: "",
  product_reference: "",
  work_order: "",
  team: "",
  quantity: 0,
  quantity_ok: 0,
  quantity_nok: 0,
  defect_type: "",
  observation: "",
  rows: [],
});
