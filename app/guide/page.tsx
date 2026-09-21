import Link from "next/link";
import { Camera, FileDown, ScanLine, ShieldCheck } from "lucide-react";
export default function Guide() {
  return (
    <>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
        Du papier au PDF
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Une fiche. Trois étapes.
      </h1>
      <p className="mt-3 text-xs text-slate-400">
        Votre guide pour une lecture fiable sur le terrain.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: Camera,
            title: "01 · Capturez la fiche",
            text: "Cliquez sur Prendre une photo pour ouvrir la caméra du PC ou du téléphone. Autorisez l’accès, cadrez le document et capturez la photo. Vérifiez-la avant de cliquer sur Utiliser cette photo. L’import d’images reste disponible.",
          },
          {
            icon: ScanLine,
            title: "02 · Analysez en un geste",
            text: "Cliquez sur Analyser et créer le PDF. Le titre, le texte et les tableaux détectés sont réunis automatiquement dans un rapport. Aucun formulaire n’est à remplir.",
          },
          {
            icon: FileDown,
            title: "03 · Consultez et partagez",
            text: "L’aperçu du PDF s’ouvre après l’analyse. Vérifiez la lecture avec la photo originale incluse, renommez le fichier si nécessaire puis téléchargez-le ou partagez-le. Chaque image produit un rapport distinct dans l’historique.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <section className="panel p-7" key={title}>
            <span className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={24} />
            </span>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-4 text-xs leading-7 text-slate-500">{text}</p>
          </section>
        ))}
      </div>
      <div className="panel mt-6 max-w-3xl p-6">
        <h2 className="mb-3 text-sm font-bold">
          Pour une meilleure reconnaissance
        </h2>
        <ul className="list-disc space-y-2 pl-4 text-xs leading-6 text-slate-500">
          <li>
            Évitez les ombres, les reflets, le flou et les photos inclinées.
          </li>
          <li>
            Les documents imprimés et les tableaux réguliers sont les mieux
            reconnus. L’écriture manuscrite peut être mal lue : comparez la
            transcription à la photo originale.
          </li>
          <li>
            Les tableaux de production et les tableaux à colonnes régulièrement
            espacées sont reconstruits quand leur structure est reconnue. Les
            autres restent visibles dans la photo originale.
          </li>
          <li>
            La première analyse charge le moteur OCR. Sur mobile, elle peut
            prendre plusieurs dizaines de secondes.
          </li>
          <li>
            Le taux de rebut est calculé à partir de NOK / quantité totale ×
            100.
          </li>
          <li>
            Sur téléphone, si la caméra intégrée est bloquée, utilisez «
            Utiliser l’appareil photo du téléphone ». Depuis Telegram, vous
            pouvez aussi ouvrir le lien dans Safari ou Chrome.
          </li>
          <li>
            Le PDF porte le département, la date et l’heure de génération dans
            son nom. Le bouton crayon permet de le renommer.
          </li>
        </ul>
        <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <ShieldCheck size={16} />
          Analyse locale : votre image reste sur cet appareil.
        </p>
      </div>
      <Link href="/lecture" className="btn-primary mt-6">
        Lire ma première fiche →
      </Link>
    </>
  );
}
