/**
 * IC Cut — Google Apps Script back-end
 * --------------------------------------------------------------
 * Copy this whole file into your Apps Script project (Code.gs).
 *
 * Sheets used (created automatically by setup()):
 *   Words : word | json | updated        → extra words for the app
 *   Logs  : timestamp | participant | event | word | source | lang | userAgent
 *
 * First-time setup:
 *   1. If the script is NOT bound to a spreadsheet, paste the
 *      spreadsheet ID into SHEET_ID below.
 *   2. Run setup() once (authorize when asked).
 *   3. Optional: run seedWordsFromGitHub() to copy the 11 test words
 *      from the GitHub repo into the Words sheet (as editable templates).
 *   4. Deploy → New deployment → Web app
 *        Execute as: Me   ·   Who has access: Anyone
 *   5. Paste the Web app URL into CONFIG.GAS_URL in app.js.
 */

const SHEET_ID = '';   // leave empty if this script is bound to the Sheet
const DATA_JS_URL = 'https://raw.githubusercontent.com/ngoly2872005-png/KLTN/main/data.js';

const WORDS_SHEET = 'Words';
const LOGS_SHEET = 'Logs';
const WORDS_HEADER = ['word', 'json', 'updated'];
const LOGS_HEADER = ['timestamp', 'participant', 'event', 'word', 'source', 'lang', 'userAgent'];

function getSpreadsheet_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name, header) {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#002147').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function setup() {
  getSheet_(WORDS_SHEET, WORDS_HEADER);
  getSheet_(LOGS_SHEET, LOGS_HEADER);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** GET ?action=lookup&word=xxx  |  GET ?action=words  |  GET ?action=ping */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'lookup': return json_({ ok: true, data: findWord_(p.word) });
      case 'words':  return json_({ ok: true, words: listWords_() });
      default:       return json_({ ok: true, service: 'IC Cut API', time: new Date().toISOString() });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** POST (text/plain body containing JSON): { action: 'log', ... } */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'log') {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        getSheet_(LOGS_SHEET, LOGS_HEADER).appendRow([
          new Date(),
          clip_(body.participant, 40),
          clip_(body.event, 40),
          clip_(body.word, 60),
          clip_(body.source, 20),
          clip_(body.lang, 5),
          clip_(body.userAgent, 300)
        ]);
      } finally {
        lock.releaseLock();
      }
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function clip_(v, n) {
  return String(v == null ? '' : v).slice(0, n);
}

function findWord_(word) {
  const key = String(word || '').toLowerCase().trim();
  if (!key) return null;
  const rows = getSheet_(WORDS_SHEET, WORDS_HEADER).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase().trim() === key) {
      try { return JSON.parse(rows[i][1]); } catch (err) { return null; }
    }
  }
  return null;
}

function listWords_() {
  const rows = getSheet_(WORDS_SHEET, WORDS_HEADER).getDataRange().getValues();
  return rows.slice(1).map(r => String(r[0])).filter(String);
}

/**
 * Copies the local mock database (data.js on GitHub) into the Words sheet,
 * so that new words can be added by duplicating a row and editing its JSON.
 */
function seedWordsFromGitHub() {
  const src = UrlFetchApp.fetch(DATA_JS_URL).getContentText();
  const start = src.indexOf('/*JSON-START*/');
  const end = src.indexOf('/*JSON-END*/');
  if (start < 0 || end < 0) throw new Error('JSON markers not found in data.js');
  const db = JSON.parse(src.substring(start + '/*JSON-START*/'.length, end));
  const sh = getSheet_(WORDS_SHEET, WORDS_HEADER);
  const existing = listWords_().map(w => w.toLowerCase());
  const now = new Date();
  Object.keys(db).forEach(key => {
    if (existing.indexOf(key) === -1) sh.appendRow([key, JSON.stringify(db[key]), now]);
  });
}

/** Quick summary for the research report: analyses per participant. */
function summarizeLogs() {
  const rows = getSheet_(LOGS_SHEET, LOGS_HEADER).getDataRange().getValues().slice(1);
  const counts = {};
  rows.filter(r => r[2] === 'analyze').forEach(r => {
    const id = r[1] || '(anonymous)';
    counts[id] = (counts[id] || 0) + 1;
  });
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sh.clear();
  sh.appendRow(['participant', 'analyses']);
  Object.keys(counts).sort().forEach(id => sh.appendRow([id, counts[id]]));
}
