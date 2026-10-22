/*
 * IC Cut — main application.
 * Lookup order (fastest first):
 *   1. verified local database (11 test words)
 *   2. this browser's cache of words it has analysed before
 *   3. the shared Google Sheet cache (words anyone has analysed before)
 *   4. Claude AI, called directly from the browser with the user's own key
 *      (see ai.js); the result is then saved to both caches.
 */
(function () {
  // Apps Script Web App URL (Deploy → Web app). Used for the shared word
  // cache and the research log — never for API keys.
  const CONFIG = {
    GAS_URL: "https://script.google.com/macros/s/AKfycbya7p6Ap71-onjPMj0VUxbEQ188jBw1urZCG_OgZF1QLU-ae-eWMg7dBXydHhn8K5TH/exec",
    SHEET_TIMEOUT_MS: 4000
  };

  const DB = window.IC_DB;
  const AI = window.ICAI;
  const CACHE_KEY = "ic-cache-v" + AI.PROMPT_VERSION;
  const CACHE_MAX = 300;
  const TEST_WORDS = ["unhappiness", "reconstruction", "misunderstanding", "running", "arguing",
    "cities", "sunflower", "children", "uncle", "sing", "unflobbable"];

  const I18N = {
    en: {
      heroTitle: "Immediate Constituent Analysis",
      heroSub: "Type a word — AI cuts it into morphemes.",
      placeholder: "e.g. unbelievable",
      analyze: "Analyze",
      morphemes: "morphemes",
      bricksTitle: "Morphemes",
      prefix: "Prefix", root: "Root", suffix: "Suffix", spelled: "spelled",
      treeTitle: "IC tree", levelWord: "Word", levelCut: "Cut",
      monomorphemic: "One morpheme — no IC cut is possible.",
      tabMatrix: "Classification", tabAllo: "Allomorphy", tabDeriv: "Derivation · Inflection", tabFamily: "Word family",
      meaning: "Meaning", etym: "Etymology", allomorphOf: "allomorph of", zero: "no separate affix",
      noRestore: "No spelling change — every morpheme keeps its dictionary form.",
      derTitle: "Derivation", derText: "New word · may change word class",
      infTitle: "Inflection", infText: "Grammatical form · same word class",
      famEmpty: "No word family available.",
      srcVerified: "✓ Verified", srcAi: "✦ AI analysis", srcSheet: "✓ Saved", srcLocal: "✓ Saved on this device",
      badWord: "Please type one English word (letters only).",
      nonce: "Not a dictionary word — analysed as a nonce word.",
      misspelled: "“{w}” is not an English word — the analysis below treats it as a made-up word. Did you mean:",
      footer: "Undergraduate thesis · English Language · Dong Nai University",
      participant: "Student ID",
      "cls_prefix-der": "Prefix (Derivational)", "cls_prefix-inf": "Prefix (Inflectional)",
      "cls_root-free": "Free Root", "cls_root-bound": "Bound Root",
      "cls_suffix-der": "Suffix (Derivational)", "cls_suffix-inf": "Suffix (Inflectional)",
      // loading
      loadCache: "Looking for a saved analysis…",
      loadThinking: "AI is thinking…",
      loadWriting: "AI is writing the analysis…",
      loadRetry: "Double-checking the result…",
      // API key
      keyBtn: "API key", keyConnected: "AI ready",
      keyTitle: "Connect AI",
      keyIntro: "Use your own API key. It is stored only in this browser and sent only to the AI provider — never to the owner of this site.",
      providerGeminiHint: "Google · free key available", providerClaudeHint: "Anthropic · paid",
      keyLabel: "API key",
      keyShared: "This is a shared computer (lab) — forget the key when the tab is closed",
      speedLabel: "AI speed",
      mode_fast: "Fast", mode_balanced: "Balanced", mode_accurate: "Most accurate",
      hint_gemini_fast: "Flash-Lite · fastest", hint_gemini_balanced: "Flash · recommended",
      hint_claude_fast: "Haiku 5.5 · cheapest", hint_claude_balanced: "Sonnet 5.5 · recommended", hint_claude_accurate: "Opus 5.5 · slower",
      keyClear: "Remove key", keyCancel: "Close", keySave: "Save",
      help_gemini: "Free key: sign in with Gmail at", help_claude: "No key yet? Create one at",
      keyCurrent: "Saved key: {k} — leave empty to keep it.",
      keyChecking: "Checking the key…",
      keyOk: "The key works and is saved in this browser.",
      keyBadFormat_gemini: "A Gemini API key starts with AIza.",
      keyBadFormat_claude: "A Claude API key starts with sk-ant-.",
      keyMissing: "Please paste your API key.",
      keyCleared: "The key was removed from this browser.",
      modeSaved: "Saved.",
      needKey: "This word is new. Enter an API key once (Gemini is free) to let AI analyse it.",
      needKeyBtn: "Enter key",
      err_badKey: "The API key is not valid. Please check it.",
      err_noPermission: "This API key is not allowed to use this model.",
      err_noCredit: "Your Anthropic account has no credit left. Add credit at console.anthropic.com.",
      err_rateLimit: "Too many requests right now (free keys have a per-minute limit). Please wait a minute and try again.",
      err_overloaded: "The AI is busy. Please try again in a moment.",
      err_network: "Could not reach the AI. Check your internet connection.",
      err_refused: "The AI declined to analyse this word.",
      err_invalid: "The AI answer did not pass the checks twice. Please try again.",
      err_apiError: "The AI returned an error: "
    },
    vi: {
      heroTitle: "Phân tích thành tố trực tiếp",
      heroSub: "Nhập một từ — AI sẽ cắt từ thành các hình vị.",
      placeholder: "ví dụ: unbelievable",
      analyze: "Phân tích",
      morphemes: "hình vị",
      bricksTitle: "Hình vị",
      prefix: "Tiền tố", root: "Gốc từ", suffix: "Hậu tố", spelled: "viết là",
      treeTitle: "Sơ đồ cây IC", levelWord: "Từ", levelCut: "Lát cắt",
      monomorphemic: "Chỉ có một hình vị — không thể cắt.",
      tabMatrix: "Phân loại", tabAllo: "Biến thể", tabDeriv: "Phái sinh · Biến tố", tabFamily: "Gia đình từ",
      meaning: "Ý nghĩa", etym: "Từ nguyên", allomorphOf: "biến thể của", zero: "không có phụ tố riêng",
      noRestore: "Không có biến đổi chính tả — các hình vị giữ nguyên dạng từ điển.",
      derTitle: "Phái sinh", derText: "Tạo từ mới · có thể đổi từ loại",
      infTitle: "Biến tố", infText: "Dạng ngữ pháp · không đổi từ loại",
      famEmpty: "Chưa có gia đình từ.",
      srcVerified: "✓ Đã kiểm duyệt", srcAi: "✦ AI phân tích", srcSheet: "✓ Đã lưu", srcLocal: "✓ Đã lưu trên máy",
      badWord: "Vui lòng nhập một từ tiếng Anh (chỉ gồm chữ cái).",
      nonce: "Không phải từ có trong từ điển — được phân tích như từ giả.",
      misspelled: "“{w}” không phải từ tiếng Anh — phần phân tích bên dưới coi nó là từ giả. Có phải bạn muốn gõ:",
      footer: "Khóa luận tốt nghiệp · Ngôn ngữ Anh · Trường Đại học Đồng Nai",
      participant: "Mã SV",
      "cls_prefix-der": "Tiền tố (Phái sinh)", "cls_prefix-inf": "Tiền tố (Biến tố)",
      "cls_root-free": "Gốc tự do", "cls_root-bound": "Gốc ràng buộc",
      "cls_suffix-der": "Hậu tố (Phái sinh)", "cls_suffix-inf": "Hậu tố (Biến tố)",
      loadCache: "Đang tìm bản phân tích đã lưu…",
      loadThinking: "AI đang suy nghĩ…",
      loadWriting: "AI đang viết kết quả phân tích…",
      loadRetry: "Đang kiểm tra lại kết quả…",
      keyBtn: "API key", keyConnected: "AI sẵn sàng",
      keyTitle: "Kết nối AI",
      keyIntro: "Dùng API key của riêng bạn. Key chỉ được lưu trong trình duyệt này và chỉ gửi tới nhà cung cấp AI — không gửi cho chủ trang web.",
      providerGeminiHint: "Google · có key miễn phí", providerClaudeHint: "Anthropic · trả phí",
      keyLabel: "API key",
      keyShared: "Đây là máy dùng chung (phòng máy) — chỉ nhớ key đến khi đóng tab",
      speedLabel: "Tốc độ AI",
      mode_fast: "Nhanh", mode_balanced: "Cân bằng", mode_accurate: "Chính xác nhất",
      hint_gemini_fast: "Flash-Lite · nhanh nhất", hint_gemini_balanced: "Flash · khuyên dùng",
      hint_claude_fast: "Haiku 5.5 · rẻ nhất", hint_claude_balanced: "Sonnet 5.5 · khuyên dùng", hint_claude_accurate: "Opus 5.5 · chậm hơn",
      keyClear: "Xóa key", keyCancel: "Đóng", keySave: "Lưu",
      help_gemini: "Key miễn phí: đăng nhập Gmail tại", help_claude: "Chưa có key? Tạo key tại",
      keyCurrent: "Key đang lưu: {k} — để trống nếu muốn giữ nguyên.",
      keyChecking: "Đang kiểm tra key…",
      keyOk: "Key hợp lệ và đã được lưu trong trình duyệt này.",
      keyBadFormat_gemini: "API key của Gemini bắt đầu bằng AIza.",
      keyBadFormat_claude: "API key của Claude bắt đầu bằng sk-ant-.",
      keyMissing: "Vui lòng dán API key của bạn.",
      keyCleared: "Đã xóa key khỏi trình duyệt này.",
      modeSaved: "Đã lưu.",
      needKey: "Đây là từ mới. Hãy nhập API key một lần (Gemini miễn phí) để AI phân tích.",
      needKeyBtn: "Nhập key",
      err_badKey: "API key không hợp lệ. Vui lòng kiểm tra lại.",
      err_noPermission: "API key này không được phép dùng model đã chọn.",
      err_noCredit: "Tài khoản Anthropic đã hết tiền. Hãy nạp thêm tại console.anthropic.com.",
      err_rateLimit: "Đang có quá nhiều yêu cầu (key miễn phí bị giới hạn số lượt mỗi phút). Vui lòng đợi một phút rồi thử lại.",
      err_overloaded: "AI đang bận. Vui lòng thử lại sau giây lát.",
      err_network: "Không kết nối được tới AI. Hãy kiểm tra mạng.",
      err_refused: "AI từ chối phân tích từ này.",
      err_invalid: "Kết quả của AI chưa đạt kiểm tra sau 2 lần. Vui lòng thử lại.",
      err_apiError: "AI báo lỗi: "
    }
  };

  const POS_VI = {
    "Noun": "Danh từ", "Verb": "Động từ", "Adjective": "Tính từ",
    "Verb (present participle)": "Động từ (hiện tại phân từ)",
    "Noun (plural)": "Danh từ (số nhiều)", "Noun (compound)": "Danh từ (ghép)",
    "Adjective (nonce word)": "Tính từ (từ giả)"
  };

  const ORIGINS = [
    [/Old English/i, "Old English", "Anh cổ"],
    [/Middle English/i, "Middle English", "Anh trung đại"],
    [/Old Norse/i, "Old Norse", "Bắc Âu cổ"],
    [/Old French|Anglo-Norman|French/i, "French", "Pháp"],
    [/Latin/i, "Latin", "Latin"],
    [/Greek/i, "Greek", "Hy Lạp"],
    [/Germanic/i, "Germanic", "German"],
    [/nonce|invented/i, "Nonce", "Từ giả"]
  ];

  const state = { lang: storageGet("ic-lang") || "vi", word: null, source: "verified", request: 0, pendingWord: null };

  const $ = sel => document.querySelector(sel);
  const t = key => (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  const L = obj => (obj && typeof obj === "object" ? (obj[state.lang] || obj.en) : obj) || "";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const firstSentence = s => (String(s).match(/^.*?[.!?](?=\s|$)/) || [s])[0];

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- Caches ----------
  function readCache() { try { return JSON.parse(storageGet(CACHE_KEY) || "{}"); } catch (e) { return {}; } }
  function cacheGet(word) { return readCache()[word] || null; }
  function cachePut(word, data) {
    const c = readCache();
    delete c[word];
    c[word] = data;
    const keys = Object.keys(c);
    keys.slice(0, Math.max(0, keys.length - CACHE_MAX)).forEach(k => delete c[k]);
    storageSet(CACHE_KEY, JSON.stringify(c));
  }

  /** Shared Google Sheet cache; gives up quickly so a slow Sheet never blocks the AI. */
  async function sheetLookup(word) {
    if (!CONFIG.GAS_URL) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.SHEET_TIMEOUT_MS);
    try {
      const res = await fetch(`${CONFIG.GAS_URL}?action=lookup&word=${encodeURIComponent(word)}`, { signal: ctrl.signal });
      const json = JSON.parse(await res.text());
      return json.ok && json.data ? json.data : null;
    } catch (e) {
      return null;   // timeout, HTML error page, offline → just ask the AI
    } finally {
      clearTimeout(timer);
    }
  }

  // text/plain avoids a CORS preflight, which Apps Script does not answer.
  function postToSheet(payload) {
    if (!CONFIG.GAS_URL) return;
    fetch(CONFIG.GAS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .catch(() => {});
  }

  function logEvent(event, word) {
    postToSheet({
      action: "log", event, word: word || "",
      participant: $("#participant").value.trim(),
      lang: state.lang, source: state.source, userAgent: navigator.userAgent
    });
  }

  // ---------- Lookup ----------
  async function lookup(raw, onStatus) {
    const word = raw.toLowerCase().trim();
    if (DB[word]) return { data: DB[word], source: "verified" };
    if (!/^[a-z][a-z'-]{0,29}$/.test(word)) throw Object.assign(new Error(t("badWord")), { code: "badWord" });

    const local = cacheGet(word);
    if (local) return { data: local, source: "local" };

    onStatus({ phase: "cache", pct: 0 });
    const shared = await sheetLookup(word);
    if (shared) { cachePut(word, shared); return { data: shared, source: "sheet" }; }

    if (!AI.hasKey()) throw Object.assign(new Error(t("needKey")), { code: "needKey", word });

    const { data, raw: aiJson, model } = await AI.analyze(word, onStatus);
    cachePut(word, data);
    postToSheet({ action: "save", word, ai: aiJson, model });
    return { data, source: "ai" };
  }

  // ---------- Render ----------
  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(n => { n.placeholder = t(n.dataset.i18nPlaceholder); });
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("active", b.dataset.lang === state.lang));
    updateKeyButton();
  }

  const PROVIDER_NAMES = { gemini: "Gemini", claude: "Claude" };
  const KEY_LINKS = {
    gemini: ["https://aistudio.google.com/apikey", "aistudio.google.com"],
    claude: ["https://console.anthropic.com/settings/keys", "console.anthropic.com"]
  };

  function updateKeyButton() {
    const on = AI.hasKey();
    $("#key-btn").classList.toggle("connected", on);
    $("#key-btn-label").textContent = on ? `${t("keyConnected")} · ${PROVIDER_NAMES[AI.getProvider()]}` : t("keyBtn");
  }

  function bracket(node, w) {
    if (!node.children) return w.morphemes[node.m].form;
    return "[" + node.children.map(c => bracket(c, w)).join(" ") + "]";
  }

  function renderHead(w) {
    $("#w-word").textContent = w.word;
    $("#w-ipa").textContent = w.ipa || "";
    $("#w-gloss").textContent = L(w.gloss);
    const pos = typeof w.pos === "string" && state.lang === "vi" ? (POS_VI[w.pos] || w.pos) : L(w.pos);
    $("#w-pos").textContent = pos;
    $("#w-process").textContent = L(w.process);
    const src = $("#w-source");
    src.className = "tag source " + (state.source === "ai" ? "ai" : "verified");
    src.textContent = t({ verified: "srcVerified", ai: "srcAi", sheet: "srcSheet", local: "srcLocal" }[state.source]);
    $("#w-count").textContent = w.morphemes.length;
    $("#w-bracket").textContent = bracket(w.tree, w);
  }

  function renderBricks(w) {
    window.ICBricks.render($("#bricks"), w.morphemes,
      { prefix: t("prefix"), root: t("root"), suffix: t("suffix"), spelled: t("spelled"), zero: t("zero") }, esc);
  }

  function originTags(etymEn) {
    return ORIGINS.filter(o => o[0].test(etymEn || "")).slice(0, 2)
      .map(o => `<span class="origin">${state.lang === "vi" ? o[2] : o[1]}</span>`).join("");
  }

  function renderMatrix(w) {
    const chev = `<svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>`;
    $("#matrix").innerHTML = w.morphemes.map(m => `
      <div class="m-row">
        <button type="button" class="m-head" aria-expanded="false">
          <span class="m-form ${m.type}">${esc(m.form)}</span>
          <span class="m-cls-wrap">
            <span class="m-cls ${m.type}">${esc(t("cls_" + m.cls))}</span>
            ${m.allomorphOf ? `<span class="m-allo">${t("allomorphOf")} <b>${esc(m.allomorphOf)}</b></span>` : ""}
          </span>
          <span class="m-short">${esc(firstSentence(L(m.meaning)))}</span>
          ${chev}
        </button>
        <div class="m-body">
          <dl>
            <dt>${t("meaning")}</dt><dd>${esc(L(m.meaning))}</dd>
            <dt>${t("etym")}</dt><dd>${originTags(m.etym && m.etym.en)} ${esc(L(m.etym))}</dd>
          </dl>
        </div>
      </div>`).join("");
  }

  function renderAllo(w) {
    const r = (w.insights && w.insights.restoration) || [];
    $("#restore").innerHTML = r.map(x => `
      <div class="rs"><span class="rs-from">${esc(x.surface)}</span><span class="rs-arrow">→</span>
      <span class="rs-to">${esc(x.base)}</span><span class="rs-rule">${esc(L(x.rule))}</span></div>`).join("");
    $("#allo-text").textContent = L(w.insights.allomorphy) || t("noRestore");
    $("#deriv-text").textContent = L(w.insights.derivInfl);
  }

  function renderFamily(w) {
    const box = $("#family");
    const fam = w.family || { words: [] };
    if (!fam.words || !fam.words.length) { box.innerHTML = `<p class="fam-empty">${t("famEmpty")}</p>`; return; }
    const W = 720, H = 340, cx = W / 2, cy = H / 2, rx = 270, ry = 125;
    const words = fam.words.slice(0, 10);
    let lines = "", pills = "";
    words.forEach((word, i) => {
      const a = -Math.PI / 2 + (i / words.length) * Math.PI * 2;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const pw = word.length * 8.6 + 26;
      const known = !!DB[word.toLowerCase()] && word.toLowerCase() !== w.word;
      lines += `<line class="fam-line" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      pills += `<g class="fam-pill${known ? " known" : ""}"${known ? ` data-word="${esc(word.toLowerCase())}" role="button" tabindex="0"` : ""}>
        <rect x="${(x - pw / 2).toFixed(1)}" y="${(y - 15).toFixed(1)}" width="${pw.toFixed(1)}" height="30" rx="15"/>
        <text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle">${esc(word)}</text></g>`;
    });
    const gloss = L(fam.rootGloss);
    const coreR = Math.max(50, fam.root.length * 5.5 + 24, gloss.length * 3.4 + 16);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Word family">
      ${lines}
      <circle class="fam-core" cx="${cx}" cy="${cy}" r="${coreR}"/>
      <text class="fam-core-text" x="${cx}" y="${cy + (gloss ? 0 : 6)}" text-anchor="middle">${esc(fam.root)}</text>
      <text class="fam-core-gloss" x="${cx}" y="${cy + 20}" text-anchor="middle">${esc(gloss)}</text>
      ${pills}</svg>`;
  }

  function renderAll() {
    const w = state.word;
    if (!w) return;
    renderHead(w);
    renderBricks(w);
    window.ICTree.render($("#tree"), w, t);
    renderMatrix(w);
    renderAllo(w);
    renderFamily(w);
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.word === w.word));
    const notice = $("#notice");
    if (w.isRealWord === false && w.suggestion) {
      notice.hidden = false;
      notice.className = "notice";
      notice.innerHTML = `${esc(t("misspelled").replace("{w}", w.word))}
        <button type="button" class="suggest-btn" data-word="${esc(w.suggestion)}">${esc(w.suggestion)} →</button>`;
    } else if (w.isRealWord === false) {
      notice.hidden = false; notice.className = "notice"; notice.textContent = t("nonce");
    } else notice.hidden = true;
  }

  function showNotice(msg, isError, actionHtml) {
    const n = $("#notice");
    n.hidden = false;
    n.className = "notice" + (isError ? " error" : "");
    n.innerHTML = esc(msg) + (actionHtml || "");
  }

  function errorMessage(err) {
    if (err.code === "apiError") return t("err_apiError") + err.message;
    return I18N.en["err_" + err.code] ? t("err_" + err.code) : err.message;
  }

  // ---------- Loading indicator ----------
  let loadTimer = null;
  function startLoading() {
    const started = Date.now();
    $("#loading").hidden = false;
    $("#progress-bar").style.width = "0%";
    $("#loading-text").textContent = t("loadCache");
    $("#loading-meta").textContent = "";
    clearInterval(loadTimer);
    loadTimer = setInterval(() => {
      const s = ((Date.now() - started) / 1000).toFixed(0);
      const model = AI.hasKey() ? AI.currentModel() + " · " : "";
      $("#loading-meta").textContent = model + s + "s";
    }, 250);
  }
  function setProgress(p) {
    const label = { cache: "loadCache", thinking: "loadThinking", writing: "loadWriting", retry: "loadRetry" }[p.phase];
    if (label) $("#loading-text").textContent = t(label);
    // While the model is thinking we have no output yet: creep slowly so the bar still moves.
    const bar = $("#progress-bar");
    const current = parseFloat(bar.style.width) || 0;
    const target = p.phase === "thinking" ? Math.min(current + 1, 20) : p.pct;
    bar.style.width = Math.max(current, target) + "%";
  }
  function stopLoading() {
    clearInterval(loadTimer);
    $("#loading").hidden = true;
  }

  async function show(raw, opts) {
    const word = (raw || "").trim();
    if (!word) { $("#word-input").focus(); return; }
    const id = ++state.request;
    const quick = !!DB[word.toLowerCase()] || !!cacheGet(word.toLowerCase());
    if (!quick) { startLoading(); $("#result").hidden = true; $("#notice").hidden = true; }
    // While the model is thinking no text arrives yet, so nudge the bar forward.
    let thinkTick = null;
    try {
      const { data, source } = await lookup(word, p => {
        if (id !== state.request) return;
        if (p.phase === "thinking" && !thinkTick) {
          thinkTick = setInterval(() => { if (id === state.request) setProgress({ phase: "thinking" }); }, 700);
        } else if (p.phase !== "thinking") {
          clearInterval(thinkTick);
          thinkTick = null;
        }
        setProgress(p);
      });
      if (id !== state.request) return;      // a newer search replaced this one
      state.word = data;
      state.source = source;
      $("#word-input").value = data.word;
      $("#result").hidden = false;
      renderAll();
      if (!opts || !opts.silentHash) history.replaceState(null, "", "#w=" + encodeURIComponent(data.word));
      logEvent("analyze", data.word);
    } catch (err) {
      if (id !== state.request) return;
      $("#result").hidden = !state.word;
      if (err.code === "needKey") {
        state.pendingWord = err.word;
        showNotice(t("needKey"), false, ` <button type="button" class="notice-btn" data-action="key">${esc(t("needKeyBtn"))}</button>`);
        openKeyDialog();
      } else {
        const keyProblem = err.code === "badKey" || err.code === "noCredit" || err.code === "noPermission";
        showNotice(errorMessage(err), true,
          keyProblem ? ` <button type="button" class="notice-btn" data-action="key">${esc(t("keyBtn"))}</button>` : "");
      }
    } finally {
      clearInterval(thinkTick);
      if (id === state.request) stopLoading();
    }
  }

  // ---------- API key dialog ----------
  function dialogProvider() {
    const r = document.querySelector('#key-form input[name="provider"]:checked');
    return r ? r.value : AI.getProvider();
  }

  /** Fills the key field hint, speed options and help link for one provider. */
  function renderProviderUI(p) {
    $("#key-input").placeholder = p === "gemini" ? "AIza…" : "sk-ant-…";
    $("#key-current").textContent = AI.hasKey(p) ? t("keyCurrent").replace("{k}", AI.maskedKey(p)) : "";
    const mode = AI.getMode(p);
    $("#speed-options").innerHTML = Object.keys(AI.PROVIDERS[p].modes).map(m => `
      <label><input type="radio" name="mode" value="${m}"${m === mode ? " checked" : ""}>
        <span><b>${esc(t("mode_" + m))}</b><small>${esc(t(`hint_${p}_${m}`))}</small></span></label>`).join("");
    const [href, label] = KEY_LINKS[p];
    $("#key-help").innerHTML = `${esc(t("help_" + p))} <a href="${href}" target="_blank" rel="noopener">${label}</a>`;
  }

  function openKeyDialog() {
    const dlg = $("#key-dialog");
    const p = AI.getProvider();
    document.querySelectorAll('#key-form input[name="provider"]').forEach(r => { r.checked = r.value === p; });
    $("#key-input").value = "";
    keyStatus("");
    renderProviderUI(p);
    if (!dlg.open) dlg.showModal();
    $("#key-input").focus();
  }

  function keyStatus(msg, kind) {
    const s = $("#key-status");
    s.textContent = msg;
    s.className = "key-status" + (kind ? " " + kind : "");
  }

  async function saveKeyDialog(e) {
    e.preventDefault();
    const p = dialogProvider();
    const chosen = document.querySelector('#key-form input[name="mode"]:checked');
    if (chosen) AI.saveMode(p, chosen.value);
    const key = $("#key-input").value.trim();

    if (!key) {
      if (!AI.hasKey(p)) { keyStatus(t("keyMissing"), "err"); return; }
      AI.setProvider(p);
      updateKeyButton();
      keyStatus(t("modeSaved"), "ok");
      closeKeyDialogSoon();
      return;
    }
    if (!AI.looksLikeKey(p, key)) { keyStatus(t("keyBadFormat_" + p), "err"); return; }

    const btn = $("#key-save");
    btn.disabled = true;
    keyStatus(t("keyChecking"));
    try {
      await AI.testKey(p, key);
      AI.saveKey(p, key, $("#key-shared").checked);
      AI.setProvider(p);
      keyStatus(t("keyOk"), "ok");
      updateKeyButton();
      closeKeyDialogSoon();
    } catch (err) {
      keyStatus(errorMessage(err), "err");
    } finally {
      btn.disabled = false;
    }
  }

  function closeKeyDialogSoon() {
    setTimeout(() => {
      $("#key-dialog").close();
      if (state.pendingWord && AI.hasKey()) {
        const w = state.pendingWord;
        state.pendingWord = null;
        show(w);
      }
    }, 700);
  }

  // ---------- Events ----------
  function bind() {
    $("#chips").innerHTML = TEST_WORDS.map(w => `<button type="button" class="chip" data-word="${w}">${w}</button>`).join("");
    $("#search").addEventListener("submit", e => { e.preventDefault(); show($("#word-input").value); });
    $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) show(b.dataset.word); });
    $("#notice").addEventListener("click", e => {
      const s = e.target.closest(".suggest-btn");
      if (s) show(s.dataset.word);
      if (e.target.closest('[data-action="key"]')) openKeyDialog();
    });

    $("#key-btn").addEventListener("click", openKeyDialog);
    $("#key-form").addEventListener("submit", saveKeyDialog);
    $("#key-cancel").addEventListener("click", () => { state.pendingWord = null; $("#key-dialog").close(); });
    $("#key-clear").addEventListener("click", () => {
      AI.clearKey(dialogProvider());
      updateKeyButton();
      $("#key-current").textContent = "";
      keyStatus(t("keyCleared"), "ok");
    });
    document.querySelectorAll('#key-form input[name="provider"]').forEach(r => r.addEventListener("change", () => {
      $("#key-input").value = "";
      keyStatus("");
      renderProviderUI(r.value);
    }));

    document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
      state.lang = b.dataset.lang;
      storageSet("ic-lang", state.lang);
      applyI18n();
      renderAll();
      if ($("#key-dialog").open) renderProviderUI(dialogProvider());
    }));

    document.querySelector(".tabs").addEventListener("click", e => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("active", x === b));
      document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.dataset.panel === b.dataset.tab));
    });

    $("#matrix").addEventListener("click", e => {
      const head = e.target.closest(".m-head");
      if (!head) return;
      const row = head.parentElement;
      row.classList.toggle("open");
      head.setAttribute("aria-expanded", row.classList.contains("open"));
    });

    const fam = $("#family");
    const pick = e => {
      const g = e.target.closest(".fam-pill.known");
      if (g) { show(g.dataset.word); window.scrollTo({ top: 0, behavior: "smooth" }); }
    };
    fam.addEventListener("click", pick);
    fam.addEventListener("keydown", e => { if (e.key === "Enter") pick(e); });

    const p = $("#participant");
    p.value = storageGet("ic-participant") || "";
    p.addEventListener("change", () => storageSet("ic-participant", p.value.trim()));

    window.addEventListener("hashchange", () => {
      const m = location.hash.match(/w=([^&]+)/);
      if (m && (!state.word || decodeURIComponent(m[1]) !== state.word.word)) show(decodeURIComponent(m[1]), { silentHash: true });
    });
  }

  function init() {
    applyI18n();
    bind();
    const m = location.hash.match(/w=([^&]+)/);
    show(m ? decodeURIComponent(m[1]) : "unhappiness", { silentHash: !m });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
