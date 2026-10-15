/**
 * IC Cut — Google Apps Script back-end (AI analysis + research log)
 * --------------------------------------------------------------
 * Copy this whole file into your Apps Script project (Code.gs).
 *
 * Sheets (created automatically by setup()):
 *   Words : word | json | updated | source   → cache of analysed words
 *   Logs  : timestamp | participant | event | word | source | lang | userAgent
 *
 * First-time setup:
 *   1. If the script is NOT bound to a spreadsheet, paste its ID into SHEET_ID.
 *   2. Project Settings → Script Properties → add
 *        ANTHROPIC_API_KEY = <your Claude API key>
 *      (never put the key in this file or in the GitHub repo)
 *   3. Run setup() once and authorize.
 *   4. Optional: run testAI() to check the AI connection.
 *   5. Deploy → New deployment → Web app
 *        Execute as: Me   ·   Who has access: Anyone
 *   6. Paste the Web app URL into CONFIG.GAS_URL in app.js.
 *
 * Every word the AI analyses is saved in the Words sheet, so each word is
 * only paid for once. You can review or correct the JSON there.
 */

const SHEET_ID = '';                // leave empty if bound to the Sheet
const AI_MODEL = 'claude-opus-5-5';
const DAILY_AI_LIMIT = 300;         // protects your API budget
const DATA_JS_URL = 'https://raw.githubusercontent.com/ngoly2872005-png/KLTN/main/data.js';

const WORDS_SHEET = 'Words';
const LOGS_SHEET = 'Logs';
const WORDS_HEADER = ['word', 'json', 'updated', 'source'];
const LOGS_HEADER = ['timestamp', 'participant', 'event', 'word', 'source', 'lang', 'userAgent'];

/* ------------------------------------------------------------------ */
/* Sheets                                                              */
/* ------------------------------------------------------------------ */

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

function clip_(v, n) {
  return String(v == null ? '' : v).slice(0, n);
}

function normalizeWord_(word) {
  const key = String(word || '').toLowerCase().trim();
  if (!/^[a-z][a-z'-]{0,29}$/.test(key)) throw new Error('Please enter a single English word (letters only, max 30).');
  return key;
}

function findWord_(key) {
  const rows = getSheet_(WORDS_SHEET, WORDS_HEADER).getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase().trim() === key) {
      try { return JSON.parse(rows[i][1]); } catch (err) { return null; }
    }
  }
  return null;
}

function saveWord_(key, data, source) {
  getSheet_(WORDS_SHEET, WORDS_HEADER).appendRow([key, JSON.stringify(data), new Date(), source]);
}

/* ------------------------------------------------------------------ */
/* Web app endpoints                                                   */
/* ------------------------------------------------------------------ */

