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

export interface SheetData {
  headers: string[];
  rows: string[][];
}

export async function getSheetData(
  spreadsheetId: string,
  range: string
): Promise<SheetData> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    const headers = values[0] || [];
    const rows = values.slice(1);

    return { headers, rows };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
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
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

export async function getSheetInfo(spreadsheetId: string) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    return response.data.sheets?.map((sheet) => ({
      sheetId: sheet.properties?.sheetId,
      title: sheet.properties?.title,
    }));
  } catch (error) {
    console.error('Error getting sheet info:', error);
    throw error;
  }
}

export { sheets };
