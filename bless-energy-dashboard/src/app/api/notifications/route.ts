import { NextResponse } from 'next/server';
import { getSheetData, getSheetInfo, SHEET_IDS } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get sheet info to find correct tab names
    const [calculadoraInfo, formularioInfo, clientesInfo, emailsInfo] = await Promise.all([
      getSheetInfo(SHEET_IDS.calculadora).catch(() => [{ title: 'Leads' }]),
      getSheetInfo(SHEET_IDS.formulario).catch(() => [{ title: 'Sheet1' }]),
      getSheetInfo(SHEET_IDS.clientes).catch(() => [{ title: 'Sheet1' }]),
      getSheetInfo(SHEET_IDS.emails).catch(() => [{ title: 'mails' }]),
    ]);

    const calculadoraTab = calculadoraInfo?.[0]?.title || 'Leads';
    const formularioTab = formularioInfo?.[0]?.title || 'Sheet1';
    const clientesTab = clientesInfo?.[0]?.title || 'Sheet1';
    const emailsTab = emailsInfo?.[0]?.title || 'mails';

    // Fetch data from all sheets
    const [calculadoraData, formularioData, clientesData, emailsData] = await Promise.all([
      getSheetData(SHEET_IDS.calculadora, `${calculadoraTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.formulario, `${formularioTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.clientes, `${clientesTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.emails, `${emailsTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
    ]);

    // Get counts for detecting new records
    const counts = {
      calculadora: calculadoraData.rows.length,
      formulario: formularioData.rows.length,
      clientes: clientesData.rows.length,
      emails: emailsData.rows.length,
    };

    // Build recent activity list
    const activities: { type: string; source: string; name: string; date: string; status: string }[] = [];

    // Helper to find column index
    const findCol = (headers: string[], ...keywords: string[]) => {
      return headers.findIndex(h => 
        keywords.some(k => h.toLowerCase().includes(k))
      );
    };

    // Process Calculadora
    const calcFechaIdx = findCol(calculadoraData.headers, 'fecha');
    const calcNombreIdx = findCol(calculadoraData.headers, 'nombre');
    const calcEmailIdx = findCol(calculadoraData.headers, 'email', 'correo');
    const calcEstadoIdx = findCol(calculadoraData.headers, 'estado');

    calculadoraData.rows.forEach((row) => {
      const name = (calcNombreIdx >= 0 ? row[calcNombreIdx] : '') ||
                   (calcEmailIdx >= 0 ? row[calcEmailIdx] : '') ||
                   'Lead sin nombre';
      const rawDate = calcFechaIdx >= 0 ? row[calcFechaIdx] : '';
      const date = parseDate(rawDate);
      const status = calcEstadoIdx >= 0 ? row[calcEstadoIdx] : 'Pendiente';

      if (name && date) {
        activities.push({
          type: 'lead',
          source: 'Calculadora',
          name,
          date,
          status: status || 'Pendiente',
        });
      }
    });

    // Process Formulario
    const formFechaIdx = findCol(formularioData.headers, 'fecha');
    const formNombreIdx = findCol(formularioData.headers, 'nombre');
    const formEmailIdx = findCol(formularioData.headers, 'email', 'correo');
    const formEstadoIdx = findCol(formularioData.headers, 'estado');

    formularioData.rows.forEach((row) => {
      const name = (formNombreIdx >= 0 ? row[formNombreIdx] : '') ||
                   (formEmailIdx >= 0 ? row[formEmailIdx] : '') ||
                   'Lead sin nombre';
      const rawDate = formFechaIdx >= 0 ? row[formFechaIdx] : '';
      const date = parseDate(rawDate);
      const status = formEstadoIdx >= 0 ? row[formEstadoIdx] : 'Pendiente';

      if (name && date) {
        activities.push({
          type: 'lead',
          source: 'Formulario',
          name,
          date,
          status: status || 'Pendiente',
        });
      }
    });

    // Process Clientes
    const clientFechaIdx = findCol(clientesData.headers, 'fecha');
    const clientNombreIdx = findCol(clientesData.headers, 'nombre');
    const clientEstadoIdx = findCol(clientesData.headers, 'estado');

    clientesData.rows.forEach((row) => {
      const name = (clientNombreIdx >= 0 ? row[clientNombreIdx] : '') || 'Cliente sin nombre';
      const rawDate = clientFechaIdx >= 0 ? row[clientFechaIdx] : '';
      const date = parseDate(rawDate);
      const status = clientEstadoIdx >= 0 ? row[clientEstadoIdx] : 'Nuevo';

      if (name && date) {
        activities.push({
          type: 'cliente',
          source: 'Clientes',
          name,
          date,
          status: status || 'Nuevo',
        });
      }
    });

    // Sort by date descending and take top 20
    const sortedActivities = activities
      .filter(a => a.date && !isNaN(new Date(a.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        recentActivity: sortedActivities,
        counts,
      },
    });
  } catch (error) {
    console.error('Notifications API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Helper to parse various date formats including time
function parseDate(dateStr: string): string {
  if (!dateStr) return '';

  try {
    // Try standard ISO parsing first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime()) && dateStr.includes('-') && dateStr.includes('T')) {
      return date.toISOString();
    }

    // Split date and time parts (e.g., "27/01/2026 16:30:45")
    const trimmed = dateStr.trim();
    const spaceIdx = trimmed.indexOf(' ');
    const datePart = spaceIdx >= 0 ? trimmed.substring(0, spaceIdx) : trimmed;
    const timePart = spaceIdx >= 0 ? trimmed.substring(spaceIdx + 1).trim() : '';

    // Try DD/MM/YYYY or DD-MM-YYYY format
    const parts = datePart.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);

      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        let hours = 0, minutes = 0, seconds = 0;

        if (timePart) {
          const timeParts = timePart.split(':');
          hours = parseInt(timeParts[0]) || 0;
          minutes = parseInt(timeParts[1]) || 0;
          seconds = parseInt(timeParts[2]) || 0;
        }

        date = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    // Last resort: try native parsing
    date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    return '';
  } catch {
    return '';
  }
}