/** GET ?action=analyze&word=xxx | ?action=lookup&word=xxx | ?action=ping */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'analyze') {
      const key = normalizeWord_(p.word);
      const cached = findWord_(key);
      if (cached) return json_({ ok: true, data: cached, source: cached.source || 'sheet' });
      const data = analyzeWithAI_(key);
      saveWord_(key, data, 'ai');
      return json_({ ok: true, data: data, source: 'ai' });
    }
    if (p.action === 'lookup') {
      return json_({ ok: true, data: findWord_(normalizeWord_(p.word)) });
    }
    return json_({ ok: true, service: 'IC Cut API', ai: !!getApiKey_(), time: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/** POST (text/plain body containing JSON): { action: 'log', ... } */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'log') return json_({ ok: false, error: 'Unknown action' });
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet_(LOGS_SHEET, LOGS_HEADER).appendRow([
        new Date(), clip_(body.participant, 40), clip_(body.event, 40), clip_(body.word, 60),
        clip_(body.source, 20), clip_(body.lang, 5), clip_(body.userAgent, 300)
      ]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/* ------------------------------------------------------------------ */
/* Claude AI analysis                                                  */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = [
  'You are an expert English morphologist helping Vietnamese English-major students practise Immediate Constituent (IC) analysis.',
  'Analyse the word you are given and answer with JSON that follows the schema.',
  '',
  'Segmentation',
  '- List morphemes left to right. "form" is the dictionary (base) form with hyphen conventions: prefixes "un-", suffixes "-ness", roots without hyphens. "surface" is exactly how the morpheme is spelled inside the word, without hyphens; joining all surfaces must give the word.',
  '- Cut only where every part carries meaning. Words such as uncle and sing are a single morpheme.',
  '- Cut a Latin/Greek bound root (struct, dict, ject) only when the remaining parts are recognisable morphemes.',
  '- Irregular forms keep their morphemes: children = child + -ren (irregular plural allomorph).',
  '- If the input is not a real English word, treat it as a nonce word: analyse it with productive rules, set isRealWord to false and say so in the gloss.',
  '',
  'Classification',
  '- type: prefix | root | suffix. cls: prefix-der | prefix-inf | root-free | root-bound | suffix-der | suffix-inf.',
  '- English has no inflectional prefixes. The only inflectional suffixes are plural -s, possessive -\'s, 3rd-person -s, -ed, progressive -ing, past-participle -en, comparative -er and superlative -est. Nominal -ing (a misunderstanding) is derivational.',
  '- cat for roots: N, V, Adj, Adv or P. Use "" for affixes.',
  '',
  'IC tree ("nodes")',
  '- Pre-order list. Node 0 is the whole word with parent -1. Every cut is binary and children are listed left to right.',
  '- A prefix branches LEFT of its stem; a suffix branches RIGHT of its stem.',
  '- Bracket by attachment: inflection is outermost; un-/in- attach to adjectives, so [un-[predict-able]] but [[un-happy]-ness].',
  '- Leaf nodes give the morpheme index in "morpheme"; inner nodes use -1. A one-morpheme word is a single node with morpheme 0.',
  '- label is the spelled string the node covers; cat is its word class (N, V, Adj, Adv) or "" for affixes.',
  '',
  'Writing',
  '- Keep everything SHORT and student-friendly: meanings at most 15 words, etym at most 15 words (e.g. Latin struere "to build"), allomorphy and derivInfl at most 2 sentences each.',
  '- Vietnamese ("vi") must be natural academic Vietnamese as used in Vietnamese university linguistics courses (tiền tố, hậu tố, gốc tự do, gốc ràng buộc, phái sinh, biến tố, biến thể hình vị, khôi phục dạng gốc).',
  '- restoration: one entry for each spelling or sound change between surface and base (consonant doubling, silent e, y → i, vowel change). surface ends with a hyphen. Empty list if none.',
  '- family: the historical root, its short gloss, and 6 to 10 real related English words.'
].join('\n');

function bi_() {
  return { type: 'object', properties: { en: { type: 'string' }, vi: { type: 'string' } }, required: ['en', 'vi'], additionalProperties: false };
}

function aiSchema_() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['word', 'isRealWord', 'pos', 'ipa', 'gloss', 'process', 'morphemes', 'nodes', 'insights', 'family'],
    properties: {
      word: { type: 'string' },
      isRealWord: { type: 'boolean' },
      pos: bi_(),
      ipa: { type: 'string' },
      gloss: bi_(),
      process: bi_(),
      morphemes: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['form', 'surface', 'type', 'cls', 'cat', 'meaning', 'etym'],
          properties: {
            form: { type: 'string' },
            surface: { type: 'string' },
            type: { type: 'string', enum: ['prefix', 'root', 'suffix'] },
            cls: { type: 'string', enum: ['prefix-der', 'prefix-inf', 'root-free', 'root-bound', 'suffix-der', 'suffix-inf'] },
            cat: { type: 'string' },
            meaning: bi_(),
            etym: bi_()
          }
        }
      },
      nodes: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['label', 'cat', 'parent', 'morpheme'],
          properties: {
            label: { type: 'string' },
            cat: { type: 'string' },
            parent: { type: 'integer' },
            morpheme: { type: 'integer' }
          }
        }
      },
      insights: {
        type: 'object', additionalProperties: false,
        required: ['allomorphy', 'restoration', 'derivInfl'],
        properties: {
          allomorphy: bi_(),
          derivInfl: bi_(),
          restoration: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              required: ['surface', 'base', 'rule'],
              properties: { surface: { type: 'string' }, base: { type: 'string' }, rule: bi_() }
            }
          }
        }
      },
      family: {
        type: 'object', additionalProperties: false,
        required: ['root', 'rootGloss', 'words'],
        properties: { root: { type: 'string' }, rootGloss: bi_(), words: { type: 'array', items: { type: 'string' } } }
      }
    }
  };
}

