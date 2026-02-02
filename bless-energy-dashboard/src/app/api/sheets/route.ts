import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, updateSheetRow, appendSheetRow, SHEET_IDS } from '@/lib/google-sheets';

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

    // Filter out empty headers and columns with no data
    const validColumns: number[] = [];
    data.headers.forEach((header, i) => {
      if (!header || !header.trim()) return;
      const hasData = data.rows.some(row => row[i] && String(row[i]).trim().length > 0);
      if (hasData) validColumns.push(i);
    });
    const headers = validColumns.map(i => data.headers[i]);

    // Transform to array of objects with row indices, only valid columns
    // Ensure the row has at least some content in any of the valid columns (excluding IDs)
    const rows: Record<string, string | number>[] = [];
    const internalFieldRegex = /^(id|rowindex|index|no\.|#|fid)$/i;

    data.rows.forEach((row, originalIndex) => {
      const hasRealContent = validColumns.some(i => {
        const header = data.headers[i];
        if (internalFieldRegex.test(header)) return false;

        const val = row[i];
        // Check for actual content, ignoring common invisible characters
        return val && String(val).replace(/[\u200B-\u200D\uFEFF\s]/g, '').length > 0;
      });

      if (!hasRealContent) return;

      const obj: Record<string, string | number> = {
        id: `${originalIndex + 2}`,
        rowIndex: originalIndex + 2
      };
      validColumns.forEach(i => {
        obj[data.headers[i]] = row[i] || '';
      });
      rows.push(obj);
    });

    return NextResponse.json({
      success: true,
      data: {
        headers,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet, tab, values } = body;

    if (!sheet || !SHEET_IDS[sheet as keyof typeof SHEET_IDS]) {
      return NextResponse.json(
        { success: false, error: 'Invalid sheet parameter' },
        { status: 400 }
      );
    }

    const spreadsheetId = SHEET_IDS[sheet as keyof typeof SHEET_IDS];
    const range = `${tab || 'Sheet1'}!A:Z`;

    await appendSheetRow(spreadsheetId, range, [values]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add data' },
      { status: 500 }
    );
  }
}
