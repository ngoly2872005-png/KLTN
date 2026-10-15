/**
 * IC Cut — Google Apps Script back-end (AI analysis + research log)
 * --------------------------------------------------------------
 * Copy this whole file into your Apps Script project (Code.gs).
 *
 * Sheets (created automatically by setup()):
 *   Words : word | json | updated | source   → cache of analysed words
 *   Logs  : timestamp | participant | event | word | source | lang | userAgent
 *   Eval  : results of runEvalSuite()
 *
 * First-time setup:
 *   1. If the script is NOT bound to a spreadsheet, paste its ID into SHEET_ID.
 *   2. Project Settings → Script Properties → add
 *        ANTHROPIC_API_KEY = <your Claude API key>
 *      (never put the key in this file or in the GitHub repo)
 *   3. Run setup() once and authorize.
 *   4. Run testAI() to check the connection, then runEvalSuite() to grade
 *      the AI on the 15 linguistic test cases (see the Eval sheet).
 *   5. Deploy → New deployment → Web app
 *        Execute as: Me   ·   Who has access: Anyone
 *   6. Paste the Web app URL into CONFIG.GAS_URL in app.js.
 *
 * Every word the AI analyses is saved in the Words sheet, so each word is
 * only paid for once. Bump PROMPT_VERSION whenever SYSTEM_PROMPT changes:
 * cached AI answers from an older prompt are then analysed again.
 */

const SHEET_ID = '';                // leave empty if bound to the Sheet
const AI_MODEL = 'claude-opus-5-5';
const PROMPT_VERSION = 2;
const MAX_ATTEMPTS = 2;             // 1 retry when the answer fails validation
const DAILY_AI_LIMIT = 300;         // protects your API budget
const DATA_JS_URL = 'https://raw.githubusercontent.com/ngoly2872005-png/KLTN/main/data.js';

const WORDS_SHEET = 'Words';
const LOGS_SHEET = 'Logs';
const EVAL_SHEET = 'Eval';
const WORDS_HEADER = ['word', 'json', 'updated', 'source'];
const LOGS_HEADER = ['timestamp', 'participant', 'event', 'word', 'source', 'lang', 'userAgent'];
const EVAL_HEADER = ['timestamp', 'case', 'word', 'test', 'result', 'failures', 'bracket', 'attempts'];

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

/**
 * Newest usable row for the word. AI rows made with an older prompt
 * version are skipped so they get re-analysed; verified rows always count.
 */
function findWord_(key) {
  const rows = getSheet_(WORDS_SHEET, WORDS_HEADER).getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).toLowerCase().trim() !== key) continue;
    let data;
    try { data = JSON.parse(rows[i][1]); } catch (err) { continue; }
    if (rows[i][3] === 'ai' && data.promptVersion !== PROMPT_VERSION) continue;
    return data;
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
    return json_({ ok: true, service: 'IC Cut API', ai: !!getApiKey_(), promptVersion: PROMPT_VERSION, time: new Date().toISOString() });
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

