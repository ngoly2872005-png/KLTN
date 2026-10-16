/*
 * IC Cut — main application.
 * Lookup order: verified local database (11 test words) → Claude AI through
 * the Google Apps Script back-end (results are cached in the Google Sheet).
 */
(function () {
  // Paste your Apps Script Web App URL here after deploying Code.gs
  // (Deploy → New deployment → Web app).
  const CONFIG = {
    GAS_URL: "https://script.google.com/macros/s/AKfycbya7p6Ap71-onjPMj0VUxbEQ188jBw1urZCG_OgZF1QLU-ae-eWMg7dBXydHhn8K5TH/exec"
  };

  const DB = window.IC_DB;
  const TEST_WORDS = ["unhappiness", "reconstruction", "misunderstanding", "running", "arguing",
    "cities", "sunflower", "children", "uncle", "sing", "unflobbable"];

  const I18N = {
    en: {
      heroTitle: "Immediate Constituent Analysis",
      heroSub: "Type a word — AI cuts it into morphemes.",
      placeholder: "e.g. unbelievable",
      analyze: "Analyze",
      loading: "AI is analysing…",
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
      srcVerified: "✓ Verified", srcAi: "✦ AI analysis", srcSheet: "✓ Saved",
      aiOff: "AI is not connected yet, so only the 11 test words can be analysed. (Set CONFIG.GAS_URL in app.js.)",
      badWord: "Please type one English word (letters only).",
      aiError: "AI could not analyse this word: ",
      serverBusy: "The server did not respond. Please press Analyze again.",
      nonce: "Not a dictionary word — analysed as a nonce word.",
      misspelled: "“{w}” is not an English word — the analysis below treats it as a made-up word. Did you mean:",
      footer: "Undergraduate thesis · English Language · Dong Nai University",
      participant: "Student ID",
      "cls_prefix-der": "Prefix (Derivational)", "cls_prefix-inf": "Prefix (Inflectional)",
      "cls_root-free": "Free Root", "cls_root-bound": "Bound Root",
      "cls_suffix-der": "Suffix (Derivational)", "cls_suffix-inf": "Suffix (Inflectional)"
    },
    vi: {
      heroTitle: "Phân tích thành tố trực tiếp",
      heroSub: "Nhập một từ — AI sẽ cắt từ thành các hình vị.",
      placeholder: "ví dụ: unbelievable",
      analyze: "Phân tích",
      loading: "AI đang phân tích…",
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
      srcVerified: "✓ Đã kiểm duyệt", srcAi: "✦ AI phân tích", srcSheet: "✓ Đã lưu",
      aiOff: "AI chưa được kết nối nên hiện chỉ phân tích được 11 từ kiểm thử. (Điền CONFIG.GAS_URL trong app.js.)",
      badWord: "Vui lòng nhập một từ tiếng Anh (chỉ gồm chữ cái).",
      aiError: "AI chưa phân tích được từ này: ",
      serverBusy: "Máy chủ chưa phản hồi. Vui lòng bấm Phân tích lại.",
      nonce: "Không phải từ có trong từ điển — được phân tích như từ giả.",
      misspelled: "“{w}” không phải từ tiếng Anh — phần phân tích bên dưới coi nó là từ giả. Có phải bạn muốn gõ:",
      footer: "Khóa luận tốt nghiệp · Ngôn ngữ Anh · Trường Đại học Đồng Nai",
      participant: "Mã SV",
      "cls_prefix-der": "Tiền tố (Phái sinh)", "cls_prefix-inf": "Tiền tố (Biến tố)",
      "cls_root-free": "Gốc tự do", "cls_root-bound": "Gốc ràng buộc",
      "cls_suffix-der": "Hậu tố (Phái sinh)", "cls_suffix-inf": "Hậu tố (Biến tố)"
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

  const state = { lang: storageGet("ic-lang") || "vi", word: null, source: "verified" };

  const $ = sel => document.querySelector(sel);
  const t = key => (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  const L = obj => (obj && typeof obj === "object" ? (obj[state.lang] || obj.en) : obj) || "";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const firstSentence = s => (String(s).match(/^.*?[.!?](?=\s|$)/) || [s])[0];

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- Data ----------
  // Apps Script occasionally answers with an HTML error page instead of
  // JSON (cold start, brief Google outage), so retry once before giving up.
  async function fetchJson(url) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(url);
        return JSON.parse(await res.text());
      } catch (e) {
        if (attempt === 2) throw new Error(t("serverBusy"));
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  async function lookup(raw) {
    const key = raw.toLowerCase().trim();
    if (DB[key]) return { data: DB[key], source: "verified" };
    if (!/^[a-z][a-z'-]{0,29}$/.test(key)) throw new Error(t("badWord"));
    if (!CONFIG.GAS_URL) throw Object.assign(new Error(t("aiOff")), { soft: true });
    const json = await fetchJson(`${CONFIG.GAS_URL}?action=analyze&word=${encodeURIComponent(key)}`);
    if (!json.ok) throw new Error(t("aiError") + json.error);
    return { data: json.data, source: json.source === "ai" ? "ai" : "sheet" };
  }

  function logEvent(event, word) {
    if (!CONFIG.GAS_URL) return;
    const body = JSON.stringify({
      action: "log", event, word: word || "",
      participant: $("#participant").value.trim(),
      lang: state.lang, source: state.source, userAgent: navigator.userAgent
    });
    // text/plain avoids a CORS preflight, which Apps Script does not answer.
    fetch(CONFIG.GAS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body })
      .catch(() => {});
  }

  // ---------- Render ----------
  function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(n => { n.placeholder = t(n.dataset.i18nPlaceholder); });
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("active", b.dataset.lang === state.lang));
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
    src.className = "tag source " + state.source;
    src.textContent = t({ verified: "srcVerified", ai: "srcAi", sheet: "srcSheet" }[state.source]);
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

  function showNotice(msg, isError) {
    const n = $("#notice");
    n.hidden = false;
    n.className = "notice" + (isError ? " error" : "");
    n.textContent = msg;
  }

  async function show(raw, opts) {
    const word = (raw || "").trim();
    if (!word) { $("#word-input").focus(); return; }
    const needsAI = !DB[word.toLowerCase()];
    if (needsAI && CONFIG.GAS_URL) { $("#loading").hidden = false; $("#result").hidden = true; $("#notice").hidden = true; }
    try {
      const { data, source } = await lookup(word);
      state.word = data;
      state.source = source;
      $("#word-input").value = data.word;
      $("#result").hidden = false;
      renderAll();
      if (!opts || !opts.silentHash) history.replaceState(null, "", "#w=" + encodeURIComponent(data.word));
      logEvent("analyze", data.word);
    } catch (err) {
      $("#result").hidden = !state.word;
      showNotice(err.message, !err.soft);
    } finally {
      $("#loading").hidden = true;
    }
  }

  // ---------- Events ----------
  function bind() {
    $("#chips").innerHTML = TEST_WORDS.map(w => `<button type="button" class="chip" data-word="${w}">${w}</button>`).join("");
    $("#search").addEventListener("submit", e => { e.preventDefault(); show($("#word-input").value); });
    $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) show(b.dataset.word); });
    $("#notice").addEventListener("click", e => { const b = e.target.closest(".suggest-btn"); if (b) show(b.dataset.word); });

    document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
      state.lang = b.dataset.lang;
      storageSet("ic-lang", state.lang);
      applyI18n();
      renderAll();
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
