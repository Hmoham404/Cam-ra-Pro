export async function createExample(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1500;
  canvas.height = 1750;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 1500, 1750);
  ctx.fillStyle = "#18283e";
  ctx.font = "bold 48px Arial";
  ctx.fillText("FICHE DE PRODUCTION", 100, 130);
  ctx.font = "28px Arial";
  ctx.fillStyle = "#555";
  ctx.fillText("DOCUMENT EXEMPLE - ATELIER INJECTION", 100, 185);
  ctx.fillStyle = "#111";
  ctx.font = "32px Arial";
  const lines = [
    "Date : 21/09/2026",
    "Département : Injection",
    "Machine : INJ-04",
    "Référence : CAP-245",
    "N° OF : OF-260921-01",
    "Équipe : A",
  ];
  lines.forEach((line, i) => ctx.fillText(line, 100, 300 + i * 66));
  ctx.font = "bold 28px Arial";
  [
    ["Heure", 100],
    ["Quantité", 350],
    ["OK", 650],
    ["NOK", 850],
    ["Observation", 1050],
  ].forEach(([t, x]) => ctx.fillText(String(t), Number(x), 790));
  ctx.font = "30px Arial";
  [
    ["08:00", "250", "240", "10", ""],
    ["10:00", "300", "290", "10", ""],
    ["12:00", "280", "270", "10", "Rayure"],
    ["14:00", "300", "295", "5", ""],
  ].forEach((row, i) => {
    row.forEach((v, j) =>
      ctx.fillText(v, [100, 350, 650, 850, 1050][j], 875 + i * 90),
    );
  });
  ctx.fillText("Défaut : Rayure", 100, 1370);
  ctx.fillText("Observation : Contrôle visuel effectué", 100, 1440);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(
              new File([blob], "exemple-injection.png", { type: "image/png" }),
            )
          : reject(new Error("Impossible de créer l’exemple.")),
      "image/png",
    ),
  );
}
