import ExcelJS from 'exceljs';

const HEADER_FILL = 'FF16A34A';
const HEADER_FONT = 'FFFFFFFF';
const ALT_ROW_FILL = 'FFF0FDF4';
const BORDER_COLOR = 'FFD1D5DB';

function applyCellBorder(cell: ExcelJS.Cell) {
  const border: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };
  cell.border = border;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadMembersExcel(
  filename: string,
  headers: string[],
  rows: string[][],
  meta?: { title?: string; subtitle?: string; sheetName?: string }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'St Joseph Church System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(meta?.sheetName ?? 'Members', {
    properties: { defaultRowHeight: 18 },
  });

  let currentRow = 1;

  if (meta?.title) {
    const titleRow = sheet.getRow(currentRow);
    titleRow.getCell(1).value = meta.title;
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF111827' } };
    titleRow.getCell(1).alignment = { vertical: 'middle' };
    if (headers.length > 1) {
      sheet.mergeCells(currentRow, 1, currentRow, headers.length);
    }
    titleRow.height = 24;
    currentRow += 1;
  }

  if (meta?.subtitle) {
    const subtitleRow = sheet.getRow(currentRow);
    subtitleRow.getCell(1).value = meta.subtitle;
    subtitleRow.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } };
    subtitleRow.getCell(1).alignment = { vertical: 'middle' };
    if (headers.length > 1) {
      sheet.mergeCells(currentRow, 1, currentRow, headers.length);
    }
    subtitleRow.height = 18;
    currentRow += 1;
    currentRow += 1;
  }

  const headerRowIndex = currentRow;
  const headerRow = sheet.getRow(headerRowIndex);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    applyCellBorder(cell);
  });
  headerRow.height = 24;

  rows.forEach((rowValues, rowIndex) => {
    const row = sheet.getRow(headerRowIndex + 1 + rowIndex);
    rowValues.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.alignment = { vertical: 'top', wrapText: true };
      applyCellBorder(cell);
      if (rowIndex % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_FILL } };
      }
    });
    row.height = 20;
  });

  headers.forEach((header, colIndex) => {
    let maxLength = header.length;
    rows.forEach((row) => {
      const cellLength = (row[colIndex] || '').length;
      if (cellLength > maxLength) maxLength = cellLength;
    });
    sheet.getColumn(colIndex + 1).width = Math.min(Math.max(maxLength + 3, 12), 50);
  });

  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, filename);
}

export function sortMembersForExport<T>(
  items: T[],
  getValue: (item: T) => string,
  direction: 'asc' | 'desc'
): T[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aVal = getValue(a).trim();
    const bVal = getValue(b).trim();
    const aKey = aVal.toLowerCase();
    const bKey = bVal.toLowerCase();

    if (!aKey && !bKey) return 0;
    if (!aKey) return 1;
    if (!bKey) return -1;

    const comparison = aKey.localeCompare(bKey, undefined, { sensitivity: 'base', numeric: true });
    return direction === 'asc' ? comparison : -comparison;
  });
  return sorted;
}
