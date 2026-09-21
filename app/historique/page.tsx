"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, Eye, History, Plus, Search, Trash2 } from "lucide-react";
import { DEPARTMENTS, SHEET_TYPES } from "@/types/production";
import { useSheets } from "@/lib/useSheets";
import { clearSheets, deleteSheet, saveSheet } from "@/lib/storage";
import { downloadPdf } from "@/lib/pdf";
import { formatNumber } from "@/lib/calculations";
import { PdfPreview, type PdfResult } from "@/components/PdfPreview";
export default function HistoryPage() {
  const { sheets, loading, error } = useSheets();
  const [search, setSearch] = useState(""),
    [department, setDepartment] = useState(""),
    [type, setType] = useState(""),
    [actionError, setActionError] = useState(""),
    [preview, setPreview] = useState<PdfResult & { id: string }>();
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = sheets.filter(
    (s) =>
      (!department || s.department === department) &&
      (!type || s.sheetType === type) &&
      normalize(
        `${s.title || ""} ${s.source_filename || ""} ${s.work_order} ${s.machine} ${s.product_reference} ${s.date} ${s.defect_type}`,
      ).includes(normalize(search)),
  );
  const remove = async (id?: string) => {
    if (
      !window.confirm(
        id
          ? "Supprimer cette fiche et son PDF de cet appareil ?"
          : "Vider tout l’historique local ? Cette action est définitive.",
      )
    )
      return;
    try {
      if (id) await deleteSheet(id);
      else await clearSheets();
      setPreview(undefined);
      setActionError("");
    } catch (e) {
      setActionError((e as Error).message);
    }
  };
  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
            Votre mémoire de production
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Historique</h1>
          <p className="mt-2 text-xs text-slate-400">
            Les 50 dernières fiches enregistrées sur cet appareil.
          </p>
        </div>
        <Link href="/lecture" className="btn-primary">
          <Plus size={16} />
          Nouvelle fiche
        </Link>
      </div>
      <div className="panel mb-5 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-48 flex-1">
          <Search size={16} className="absolute top-3 left-3 text-slate-400" />
          <input
            aria-label="Rechercher dans l’historique"
            className="field pl-10"
            placeholder="Rechercher un OF, une machine, une référence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrer par département"
          className="field w-auto"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Tous les départements</option>
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          aria-label="Filtrer par type de fiche"
          className="field w-auto"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tous les types</option>
          {SHEET_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      {(error || actionError) && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error || actionError}
        </p>
      )}
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-xs font-bold">
            {filtered.length} fiche{filtered.length !== 1 ? "s" : ""}{" "}
            enregistrée{filtered.length !== 1 ? "s" : ""}
          </h2>
          <button
            disabled={!sheets.length}
            onClick={() => remove()}
            className="btn !min-h-9 !px-2 text-red-500"
          >
            <Trash2 size={14} />
            Vider l’historique
          </button>
        </div>
        {loading ? (
          <p className="p-12 text-center text-slate-400">
            Chargement de l’historique…
          </p>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center px-5 py-20">
            <History size={36} className="mb-4 text-slate-300" />
            <h2 className="font-bold">
              {sheets.length
                ? "Aucune fiche correspondante"
                : "Votre première fiche vous attend."}
            </h2>
            <p className="mt-2 max-w-md text-center text-xs leading-6 text-slate-400">
              {sheets.length
                ? "Essayez un autre filtre ou un autre terme de recherche."
                : "Les PDF que vous générez sont automatiquement sauvegardés ici, sur cet appareil."}
            </p>
            {!sheets.length && (
              <Link href="/lecture" className="btn-primary mt-5">
                Lire une fiche
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-400">
                <tr>
                  {[
                    "Document / Image",
                    "Date / OF",
                    "Département / Type",
                    "Machine / Référence",
                    "Total",
                    "OK",
                    "NOK",
                    "Rebut",
                    "Actions",
                  ].map((s) => (
                    <th key={s} className="px-4 py-4 font-semibold">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="max-w-60 px-4 py-5">
                      <span className="block text-xs font-semibold">
                        {s.title || s.sheetType}
                      </span>
                      <span className="mt-1 block break-all text-[10px] text-slate-400">
                        {s.source_filename || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-5 font-semibold">
                      {s.date}
                      <span className="mt-1 block text-[10px] font-normal text-slate-400">
                        {s.work_order || "Sans OF"}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {s.department}
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {s.sheetType}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {s.machine || "—"}
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {s.product_reference || "—"}
                      </span>
                    </td>
                    <td className="px-4 font-semibold">
                      {formatNumber(s.quantity)}
                    </td>
                    <td className="px-4 text-emerald-600">
                      {formatNumber(s.quantity_ok)}
                    </td>
                    <td className="px-4 text-red-500">
                      {formatNumber(s.quantity_nok)}
                    </td>
                    <td className="px-4">{s.scrapRate.toFixed(2)} %</td>
                    <td className="px-3">
                      <div className="flex">
                        <button
                          aria-label={`Télécharger ${s.work_order}`}
                          className="icon-btn"
                          onClick={() => downloadPdf(s.pdf, s.filename)}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          aria-label={`Aperçu ${s.work_order}`}
                          className="icon-btn"
                          onClick={() =>
                            setPreview({
                              id: s.id,
                              blob: s.pdf,
                              filename: s.filename,
                              createdAt: s.createdAt,
                            })
                          }
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          aria-label={`Supprimer ${s.work_order}`}
                          className="icon-btn hover:!text-red-500"
                          onClick={() => remove(s.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {preview && (
        <PdfPreview
          key={preview.id}
          pdf={preview}
          onNew={() => setPreview(undefined)}
          autoPreview
          onRename={async (filename) => {
            const sheet = sheets.find((item) => item.id === preview.id);
            if (!sheet) throw new Error("Fiche indisponible");
            await saveSheet({ ...sheet, filename });
            setPreview({ ...preview, filename });
          }}
        />
      )}
      <p className="mt-5 text-[10px] text-slate-400">
        L’effacement des données du navigateur supprime cet historique.
        Téléchargez vos PDF pour les conserver.
      </p>
    </>
  );
}
