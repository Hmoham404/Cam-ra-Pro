import type { ProductionSheet, SheetType } from "@/types/production";
import { scrapRate } from "./calculations";
import { thumbnail } from "./imageProcessing";
import { reportFilename } from "./filenames";

export async function generatePdf(
  sheet: ProductionSheet,
  sheetType: SheetType,
  image?: File,
  reportId = crypto.randomUUID(),
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  const now = new Date(),
    createdAt = now.toISOString();
  const department = sheet.department || "Non précisé";
  doc.setProperties({
    title: sheet.title || sheetType,
    subject: `Rapport ${department}`,
    creator: "Production Sheet Reader",
  });
  doc.setFillColor(17, 31, 53);
  doc.rect(0, 0, 210, 37, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("RAPPORT DE LECTURE", 16, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${department.toUpperCase()}  /  ${sheetType}`, 16, 28);
  const metadata: string[][] = [
    ["Département", department],
    ["Généré le", now.toLocaleString("fr-FR")],
    ["Image source", sheet.source_filename || image?.name || "Non précisée"],
  ];
  for (const [label, value] of [
    ["Date du document", sheet.date],
    ["Machine", sheet.machine],
    ["Référence", sheet.product_reference],
    ["N° OF", sheet.work_order],
    ["Équipe", sheet.team],
  ])
    if (value) metadata.push([label, value]);
  autoTable(doc, {
    startY: 44,
    head: [[{ content: sheet.title || sheetType, colSpan: 2 }]],
    body: metadata,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fontSize: 14, fontStyle: "bold", textColor: [17, 31, 53] },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: "bold", textColor: [95, 110, 130] },
    },
    margin: { left: 16, right: 16, bottom: 20 },
  });
  const lastY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;
  if (sheet.rows.length) {
    autoTable(doc, {
      startY: lastY() + 8,
      head: [["Heure", "Quantité", "OK", "NOK", "Observation"]],
      body: sheet.rows.map((row) => [
        row.time,
        row.quantity,
        row.ok,
        row.nok,
        row.observation,
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [246, 248, 251] },
      margin: { left: 16, right: 16, bottom: 20 },
    });
  }
  if (sheet.rows.length || sheet.quantity > 0) {
    autoTable(doc, {
      startY: lastY() + 6,
      head: [["TOTAL", "OK", "NOK", "REBUT"]],
      body: [
        [
          sheet.quantity,
          sheet.quantity_ok,
          sheet.quantity_nok,
          `${scrapRate(sheet.quantity_nok, sheet.quantity).toFixed(2)} %`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [17, 31, 53] },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 16, right: 16, bottom: 20 },
    });
  }
  if (sheet.tables?.length) {
    for (const table of sheet.tables.filter(
      (table) =>
        !sheet.rows.length ||
        !table.headers.some((header) => /^heure$/i.test(header)),
    ))
      autoTable(doc, {
        startY: lastY() + 8,
        head: [table.headers],
        body: table.rows,
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 16, right: 16, bottom: 20 },
      });
  }
  const quality = [
    ["Défaut", sheet.defect_type],
    ["Observation", sheet.observation],
  ].filter(([, value]) => value);
  if (quality.length)
    autoTable(doc, {
      startY: lastY() + 8,
      body: quality,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 } },
      margin: { left: 16, right: 16, bottom: 20 },
    });
  if (sheet.extracted_text.trim())
    autoTable(doc, {
      startY: lastY() + 10,
      head: [["TRANSCRIPTION DE L’IMAGE"]],
      body: sheet.extracted_text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => [line]),
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
      headStyles: {
        fillColor: [17, 31, 53],
        textColor: [255, 255, 255],
        cellPadding: 4,
      },
      margin: { left: 16, right: 16, top: 18, bottom: 22 },
    });
  else
    autoTable(doc, {
      startY: lastY() + 8,
      body: [
        [
          "Aucun texte lisible détecté. Consultez la photo originale ci-dessous.",
        ],
      ],
      theme: "plain",
      styles: { fontSize: 11, textColor: [180, 90, 20] },
      margin: { left: 16, right: 16, bottom: 20 },
    });
  if (image) {
    doc.addPage();
    doc.setTextColor(17, 31, 53);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PHOTO ORIGINALE", 16, 20);
    const data = await thumbnail(image, 1800),
      props = doc.getImageProperties(data);
    const scale = Math.min(178 / props.width, 245 / props.height);
    doc.addImage(
      data,
      "JPEG",
      16,
      27,
      props.width * scale,
      props.height * scale,
    );
  }
  for (let page = 1; page <= doc.getNumberOfPages(); page++) {
    doc.setPage(page);
    doc.setTextColor(110, 120, 135);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Lecture OCR automatique · Vérifier les données avec la photo originale.",
      16,
      286,
    );
    doc.text(`${page} / ${doc.getNumberOfPages()}`, 194, 286, {
      align: "right",
    });
  }
  return {
    blob: doc.output("blob"),
    filename: reportFilename(department, now, reportId),
    createdAt,
  };
}
export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
