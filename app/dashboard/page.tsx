"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Package,
  Plus,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useSheets } from "@/lib/useSheets";
import { formatNumber, scrapRate } from "@/lib/calculations";
import { DEPARTMENTS } from "@/types/production";
const colors = [
  "bg-blue-500",
  "bg-orange-400",
  "bg-emerald-500",
  "bg-violet-500",
];
export default function Dashboard() {
  const { sheets, loading, error } = useSheets();
  const total = sheets.reduce((s, r) => s + r.quantity, 0),
    ok = sheets.reduce((s, r) => s + r.quantity_ok, 0),
    nok = sheets.reduce((s, r) => s + r.quantity_nok, 0);
  const mean = sheets.length
    ? sheets.reduce((s, r) => s + scrapRate(r.quantity_nok, r.quantity), 0) /
      sheets.length
    : 0;
  const byDepartment = DEPARTMENTS.map((name) => ({
    name,
    count: sheets.filter((s) => s.department === name).length,
    production: sheets
      .filter((s) => s.department === name)
      .reduce((sum, s) => sum + s.quantity, 0),
  }));
  const defects = new Map<string, number>();
  sheets.forEach((s) => {
    s.defect_type
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .forEach((d) => defects.set(d, (defects.get(d) || 0) + 1));
  });
  const top = [...defects.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
            La production, en perspective
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-xs text-slate-400">
            Une vue d’ensemble des fiches conservées sur cet appareil.
          </p>
        </div>
        <Link href="/lecture" className="btn-primary">
          <Plus size={16} />
          Lire une fiche
        </Link>
      </div>
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </p>
      )}
      {loading ? (
        <p className="panel p-10 text-center text-slate-400">
          Chargement des données locales…
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Fiches enregistrées",
                value: formatNumber(sheets.length),
                icon: FileText,
                color: "text-blue-600",
                sub: "50 dernières fiches",
              },
              {
                label: "Production totale",
                value: formatNumber(total),
                icon: Package,
                color: "text-ink",
                sub: "pièces produites",
              },
              {
                label: "Quantité OK",
                value: formatNumber(ok),
                icon: CheckCircle2,
                color: "text-emerald-600",
                sub: "pièces conformes",
              },
              {
                label: "Quantité NOK",
                value: formatNumber(nok),
                icon: XCircle,
                color: "text-red-500",
                sub: "pièces non conformes",
              },
              {
                label: "Taux de rebut moyen",
                value: `${mean.toFixed(2)} %`,
                icon: TriangleAlert,
                color: "text-orange-500",
                sub: "moyenne des taux par fiche",
              },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="panel p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500">
                    {label}
                  </span>
                  <Icon size={16} className={color} />
                </div>
                <p
                  className={`mt-5 text-[28px] font-extrabold tracking-tight ${color}`}
                >
                  {value}
                </p>
                <p className="mt-2 text-[9px] text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
          {!sheets.length && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div>
                <h2 className="text-xs font-bold text-blue-800">
                  Chaque fiche raconte votre production.
                </h2>
                <p className="mt-1 text-[11px] text-blue-600">
                  Générez votre premier PDF pour commencer à alimenter ce
                  tableau de bord.
                </p>
              </div>
              <Link
                href="/lecture"
                className="flex items-center gap-2 text-xs font-bold text-blue-600"
              >
                Commencer
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {[
              {
                title: "Fiches par département",
                key: "count" as const,
                unit: "fiches",
              },
              {
                title: "Production par département",
                key: "production" as const,
                unit: "pièces",
              },
            ].map((chart) => (
              <section key={chart.key} className="panel p-6">
                <h2 className="mb-7 flex items-center gap-2 text-xs font-bold">
                  <BarChart3 size={16} className="text-slate-400" />
                  {chart.title}
                </h2>
                <div className="space-y-6">
                  {byDepartment.map((d, i) => (
                    <div key={d.name}>
                      <div className="mb-2 flex justify-between text-[11px]">
                        <span className="font-semibold">{d.name}</span>
                        <span className="text-slate-400">
                          {formatNumber(d[chart.key])} {chart.unit}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${colors[i]}`}
                          style={{
                            width: `${(d[chart.key] / Math.max(1, ...byDepartment.map((x) => x[chart.key]))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.5fr]">
            <section className="panel p-6">
              <h2 className="mb-2 text-xs font-bold">
                Défauts les plus fréquents
              </h2>
              <p className="text-[10px] text-slate-400">
                Nombre de fiches mentionnant chaque défaut
              </p>
              {!top.length ? (
                <p className="py-12 text-center text-xs text-slate-400">
                  Aucun défaut enregistré.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {top.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded bg-orange-50 text-[10px] font-bold text-orange-500">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs">{name}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="panel p-6">
              <div className="mb-5 flex justify-between">
                <h2 className="text-xs font-bold">Dernières fiches</h2>
                <Link
                  href="/historique"
                  className="text-[10px] font-bold text-blue-600"
                >
                  Tout voir →
                </Link>
              </div>
              {!sheets.length ? (
                <p className="py-10 text-center text-xs text-slate-400">
                  Aucune fiche pour le moment.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sheets.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FileText size={16} />
                        </span>
                        <div className="text-xs font-bold">
                          {s.work_order || "Sans OF"}
                          <p className="mt-1 text-[10px] font-normal text-slate-400">
                            {s.department} · {s.date}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold">
                        {formatNumber(s.quantity)}{" "}
                        <span className="font-normal text-slate-400">
                          pièces
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
      <p className="mt-6 flex items-center gap-2 text-[10px] text-slate-400">
        <ShieldCheck size={14} />
        Données locales uniquement · Le tableau de bord évolue avec votre
        historique.
      </p>
    </>
  );
}
