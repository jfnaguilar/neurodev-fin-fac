import ExcelJS from "exceljs";

// ─── Column definition ────────────────────────────────────────────────────────

export interface ColDef {
  key: string;
  header: string;
  width?: number;
  required?: boolean;
  hint?: string;       // shown in row 2 as instruction
  type?: "text" | "number" | "date" | "boolean" | "enum";
  enumValues?: string[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E293B" },
};
const REQUIRED_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF7C2D12" },
};
const HINT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0F172A" },
};
const SAMPLE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0F1F35" },
};

// ─── Template builder ─────────────────────────────────────────────────────────

export function buildTemplate(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  cols: ColDef[],
  sampleRows: Record<string, unknown>[]
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  // Column widths
  ws.columns = cols.map((c) => ({
    key: c.key,
    width: c.width ?? 20,
  }));

  // Row 1 — headers
  const headerRow = ws.addRow(cols.map((c) => c.header));
  headerRow.eachCell((cell, ci) => {
    const col = cols[ci - 1];
    cell.fill = col?.required ? REQUIRED_FILL : HEADER_FILL;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF334155" } },
    };
  });
  headerRow.height = 22;

  // Row 2 — instructions/hints
  const hintRow = ws.addRow(
    cols.map((c) => {
      const parts = [];
      if (c.required) parts.push("OBRIGATÓRIO");
      if (c.type === "date") parts.push("Formato: DD/MM/AAAA");
      if (c.type === "boolean") parts.push("Valores: SIM ou NÃO");
      if (c.enumValues?.length) parts.push(`Valores: ${c.enumValues.join(" | ")}`);
      if (c.hint) parts.push(c.hint);
      return parts.join(" · ") || "—";
    })
  );
  hintRow.eachCell((cell) => {
    cell.fill = HINT_FILL;
    cell.font = { italic: true, color: { argb: "FF64748B" }, size: 9 };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  });
  hintRow.height = 30;

  // Sample rows
  sampleRows.forEach((row) => {
    const r = ws.addRow(cols.map((c) => row[c.key] ?? ""));
    r.eachCell((cell) => {
      cell.fill = SAMPLE_FILL;
      cell.font = { color: { argb: "FF94A3B8" }, size: 10 };
    });
  });

  // Enum validation
  cols.forEach((col, idx) => {
    if (col.enumValues?.length) {
      for (let rowIdx = 3; rowIdx <= 10000; rowIdx++) {
        const cell = ws.getCell(rowIdx, idx + 1);
        cell.dataValidation = {
          type: "list",
          allowBlank: !col.required,
          formulae: [`"${col.enumValues.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Valor inválido",
          error: `Use um dos valores: ${col.enumValues.join(", ")}`,
        };
      }
    }
  });

  return ws;
}

// ─── Data export builder ──────────────────────────────────────────────────────

export function buildDataSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  cols: ColDef[],
  rows: Record<string, unknown>[]
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet(sheetName);
  ws.columns = cols.map((c) => ({ key: c.key, width: c.width ?? 20 }));

  const headerRow = ws.addRow(cols.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  });
  headerRow.height = 22;

  rows.forEach((row) => {
    ws.addRow(cols.map((c) => row[c.key] ?? ""));
  });

  // Auto-filter
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: cols.length },
  };

  return ws;
}

// ─── Workbook → Buffer ────────────────────────────────────────────────────────

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
}

export function excelResponse(buffer: Buffer, filename: string): Response {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

// ─── Import parser ────────────────────────────────────────────────────────────

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
}

export async function parseImportBuffer(
  buffer: ArrayBuffer,
  cols: ColDef[]
): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Planilha vazia ou inválida");

  // Row 1 = headers, Row 2 = hints → data starts at row 3
  // But we also support plain files where row 1 = headers, data from row 2
  const firstRow = ws.getRow(1).values as (string | undefined)[];
  const headers = firstRow.slice(1).map((h) => String(h ?? "").trim());

  // Map header → col key
  const colByHeader = new Map<string, ColDef>();
  cols.forEach((c) => colByHeader.set(c.header.toLowerCase(), c));

  // Detect if row 2 is a hint row (all non-numeric, italic-looking text)
  const dataStartRow = 3; // template has 2 header rows; plain xlsx starts at 2

  const results: ParsedRow[] = [];

  ws.eachRow((row, rowNum) => {
    if (rowNum < dataStartRow) return;
    const values = row.values as unknown[];
    // Skip completely empty rows
    const cells = values.slice(1).map((v) => String(v ?? "").trim());
    if (cells.every((c) => c === "")) return;

    const data: Record<string, string> = {};
    const errors: string[] = [];

    headers.forEach((h, i) => {
      const col = colByHeader.get(h.toLowerCase());
      if (!col) return;
      data[col.key] = cells[i] ?? "";
    });

    // Validate required
    cols.forEach((col) => {
      if (col.required && !data[col.key]) {
        errors.push(`"${col.header}" é obrigatório`);
      }
      // Enum validation
      if (col.enumValues?.length && data[col.key] && !col.enumValues.includes(data[col.key])) {
        errors.push(`"${col.header}": valor inválido "${data[col.key]}" (esperado: ${col.enumValues.join(", ")})`);
      }
    });

    results.push({ rowIndex: rowNum, data, errors });
  });

  return results;
}
