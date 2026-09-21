"use client";
import { useEffect, useState } from "react";
import { Check, HardDrive, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { DEPARTMENTS, type Department } from "@/types/production";
export default function Settings() {
  const [department, setDepartment] = useState<Department>("Injection"),
    [enhance, setEnhance] = useState(true),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("psr-settings") || "{}");
      if (DEPARTMENTS.includes(settings.department))
        setDepartment(settings.department);
      if (typeof settings.enhance === "boolean") setEnhance(settings.enhance);
    } catch {
      setError("Les préférences locales ne peuvent pas être lues.");
    }
  }, []);
  const save = () => {
    try {
      localStorage.setItem(
        "psr-settings",
        JSON.stringify({ department, enhance }),
      );
      setSaved(true);
      setError("");
    } catch {
      setError(
        "Impossible de sauvegarder les préférences. Vérifiez les autorisations de stockage du navigateur.",
      );
    }
  };
  return (
    <>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
        Un outil à votre mesure
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight">Paramètres</h1>
      <p className="mt-2 text-xs text-slate-400">
        Vos préférences sont enregistrées uniquement sur cet appareil.
      </p>
      <div className="mt-7 grid max-w-5xl gap-5 md:grid-cols-2">
        <section className="panel p-6">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal size={18} className="text-blue-600" />
            Préférences de lecture
          </h2>
          <label>
            <span className="label">Département par défaut</span>
            <select
              className="field"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value as Department);
                setSaved(false);
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="mt-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={enhance}
              className="mt-1 size-4 accent-blue-600"
              onChange={(e) => {
                setEnhance(e.target.checked);
                setSaved(false);
              }}
            />
            <span className="text-xs font-bold">
              Améliorer l’image avant l’analyse
              <span className="mt-2 block text-[11px] leading-5 font-normal text-slate-400">
                Niveaux de gris, contraste et réduction légère du bruit.
                Désactivez si le document contient du texte très fin.
              </span>
            </span>
          </label>
          <button className="btn-primary mt-7" onClick={save}>
            {saved && <Check size={15} />}{" "}
            {saved ? "Préférences enregistrées" : "Enregistrer les préférences"}
          </button>
          {error && (
            <p role="alert" className="mt-4 text-xs text-red-500">
              {error}
            </p>
          )}
        </section>
        <section className="panel p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-bold">
            <ShieldCheck size={18} className="text-emerald-600" />
            Confidentialité par conception
          </h2>
          <div className="space-y-5 text-xs leading-6 text-slate-500">
            <p>
              L’analyse OCR et la génération des PDF se font dans votre
              navigateur. Votre image n’est jamais envoyée à un serveur.
            </p>
            <p>
              L’application charge ses fichiers, son moteur OCR et les langues
              depuis son hébergement. Les images restent en mémoire sur votre
              appareil.
            </p>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 flex items-center gap-2 font-bold text-ink">
                <HardDrive size={15} />
                Stockage local
              </p>
              <p>
                Les 50 derniers rapports PDF et leurs données sont conservés
                dans IndexedDB. Effacer les données du navigateur efface
                l’historique. Pensez à télécharger vos rapports.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
