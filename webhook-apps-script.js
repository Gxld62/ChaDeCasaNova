/**
 * Exemplo de endpoint (Google Apps Script) para receber reservas do site
 * e salvar em uma planilha. Publique como Web App (Deploy > New deployment).
 */

/**
 * Ajuste o ID da planilha abaixo (crie uma planilha no Drive e copie o ID da URL).
 */
const SPREADSHEET_ID = '1W72FriveQjpHLpcPniMv8qK5QoCRzrfCnxlViRAIx3o';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Reservas') || createSheet();

    sheet.appendRow([
      new Date(),
      body.page || '',
      body.tier || '',
      body.itemId || '',
      body.itemName || '',
      body.guestName || '',
      body.guestContact || '',
      body.guestNote || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.insertSheet('Reservas');
  sheet.appendRow(['Timestamp', 'Página', 'Bloco', 'Item ID', 'Item Nome', 'Convidado', 'Contato', 'Mensagem']);
  return sheet;
}