function getApiKey_() {
  return PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
}

function checkQuota_() {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const used = props.getProperty('AI_COUNT_' + today);
  const n = used ? Number(used) : 0;
  if (n >= DAILY_AI_LIMIT) throw new Error('Daily AI limit reached. Please try again tomorrow.');
  props.setProperty('AI_COUNT_' + today, String(n + 1));
}

function analyzeWithAI_(word) {
  const key = getApiKey_();
  if (!key) throw new Error('AI is not configured: add ANTHROPIC_API_KEY in Script Properties.');
  checkQuota_();

  const payload = {
    model: AI_MODEL,
    max_tokens: 16000,
    // On a safety refusal, the API retries on a fallback model automatically.
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: aiSchema_() } },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: 'Word to analyse: "' + word + '"' }]
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    payload: JSON.stringify(payload)
  });

  const status = res.getResponseCode();
  const body = JSON.parse(res.getContentText());
  if (status === 429) throw new Error('The AI is busy right now. Please try again in a minute.');
  if (status !== 200) throw new Error('Claude API error ' + status + ': ' + ((body.error && body.error.message) || ''));
  if (body.stop_reason === 'refusal') throw new Error('The AI declined to analyse this word.');
  if (body.stop_reason === 'max_tokens') throw new Error('The AI answer was cut off. Please try again.');

  const text = body.content.filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
  return toAppFormat_(JSON.parse(text), word);
}

/** Converts the flat AI node list into the nested tree used by the front-end. */
function toAppFormat_(ai, word) {
  const nodes = ai.nodes;
  const kids = nodes.map(function () { return []; });
  let root = -1;
  nodes.forEach(function (n, i) {
    if (n.parent < 0) root = i;
    else if (n.parent < nodes.length) kids[n.parent].push(i);
  });
  if (root < 0) throw new Error('AI returned a tree without a root.');

  const used = [];
  function make(i) {
    const n = nodes[i];
    if (!kids[i].length) {
      if (n.morpheme < 0 || n.morpheme >= ai.morphemes.length) throw new Error('AI returned an invalid tree leaf.');
      used.push(n.morpheme);
      return i === root ? { label: n.label, cat: n.cat, m: n.morpheme } : { m: n.morpheme };
    }
    return { label: n.label, cat: n.cat, children: kids[i].map(make) };
  }
  const tree = make(root);
  if (used.length !== ai.morphemes.length) throw new Error('AI tree does not match the morpheme list.');

  return {
    word: word,
    isRealWord: ai.isRealWord,
    pos: ai.pos,
    ipa: ai.ipa,
    gloss: ai.gloss,
    process: ai.process,
    morphemes: ai.morphemes,
    tree: tree,
    insights: ai.insights,
    family: ai.family,
    source: 'ai',
    model: AI_MODEL
  };
}

/** Run from the editor to check that the API key and the model work. */
function testAI() {
  Logger.log(JSON.stringify(analyzeWithAI_('unbreakable'), null, 2));
}

/* ------------------------------------------------------------------ */
/* Research helpers                                                    */
/* ------------------------------------------------------------------ */

/** Copies the 11 verified words from data.js on GitHub into the Words sheet. */
function seedWordsFromGitHub() {
  const src = UrlFetchApp.fetch(DATA_JS_URL).getContentText();
  const start = src.indexOf('/*JSON-START*/');
  const end = src.indexOf('/*JSON-END*/');
  if (start < 0 || end < 0) throw new Error('JSON markers not found in data.js');
  const db = JSON.parse(src.substring(start + '/*JSON-START*/'.length, end));
  Object.keys(db).forEach(function (key) {
    if (!findWord_(key)) saveWord_(key, db[key], 'verified');
  });
}

/** Summary sheet: number of analyses per participant. */
function summarizeLogs() {
  const rows = getSheet_(LOGS_SHEET, LOGS_HEADER).getDataRange().getValues().slice(1);
  const counts = {};
  rows.filter(function (r) { return r[2] === 'analyze'; }).forEach(function (r) {
    const id = r[1] || '(anonymous)';
    counts[id] = (counts[id] || 0) + 1;
  });
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sh.clear();
  sh.appendRow(['participant', 'analyses']);
  Object.keys(counts).sort().forEach(function (id) { sh.appendRow([id, counts[id]]); });
}
