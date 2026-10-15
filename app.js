/*
 * IC Cut — main application.
 * Lookup order: local mock database → Google Apps Script back-end (if
 * configured) → heuristic analyzer (marked provisional).
 */
(function () {
  // Paste your Apps Script Web App URL here after deploying Code.gs
  // (Deploy → New deployment → Web app). Leave empty for offline mode.
  const CONFIG = {
    GAS_URL: ""
  };

  const DB = window.IC_DB;
  const TEST_WORDS = ["unhappiness", "reconstruction", "misunderstanding", "running", "arguing",
    "cities", "sunflower", "children", "uncle", "sing", "unflobbable"];

  const I18N = {
    en: {
      brandSub: "Morphology Lab · Dong Nai University",
      navBreakdown: "Breakdown", navTree: "IC Tree", navMatrix: "Matrix", navInsights: "Insights",
      heroKicker: "Immediate Constituent Analysis",
      heroTitle: "Cut words into their meaningful parts",
      heroSub: "Enter an English word to see its morphemes, its hierarchical IC tree, a linguistic classification matrix and pedagogical insights.",
      placeholder: "Type an English word, e.g. unhappiness",
      analyze: "Analyze", tryWords: "Strategic test words",
      pos: "Part of speech", process: "Word-formation process", bracket: "IC bracketing",
      sec1: "Morpheme Breakdown", sec1Sub: "Each Lego block is one morpheme — the smallest unit of meaning in a word.",
      morpheme: "morpheme", morphemes: "morphemes",
      legendPrefix: "Prefix", legendRoot: "Root / Stem", legendSuffix: "Suffix",
      type_prefix: "Prefix", type_root: "Root", type_suffix: "Suffix",
      spelled: "spelled", countDetail: "Prefixes: {p} · Roots: {r} · Suffixes: {s}",
      sec2: "Hierarchical IC Tree",
      sec2Sub: "Top-down binary cuts, read left to right: a prefix branches LEFT of its stem, a suffix branches RIGHT of its stem.",
      replay: "Replay", levelWord: "Word", levelCut: "Cut",
      monomorphemic: "Monomorphemic word — no IC cut is possible.",
      sec3: "Linguistic Matrix",
      sec3Sub: "Classification, pedagogical meaning and etymology of every constituent. Use the EN / VI switch to translate the explanations.",
      thMorph: "Morpheme", thCls: "Classification", thMeaning: "Pedagogical Meaning", thEtym: "Etymology",
      noInflPrefix: "Note: English has no inflectional prefixes — all eight inflectional morphemes are suffixes.",
      "cls_prefix-der": "Prefix (Derivational)", "cls_prefix-inf": "Prefix (Inflectional)",
      "cls_root-free": "Free Root", "cls_root-bound": "Bound Root",
      "cls_suffix-der": "Suffix (Derivational)", "cls_suffix-inf": "Suffix (Inflectional)",
      sec4: "Pedagogical Insights",
      allo: "Allomorphy & Base-form Restoration", restoreTitle: "Base-form restoration",
      noRestore: "No restoration needed — every morpheme keeps its dictionary spelling.",
      derivInfl: "Derivation vs. Inflection",
      derTitle: "Derivation", derText: "creates a new word · may change word class · inner position",
      infTitle: "Inflection", infText: "grammatical form of the same word · never changes class · outermost",
      constellation: "Word Constellation", constSub: "Words sharing the historical root “{root}” ({gloss})",
      constEmpty: "No word family is available for an automatic analysis.",
      clickHint: "Gold stars are in the database — click to analyse them.",
      provisional: "Provisional analysis: “{w}” is not in the database, so it was cut by affix-stripping rules. Check every part with the meaning test before accepting it.",
      fromSheet: "Loaded from the research database (Google Sheet).",
      empty: "Please type a word.",
      footerNote: "Undergraduate thesis project · Faculty of Foreign Languages · Dong Nai University",
      participant: "Participant code", participantHint: "Optional — links your sessions in the research log.",
      backendOn: "Research log: connected", backendOff: "Research log: offline (local mode)"
    },
    vi: {
      brandSub: "Phòng thí nghiệm Hình thái học · Đại học Đồng Nai",
      navBreakdown: "Hình vị", navTree: "Sơ đồ cây", navMatrix: "Bảng phân loại", navInsights: "Giải thích",
      heroKicker: "Phân tích thành tố trực tiếp",
      heroTitle: "Cắt từ thành các thành phần mang nghĩa",
      heroSub: "Nhập một từ tiếng Anh để xem các hình vị, sơ đồ cây thành tố trực tiếp, bảng phân loại ngôn ngữ học và phần giải thích sư phạm.",
      placeholder: "Nhập một từ tiếng Anh, ví dụ: unhappiness",
      analyze: "Phân tích", tryWords: "Bộ từ kiểm thử chiến lược",
      pos: "Từ loại", process: "Phương thức cấu tạo từ", bracket: "Đóng ngoặc IC",
      sec1: "Bóc tách hình vị", sec1Sub: "Mỗi khối Lego là một hình vị — đơn vị nhỏ nhất mang nghĩa trong từ.",
      morpheme: "hình vị", morphemes: "hình vị",
      legendPrefix: "Tiền tố", legendRoot: "Gốc từ / Thân từ", legendSuffix: "Hậu tố",
      type_prefix: "Tiền tố", type_root: "Gốc từ", type_suffix: "Hậu tố",
      spelled: "chính tả", countDetail: "{p} tiền tố · {r} gốc từ · {s} hậu tố",
      sec2: "Sơ đồ cây phân cấp IC",
      sec2Sub: "Các lát cắt nhị phân từ trên xuống, đọc từ trái sang phải: tiền tố tách sang TRÁI thân từ, hậu tố tách sang PHẢI thân từ.",
      replay: "Vẽ lại", levelWord: "Từ", levelCut: "Lát cắt",
      monomorphemic: "Từ đơn hình vị — không thể cắt thành tố trực tiếp.",
      sec3: "Bảng phân loại & Từ nguyên",
      sec3Sub: "Phân loại, ý nghĩa sư phạm và từ nguyên của từng thành tố. Dùng nút EN / VI để dịch phần giải thích.",
      thMorph: "Hình vị", thCls: "Phân loại", thMeaning: "Ý nghĩa sư phạm", thEtym: "Từ nguyên",
      noInflPrefix: "Lưu ý: tiếng Anh không có tiền tố biến tố — cả tám hình vị biến tố đều là hậu tố.",
      "cls_prefix-der": "Tiền tố (Phái sinh)", "cls_prefix-inf": "Tiền tố (Biến tố)",
      "cls_root-free": "Gốc tự do", "cls_root-bound": "Gốc ràng buộc",
      "cls_suffix-der": "Hậu tố (Phái sinh)", "cls_suffix-inf": "Hậu tố (Biến tố)",
      sec4: "Giải thích sư phạm",
      allo: "Biến thể hình vị & Khôi phục dạng gốc", restoreTitle: "Khôi phục dạng gốc",
      noRestore: "Không cần khôi phục — mọi hình vị đều giữ nguyên chính tả như trong từ điển.",
      derivInfl: "Phái sinh và Biến tố",
      derTitle: "Phái sinh", derText: "tạo ra từ mới · có thể đổi từ loại · nằm ở vị trí bên trong",
      infTitle: "Biến tố", infText: "dạng ngữ pháp của cùng một từ · không đổi từ loại · nằm ngoài cùng",
      constellation: "Bảng gia đình từ", constSub: "Các từ có chung gốc lịch sử “{root}” ({gloss})",
      constEmpty: "Chưa có gia đình từ cho phân tích tự động.",
      clickHint: "Các ngôi sao vàng có trong cơ sở dữ liệu — nhấp để phân tích.",
      provisional: "Phân tích tạm thời: “{w}” chưa có trong cơ sở dữ liệu nên được cắt bằng quy tắc tách phụ tố. Hãy kiểm tra từng phần bằng phép thử nghĩa trước khi chấp nhận.",
      fromSheet: "Đã tải từ cơ sở dữ liệu nghiên cứu (Google Sheet).",
      empty: "Vui lòng nhập một từ.",
      footerNote: "Khóa luận tốt nghiệp · Khoa Ngoại ngữ · Trường Đại học Đồng Nai",
      participant: "Mã người tham gia", participantHint: "Không bắt buộc — dùng để liên kết các phiên học trong nhật ký nghiên cứu.",
      backendOn: "Nhật ký nghiên cứu: đã kết nối", backendOff: "Nhật ký nghiên cứu: ngoại tuyến (chế độ cục bộ)"
    }
  };

  const POS_VI = {
    "Noun": "Danh từ", "Verb": "Động từ", "Adjective": "Tính từ",
    "Verb (present participle)": "Động từ (hiện tại phân từ)",
    "Noun (plural)": "Danh từ (số nhiều)", "Noun (compound)": "Danh từ (ghép)",
    "Adjective (nonce word)": "Tính từ (từ giả)"
  };

  const state = {
    lang: storageGet("ic-lang") || "en",
    word: null,
    source: "local"
  };

  const $ = sel => document.querySelector(sel);
  const t = (key, vars) => {
    let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
    if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  };
  const L = obj => (obj && (obj[state.lang] || obj.en)) || "";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- Data access ----------
  async function lookup(raw) {
    const key = raw.toLowerCase().trim();
    if (DB[key]) return { data: DB[key], source: "local" };
    if (CONFIG.GAS_URL) {
      try {
        const res = await fetch(`${CONFIG.GAS_URL}?action=lookup&word=${encodeURIComponent(key)}`);
        const json = await res.json();
        if (json.ok && json.data) return { data: json.data, source: "sheet" };
      } catch (e) { console.warn("GAS lookup failed", e); }
    }
    return { data: window.ICAnalyzer.analyze(key), source: "heuristic" };
  }

  function logEvent(event, word, extra) {
    if (!CONFIG.GAS_URL) return;
    const body = JSON.stringify(Object.assign({
      action: "log", event, word: word || "",
      participant: $("#participant").value.trim(),
      lang: state.lang, source: state.source,
      userAgent: navigator.userAgent
    }, extra || {}));
    // text/plain avoids a CORS preflight, which Apps Script does not answer.
    fetch(CONFIG.GAS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body })
      .catch(e => console.warn("log failed", e));
  }

  // ---------- Rendering ----------
  function applyStaticI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(n => { n.placeholder = t(n.dataset.i18nPlaceholder); });
    document.querySelectorAll(".lang-toggle button").forEach(b => b.classList.toggle("active", b.dataset.lang === state.lang));
    const status = $("#backend-status");
    status.textContent = CONFIG.GAS_URL ? t("backendOn") : t("backendOff");
    status.classList.toggle("on", !!CONFIG.GAS_URL);
  }

  function renderChips() {
    $("#word-chips").innerHTML = TEST_WORDS.map(w => `<button type="button" class="chip" data-word="${w}">${w}</button>`).join("");
    $("#word-list").innerHTML = TEST_WORDS.map(w => `<option value="${w}">`).join("");
  }

  function bracket(node, word) {
    if (!node.children) return word.morphemes[node.m].form;
    return "[" + node.children.map(c => bracket(c, word)).join(" ") + "]";
  }

  function renderSummary(w) {
    $("#sum-word").textContent = w.word;
    $("#sum-ipa").textContent = w.ipa || "";
    $("#sum-gloss").textContent = L(w.gloss);
    $("#sum-pos").textContent = state.lang === "vi" ? (POS_VI[w.pos] || w.pos) : w.pos;
    $("#sum-process").textContent = L(w.process);
    $("#sum-bracket").textContent = bracket(w.tree, w);
  }

  function renderLego(w) {
    const parts = [];
    w.morphemes.forEach((m, i) => {
      if (i > 0) parts.push(`<span class="plus" aria-hidden="true">+</span>`);
      const surface = m.surface && m.surface !== m.form.replace(/-/g, "")
        ? `<span class="lego-surface">${t("spelled")}: ${esc(m.surface)}-</span>` : "";
      parts.push(`<div class="lego ${m.type}" style="animation-delay:${i * 0.12}s" title="${esc(t("cls_" + m.cls))}">
        <span class="lego-form">${esc(m.form)}</span>
        <span class="lego-type">${t("type_" + m.type)}</span>${surface}
      </div>`);
    });
    $("#lego-row").innerHTML = parts.join("");
    const n = w.morphemes.length;
    $("#count-num").textContent = n;
    $("#count-label").textContent = n === 1 ? t("morpheme") : t("morphemes");
    const c = type => w.morphemes.filter(m => m.type === type).length;
    $("#count-detail").textContent = t("countDetail", { p: c("prefix"), r: c("root"), s: c("suffix") });
  }

  function renderTree(w) { window.ICTree.render($("#tree-box"), w, t); }

  function renderMatrix(w) {
    $("#matrix-body").innerHTML = w.morphemes.map((m, i) => `
      <tr style="animation-delay:${i * 0.07}s">
        <td>${i + 1}</td>
        <td><span class="m-form ${m.type}">${esc(m.form)}</span></td>
        <td><span class="cls-pill ${m.type}">${esc(t("cls_" + m.cls))}</span></td>
        <td>${esc(L(m.meaning))}</td>
        <td class="etym">${esc(L(m.etym))}</td>
      </tr>`).join("");
  }

  function renderInsights(w) {
    $("#ins-allo").textContent = L(w.insights.allomorphy);
    $("#ins-deriv").textContent = L(w.insights.derivInfl);
    const r = w.insights.restoration || [];
    $("#ins-restore").innerHTML = r.length
      ? r.map(x => `<div class="restore-item"><span class="from">${esc(x.surface)}</span><span class="arrow">→</span><span class="to">${esc(x.base)}</span><span class="rule">${esc(L(x.rule))}</span></div>`).join("")
      : `<p class="restore-empty">${t("noRestore")}</p>`;
    renderConstellation(w);
  }

  function renderConstellation(w) {
    const box = $("#constellation");
    const fam = w.family || { words: [] };
    if (!fam.words.length) {
      $("#const-sub").textContent = t("constEmpty");
      box.innerHTML = "";
      document.querySelector(".constellation-card .hint").hidden = true;
      return;
    }
    $("#const-sub").textContent = t("constSub", { root: fam.root, gloss: L(fam.rootGloss) });
    const W = 760, H = 380, cx = W / 2, cy = H / 2;
    const words = fam.words;
    const rx = 290, ry = 140;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Word family"><rect class="const-bg" width="${W}" height="${H}" rx="14"/>`;
    // background stars
    for (let i = 0; i < 40; i++) {
      const x = (i * 97.3) % W, y = (i * 53.7 + 17) % H, r = (i % 3) * 0.5 + 0.6;
      svg += `<circle class="const-star twinkle" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="animation-delay:${(i % 7) * 0.4}s;opacity:.4"/>`;
    }
    const pts = words.map((word, i) => {
      const a = -Math.PI / 2 + (i / words.length) * Math.PI * 2;
      return { word, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    });
    pts.forEach(p => { svg += `<line class="const-line" x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`; });
    svg += `<circle class="const-core" cx="${cx}" cy="${cy}" r="46"/>`;
    svg += `<text class="const-core-text" x="${cx}" y="${cy + 6}" text-anchor="middle">${esc(fam.root)}</text>`;
    svg += `<text class="const-core-gloss" x="${cx}" y="${cy + 66}" text-anchor="middle">${esc(L(fam.rootGloss))}</text>`;
    pts.forEach(p => {
      const known = !!DB[p.word.toLowerCase()];
      const current = p.word.toLowerCase() === w.word;
      const anchor = p.x < cx - 20 ? "end" : p.x > cx + 20 ? "start" : "middle";
      const dx = anchor === "end" ? -10 : anchor === "start" ? 10 : 0;
      const dy = anchor === "middle" ? (p.y < cy ? -10 : 20) : 5;
      svg += `<g class="const-node${known ? " known" : ""}${current ? " current" : ""}" ${known ? `data-word="${esc(p.word.toLowerCase())}" tabindex="0" role="button"` : ""}>
        <circle class="const-star" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${known ? 5 : 3.5}"/>
        <text class="const-word" x="${(p.x + dx).toFixed(1)}" y="${(p.y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(p.word)}</text>
      </g>`;
    });
    svg += `</svg>`;
    box.innerHTML = svg;
    document.querySelector(".constellation-card .hint").hidden = !box.querySelector(".const-node.known");
  }

  function renderAll() {
    const w = state.word;
    if (!w) return;
    const notice = $("#provisional");
    if (state.source === "heuristic") { notice.hidden = false; notice.textContent = t("provisional", { w: w.word }); }
    else if (state.source === "sheet") { notice.hidden = false; notice.textContent = t("fromSheet"); }
    else notice.hidden = true;
    renderSummary(w);
    renderLego(w);
    renderTree(w);
    renderMatrix(w);
    renderInsights(w);
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.word === w.word));
  }

  async function show(raw, opts) {
    const word = (raw || "").trim();
    if (!word) { $("#word-input").focus(); return; }
    const { data, source } = await lookup(word);
    state.word = data;
    state.source = source;
    $("#word-input").value = data.word;
    renderAll();
    if (!opts || !opts.silentHash) history.replaceState(null, "", "#w=" + encodeURIComponent(data.word));
    logEvent("analyze", data.word);
  }

  // ---------- Events ----------
  function bind() {
    $("#search-form").addEventListener("submit", e => {
      e.preventDefault();
      show($("#word-input").value);
      document.getElementById("breakdown").scrollIntoView({ behavior: "smooth" });
    });
    $("#word-chips").addEventListener("click", e => {
      const b = e.target.closest(".chip");
      if (b) show(b.dataset.word);
    });
    document.querySelectorAll(".lang-toggle button").forEach(b => b.addEventListener("click", () => {
      state.lang = b.dataset.lang;
      storageSet("ic-lang", state.lang);
      applyStaticI18n();
      renderAll();
      logEvent("toggle_lang", state.word && state.word.word);
    }));
    $("#replay-tree").addEventListener("click", () => state.word && renderTree(state.word));
    const constBox = $("#constellation");
    const pick = e => {
      const g = e.target.closest(".const-node.known");
      if (!g) return;
      show(g.dataset.word);
      document.getElementById("breakdown").scrollIntoView({ behavior: "smooth" });
    };
    constBox.addEventListener("click", pick);
    constBox.addEventListener("keydown", e => { if (e.key === "Enter") pick(e); });
    const p = $("#participant");
    p.value = storageGet("ic-participant") || "";
    p.addEventListener("change", () => storageSet("ic-participant", p.value.trim()));
    window.addEventListener("hashchange", () => {
      const m = location.hash.match(/w=([^&]+)/);
      if (m && (!state.word || decodeURIComponent(m[1]) !== state.word.word)) show(decodeURIComponent(m[1]), { silentHash: true });
    });
  }

  function init() {
    renderChips();
    applyStaticI18n();
    bind();
    const m = location.hash.match(/w=([^&]+)/);
    show(m ? decodeURIComponent(m[1]) : "unhappiness", { silentHash: !m });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
