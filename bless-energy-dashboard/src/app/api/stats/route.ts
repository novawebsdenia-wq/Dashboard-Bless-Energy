import { NextResponse } from 'next/server';
import { getSheetData, getSheetInfo, SHEET_IDS } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Get sheet info to find correct tab names
    const [emailsInfo, calculadoraInfo, formularioInfo, clientesInfo] = await Promise.all([
      getSheetInfo(SHEET_IDS.emails).catch(() => [{ title: 'mails' }]),
      getSheetInfo(SHEET_IDS.calculadora).catch(() => [{ title: 'Leads' }]),
      getSheetInfo(SHEET_IDS.formulario).catch(() => [{ title: 'Sheet1' }]),
      getSheetInfo(SHEET_IDS.clientes).catch(() => [{ title: 'Sheet1' }]),
    ]);

    const emailsTab = emailsInfo?.[0]?.title || 'mails';
    const calculadoraTab = calculadoraInfo?.[0]?.title || 'Leads';
    const formularioTab = formularioInfo?.[0]?.title || 'Sheet1';
    const clientesTab = clientesInfo?.[0]?.title || 'Sheet1';

    // Fetch data from all sheets in parallel
    const [emailsData, calculadoraData, formularioData, clientesData] = await Promise.all([
      getSheetData(SHEET_IDS.emails, `${emailsTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.calculadora, `${calculadoraTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.formulario, `${formularioTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
      getSheetData(SHEET_IDS.clientes, `${clientesTab}!A:Z`).catch(() => ({ headers: [], rows: [] })),
    ]);

    // Helper to parse dates in various formats including time
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;

      // Try standard ISO parsing first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime()) && dateStr.includes('-') && dateStr.includes('T')) return date;

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

        // Handle 2-digit years
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
          if (!isNaN(date.getTime())) return date;
        }
      }

      // Last resort: try native parsing
      date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;

      return null;
    };

    // Helper to filter out empty rows (same logic as /api/sheets endpoint)
    // A row is valid if at least one of the first 3 key columns has content
    const filterValidRows = (data: { headers: string[]; rows: string[][] }) => {
      const validColumns: number[] = [];
      data.headers.forEach((header, i) => {
        if (!header || !header.trim()) return;
        const hasData = data.rows.some(row => row[i] && String(row[i]).trim().length > 0);
        if (hasData) validColumns.push(i);
      });
      const firstKeyColumns = validColumns.slice(0, Math.min(3, validColumns.length));

      return data.rows.filter((row) => {
        return firstKeyColumns.some(i => row[i] && String(row[i]).trim().length > 0);
      });
    };

    // Calculate new clients from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const clientFechaIdx = clientesData.headers.findIndex(
      (h) => h.toLowerCase().includes('fecha')
    );

    const validClienteRows = filterValidRows(clientesData);
    let clientesNuevos = 0;
    if (clientFechaIdx >= 0) {
      clientesNuevos = validClienteRows.filter((row) => {
        const fecha = parseDate(row[clientFechaIdx]);
        return fecha && fecha >= sevenDaysAgo;
      }).length;
    } else {
      clientesNuevos = validClienteRows.length;
    }

    // Calculate pending leads (only from valid/non-empty rows)
    const countPending = (data: { headers: string[]; rows: string[][] }) => {
      const estadoIndex = data.headers.findIndex(
        (h) => h.toLowerCase().includes('estado')
      );
      const validRows = filterValidRows(data);
      if (estadoIndex < 0) return validRows.length; // All are pending if no status column

      return validRows.filter((row) => {
        const estado = row[estadoIndex]?.toLowerCase() || '';
        return estado.includes('pendiente') || estado.includes('nuevo') || !estado;
      }).length;
    };

    const leadsPendientes = countPending(formularioData) + countPending(calculadoraData);

    // Build recent activity
    const recentActivity = getRecentActivity(calculadoraData, formularioData, clientesData, emailsData, parseDate);

    // Calculate stats using filtered rows for consistency with individual pages
    const validEmails = filterValidRows(emailsData);
    const validLeads = filterValidRows(calculadoraData);
    const validFormulario = filterValidRows(formularioData);
    const validClientes = filterValidRows(clientesData);

    const stats = {
      totalEmails: validEmails.length,
      totalLeads: validLeads.length,
      totalFormulario: validFormulario.length,
      totalClientes: validClientes.length,
      leadsPendientes,
      clientesNuevos,
      sourceData: [
        { name: 'Calculadora', value: validLeads.length },
        { name: 'Formulario', value: validFormulario.length },
      ],
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

interface SheetData {
  headers: string[];
  rows: string[][];
}

function getRecentActivity(
  calculadoraData: SheetData,
  formularioData: SheetData,
  clientesData: SheetData,
  emailsData: SheetData,
  parseDate: (dateStr: string) => Date | null
) {
  const activities: { type: string; source: string; name: string; date: Date; status: string }[] = [];

  // Helper to find column index
  const findCol = (headers: string[], ...keywords: string[]) => {
    return headers.findIndex(h => 
      keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))
    );
  };

  // Process calculadora leads
  const calcFechaIdx = findCol(calculadoraData.headers, 'fecha');
  const calcNombreIdx = findCol(calculadoraData.headers, 'nombre');
  const calcEmailIdx = findCol(calculadoraData.headers, 'email', 'correo');
  const calcEstadoIdx = findCol(calculadoraData.headers, 'estado');
  
  calculadoraData.rows.forEach((row) => {
    const dateStr = calcFechaIdx >= 0 ? row[calcFechaIdx] : '';
    const name = (calcNombreIdx >= 0 ? row[calcNombreIdx] : '') || 
                 (calcEmailIdx >= 0 ? row[calcEmailIdx] : '') || 
                 'Lead sin nombre';
    const status = calcEstadoIdx >= 0 ? row[calcEstadoIdx] : 'Pendiente';
    
    const date = parseDate(dateStr);
    if (date) {
      activities.push({
        type: 'lead',
        source: 'Calculadora',
        name,
        date,
        status: status || 'Pendiente',
      });
    }
  });

  // Process formulario leads
  const formFechaIdx = findCol(formularioData.headers, 'fecha');
  const formNombreIdx = findCol(formularioData.headers, 'nombre');
  const formEmailIdx = findCol(formularioData.headers, 'email', 'correo');
  const formEstadoIdx = findCol(formularioData.headers, 'estado');
  
  formularioData.rows.forEach((row) => {
    const dateStr = formFechaIdx >= 0 ? row[formFechaIdx] : '';
    const name = (formNombreIdx >= 0 ? row[formNombreIdx] : '') || 
                 (formEmailIdx >= 0 ? row[formEmailIdx] : '') || 
                 'Lead sin nombre';
    const status = formEstadoIdx >= 0 ? row[formEstadoIdx] : 'Pendiente';
    
    const date = parseDate(dateStr);
    if (date) {
      activities.push({
        type: 'lead',
        source: 'Formulario',
        name,
        date,
        status: status || 'Pendiente',
      });
    }
  });

  // Process clients
  const clientFechaIdx = findCol(clientesData.headers, 'fecha');
  const clientNombreIdx = findCol(clientesData.headers, 'nombre');
  const clientEstadoIdx = findCol(clientesData.headers, 'estado');
  
  clientesData.rows.forEach((row) => {
    const dateStr = clientFechaIdx >= 0 ? row[clientFechaIdx] : '';
    const name = (clientNombreIdx >= 0 ? row[clientNombreIdx] : '') || 'Cliente sin nombre';
    const status = clientEstadoIdx >= 0 ? row[clientEstadoIdx] : 'Nuevo';
    
    const date = parseDate(dateStr);
    if (date) {
      activities.push({
        type: 'cliente',
        source: 'Clientes',
        name,
        date,
        status: status || 'Nuevo',
      });
    }
  });

  // Process emails
  const emailFechaIdx = findCol(emailsData.headers, 'fecha');
  const emailAsuntoIdx = findCol(emailsData.headers, 'asunto', 'subject');
  const emailRemitenteIdx = findCol(emailsData.headers, 'remitente', 'from', 'de');
  
  emailsData.rows.forEach((row) => {
    const dateStr = emailFechaIdx >= 0 ? row[emailFechaIdx] : '';
    const asunto = emailAsuntoIdx >= 0 ? row[emailAsuntoIdx] : '';
    const remitente = emailRemitenteIdx >= 0 ? row[emailRemitenteIdx] : '';
    const name = asunto || remitente || 'Email sin asunto';
    
    const date = parseDate(dateStr);
    if (date) {
      activities.push({
        type: 'email',
        source: 'Email',
        name,
        date,
        status: 'Recibido',
      });
    }
  });

  // Sort by date descending and return top 15
  return activities
    .filter(a => !isNaN(a.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15)
    .map(a => ({
      ...a,
      date: a.date.toISOString(),
    }));
}
