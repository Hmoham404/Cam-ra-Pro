"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  FileCheck2,
  Plus,
  Save,
  Table2,
  Trash2,
} from "lucide-react";
import type {
  DocumentTable,
  ProductionRow,
  ProductionSheet,
} from "@/types/production";
import { formatNumber, totals } from "@/lib/calculations";

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadText = (text: string, filename: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const emptyRow = (): ProductionRow => ({
  time: "",
  quantity: 0,
  ok: 0,
  nok: 0,
  observation: "",
});

const cleanNumber = (value: string) =>
  Math.max(0, Math.round(Number(value.replace(",", ".")) || 0));

const cloneTable = (table?: DocumentTable): DocumentTable | undefined =>
  table
    ? {
        headers: [...table.headers],
        rows: table.rows.map((row) => [...row]),
      }
    : undefined;

export function ExtractedDataPanel({
  sheet,
  disabled,
  onApply,
}: {
  sheet: ProductionSheet;
  disabled?: boolean;
  onApply?: (sheet: ProductionSheet) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false),
    [saving, setSaving] = useState(false),
    [saved, setSaved] = useState(false),
    [rows, setRows] = useState<ProductionRow[]>(sheet.rows),
    [table, setTable] = useState<DocumentTable | undefined>(() =>
      cloneTable(sheet.tables?.[0]),
    );

  useEffect(() => {
    setRows(sheet.rows.map((row) => ({ ...row })));
    setTable(cloneTable(sheet.tables?.[0]));
    setSaved(false);
  }, [sheet]);

  const sum = useMemo(() => totals(rows), [rows]);
  const inconsistent = rows.filter((row) => row.quantity !== row.ok + row.nok);

  const csv = useMemo(() => {
    const tableRows = rows.length
      ? [
          ["Heure", "Quantite", "OK", "NOK", "Observation"],
          ...rows.map((row) => [
            row.time,
            row.quantity,
            row.ok,
            row.nok,
            row.observation,
          ]),
        ]
      : table
        ? [table.headers, ...table.rows]
        : [
            ["Champ", "Valeur"],
            ["Titre", sheet.title],
            ["Date", sheet.date],
            ["Departement", sheet.department],
            ["Machine", sheet.machine],
            ["Reference", sheet.product_reference],
            ["OF", sheet.work_order],
          ].filter(([, value]) => value);
    return tableRows.map((row) => row.map(escapeCsv).join(";")).join("\n");
  }, [rows, sheet, table]);

  const updateRow = (
    index: number,
    key: keyof ProductionRow,
    value: string,
  ) => {
    setSaved(false);
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [key]:
                key === "time" || key === "observation"
                  ? value
                  : cleanNumber(value),
            }
          : row,
      ),
    );
  };

  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    setSaved(false);
    setTable((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row, index) =>
              index === rowIndex
                ? row.map((cell, nestedIndex) =>
                    nestedIndex === cellIndex ? value : cell,
                  )
                : row,
            ),
          }
        : current,
    );
  };

  async function copyCsv() {
    await navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function applyCorrections() {
    if (!onApply) return;
    setSaving(true);
    setSaved(false);
    try {
      const next: ProductionSheet = rows.length
        ? {
            ...sheet,
            rows,
            tables: table ? [table, ...(sheet.tables || []).slice(1)] : [],
            quantity: sum.quantity,
            quantity_ok: sum.quantity_ok,
            quantity_nok: sum.quantity_nok,
          }
        : {
            ...sheet,
            tables: table ? [table, ...(sheet.tables || []).slice(1)] : [],
          };
      await onApply(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel mt-5 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-600">
            <span className="h-1 w-5 rounded bg-emerald-500" />
            Controle des donnees
          </p>
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <Table2 size={18} className="text-blue-600" />
            Tableau modifiable
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Corrigez les cellules importees, puis mettez a jour le PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary !min-h-10 !px-3" onClick={copyCsv}>
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            {copied ? "Copie" : "Copier"}
          </button>
          <button
            className="btn-secondary !min-h-10 !px-3"
            onClick={() => downloadText(csv, "donnees-rapport.csv", "text/csv")}
          >
            <Download size={15} />
            CSV
          </button>
          {onApply && (
            <button
              className="btn-primary !min-h-10 !px-3"
              disabled={disabled || saving}
              onClick={applyCorrections}
            >
              {saved ? <FileCheck2 size={15} /> : <Save size={15} />}
              {saving
                ? "Mise a jour..."
                : saved
                  ? "PDF a jour"
                  : "Mettre a jour"}
            </button>
          )}
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[11px]">
              <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-400">
                <tr>
                  {["Heure", "Quantite", "OK", "NOK", "Observation", ""].map(
                    (header) => (
                      <th
                        className="border-b border-slate-100 px-3 py-3 font-semibold first:pl-5 last:pr-5"
                        key={header}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const hasIssue = row.quantity !== row.ok + row.nok;
                  return (
                    <tr
                      className={`border-t border-slate-100 ${hasIssue ? "bg-orange-50/70" : ""}`}
                      key={index}
                    >
                      <td className="px-3 py-2 first:pl-5">
                        <input
                          aria-label={`Heure ligne ${index + 1}`}
                          className="field !min-h-10 !py-1.5 font-semibold"
                          disabled={disabled || saving}
                          type="time"
                          value={row.time}
                          onChange={(event) =>
                            updateRow(index, "time", event.target.value)
                          }
                        />
                      </td>
                      {(["quantity", "ok", "nok"] as const).map((key) => (
                        <td className="px-3 py-2" key={key}>
                          <input
                            aria-label={`${
                              key === "quantity"
                                ? "Quantite"
                                : key === "ok"
                                  ? "OK"
                                  : "NOK"
                            } ligne ${index + 1}`}
                            className={`field !min-h-10 !py-1.5 ${key === "ok" ? "!text-emerald-700" : key === "nok" ? "!text-red-600" : ""}`}
                            disabled={disabled || saving}
                            min={0}
                            type="number"
                            value={row[key]}
                            onChange={(event) =>
                              updateRow(index, key, event.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <input
                          aria-label={`Observation ligne ${index + 1}`}
                          className="field !min-h-10 !py-1.5"
                          disabled={disabled || saving}
                          value={row.observation}
                          onChange={(event) =>
                            updateRow(index, "observation", event.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2 pr-5">
                        <button
                          aria-label={`Supprimer ligne ${index + 1}`}
                          className="icon-btn hover:!text-red-600"
                          disabled={disabled || saving}
                          onClick={() => {
                            setSaved(false);
                            setRows((current) =>
                              current.filter(
                                (_, rowIndex) => rowIndex !== index,
                              ),
                            );
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
                <tr>
                  <td className="px-5 py-3">Total</td>
                  <td className="px-3 py-3">{formatNumber(sum.quantity)}</td>
                  <td className="px-3 py-3 text-emerald-600">
                    {formatNumber(sum.quantity_ok)}
                  </td>
                  <td className="px-3 py-3 text-red-500">
                    {formatNumber(sum.quantity_nok)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
            <button
              className="btn-secondary !min-h-10 !px-3"
              disabled={disabled || saving}
              onClick={() => {
                setSaved(false);
                setRows((current) => [...current, emptyRow()]);
              }}
            >
              <Plus size={15} />
              Ajouter une ligne
            </button>
            <p
              className={`text-[11px] leading-5 ${
                inconsistent.length ? "text-orange-700" : "text-slate-500"
              }`}
            >
              {inconsistent.length
                ? `${inconsistent.length} ligne(s) a verifier: quantite differente de OK + NOK.`
                : "Les totaux sont recalcules automatiquement."}
            </p>
          </div>
        </>
      ) : table ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-[11px]">
            <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-400">
              <tr>
                {table.headers.map((header, index) => (
                  <th
                    className="border-b border-slate-100 px-3 py-3 font-semibold first:pl-5 last:pr-5"
                    key={index}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr className="border-t border-slate-100" key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      className="px-3 py-2 first:pl-5 last:pr-5"
                      key={cellIndex}
                    >
                      <input
                        aria-label={`Cellule ${rowIndex + 1}-${cellIndex + 1}`}
                        className="field !min-h-10 !py-1.5"
                        disabled={disabled || saving}
                        value={cell}
                        onChange={(event) =>
                          updateCell(rowIndex, cellIndex, event.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <pre className="max-h-64 overflow-auto rounded-xl bg-slate-50 p-4 whitespace-pre-wrap text-[11px] leading-5 text-slate-600">
            {sheet.extracted_text || "Aucun texte exploitable detecte."}
          </pre>
        </div>
      )}
    </section>
  );
}