// The worked examples deliberately avoid the 15 evaluation words, so that
// runEvalSuite() measures whether the rules generalise.
const SYSTEM_PROMPT = [
  'You are an expert English morphologist helping Vietnamese English-major students practise Immediate Constituent (IC) analysis.',
  'Analyse the word you are given and answer with JSON that follows the schema. Work through the decision procedure below before you answer.',
  '',
  '## 1. Segment: is each cut real in present-day English?',
  'Cut off a piece only if ALL three tests pass:',
  '  (a) the remaining base exists as a word or recognisable morpheme in present-day English;',
  '  (b) the piece adds its usual meaning or grammatical function;',
  '  (c) the whole word means roughly "base + affix meaning".',
  'Historical (etymological) structure is NOT enough: mention it in "etym", but do not cut it.',
  'Pseudo-affix traps that must stay ONE free root: carpet (not car + pet), hammer (not ham + -er), regard (not re- + gard), report (not re- + port), wonder (not won + -der). A word only ends in -er/-ing or starts with re-/in-/un- by accident unless the tests pass.',
  'Lexicalised participial adjectives keep their base when the base is a living word: charming = charm + -ing, surprising = surprise + -ing. In these adjectives -ing / -ed are DERIVATIONAL (suffix-der), never inflectional.',
  '',
  '## 2. Spell out every morpheme',
  '- List morphemes left to right. "form" is the dictionary (base) form with hyphen conventions: prefixes "un-", suffixes "-ness", roots without hyphens.',
  '- "surface" is exactly how the morpheme is spelled inside the word, without hyphens. Joining all surfaces in order MUST give the word with its hyphens removed.',
  '- Restore the base form after spelling changes, and add a "restoration" entry for each: consonant doubling (stopping: surface "stopp", form "stop"), silent e (hoping: surface "hop", form "hope"), y → i (ladies: surface "ladi", form "lady").',
  '- Internal change with no separate affix (mice, men, sang): the root keeps its base form with the changed spelling as surface (form "mouse", surface "mice"), followed by a ZERO morpheme with surface "" and form "{PLURAL}" or "{PAST}", type "suffix", cls "suffix-inf". Explain the vowel mutation in allomorphy and add a restoration entry (mice- → mouse).',
  '- Hyphenated compounds (editor-in-chief): every word between hyphens is a free root; surfaces contain no hyphens.',
  '- allomorphOf: when a morpheme is a conditioned variant of another morpheme, name the basic form, otherwise "". The negative prefix in- has the assimilated allomorphs im- (before p, b, m), il- (before l) and ir- (before r): immature → "im-" with allomorphOf "in-", illegal → "il-" with allomorphOf "in-". Other examples: -ion vs -tion, a- vs an-.',
  '',
  '## 3. Classify',
  '- type: prefix | root | suffix. cls: prefix-der | prefix-inf | root-free | root-bound | suffix-der | suffix-inf.',
  '- English has no inflectional prefixes. The only inflectional suffixes are plural -s/-es, possessive -\'s, 3rd-person -s, past -ed, progressive -ing, past-participle -en/-ed, comparative -er and superlative -est (and their zero/irregular allomorphs). Deadjectival -ly (decidedly = "in a decided way") and nominal -ing (a misunderstanding) are derivational.',
  '- cat for roots: N, V, Adj, Adv or P. Use "" for affixes.',
  '',
  '## 4. Build the binary IC tree ("nodes")',
  '- Pre-order list. Node 0 is the whole word with parent -1. A node\'s parent always appears before it.',
  '- Every inner node has EXACTLY TWO children, listed left to right. Reading the leaves left to right must give morpheme 0, 1, 2 … in order.',
  '- A prefix branches LEFT of its stem; a suffix branches RIGHT of its stem.',
  '- Decide the order of attachment by asking which affix attached LAST, using word-class requirements:',
  '    • Inflection is always outermost. A plural on a compound attaches to the whole compound: bookshelves = [[book shelf] -es].',
  '    • un- and in-/im-/il-/ir- (meaning "not") attach to ADJECTIVES (including participial adjectives). So if the suffix turns an adjective into a noun (-ness, -ity), the prefix attached first: unkindness = [[un-kind]-ness], inactivity = [[in-active]-ity]. If the suffix creates the adjective (-able, -ible, -ed participle), the suffix attached first: unwashed = [un-[wash-ed]], unthinkable = [un-[think-able]].',
  '    • A prefix that needs a verb (re-, mis-, dis-) attaches to the verb before nominalising suffixes: [[re-write]-er].',
  '    • Suffix chains build from the inside out: hopelessness = [[hope-less]-ness], hurriedly = [[hurry-ed]-ly].',
  '    • Hyphenated phrasal compounds follow their phrase structure: editor-in-chief = [editor [in chief]].',
  '- Leaf nodes give the morpheme index in "morpheme"; inner nodes use -1. A one-morpheme word is a single node with morpheme 0.',
  '- label is the spelled string the node covers (hyphens allowed); cat is its word class (N, V, Adj, Adv, P/PP) or "" for affixes.',
  '',
  '## 5. Write',
  '- Keep everything SHORT and student-friendly: meanings at most 15 words, etym at most 15 words, allomorphy and derivInfl at most 2 sentences each.',
  '- Vietnamese ("vi") must be natural academic Vietnamese as used in Vietnamese university linguistics courses (tiền tố, hậu tố, gốc tự do, gốc ràng buộc, phái sinh, biến tố, biến thể hình vị, khôi phục dạng gốc, từ ghép).',
  '- restoration: surface ends with a hyphen; empty list if nothing changed.',
  '- family: the historical root, its short gloss, and 6 to 10 real related English words.',
  '- If the input is not a real English word, analyse it as a nonce word with productive rules, set isRealWord to false and say so in the gloss.'
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
          required: ['form', 'surface', 'type', 'cls', 'cat', 'allomorphOf', 'meaning', 'etym'],
          properties: {
            form: { type: 'string' },
            surface: { type: 'string' },
            type: { type: 'string', enum: ['prefix', 'root', 'suffix'] },
            cls: { type: 'string', enum: ['prefix-der', 'prefix-inf', 'root-free', 'root-bound', 'suffix-der', 'suffix-inf'] },
            cat: { type: 'string' },
            allomorphOf: { type: 'string' },
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

/** One Messages API call with structured output; returns the parsed JSON. */
function callClaude_(userText) {
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
    messages: [{ role: 'user', content: userText }]
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
  return JSON.parse(text);
}

/**
 * Asks Claude for an analysis, checks it with validateAnalysis_(), and
 * retries once with the list of problems if the answer is malformed.
 */
function analyzeWithAI_(word) {
  let problems = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let text = 'Word to analyse: "' + word + '"';
    if (problems.length) {
      text += '\n\nA previous analysis of this word was rejected by the validator for these reasons:\n- '
        + problems.join('\n- ') + '\nFollow the decision procedure carefully and fix every point.';
    }
    const ai = callClaude_(text);
    problems = validateAnalysis_(ai, word);
    if (!problems.length) {
      const data = toAppFormat_(ai, word);
      data.attempts = attempt;
      return data;
    }
  }
  throw new Error('The AI analysis failed validation: ' + problems.join('; '));
}

/** Structural checks on the AI answer. Returns a list of problems (empty = valid). */
function validateAnalysis_(ai, word) {
  const problems = [];
  const plain = function (s) { return String(s || '').toLowerCase().replace(/-/g, ''); };
  const ms = ai.morphemes || [];
  const nodes = ai.nodes || [];
  if (!ms.length) return ['The morpheme list is empty.'];

  const joined = ms.map(function (m) { return m.surface; }).join('').toLowerCase();
  if (joined !== plain(word)) {
    problems.push('Joining the surfaces gives "' + joined + '" but the word without hyphens is "' + plain(word) + '".');
  }
  ms.forEach(function (m, i) {
    if (m.cls.split('-')[0] !== m.type) problems.push('Morpheme ' + i + ' has type ' + m.type + ' but cls ' + m.cls + '.');
    if (m.cls === 'prefix-inf') problems.push('English has no inflectional prefixes (morpheme ' + i + ').');
    if (m.surface === '' && m.cls !== 'suffix-inf') problems.push('Only an inflectional zero morpheme may have an empty surface (morpheme ' + i + ').');
  });
  if (!ms.some(function (m) { return m.type === 'root'; })) problems.push('There is no root.');

  const roots = nodes.filter(function (n) { return n.parent < 0; });
  if (roots.length !== 1 || nodes[0].parent >= 0) return problems.concat(['Node 0 must be the only node with parent -1.']);

  const kids = nodes.map(function () { return []; });
  for (let i = 1; i < nodes.length; i++) {
    const p = nodes[i].parent;
    if (p < 0 || p >= i) return problems.concat(['Node ' + i + ' must point to a parent that appears before it.']);
    kids[p].push(i);
  }

  const leafOrder = [];
  (function walk(i) {
    const n = nodes[i];
    if (!kids[i].length) {
      if (n.morpheme < 0 || n.morpheme >= ms.length) problems.push('Leaf node ' + i + ' ("' + n.label + '") has no valid morpheme index.');
      else leafOrder.push(n.morpheme);
      return;
    }
    if (n.morpheme !== -1) problems.push('Inner node ' + i + ' ("' + n.label + '") must have morpheme -1.');
    if (kids[i].length !== 2) problems.push('Node "' + n.label + '" has ' + kids[i].length + ' children; every cut must be binary.');
    kids[i].forEach(walk);
  })(0);

  const expected = ms.map(function (m, i) { return i; }).join(',');
  if (leafOrder.join(',') !== expected) {
    problems.push('Reading the leaves left to right gives morphemes [' + leafOrder.join(',') + '] instead of [' + expected + '].');
  } else {
    // Each inner node's label must spell exactly the morphemes below it.
    (function spell(i) {
      if (!kids[i].length) return ms[nodes[i].morpheme].surface.toLowerCase();
      const s = kids[i].map(spell).join('');
      if (plain(nodes[i].label) !== s) problems.push('Node label "' + nodes[i].label + '" does not match the morphemes below it ("' + s + '").');
      return s;
    })(0);
  }
  return problems;
}

/** Converts the flat AI node list into the nested tree used by the front-end. */
function toAppFormat_(ai, word) {
  const nodes = ai.nodes;
  const kids = nodes.map(function () { return []; });
  for (let i = 1; i < nodes.length; i++) kids[nodes[i].parent].push(i);

  function make(i) {
    const n = nodes[i];
    if (!kids[i].length) return i === 0 ? { label: n.label, cat: n.cat, m: n.morpheme } : { m: n.morpheme };
    return { label: n.label, cat: n.cat, children: kids[i].map(make) };
  }

  return {
    word: word,
    isRealWord: ai.isRealWord,
    pos: ai.pos,
    ipa: ai.ipa,
    gloss: ai.gloss,
    process: ai.process,
    morphemes: ai.morphemes,
    tree: make(0),
    insights: ai.insights,
    family: ai.family,
    source: 'ai',
    model: AI_MODEL,
    promptVersion: PROMPT_VERSION
  };
}

/** Run from the editor to check that the API key and the model work. */
function testAI() {
  Logger.log(JSON.stringify(analyzeWithAI_('unbreakable'), null, 2));
}

/* ------------------------------------------------------------------ */
/* Evaluation suite: 15 strategic test cases                           */
/* ------------------------------------------------------------------ */

function plain_(s) { return String(s || '').toLowerCase().replace(/-/g, ''); }

function firstCut_(d) {
  if (!d.tree.children) return null;
  return d.tree.children.map(function (c) {
    return plain_(c.label || d.morphemes[c.m].surface || d.morphemes[c.m].form);
  });
}

function bracket_(node, d) {
  if (!node.children) return d.morphemes[node.m].form;
  return '[' + node.children.map(function (c) { return bracket_(c, d); }).join(' ') + ']';
}

function rootForms_(d) {
  return d.morphemes.filter(function (m) { return m.type === 'root'; }).map(function (m) { return plain_(m.form); });
}

function restored_(d, base) {
  return (d.insights.restoration || []).some(function (r) { return plain_(r.base) === base; })
    || rootForms_(d).indexOf(base) >= 0;
}

function expect_(fails, ok, msg) { if (!ok) fails.push(msg); }

/** left / right may list several spellings, e.g. ['unhappy', 'unhappi'] (labels use the spelled form). */
function expectCut_(fails, d, left, right) {
  const cut = firstCut_(d);
  const L = [].concat(left), R = [].concat(right);
  expect_(fails, cut && L.indexOf(cut[0]) >= 0 && R.indexOf(cut[1]) >= 0,
    'first cut should be ' + L[0] + ' | ' + R[0] + ', got ' + (cut ? cut.join(' | ') : 'no cut'));
}

function expectSingleRoot_(fails, d) {
  expect_(fails, d.morphemes.length === 1 && d.morphemes[0].cls === 'root-free',
    'should be one free root, got ' + d.morphemes.map(function (m) { return m.form; }).join(' + '));
}

function expectAllomorph_(fails, d, form) {
  const m = d.morphemes[0];
  expect_(fails, m.form === form && m.cls === 'prefix-der', 'first morpheme should be ' + form + ' (prefix-der), got ' + m.form);
  expect_(fails, m.allomorphOf === 'in-', form + ' should be flagged as an allomorph of in-, got "' + m.allomorphOf + '"');
}

function last_(d) { return d.morphemes[d.morphemes.length - 1]; }

/*
 * Expected bracketing for cases 1 and 3 follows the standard analysis
 * (Bauer, Katamba, Plag): un-/in- attach to adjectives, so the adjective is
 * formed first and -ness/-ity apply last: [[un-happy]-ness], [[in-sincere]-ity].
 */
const EVAL_CASES = [
  { id: 1, word: 'insincerity', test: 'Hierarchy', check: function (d, f) {
    expectCut_(f, d, ['insincere', 'insincer'], 'ity');
    expect_(f, d.morphemes[0].form === 'in-', 'first morpheme should be in-');
  } },
  { id: 2, word: 'undarkened', test: 'Hierarchy', check: function (d, f) {
    expectCut_(f, d, 'un', 'darkened');
  } },
  { id: 3, word: 'unhappiness', test: 'Hierarchy', check: function (d, f) {
    expectCut_(f, d, ['unhappy', 'unhappi'], 'ness');
    expect_(f, restored_(d, 'happy'), 'happi- should be restored to happy');
  } },
  { id: 4, word: 'release', test: 'Pseudo-affix', check: function (d, f) { expectSingleRoot_(f, d); } },
  { id: 5, word: 'interesting', test: 'Pseudo-affix', check: function (d, f) {
    expect_(f, !d.morphemes.some(function (m) { return m.cls === 'suffix-inf'; }), '-ing must not be inflectional in the adjective interesting');
    expect_(f, d.morphemes.length <= 2, 'should be interest (+ derivational -ing) at most');
  } },
  { id: 6, word: 'corner', test: 'Pseudo-affix', check: function (d, f) { expectSingleRoot_(f, d); } },
  { id: 7, word: 'butterflies', test: 'Orthography', check: function (d, f) {
    expect_(f, (d.insights.restoration || []).some(function (r) { return plain_(r.base) === 'butterfly'; }), 'butterfli- should be restored to butterfly');
    expect_(f, last_(d).form === '-es' && last_(d).cls === 'suffix-inf', 'last morpheme should be plural -es (suffix-inf)');
    expect_(f, firstCut_(d) && firstCut_(d)[1] === 'es', 'plural -es should attach to the whole word (outermost)');
  } },
  { id: 8, word: 'admitting', test: 'Orthography', check: function (d, f) {
    expect_(f, rootForms_(d).indexOf('admit') >= 0, 'root form should be admit (doubled t removed)');
    expect_(f, last_(d).form === '-ing' && last_(d).cls === 'suffix-inf', 'last morpheme should be inflectional -ing');
  } },
  { id: 9, word: 'decidedly', test: 'Orthography', check: function (d, f) {
    expect_(f, rootForms_(d).indexOf('decide') >= 0, 'root form should be decide (silent e restored)');
    expect_(f, last_(d).form === '-ly' && last_(d).cls === 'suffix-der', 'last morpheme should be derivational -ly');
    expectCut_(f, d, 'decided', 'ly');
  } },
  { id: 10, word: 'greenhouse', test: 'Compound', check: function (d, f) {
    expect_(f, d.morphemes.length === 2 && d.morphemes.every(function (m) { return m.cls === 'root-free'; }), 'should be two free roots: green + house');
  } },
  { id: 11, word: 'mother-in-law', test: 'Compound', check: function (d, f) {
    expect_(f, rootForms_(d).join(',') === 'mother,in,law' && d.morphemes.length === 3, 'should be three free roots: mother + in + law');
    expectCut_(f, d, 'mother', 'inlaw');
  } },
  { id: 12, word: 'impossible', test: 'Allomorphy', check: function (d, f) { expectAllomorph_(f, d, 'im-'); } },
  { id: 13, word: 'illiterate', test: 'Allomorphy', check: function (d, f) { expectAllomorph_(f, d, 'il-'); } },
  { id: 14, word: 'irresponsible', test: 'Allomorphy', check: function (d, f) { expectAllomorph_(f, d, 'ir-'); } },
  { id: 15, word: 'geese', test: 'Irregular plural', check: function (d, f) {
    expect_(f, rootForms_(d).indexOf('goose') >= 0, 'root form should be goose (vowel mutation reversed)');
    expect_(f, d.morphemes.some(function (m) { return m.surface === '' && m.cls === 'suffix-inf'; }), 'should contain a zero plural morpheme {PLURAL}');
  } }
];

/**
 * Sends the 15 test words to the AI (bypassing the cache), grades each
 * answer and writes the results to the Eval sheet. Costs 15–30 AI calls.
 * Optional: runEvalSuite([4, 5, 6]) runs only the listed case ids.
 */
function runEvalSuite(onlyIds) {
  const sh = getSheet_(EVAL_SHEET, EVAL_HEADER);
  const now = new Date();
  let passed = 0, total = 0;
  EVAL_CASES.forEach(function (c) {
    if (onlyIds && onlyIds.length && onlyIds.indexOf(c.id) < 0) return;
    total++;
    const fails = [];
    let d = null;
    try {
      d = analyzeWithAI_(c.word);
      c.check(d, fails);
    } catch (err) {
      fails.push('ERROR: ' + (err.message || err));
    }
    if (!fails.length) passed++;
    sh.appendRow([now, c.id, c.word, c.test, fails.length ? 'FAIL' : 'PASS', fails.join('; '),
      d ? bracket_(d.tree, d) : '', d ? d.attempts : '']);
  });
  Logger.log('Eval: ' + passed + ' / ' + total + ' passed (prompt v' + PROMPT_VERSION + '). See the Eval sheet.');
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
