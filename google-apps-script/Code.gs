/**
 * NexaSphere Core Team Recruitment — Google Apps Script
 * -------------------------------------------------------
 * Deploy as a Web App:
 *   1. Open Apps Script (script.google.com) → New Project
 *   2. Paste this code
 *   3. Deploy → New deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Copy the Web App URL → set it as VITE_APPS_SCRIPT_URL in your .env
 *      OR paste it directly in RecruitmentPage.jsx (APPS_SCRIPT_URL constant)
 *
 * The spreadsheet must be the one where this script is bound,
 * OR you can set SPREADSHEET_ID below manually.
 */

// ── CONFIG ──────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = '1bUtbaHwA7_ooqE4pNn3B74uE3hRQi1e7NzDC-70OjYQ'; // your sheet
var SHEET_TAB_NAME = 'Responses'; // tab name inside the sheet
var HEADER_ROW = [
  'Timestamp', 'Full Name', 'College Email', 'WhatsApp',
  'Year', 'Branch', 'Section',
  'Role Applied', 'Areas of Interest',
  'Programming Skills', 'Communication Languages',
  'Campus Experience (Y/N)', 'Campus Exp Details', 'Links',
  'Commit 4-6 hrs/week', 'Attend Campus', 'Assessment OK',
  'Why Join NexaSphere', 'Anything Else',
  'Declaration', 'Submitted At', 'User Agent',
];
// ────────────────────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TAB_NAME);
    // Write header row
    sheet.appendRow(HEADER_ROW);
    // Style header
    var headerRange = sheet.getRange(1, 1, 1, HEADER_ROW.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a1a2e');
    headerRange.setFontColor('#00d4ff');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    // When called from a browser via fetch with mode:'no-cors', the Content-Type is
    // forced to 'text/plain' (the only CORS-safe value). Parse postData.contents as JSON.
    var raw = '';
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter) {
      // Fallback: form-encoded params
      raw = JSON.stringify(e.parameter);
    }

    if (!raw) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Empty request body' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(raw);

    var sheet = getOrCreateSheet();

    var now = new Date().toISOString();
    var row = [
      now,
      data.fullName || '',
      data.collegeEmail || '',
      data.whatsapp || '',
      data.year || '',
      data.branch || '',
      data.section || '',
      data.role || '',
      // interests may already be joined as string or still an array
      Array.isArray(data.interests) ? data.interests.join(', ') : (data.interests || ''),
      data.skills || '',
      data.comms || '',
      data.campusExp || '',
      data.campusExpDetails || '',
      data.links || '',
      data.commitHours || '',
      data.attendCampus || '',
      data.assessmentOk || '',
      data.whyJoin || '',
      data.anythingElse || '',
      data.declarationSelected || '',
      data.submittedAt || now,
      data.userAgent || '',
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET for testing/health check
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'NexaSphere Recruitment API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
