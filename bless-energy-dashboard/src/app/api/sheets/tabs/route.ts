import { NextRequest, NextResponse } from 'next/server';
import { getSheetInfo, SHEET_IDS } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sheet = searchParams.get('sheet');

  if (!sheet || !SHEET_IDS[sheet as keyof typeof SHEET_IDS]) {
    return NextResponse.json(
      { success: false, error: 'Invalid sheet parameter' },
      { status: 400 }
    );
  }

  try {
    const spreadsheetId = SHEET_IDS[sheet as keyof typeof SHEET_IDS];
    const tabs = await getSheetInfo(spreadsheetId);

    return NextResponse.json({
      success: true,
      data: tabs,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tabs' },
      { status: 500 }
    );
  }
}
