import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

/**
 * Robustly filters out empty rows from data.
 * A row is considered empty if all its visible values (headers) are empty or whitespace.
 */
export const filterEmptyRows = (
    data: Record<string, string | number>[],
    headers: string[]
): Record<string, string | number>[] => {
    return data.filter(row => {
        return headers.some(h => {
            const val = row[h];
            return val !== undefined && val !== null && String(val).trim().length > 0;
        });
    });
};

interface ExportExcelOptions {
    filename: string;
    sheetName?: string;
}

export const exportToExcel = (
    data: Record<string, string | number>[],
    headers: string[],
    options: ExportExcelOptions
) => {
    const { filename, sheetName = 'Datos' } = options;

    // 1. Filter out empty headers and columns that have NO data in ANY row
    const validHeaders = headers.filter(h => {
        if (!h || !h.trim()) return false;
        return data.some(row => String(row[h] || '').trim().length > 0);
    });

    // 2. Map data and filter out completely empty rows
    const rawRows = data
        .map(row => validHeaders.map(h => String(row[h] || '').trim()))
        .filter(values => values.some(v => v.length > 0)); // FIX: Check ALL columns, not just first 3

    if (rawRows.length === 0) {
        console.warn('No hay datos para exportar');
        return;
    }

    // 3. Final cleanup of columns (in case some were only whitespace)
    const nonEmptyCols = validHeaders.map((_, colIdx) =>
        rawRows.some(row => row[colIdx].length > 0)
    );
    const finalHeaders = validHeaders.filter((_, i) => nonEmptyCols[i]);
    const finalRows = rawRows.map(row => row.filter((_, i) => nonEmptyCols[i]));

    if (finalHeaders.length === 0) return;

    const aoa: string[][] = [finalHeaders, ...finalRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Styling
    ws['!cols'] = finalHeaders.map((header, idx) => {
        const maxLen = Math.max(header.length, ...finalRows.map(row => row[idx].length));
        return { wch: Math.min(Math.max(maxLen + 2, 12), 60) };
    });

    finalHeaders.forEach((_, idx) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (ws[cellRef]) {
            ws[cellRef].s = {
                fill: { fgColor: { rgb: 'D4AF37' } },
                font: { bold: true, color: { rgb: '000000' }, sz: 11 },
                alignment: { horizontal: 'center', vertical: 'center' },
            };
        }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};

interface ExportPDFOptions {
    filename: string;
    title: string;
    subtitle?: string;
}

export const exportToPDF = (
    data: Record<string, string | number>[],
    headers: string[],
    options: ExportPDFOptions
) => {
    const { filename, title, subtitle } = options;
    const doc = new jsPDF('landscape');

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.text(title, 14, 22);

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(subtitle, 14, 30);
    }

    // Filter data (same logic as Excel to be consistent)
    const validHeaders = headers.filter(h => h && h.trim());
    const tableData = data
        .map(row => validHeaders.map(h => String(row[h] || '').trim()))
        .filter(values => values.some(v => v.length > 0));

    if (tableData.length === 0) return;

    // Add table
    doc.autoTable({
        head: [validHeaders],
        body: tableData,
        startY: subtitle ? 35 : 28,
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: [212, 175, 55],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
