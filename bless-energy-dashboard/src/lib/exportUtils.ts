import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
    interface jsPDF {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const internalFieldRegex = /^(id|rowindex|index|no\.|#|fid)$/i;
    return data.filter(row => {
        return headers.some(h => {
            if (internalFieldRegex.test(h)) return false;
            const val = row[h];
            return val !== undefined && val !== null && String(val).replace(/[\u200B-\u200D\uFEFF\s]/g, '').length > 0;
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
    const internalFieldRegex = /^(id|rowindex|index|no\.|#|fid)$/i;
    const rawRows = data
        .map(row => validHeaders.map(h => String(row[h] || '').trim()))
        .filter((rowValues) => {
            // Check if this row has any real data in non-internal columns
            return validHeaders.some((h, i) => {
                if (internalFieldRegex.test(h)) return false;
                const val = rowValues[i];
                // Check if the cell has actual content, ignoring common invisible characters from Google Sheets
                return val && val.replace(/[\u200B-\u200D\uFEFF\s]/g, '').length > 0;
            });
        });

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

    // Header Branding
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 297, 40, 'F');

    // Logo placeholder / Text as Logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text('BLESS', 20, 22);
    doc.setTextColor(255, 255, 255);
    doc.text('ENERGY', 92, 22, { align: 'right' });

    // Vertical line in logo
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(56, 12, 56, 28);

    // Document Title
    doc.setFontSize(14);
    doc.setTextColor(212, 175, 55);
    doc.text(title.toUpperCase(), 277, 22, { align: 'right' });

    if (subtitle) {
        doc.setFontSize(9);
        doc.setTextColor(180, 180, 180);
        doc.text(subtitle, 277, 30, { align: 'right' });
    }

    // Filter and clean data
    const validHeaders = headers.filter(h => h && h.trim());
    const tableData = data
        .map(row => validHeaders.map(h => String(row[h] || '').trim()))
        .filter(values => values.some(v => v.length > 0));

    if (tableData.length === 0) return;

    // Table Implementation
    doc.autoTable({
        head: [validHeaders],
        body: tableData,
        startY: 50,
        margin: { left: 15, right: 15 },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            font: 'helvetica',
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [20, 20, 20],
            textColor: [212, 175, 55],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
        },
        bodyStyles: {
            textColor: [50, 50, 50],
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250],
        },
        didDrawPage: () => {
            // Footer
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generado el ${new Date().toLocaleDateString()} | Página ${pageCount}`, 150, 200, { align: 'center' });
            doc.text('Bless Energy - Dashboard Inteligente', 20, 200);
        }
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
