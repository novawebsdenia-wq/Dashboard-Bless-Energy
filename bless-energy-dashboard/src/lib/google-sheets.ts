import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

export const SHEET_IDS = {
  emails: process.env.SHEET_EMAILS_ID!,
  calculadora: process.env.SHEET_CALCULADORA_ID!,
  formulario: process.env.SHEET_FORMULARIO_ID!,
  clientes: process.env.SHEET_CLIENTES_ID!,
  contabilidad: process.env.SHEET_CONTABILIDAD_ID!,
};

// In-memory cache for Google Sheets API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds
const CACHE_INFO_TTL_MS = 120_000; // 2 minutes for sheet info (rarely changes)

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export async function getSheetData(
  spreadsheetId: string,
  range: string
): Promise<SheetData> {
  const cacheKey = `data:${spreadsheetId}:${range}`;
  const cached = getCached<SheetData>(cacheKey, CACHE_TTL_MS);
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const rows = values.slice(1);

    const result = { headers, rows };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Invalidate all cache entries for a spreadsheet after writes
function invalidateCache(spreadsheetId: string): void {
  for (const key of cache.keys()) {
    if (key.includes(spreadsheetId)) {
      cache.delete(key);
    }
  }
}

export async function updateSheetRow(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<void> {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    invalidateCache(spreadsheetId);
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

export async function appendSheetRow(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<void> {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    invalidateCache(spreadsheetId);
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

export async function deleteSheetRow(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    invalidateCache(spreadsheetId);
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

export async function getSheetInfo(spreadsheetId: string) {
  const cacheKey = `info:${spreadsheetId}`;
  const cached = getCached<{ sheetId: number | undefined; title: string | undefined }[]>(cacheKey, CACHE_INFO_TTL_MS);
  if (cached) return cached;

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const result = response.data.sheets?.map((sheet) => ({
      sheetId: sheet.properties?.sheetId,
      title: sheet.properties?.title,
    }));
    if (result) setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error getting sheet info:', error);
    throw error;
  }
}

export { sheets };
