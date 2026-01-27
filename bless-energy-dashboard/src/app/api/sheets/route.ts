import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, updateSheetRow, SHEET_IDS, getSheetInfo } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sheet = searchParams.get('sheet');
  const tab = searchParams.get('tab') || 'Sheet1';

  if (!sheet || !SHEET_IDS[sheet as keyof typeof SHEET_IDS]) {
    return NextResponse.json(
      { success: false, error: 'Invalid sheet parameter' },
      { status: 400 }
    );
  }

  try {
    const spreadsheetId = SHEET_IDS[sheet as keyof typeof SHEET_IDS];
    const data = await getSheetData(spreadsheetId, `${tab}!A:Z`);
    
    // Transform to array of objects with row indices
    const rows = data.rows.map((row, index) => {
      const obj: Record<string, string | number> = { 
        id: `${index + 2}`, // +2 because of header and 0-index
        rowIndex: index + 2 
      };
      data.headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    return NextResponse.json({
      success: true,
      data: {
        headers: data.headers,
        rows,
        total: rows.length,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet, tab, rowIndex, values } = body;

    if (!sheet || !SHEET_IDS[sheet as keyof typeof SHEET_IDS]) {
      return NextResponse.json(
        { success: false, error: 'Invalid sheet parameter' },
        { status: 400 }
      );
    }

    const spreadsheetId = SHEET_IDS[sheet as keyof typeof SHEET_IDS];
    const range = `${tab || 'Sheet1'}!A${rowIndex}:Z${rowIndex}`;
    
    await updateSheetRow(spreadsheetId, range, [values]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}
