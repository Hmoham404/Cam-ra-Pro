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
    "Departement : Injection",
    "Machine : INJ-04",
    "Reference : CAP-245",
    "N OF : OF-260921-01",
    "Equipe : A",
  ];
  lines.forEach((line, i) => ctx.fillText(line, 100, 300 + i * 66));
  ctx.font = "bold 28px Arial";
  [
    ["Heure", 100],
    ["Quantite", 350],
    ["OK", 650],
    ["NOK", 850],
    ["Observation", 1050],
  ].forEach(([text, x]) => ctx.fillText(String(text), Number(x), 790));
  ctx.font = "30px Arial";
  [
    ["08:00", "250", "240", "10", ""],
    ["10:00", "300", "290", "10", ""],
    ["12:00", "280", "270", "10", "Rayure"],
    ["14:00", "300", "295", "5", ""],
  ].forEach((row, i) => {
    row.forEach((value, j) =>
      ctx.fillText(value, [100, 350, 650, 850, 1050][j], 875 + i * 90),
    );
  });
  ctx.fillText("Defaut : Rayure", 100, 1370);
  ctx.fillText("Observation : Controle visuel effectue", 100, 1440);

  const blob = await new Promise<Blob | null>((resolve) => {
    const timeout = window.setTimeout(() => resolve(null), 1200);
    canvas.toBlob((value) => {
      window.clearTimeout(timeout);
      resolve(value);
    }, "image/png");
  });
  if (blob)
    return new File([blob], "exemple-injection.png", { type: "image/png" });

  const response = await fetch(canvas.toDataURL("image/png"));
  return new File([await response.blob()], "exemple-injection.png", {
    type: "image/png",
  });
}
