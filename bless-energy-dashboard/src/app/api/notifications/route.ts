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
    
    calculadoraData.rows.forEach((row) => {
      const name = calcNombreIdx >= 0 ? row[calcNombreIdx] : 
                   (calcEmailIdx >= 0 ? row[calcEmailIdx] : 'Lead sin nombre');
      const date = calcFechaIdx >= 0 ? row[calcFechaIdx] : new Date().toISOString();
      
      if (name) {
        activities.push({
          type: 'lead',
          source: 'Calculadora',
          name: name || 'Lead sin nombre',
          date: parseDate(date),
          status: 'Nuevo',
        });
      }
    });

    // Process Formulario
    const formFechaIdx = findCol(formularioData.headers, 'fecha');
    const formNombreIdx = findCol(formularioData.headers, 'nombre');
    const formEmailIdx = findCol(formularioData.headers, 'email', 'correo');
    
    formularioData.rows.forEach((row) => {
      const name = formNombreIdx >= 0 ? row[formNombreIdx] : 
                   (formEmailIdx >= 0 ? row[formEmailIdx] : 'Lead sin nombre');
      const date = formFechaIdx >= 0 ? row[formFechaIdx] : new Date().toISOString();
      
      if (name) {
        activities.push({
          type: 'lead',
          source: 'Formulario',
          name: name || 'Lead sin nombre',
          date: parseDate(date),
          status: 'Nuevo',
        });
      }
    });

    // Process Clientes
    const clientFechaIdx = findCol(clientesData.headers, 'fecha');
    const clientNombreIdx = findCol(clientesData.headers, 'nombre');
    
    clientesData.rows.forEach((row) => {
      const name = clientNombreIdx >= 0 ? row[clientNombreIdx] : 'Cliente sin nombre';
      const date = clientFechaIdx >= 0 ? row[clientFechaIdx] : new Date().toISOString();
      
      if (name) {
        activities.push({
          type: 'cliente',
          source: 'Clientes',
          name: name || 'Cliente sin nombre',
          date: parseDate(date),
          status: 'Nuevo',
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

// Helper to parse various date formats
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  
  try {
    // Try direct parsing
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      
      if (day <= 31 && month <= 11) {
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
