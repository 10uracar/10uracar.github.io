/**
 * Onur Acar — Araştırma Sonuçları API (Google Sheets -> onuracar.net/anket)
 *
 * Google Sheets'te "Dashboard" adlı bir sayfa oluşturun ve A:B sütunlarına:
 * A1=key, B1=value
 * A2=participants, B2=123
 * A3=avgProductivity, B3=4.12
 * A4=timeSavingPct, B4=61
 * A5=message, B5=Deneme verisi
 *
 * Yayın: Deploy > New deployment > Web app
 * Execute as: Me
 * Who has access: Anyone
 */

const SHEET_NAME = 'Dashboard';

function doGet(e) {
  const result = readDashboard_();
  const callback = e && e.parameter ? e.parameter.prefix : '';
  const payload = JSON.stringify(result);

  // Browser tarafında CORS ile uğraşmamak için yalnızca okuma amaçlı JSONP.
  // Sadece toplu/anonim istatistik döndürün; bireysel yanıtları döndürmeyin.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${payload});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function readDashboard_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return {
      ok: false,
      error: `"${SHEET_NAME}" sayfası bulunamadı.`
    };
  }

  const rows = sheet.getDataRange().getDisplayValues();
  const data = {};

  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0] || '').trim();
    const value = String(rows[i][1] || '').trim();
    if (!key) continue;

    if (['participants', 'avgProductivity', 'timeSavingPct'].includes(key)) {
      const numeric = Number(String(value).replace(',', '.'));
      data[key] = Number.isFinite(numeric) ? numeric : null;
    } else {
      data[key] = value;
    }
  }

  return {
    ok: true,
    participants: data.participants ?? null,
    avgProductivity: data.avgProductivity ?? null,
    timeSavingPct: data.timeSavingPct ?? null,
    message: data.message || 'Toplu araştırma sonuçları başarıyla yüklendi.',
    updatedAt: new Date().toISOString()
  };
}
