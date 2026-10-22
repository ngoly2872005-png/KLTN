/*
 * IC Cut — Claude AI analysis in the browser ("bring your own key").
 *
 * Each user enters their own Claude API key once. It is stored only in that
 * browser (localStorage, or sessionStorage on a shared computer) and sent
 * only to api.anthropic.com — never to the Google Sheet or to GitHub.
 *
 * SYSTEM_PROMPT, the schema and validateAnalysis() mirror Code.gs (which
 * keeps them for runEvalSuite and for validating shared-cache saves).
 * Keep PROMPT_VERSION and the prompt text in sync in both files.
 */
(function () {
  const PROMPT_VERSION = 3;
  const API_URL = "https://api.anthropic.com/v1/messages";
  const KEY_STORE = "ic-claude-key";
  const MODE_STORE = "ic-ai-mode";

  // Speed modes. "fallbacks" retries on another model after a safety refusal
  // (server-side; only some models accept it).
  const MODES = {
    fast:     { model: "claude-haiku-5-5",  effort: "low",    fallbacks: false },
    balanced: { model: "claude-sonnet-5-5", effort: "low",    fallbacks: true  },
    accurate: { model: "claude-opus-5-5",   effort: "medium", fallbacks: true  }
  };
  const DEFAULT_MODE = "balanced";
  const EXPECTED_CHARS = 3200;   // typical answer length, for the progress bar

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
    '- If the input is not a real English word, set isRealWord to false. If it looks like a misspelling of a real word (coinside → coincide, recieve → receive), put the correctly spelled word in "suggestion". Otherwise leave "suggestion" empty and analyse the input as a nonce word with productive rules, saying so in the gloss. For real words "suggestion" is always "".'
  ].join('\n');

  const bi = () => ({ type: "object", properties: { en: { type: "string" }, vi: { type: "string" } }, required: ["en", "vi"], additionalProperties: false });

  const SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["word", "isRealWord", "suggestion", "pos", "ipa", "gloss", "process", "morphemes", "nodes", "insights", "family"],
    properties: {
      word: { type: "string" },
      isRealWord: { type: "boolean" },
      suggestion: { type: "string" },
      pos: bi(),
      ipa: { type: "string" },
      gloss: bi(),
      process: bi(),
      morphemes: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["form", "surface", "type", "cls", "cat", "allomorphOf", "meaning", "etym"],
          properties: {
            form: { type: "string" },
            surface: { type: "string" },
            type: { type: "string", enum: ["prefix", "root", "suffix"] },
            cls: { type: "string", enum: ["prefix-der", "prefix-inf", "root-free", "root-bound", "suffix-der", "suffix-inf"] },
            cat: { type: "string" },
            allomorphOf: { type: "string" },
            meaning: bi(),
            etym: bi()
          }
        }
      },
      nodes: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["label", "cat", "parent", "morpheme"],
          properties: { label: { type: "string" }, cat: { type: "string" }, parent: { type: "integer" }, morpheme: { type: "integer" } }
        }
      },
      insights: {
        type: "object", additionalProperties: false,
        required: ["allomorphy", "restoration", "derivInfl"],
        properties: {
          allomorphy: bi(),
          derivInfl: bi(),
          restoration: {
            type: "array",
            items: {
              type: "object", additionalProperties: false,
              required: ["surface", "base", "rule"],
              properties: { surface: { type: "string" }, base: { type: "string" }, rule: bi() }
            }
          }
        }
      },
      family: {
        type: "object", additionalProperties: false,
        required: ["root", "rootGloss", "words"],
        properties: { root: { type: "string" }, rootGloss: bi(), words: { type: "array", items: { type: "string" } } }
      }
    }
  };

  // ---------- Key & settings storage ----------
  function store(kind) { try { return kind === "session" ? sessionStorage : localStorage; } catch (e) { return null; } }
  function read(k) { for (const s of [store("local"), store("session")]) { try { const v = s && s.getItem(k); if (v) return v; } catch (e) { /* blocked */ } } return ""; }
  function write(k, v, kind) { try { const s = store(kind); if (s) s.setItem(k, v); } catch (e) { /* blocked */ } }
  function remove(k) { for (const s of [store("local"), store("session")]) { try { s && s.removeItem(k); } catch (e) { /* blocked */ } } }

  function getKey() { return read(KEY_STORE); }
  function hasKey() { return !!getKey(); }
  function getMode() { const m = read(MODE_STORE); return MODES[m] ? m : DEFAULT_MODE; }
  function maskedKey() { const k = getKey(); return k ? k.slice(0, 10) + "…" + k.slice(-4) : ""; }

  /** sharedDevice: keep the key only until the tab is closed. */
  function saveKey(key, sharedDevice) {
    remove(KEY_STORE);
    write(KEY_STORE, key.trim(), sharedDevice ? "session" : "local");
  }
  function clearKey() { remove(KEY_STORE); }
  function saveMode(mode) { if (MODES[mode]) write(MODE_STORE, mode, "local"); }

  function headers(key, beta) {
    const h = {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      // Required for calls made directly from a web page.
      "anthropic-dangerous-direct-browser-access": "true"
    };
    if (beta) h["anthropic-beta"] = beta;
    return h;
  }

  // ---------- Errors ----------
  function apiError(status, body) {
    const msg = (body && body.error && body.error.message) || "";
    const code = status === 401 ? "badKey"
      : status === 403 ? "noPermission"
      : status === 429 ? "rateLimit"
      : status === 529 || status >= 500 ? "overloaded"
      : /credit balance/i.test(msg) ? "noCredit"
      : "apiError";
    return Object.assign(new Error(msg || ("HTTP " + status)), { code, status });
  }

  /** Cheap key check: listing models costs nothing. */
  async function testKey(key) {
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: headers(key.trim()) });
    } catch (e) {
      throw Object.assign(new Error(e.message), { code: "network" });
    }
    if (!res.ok) throw apiError(res.status, await res.json().catch(() => null));
    return true;
  }

  // ---------- One streamed Messages API call ----------
  async function callClaude(userText, onProgress, signal) {
    const key = getKey();
    if (!key) throw Object.assign(new Error("No API key"), { code: "noKey" });
    const mode = MODES[getMode()];

    const body = {
      model: mode.model,
      max_tokens: 16000,
      stream: true,
      output_config: { effort: mode.effort, format: { type: "json_schema", schema: SCHEMA } },
      // The long system prompt is cached, so later words start faster and cost less.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }]
    };
    if (mode.fallbacks) body.fallbacks = "default";

    let res;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: headers(key, mode.fallbacks ? "server-side-fallback-2026-07-01" : ""),
        body: JSON.stringify(body),
        signal
      });
    } catch (e) {
      throw Object.assign(new Error(e.message), { code: e.name === "AbortError" ? "aborted" : "network" });
    }
    if (!res.ok) throw apiError(res.status, await res.json().catch(() => null));

    // Server-sent events: collect the JSON text as it streams in.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "", text = "", stopReason = "", started = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        let ev;
        try { ev = JSON.parse(line.slice(5)); } catch (e) { continue; }
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") {
          text += ev.delta.text;
          if (!started) { started = true; onProgress && onProgress({ phase: "writing", pct: 5 }); }
          onProgress && onProgress({ phase: "writing", pct: Math.min(96, 5 + (text.length / EXPECTED_CHARS) * 91) });
        } else if (ev.type === "message_delta" && ev.delta && ev.delta.stop_reason) {
          stopReason = ev.delta.stop_reason;
        } else if (ev.type === "error") {
          throw Object.assign(new Error((ev.error && ev.error.message) || "stream error"), { code: "overloaded" });
        }
      }
    }
    if (stopReason === "refusal") throw Object.assign(new Error("refused"), { code: "refused" });
    if (stopReason === "max_tokens") throw Object.assign(new Error("cut off"), { code: "apiError" });
    return JSON.parse(text);
  }

  // ---------- Validation (mirrors Code.gs validateAnalysis_) ----------
  function validateAnalysis(ai, word) {
    const problems = [];
    const plain = s => String(s || "").toLowerCase().replace(/-/g, "");
    const ms = ai.morphemes || [];
    const nodes = ai.nodes || [];
    if (!ms.length) return ["The morpheme list is empty."];

    const joined = ms.map(m => m.surface).join("").toLowerCase();
    if (joined !== plain(word)) problems.push(`Joining the surfaces gives "${joined}" but the word without hyphens is "${plain(word)}".`);
    ms.forEach((m, i) => {
      if (m.cls.split("-")[0] !== m.type) problems.push(`Morpheme ${i} has type ${m.type} but cls ${m.cls}.`);
      if (m.cls === "prefix-inf") problems.push(`English has no inflectional prefixes (morpheme ${i}).`);
      if (m.surface === "" && m.cls !== "suffix-inf") problems.push(`Only an inflectional zero morpheme may have an empty surface (morpheme ${i}).`);
    });
    if (!ms.some(m => m.type === "root")) problems.push("There is no root.");

    if (!nodes.length || nodes[0].parent >= 0 || nodes.filter(n => n.parent < 0).length !== 1) {
      return problems.concat(["Node 0 must be the only node with parent -1."]);
    }
    const kids = nodes.map(() => []);
    for (let i = 1; i < nodes.length; i++) {
      const p = nodes[i].parent;
      if (p < 0 || p >= i) return problems.concat([`Node ${i} must point to a parent that appears before it.`]);
      kids[p].push(i);
    }
    const leafOrder = [];
    (function walk(i) {
      const n = nodes[i];
      if (!kids[i].length) {
        if (n.morpheme < 0 || n.morpheme >= ms.length) problems.push(`Leaf node ${i} ("${n.label}") has no valid morpheme index.`);
        else leafOrder.push(n.morpheme);
        return;
      }
      if (n.morpheme !== -1) problems.push(`Inner node ${i} ("${n.label}") must have morpheme -1.`);
      if (kids[i].length !== 2) problems.push(`Node "${n.label}" has ${kids[i].length} children; every cut must be binary.`);
      kids[i].forEach(walk);
    })(0);
    const expected = ms.map((m, i) => i).join(",");
    if (leafOrder.join(",") !== expected) {
      problems.push(`Reading the leaves left to right gives morphemes [${leafOrder.join(",")}] instead of [${expected}].`);
    } else {
      (function spell(i) {
        if (!kids[i].length) return ms[nodes[i].morpheme].surface.toLowerCase();
        const s = kids[i].map(spell).join("");
        if (plain(nodes[i].label) !== s) problems.push(`Node label "${nodes[i].label}" does not match the morphemes below it ("${s}").`);
        return s;
      })(0);
    }
    return problems;
  }

  /** Flat AI node list → nested tree used by the page (mirrors Code.gs toAppFormat_). */
  function toAppFormat(ai, word, model) {
    const nodes = ai.nodes;
    const kids = nodes.map(() => []);
    for (let i = 1; i < nodes.length; i++) kids[nodes[i].parent].push(i);
    const make = i => {
      const n = nodes[i];
      if (!kids[i].length) return i === 0 ? { label: n.label, cat: n.cat, m: n.morpheme } : { m: n.morpheme };
      return { label: n.label, cat: n.cat, children: kids[i].map(make) };
    };
    return {
      word,
      isRealWord: ai.isRealWord,
      suggestion: ai.isRealWord ? "" : String(ai.suggestion || "").toLowerCase().trim(),
      pos: ai.pos, ipa: ai.ipa, gloss: ai.gloss, process: ai.process,
      morphemes: ai.morphemes,
      tree: make(0),
      insights: ai.insights,
      family: ai.family,
      source: "ai", model, promptVersion: PROMPT_VERSION
    };
  }

  /**
   * Analyse a word; retries once with the validator's feedback.
   * Returns { data, raw } — raw is the flat AI JSON (sent to the shared cache).
   */
  async function analyze(word, onProgress, signal) {
    let problems = [];
    for (let attempt = 1; attempt <= 2; attempt++) {
      let text = `Word to analyse: "${word}"`;
      if (problems.length) {
        text += "\n\nA previous analysis of this word was rejected by the validator for these reasons:\n- "
          + problems.join("\n- ") + "\nFollow the decision procedure carefully and fix every point.";
        onProgress && onProgress({ phase: "retry", pct: 0 });
      } else {
        onProgress && onProgress({ phase: "thinking", pct: 2 });
      }
      const raw = await callClaude(text, onProgress, signal);
      problems = validateAnalysis(raw, word);
      if (!problems.length) {
        const model = MODES[getMode()].model;
        const data = toAppFormat(raw, word, model);
        data.attempts = attempt;
        return { data, raw, model };
      }
    }
    throw Object.assign(new Error(problems.join("; ")), { code: "invalid" });
  }

  window.ICAI = {
    PROMPT_VERSION, MODES, DEFAULT_MODE,
    getKey, hasKey, maskedKey, saveKey, clearKey, testKey,
    getMode, saveMode, analyze, validateAnalysis
  };
})();
